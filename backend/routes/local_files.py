"""
Local Object Storage + Document Versioning
==========================================

Persistent file storage on local disk at `/data/object_storage` (NOT in the
backend's working dir — survives redeploys/restarts on Emergent Kubernetes).
Each upload:

  • Gets a content-addressed object ID
  • Lands on disk under /data/object_storage/<yyyy>/<mm>/<object_id>
  • Has metadata indexed in MongoDB `storage_objects` (size, sha256, mime,
    owner_client_id, tags, source_deal_id)
  • Is versionable: every regen with the same `family_key` increments version

Endpoints (under /api/files):
  POST /upload                 multipart upload + metadata
  POST /upload-base64          JSON base64 upload (used by Implementation Pack)
  GET  /{object_id}            stream the bytes
  GET  /{object_id}/meta       return metadata only
  GET  /versions/{family_key}  full version chain (v1/v2/v3…) for a family
  GET  /search                 metadata-tag search (?tag=soa&client_id=…)
  DELETE /{object_id}          soft-delete (sets deleted=true)
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Response
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path
import base64
import hashlib
import uuid
import logging
import os

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/files", tags=["Files & Versioning"])

# Storage root — persistent across container restarts. Override with
# FILE_STORAGE_ROOT env var if you want to put it elsewhere.
STORAGE_ROOT = Path(os.environ.get("FILE_STORAGE_ROOT", "/data/object_storage"))
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

COL = "storage_objects"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _disk_path(object_id: str, dt: Optional[datetime] = None) -> Path:
    dt = dt or datetime.now(timezone.utc)
    return STORAGE_ROOT / f"{dt.year:04d}" / f"{dt.month:02d}" / object_id


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def _next_version(family_key: str) -> int:
    """Return the next sequential version number for a doc family."""
    latest = await db[COL].find_one(
        {"family_key": family_key, "deleted": {"$ne": True}},
        {"_id": 0, "version": 1},
        sort=[("version", -1)],
    )
    return (latest["version"] + 1) if latest else 1


async def _persist(content: bytes, *, filename: str, mime: str,
                   owner_client_id: Optional[str], tags: List[str],
                   source_deal_id: Optional[str], source_pack_id: Optional[str],
                   family_key: Optional[str]) -> dict:
    now = datetime.now(timezone.utc)
    object_id = f"obj_{uuid.uuid4().hex}"
    path = _disk_path(object_id, now)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    sha = _sha256(content)

    # Generate a family key if not provided so even one-off uploads can be
    # versioned later if the caller wants.
    fk = family_key or f"family_{sha[:16]}"
    version = await _next_version(fk)
    # Mark prior latest as superseded
    if version > 1:
        await db[COL].update_many(
            {"family_key": fk, "is_latest": True, "deleted": {"$ne": True}},
            {"$set": {"is_latest": False, "superseded_at": _now()}},
        )

    doc = {
        "_id": object_id,
        "object_id": object_id,
        "filename": filename,
        "mime": mime,
        "size_bytes": len(content),
        "sha256": sha,
        "owner_client_id": owner_client_id,
        "tags": tags or [],
        "source_deal_id": source_deal_id,
        "source_pack_id": source_pack_id,
        "family_key": fk,
        "version": version,
        "is_latest": True,
        "deleted": False,
        "created_at": _now(),
        "path_relative": str(path.relative_to(STORAGE_ROOT)),
    }
    await db[COL].insert_one(doc)
    return _strip_id(doc)


class Base64Upload(BaseModel):
    filename: str
    mime: Optional[str] = "application/pdf"
    content_base64: str
    owner_client_id: Optional[str] = None
    tags: Optional[List[str]] = None
    source_deal_id: Optional[str] = None
    source_pack_id: Optional[str] = None
    family_key: Optional[str] = None  # to version a doc family (e.g. "SOA-2026-THOMPS-0001")


@router.post("/upload-base64")
async def upload_base64(payload: Base64Upload) -> dict:
    try:
        content = base64.b64decode(payload.content_base64)
    except Exception:
        raise HTTPException(400, "invalid base64 content")
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(413, "file too large (>50 MB)")
    return await _persist(
        content,
        filename=payload.filename,
        mime=payload.mime or "application/octet-stream",
        owner_client_id=payload.owner_client_id,
        tags=payload.tags or [],
        source_deal_id=payload.source_deal_id,
        source_pack_id=payload.source_pack_id,
        family_key=payload.family_key,
    )


@router.post("/upload")
async def upload_multipart(
    file: UploadFile = File(...),
    owner_client_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # comma-separated
    family_key: Optional[str] = Form(None),
    source_deal_id: Optional[str] = Form(None),
) -> dict:
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(413, "file too large (>50 MB)")
    return await _persist(
        content,
        filename=file.filename,
        mime=file.content_type or "application/octet-stream",
        owner_client_id=owner_client_id,
        tags=[t.strip() for t in (tags or "").split(",") if t.strip()],
        source_deal_id=source_deal_id,
        source_pack_id=None,
        family_key=family_key,
    )


@router.get("/_/usage")
async def usage_summary() -> dict:
    """Disk and DB usage summary — for the Vault dashboard."""
    pipeline = [
        {"$match": {"deleted": {"$ne": True}}},
        {"$group": {
            "_id": None,
            "total_count": {"$sum": 1},
            "total_bytes": {"$sum": "$size_bytes"},
            "latest_count": {"$sum": {"$cond": [{"$eq": ["$is_latest", True]}, 1, 0]}},
        }},
    ]
    rows = await db[COL].aggregate(pipeline).to_list(length=1)
    row = rows[0] if rows else {"total_count": 0, "total_bytes": 0, "latest_count": 0}
    row.pop("_id", None)
    row["storage_root"] = str(STORAGE_ROOT)
    return row


@router.get("/search")
async def search(
    tag: Optional[str] = None,
    client_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    family_key: Optional[str] = None,
    only_latest: bool = True,
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
) -> dict:
    q: Dict[str, Any] = {"deleted": {"$ne": True}}
    if tag:
        q["tags"] = tag
    if client_id:
        q["owner_client_id"] = client_id
    if deal_id:
        q["source_deal_id"] = deal_id
    if family_key:
        q["family_key"] = family_key
    if only_latest and not family_key:
        q["is_latest"] = True
    cur = db[COL].find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    rows = await cur.to_list(length=limit)
    total = await db[COL].count_documents(q)
    return {"objects": rows, "count": len(rows), "total": total, "limit": limit, "skip": skip}


@router.post("/versions/{family_key}/restore/{object_id}")
async def restore_version(family_key: str, object_id: str) -> dict:
    """Restore a prior version as the new latest. Creates v(N+1) with the
    selected version's bytes — preserves full audit trail."""
    target = await db[COL].find_one(
        {"family_key": family_key, "object_id": object_id, "deleted": {"$ne": True}},
        {"_id": 0},
    )
    if not target:
        raise HTTPException(404, "Target version not found in family")
    src_path = STORAGE_ROOT / target["path_relative"]
    if not src_path.exists():
        raise HTTPException(410, "Source bytes missing on disk")
    content = src_path.read_bytes()
    restored = await _persist(
        content,
        filename=target["filename"],
        mime=target["mime"],
        owner_client_id=target.get("owner_client_id"),
        tags=list(set((target.get("tags") or []) + ["restored"])),
        source_deal_id=target.get("source_deal_id"),
        source_pack_id=target.get("source_pack_id"),
        family_key=family_key,
    )
    return {"success": True, "restored_from_version": target["version"],
            "new_version": restored["version"], "new_object_id": restored["object_id"]}


@router.get("/versions/{family_key}")
async def list_versions(family_key: str) -> dict:
    cur = db[COL].find({"family_key": family_key}, {"_id": 0}).sort("version", 1)
    rows = await cur.to_list(length=200)
    return {"family_key": family_key, "versions": rows, "count": len(rows),
            "latest_version": max((r["version"] for r in rows), default=0)}


@router.get("/{object_id}/meta")
async def read_meta(object_id: str) -> dict:
    doc = await db[COL].find_one({"object_id": object_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    return doc


@router.get("/{object_id}")
async def download(object_id: str):
    doc = await db[COL].find_one({"object_id": object_id, "deleted": {"$ne": True}}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    p = STORAGE_ROOT / doc["path_relative"]
    if not p.exists():
        raise HTTPException(410, "file missing on disk (orphan record)")
    return Response(content=p.read_bytes(), media_type=doc["mime"],
                    headers={"Content-Disposition": f'inline; filename="{doc["filename"]}"'})


@router.delete("/{object_id}")
async def soft_delete(object_id: str) -> dict:
    res = await db[COL].update_one(
        {"object_id": object_id},
        {"$set": {"deleted": True, "deleted_at": _now(), "is_latest": False}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "not found")
    return {"success": True, "object_id": object_id}
