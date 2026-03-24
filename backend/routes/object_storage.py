"""
Wealth Command Object Storage Service
=====================================
Handles file uploads for:
- Audit export packs (JSON/PDF)
- Document backups
- Compliance reports
- Client documents

Uses Emergent Object Storage API
"""

import os
import uuid
import requests
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Response
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/storage", tags=["Object Storage"])

# Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "wealth-command"

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
files_col = db["storage_files"]
audit_exports_col = db["audit_export_files"]

# Module-level storage key (initialized once)
storage_key = None

# Content-Type mapping
MIME_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "pdf": "application/pdf",
    "json": "application/json",
    "csv": "text/csv",
    "txt": "text/plain",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

# ==================== STORAGE FUNCTIONS ====================

def init_storage() -> str:
    """Initialize storage and return storage key. Call once at startup."""
    global storage_key
    
    if storage_key:
        return storage_key
    
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set - storage operations will fail")
        raise HTTPException(status_code=500, detail="Storage not configured")
    
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Failed to initialize storage: {e}")
        raise HTTPException(status_code=500, detail=f"Storage initialization failed: {str(e)}")


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to object storage."""
    key = init_storage()
    
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to upload object: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


def get_object(path: str) -> tuple:
    """Download file from object storage. Returns (content_bytes, content_type)."""
    key = init_storage()
    
    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60
        )
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    except Exception as e:
        logger.error(f"Failed to download object: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


def get_content_type(filename: str) -> str:
    """Get content type from filename extension."""
    ext = filename.split(".")[-1].lower() if "." in filename else "bin"
    return MIME_TYPES.get(ext, "application/octet-stream")


# ==================== MODELS ====================

class FileUploadResponse(BaseModel):
    id: str
    path: str
    original_filename: str
    content_type: str
    size: int
    category: str
    uploaded_at: str


class AuditExportUpload(BaseModel):
    export_id: str
    licensee_id: str
    export_type: str
    data: str  # Base64 encoded or JSON string
    filename: str


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def storage_status():
    """Get object storage service status."""
    global storage_key
    
    initialized = storage_key is not None
    key_configured = EMERGENT_KEY is not None
    
    return {
        "service": "object_storage",
        "status": "ready" if initialized else "not_initialized",
        "key_configured": key_configured,
        "app_prefix": APP_NAME,
        "supported_types": list(MIME_TYPES.keys()),
        "capabilities": [
            "audit_exports",
            "document_backups",
            "compliance_reports",
            "client_documents"
        ]
    }


@router.post("/init")
async def initialize_storage():
    """Initialize the storage connection."""
    try:
        key = init_storage()
        return {
            "success": True,
            "message": "Storage initialized",
            "key_prefix": key[:8] + "..." if key else None
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Query("general", description="File category: audit, document, compliance, report"),
    licensee_id: str = Query("lic_default"),
    user_id: str = Query("system")
):
    """Upload a file to object storage."""
    # Generate unique path
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/{category}/{licensee_id}/{file_id}.{ext}"
    
    # Read file content
    data = await file.read()
    content_type = file.content_type or get_content_type(file.filename)
    
    # Upload to storage
    result = put_object(path, data, content_type)
    
    # Store reference in MongoDB
    file_doc = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "category": category,
        "licensee_id": licensee_id,
        "uploaded_by": user_id,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await files_col.insert_one(file_doc)
    
    return FileUploadResponse(
        id=file_id,
        path=result["path"],
        original_filename=file.filename,
        content_type=content_type,
        size=file_doc["size"],
        category=category,
        uploaded_at=file_doc["created_at"]
    )


@router.post("/audit-export/upload")
async def upload_audit_export(
    export_id: str,
    licensee_id: str = "lic_default",
    export_type: str = "json",
    file: UploadFile = File(...)
):
    """Upload an audit export pack to object storage."""
    # Generate path for audit export
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    file_id = str(uuid.uuid4())
    ext = "json" if export_type == "json" else "pdf"
    path = f"{APP_NAME}/audit-exports/{licensee_id}/{timestamp}_{export_id}.{ext}"
    
    # Read and upload
    data = await file.read()
    content_type = "application/json" if export_type == "json" else "application/pdf"
    
    result = put_object(path, data, content_type)
    
    # Store reference
    export_doc = {
        "id": file_id,
        "export_id": export_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "export_type": export_type,
        "licensee_id": licensee_id,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await audit_exports_col.insert_one(export_doc)
    
    return {
        "success": True,
        "file_id": file_id,
        "export_id": export_id,
        "storage_path": result["path"],
        "size": export_doc["size"],
        "uploaded_at": export_doc["created_at"]
    }


@router.post("/audit-export/save-json")
async def save_audit_export_json(
    export_id: str,
    licensee_id: str = "lic_default",
    events: List[Dict[str, Any]] = None,
    certificate: Dict[str, Any] = None
):
    """Save audit export data directly as JSON file."""
    import json
    
    # Create export package
    export_data = {
        "export_id": export_id,
        "licensee_id": licensee_id,
        "events": events or [],
        "certificate": certificate or {},
        "exported_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Convert to JSON bytes
    data = json.dumps(export_data, indent=2).encode("utf-8")
    
    # Generate path
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/audit-exports/{licensee_id}/{timestamp}_{export_id}.json"
    
    # Upload
    result = put_object(path, data, "application/json")
    
    # Store reference
    export_doc = {
        "id": file_id,
        "export_id": export_id,
        "storage_path": result["path"],
        "original_filename": f"audit_export_{export_id}.json",
        "content_type": "application/json",
        "size": result.get("size", len(data)),
        "export_type": "json",
        "licensee_id": licensee_id,
        "event_count": len(events or []),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await audit_exports_col.insert_one(export_doc)
    
    return {
        "success": True,
        "file_id": file_id,
        "export_id": export_id,
        "storage_path": result["path"],
        "event_count": len(events or []),
        "size": export_doc["size"]
    }


@router.get("/files/{file_id}")
async def download_file(file_id: str):
    """Download a file by ID."""
    # Find file in database
    record = await files_col.find_one({"id": file_id, "is_deleted": False})
    
    if not record:
        # Check audit exports
        record = await audit_exports_col.find_one({"id": file_id, "is_deleted": False})
    
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Download from storage
    data, content_type = get_object(record["storage_path"])
    
    return Response(
        content=data,
        media_type=record.get("content_type", content_type),
        headers={
            "Content-Disposition": f'attachment; filename="{record.get("original_filename", "download")}"'
        }
    )


@router.get("/audit-exports")
async def list_audit_exports(
    licensee_id: str = "lic_default",
    limit: int = 50
):
    """List all audit exports for a licensee."""
    exports = await audit_exports_col.find(
        {"licensee_id": licensee_id, "is_deleted": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "exports": exports,
        "count": len(exports)
    }


@router.get("/files")
async def list_files(
    category: Optional[str] = None,
    licensee_id: str = "lic_default",
    limit: int = 50
):
    """List files by category."""
    query = {"licensee_id": licensee_id, "is_deleted": False}
    if category:
        query["category"] = category
    
    files = await files_col.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "files": files,
        "count": len(files)
    }


@router.delete("/files/{file_id}")
async def soft_delete_file(file_id: str):
    """Soft delete a file (mark as deleted)."""
    # Check both collections
    result = await files_col.update_one(
        {"id": file_id},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        result = await audit_exports_col.update_one(
            {"id": file_id},
            {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"success": True, "message": "File marked as deleted"}


@router.get("/document-backup/status")
async def document_backup_status(licensee_id: str = "lic_default"):
    """Get document backup status for a licensee."""
    # Count files by category
    total_files = await files_col.count_documents({"licensee_id": licensee_id, "is_deleted": False})
    audit_exports = await audit_exports_col.count_documents({"licensee_id": licensee_id, "is_deleted": False})
    
    # Get categories breakdown
    pipeline = [
        {"$match": {"licensee_id": licensee_id, "is_deleted": False}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}, "total_size": {"$sum": "$size"}}}
    ]
    categories = await files_col.aggregate(pipeline).to_list(20)
    
    return {
        "licensee_id": licensee_id,
        "total_files": total_files,
        "audit_exports": audit_exports,
        "categories": {cat["_id"]: {"count": cat["count"], "size_bytes": cat["total_size"]} for cat in categories},
        "storage_provider": "emergent_object_storage",
        "backup_status": "active",
        "last_checked": datetime.now(timezone.utc).isoformat()
    }
