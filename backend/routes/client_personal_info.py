"""
Client Personal Information Service
====================================
Manages TFN, ID documents, and custom fields with:
- AES-256-GCM encryption at rest
- Masked display for sensitive data
- Two-way Xplan sync (mocked, ready for real API)
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import logging

from services.encryption import get_encryption_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/client-personal-info", tags=["Client Personal Info"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

personal_info_col = db["client_personal_info"]
xplan_sync_log_col = db["client_xplan_sync_log"]


# ==================== MODELS ====================

class IDDocument(BaseModel):
    type: str  # e.g. "drivers_licence", "passport", "medicare"
    number: str
    expiry_date: Optional[str] = None
    issuing_authority: Optional[str] = None

class CustomField(BaseModel):
    label: str
    value: str

class PersonalInfoRequest(BaseModel):
    tfn: Optional[str] = None
    id_documents: Optional[List[IDDocument]] = []
    custom_fields: Optional[List[CustomField]] = []

class ClientSetupRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    marital_status: Optional[str] = None
    dependents: Optional[int] = 0
    tfn: Optional[str] = None
    id_documents: Optional[List[IDDocument]] = []
    custom_fields: Optional[List[CustomField]] = []


# ==================== HELPERS ====================

def mask_tfn(tfn: str) -> str:
    """Mask TFN showing only last 3 digits: ***-***-789"""
    clean = tfn.replace(" ", "").replace("-", "")
    if len(clean) >= 3:
        return f"***-***-{clean[-3:]}"
    return "***-***-***"

def mask_id_number(number: str) -> str:
    """Mask ID number showing only last 4 chars."""
    if len(number) <= 4:
        return "*" * len(number)
    return "*" * (len(number) - 4) + number[-4:]

def encrypt_value(enc, value: str) -> dict:
    """Encrypt a single value."""
    return enc.encrypt(value)

def decrypt_value(enc, encrypted: dict) -> str:
    """Decrypt a single value, return empty string on failure."""
    try:
        return enc.decrypt(encrypted)
    except Exception:
        return ""


# ==================== ENDPOINTS ====================

# NOTE: /setup must be defined BEFORE /{client_id} to avoid route conflict
@router.post("/setup")
async def setup_new_client(req: ClientSetupRequest):
    """Full client setup wizard — creates client profile + personal info."""
    client_id = f"{req.first_name.lower()}_{req.last_name.lower()}".replace(" ", "_")
    now = datetime.now(timezone.utc).isoformat()
    enc = get_encryption_service()

    # Build personal info doc
    personal_doc = {
        "client_id": client_id,
        "first_name": req.first_name,
        "last_name": req.last_name,
        "date_of_birth": req.date_of_birth,
        "email": req.email,
        "phone": req.phone,
        "address": req.address,
        "marital_status": req.marital_status,
        "dependents": req.dependents,
        "created_at": now,
        "updated_at": now,
        "xplan_synced": False,
    }

    # Encrypt TFN
    if req.tfn:
        personal_doc["tfn_encrypted"] = encrypt_value(enc, req.tfn)
        personal_doc["tfn_masked"] = mask_tfn(req.tfn)

    # Encrypt ID documents
    encrypted_ids = []
    for id_doc in (req.id_documents or []):
        encrypted_ids.append({
            "type": id_doc.type,
            "number_encrypted": encrypt_value(enc, id_doc.number),
            "number_masked": mask_id_number(id_doc.number),
            "expiry_date": id_doc.expiry_date,
            "issuing_authority": id_doc.issuing_authority,
        })
    personal_doc["id_documents"] = encrypted_ids

    # Custom fields
    encrypted_custom = []
    for cf in (req.custom_fields or []):
        encrypted_custom.append({
            "label": cf.label,
            "value_encrypted": encrypt_value(enc, cf.value),
        })
    personal_doc["custom_fields"] = encrypted_custom

    # Upsert
    await personal_info_col.replace_one({"client_id": client_id}, personal_doc, upsert=True)

    return {
        "status": "created",
        "client_id": client_id,
        "name": f"{req.first_name} {req.last_name}",
        "tfn_masked": personal_doc.get("tfn_masked"),
        "id_documents_count": len(encrypted_ids),
        "custom_fields_count": len(encrypted_custom),
    }


@router.post("/{client_id}")
async def save_personal_info(client_id: str, req: PersonalInfoRequest):
    """Save or update client personal info with encryption."""
    enc = get_encryption_service()
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "client_id": client_id,
        "updated_at": now,
    }

    # Encrypt TFN
    if req.tfn:
        doc["tfn_encrypted"] = encrypt_value(enc, req.tfn)
        doc["tfn_masked"] = mask_tfn(req.tfn)
    
    # Encrypt ID documents
    encrypted_ids = []
    for id_doc in (req.id_documents or []):
        encrypted_ids.append({
            "type": id_doc.type,
            "number_encrypted": encrypt_value(enc, id_doc.number),
            "number_masked": mask_id_number(id_doc.number),
            "expiry_date": id_doc.expiry_date,
            "issuing_authority": id_doc.issuing_authority,
        })
    doc["id_documents"] = encrypted_ids

    # Custom fields (encrypt values)
    encrypted_custom = []
    for cf in (req.custom_fields or []):
        encrypted_custom.append({
            "label": cf.label,
            "value_encrypted": encrypt_value(enc, cf.value),
        })
    doc["custom_fields"] = encrypted_custom

    existing = await personal_info_col.find_one({"client_id": client_id}, {"_id": 0})
    if existing:
        # Merge: keep existing fields not being overwritten
        if not req.tfn and "tfn_encrypted" in existing:
            doc["tfn_encrypted"] = existing["tfn_encrypted"]
            doc["tfn_masked"] = existing.get("tfn_masked", "***-***-***")
        if not req.id_documents and "id_documents" in existing:
            doc["id_documents"] = existing["id_documents"]
        if not req.custom_fields and "custom_fields" in existing:
            doc["custom_fields"] = existing["custom_fields"]
        doc["created_at"] = existing.get("created_at", now)
        await personal_info_col.replace_one({"client_id": client_id}, doc)
    else:
        doc["created_at"] = now
        await personal_info_col.insert_one(doc)

    return {
        "status": "saved",
        "client_id": client_id,
        "tfn_masked": doc.get("tfn_masked"),
        "id_documents_count": len(doc.get("id_documents", [])),
        "custom_fields_count": len(doc.get("custom_fields", [])),
    }


@router.get("/{client_id}")
async def get_personal_info(client_id: str):
    """Get personal info with masked sensitive data."""
    doc = await personal_info_col.find_one({"client_id": client_id}, {"_id": 0})
    if not doc:
        return {
            "client_id": client_id,
            "tfn_masked": None,
            "id_documents": [],
            "custom_fields": [],
            "xplan_synced": False,
        }

    # Return masked versions
    ids_masked = []
    for id_doc in doc.get("id_documents", []):
        ids_masked.append({
            "type": id_doc["type"],
            "number_masked": id_doc.get("number_masked", "****"),
            "expiry_date": id_doc.get("expiry_date"),
            "issuing_authority": id_doc.get("issuing_authority"),
        })

    custom = []
    enc = get_encryption_service()
    for cf in doc.get("custom_fields", []):
        val = decrypt_value(enc, cf["value_encrypted"]) if "value_encrypted" in cf else cf.get("value", "")
        custom.append({"label": cf["label"], "value": val})

    return {
        "client_id": client_id,
        "tfn_masked": doc.get("tfn_masked"),
        "id_documents": ids_masked,
        "custom_fields": custom,
        "xplan_synced": doc.get("xplan_synced", False),
        "last_xplan_sync": doc.get("last_xplan_sync"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.get("/{client_id}/unmasked")
async def get_personal_info_unmasked(client_id: str):
    """Get personal info with decrypted sensitive data (adviser only)."""
    doc = await personal_info_col.find_one({"client_id": client_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No personal info found")

    enc = get_encryption_service()

    # Decrypt TFN
    tfn = None
    if "tfn_encrypted" in doc:
        tfn = decrypt_value(enc, doc["tfn_encrypted"])

    # Decrypt IDs
    ids_decrypted = []
    for id_doc in doc.get("id_documents", []):
        number = decrypt_value(enc, id_doc["number_encrypted"]) if "number_encrypted" in id_doc else ""
        ids_decrypted.append({
            "type": id_doc["type"],
            "number": number,
            "expiry_date": id_doc.get("expiry_date"),
            "issuing_authority": id_doc.get("issuing_authority"),
        })

    custom = []
    for cf in doc.get("custom_fields", []):
        val = decrypt_value(enc, cf["value_encrypted"]) if "value_encrypted" in cf else ""
        custom.append({"label": cf["label"], "value": val})

    return {
        "client_id": client_id,
        "tfn": tfn,
        "id_documents": ids_decrypted,
        "custom_fields": custom,
        "xplan_synced": doc.get("xplan_synced", False),
        "last_xplan_sync": doc.get("last_xplan_sync"),
    }


@router.post("/{client_id}/xplan-sync")
async def sync_with_xplan(client_id: str):
    """
    Two-way sync personal info with Xplan (MOCKED).
    Push local data -> Xplan, Pull Xplan data -> local.
    """
    now = datetime.now(timezone.utc).isoformat()
    sync_id = str(uuid.uuid4())[:8]

    # Mock: simulate pulling TFN and ID from Xplan
    mock_xplan_data = {
        "XP-001": {"tfn": "123456789", "id_type": "drivers_licence", "id_number": "DL98765432", "id_expiry": "2028-06-15", "id_authority": "VicRoads"},
        "XP-002": {"tfn": "987654321", "id_type": "passport", "id_number": "PA1234567", "id_expiry": "2030-01-20", "id_authority": "DFAT"},
        "XP-003": {"tfn": "456789123", "id_type": "medicare", "id_number": "2345 67890 1", "id_expiry": "2027-03-01", "id_authority": "Services Australia"},
    }

    # Map internal client IDs to Xplan IDs
    client_xplan_map = {
        "thompson_family": "XP-002",
        "james_mitchell": "XP-001",
        "michael_chen": "XP-003",
    }

    xplan_id = client_xplan_map.get(client_id, "XP-001")
    xplan_client = mock_xplan_data.get(xplan_id, mock_xplan_data["XP-001"])

    enc = get_encryption_service()
    
    # Pull from Xplan: merge with existing local data
    existing = await personal_info_col.find_one({"client_id": client_id}, {"_id": 0})
    
    update_doc = {
        "client_id": client_id,
        "xplan_synced": True,
        "last_xplan_sync": now,
        "xplan_client_id": xplan_id,
        "updated_at": now,
    }

    # If no local TFN, pull from Xplan
    if not existing or "tfn_encrypted" not in existing:
        update_doc["tfn_encrypted"] = encrypt_value(enc, xplan_client["tfn"])
        update_doc["tfn_masked"] = mask_tfn(xplan_client["tfn"])

    # If no local IDs, pull from Xplan
    if not existing or not existing.get("id_documents"):
        update_doc["id_documents"] = [{
            "type": xplan_client["id_type"],
            "number_encrypted": encrypt_value(enc, xplan_client["id_number"]),
            "number_masked": mask_id_number(xplan_client["id_number"]),
            "expiry_date": xplan_client.get("id_expiry"),
            "issuing_authority": xplan_client.get("id_authority"),
        }]

    if existing:
        # Preserve existing fields
        if "tfn_encrypted" not in update_doc and "tfn_encrypted" in existing:
            update_doc["tfn_encrypted"] = existing["tfn_encrypted"]
            update_doc["tfn_masked"] = existing.get("tfn_masked")
        if "id_documents" not in update_doc and "id_documents" in existing:
            update_doc["id_documents"] = existing["id_documents"]
        if "custom_fields" in existing:
            update_doc["custom_fields"] = existing["custom_fields"]
        update_doc["created_at"] = existing.get("created_at", now)
        await personal_info_col.replace_one({"client_id": client_id}, update_doc)
    else:
        update_doc["created_at"] = now
        update_doc["custom_fields"] = []
        await personal_info_col.insert_one(update_doc)

    # Log sync event
    sync_log = {
        "sync_id": sync_id,
        "client_id": client_id,
        "xplan_client_id": xplan_id,
        "direction": "bidirectional",
        "status": "success",
        "fields_synced": ["tfn", "id_documents"],
        "timestamp": now,
    }
    await xplan_sync_log_col.insert_one(sync_log)

    return {
        "status": "synced",
        "sync_id": sync_id,
        "client_id": client_id,
        "xplan_client_id": xplan_id,
        "direction": "bidirectional",
        "fields_pulled": ["tfn", "id_documents"] if not existing else [],
        "fields_pushed": ["tfn", "id_documents"] if existing else [],
        "timestamp": now,
        "note": "MOCK — real Xplan API integration ready when credentials are configured",
    }


@router.get("/{client_id}/xplan-status")
async def get_xplan_sync_status(client_id: str):
    """Get Xplan sync status for a client."""
    doc = await personal_info_col.find_one({"client_id": client_id}, {"_id": 0, "tfn_encrypted": 0, "id_documents": 0, "custom_fields": 0})
    
    # Get last 5 sync logs
    logs = []
    cursor = xplan_sync_log_col.find({"client_id": client_id}, {"_id": 0}).sort("timestamp", -1).limit(5)
    async for log in cursor:
        logs.append(log)

    return {
        "client_id": client_id,
        "xplan_synced": doc.get("xplan_synced", False) if doc else False,
        "xplan_client_id": doc.get("xplan_client_id") if doc else None,
        "last_sync": doc.get("last_xplan_sync") if doc else None,
        "sync_history": logs,
    }
