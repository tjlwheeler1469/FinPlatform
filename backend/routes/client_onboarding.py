"""Client Portal — document uploads, TFN input, info updates → Xplan."""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os
import uuid
import requests
from pymongo import MongoClient
from cryptography.fernet import Fernet
import base64
import hashlib

router = APIRouter(prefix="/api/client-onboarding", tags=["client-onboarding"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "adviceos")
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Object storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "halcyon-wealth"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Encryption for TFN (AES via Fernet)
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = base64.urlsafe_b64encode(hashlib.sha256(b"halcyon-wealth-tfn-key-2026").digest())
else:
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY
fernet = Fernet(ENCRYPTION_KEY if isinstance(ENCRYPTION_KEY, bytes) and len(ENCRYPTION_KEY) == 44 else base64.urlsafe_b64encode(hashlib.sha256(b"halcyon-wealth-tfn-key-2026").digest()))


class TFNSubmission(BaseModel):
    client_id: str
    tfn: str  # Will be encrypted before storage

class InfoUpdate(BaseModel):
    client_id: str
    field: str  # address, phone, email, etc.
    value: str

class XplanSyncRequest(BaseModel):
    client_id: str

# Upload ID document
@router.post("/upload-id")
async def upload_id(
    client_id: str = Form(...),
    doc_type: str = Form(...),  # passport, drivers_licence, medicare
    file: UploadFile = File(...)
):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    if ext not in ("jpg", "jpeg", "png", "pdf", "heic"):
        raise HTTPException(400, "Supported formats: jpg, png, pdf, heic")
    
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(400, "File too large (max 10MB)")
    
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "pdf": "application/pdf", "heic": "image/heic"}.get(ext, "application/octet-stream")
    path = f"{APP_NAME}/client-docs/{client_id}/{uuid.uuid4()}.{ext}"
    
    try:
        result = put_object(path, data, mime)
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")
    
    doc_record = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "doc_type": doc_type,
        "original_filename": file.filename,
        "storage_path": result.get("path", path),
        "content_type": mime,
        "size": len(data),
        "status": "uploaded",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "verified": False,
        "is_deleted": False,
    }
    db.client_documents.insert_one({**doc_record})
    return {"status": "uploaded", "doc_id": doc_record["id"], "filename": file.filename, "doc_type": doc_type}

# Get uploaded documents for a client
@router.get("/documents/{client_id}")
async def get_documents(client_id: str):
    docs = list(db.client_documents.find(
        {"client_id": client_id, "is_deleted": False},
        {"_id": 0}
    ).sort("uploaded_at", -1))
    return docs

# Download a document
@router.get("/documents/{client_id}/{doc_id}/download")
async def download_document(client_id: str, doc_id: str):
    record = db.client_documents.find_one({"id": doc_id, "client_id": client_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Document not found")
    try:
        data, ct = get_object(record["storage_path"])
        return Response(content=data, media_type=record.get("content_type", ct))
    except Exception as e:
        raise HTTPException(500, f"Download failed: {str(e)}")

# Submit TFN (encrypted)
@router.post("/tfn")
async def submit_tfn(data: TFNSubmission):
    tfn_clean = data.tfn.replace(" ", "").replace("-", "")
    if not tfn_clean.isdigit() or len(tfn_clean) != 9:
        raise HTTPException(400, "TFN must be exactly 9 digits")
    
    encrypted = fernet.encrypt(tfn_clean.encode()).decode()
    db.client_tfn.update_one(
        {"client_id": data.client_id},
        {"$set": {
            "client_id": data.client_id,
            "tfn_encrypted": encrypted,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "verified": False,
        }},
        upsert=True
    )
    masked = f"***-***-{tfn_clean[-3:]}"
    return {"status": "submitted", "masked_tfn": masked}

# Check TFN status
@router.get("/tfn/{client_id}")
async def get_tfn_status(client_id: str):
    doc = db.client_tfn.find_one({"client_id": client_id}, {"_id": 0, "tfn_encrypted": 0})
    if not doc:
        return {"submitted": False}
    return {"submitted": True, "submitted_at": doc.get("submitted_at"), "verified": doc.get("verified", False)}

# Update client info
@router.post("/info-update")
async def update_info(data: InfoUpdate):
    allowed = {"address", "phone", "email", "occupation", "employer", "marital_status"}
    if data.field not in allowed:
        raise HTTPException(400, f"Field must be one of: {', '.join(allowed)}")
    
    db.client_info_updates.insert_one({
        "id": str(uuid.uuid4()),
        "client_id": data.client_id,
        "field": data.field,
        "value": data.value,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "synced_to_xplan": False,
    })
    return {"status": "updated", "field": data.field}

# Get pending info updates
@router.get("/info-updates/{client_id}")
async def get_info_updates(client_id: str):
    updates = list(db.client_info_updates.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("submitted_at", -1).limit(20))
    return updates

# Mock Xplan sync
@router.post("/sync-xplan")
async def sync_to_xplan(data: XplanSyncRequest):
    # Mark all pending items as synced
    db.client_info_updates.update_many(
        {"client_id": data.client_id, "synced_to_xplan": False},
        {"$set": {"synced_to_xplan": True, "synced_at": datetime.now(timezone.utc).isoformat()}}
    )
    db.client_documents.update_many(
        {"client_id": data.client_id, "status": "uploaded"},
        {"$set": {"status": "synced_to_xplan", "synced_at": datetime.now(timezone.utc).isoformat()}}
    )
    db.client_tfn.update_one(
        {"client_id": data.client_id},
        {"$set": {"verified": True, "synced_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "synced", "message": f"All data for {data.client_id} synced to Xplan (MOCKED)"}
