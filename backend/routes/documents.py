"""
Documents Routes
Document vault, PDF exports, and document management.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])

# In-memory document storage
DOCUMENTS: Dict[str, Dict] = {}


class DocumentCreate(BaseModel):
    name: str
    category: str
    client_id: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


# Initialize sample documents
def init_sample_documents():
    if not DOCUMENTS:
        samples = [
            {
                "id": "doc_001",
                "name": "Financial Plan 2024",
                "category": "financial_plan",
                "client_id": "hh_001",
                "description": "Comprehensive financial plan for Wheeler Family",
                "file_type": "pdf",
                "file_size": 2456000,
                "tags": ["financial_plan", "2024", "retirement"],
                "status": "active",
                "created_at": "2024-12-01T10:00:00Z",
                "updated_at": "2024-12-15T14:30:00Z"
            },
            {
                "id": "doc_002",
                "name": "Statement of Advice - Super Strategy",
                "category": "soa",
                "client_id": "hh_001",
                "description": "SOA for superannuation contribution strategy",
                "file_type": "pdf",
                "file_size": 1890000,
                "tags": ["soa", "super", "2024"],
                "status": "active",
                "created_at": "2024-11-15T09:00:00Z"
            },
            {
                "id": "doc_003",
                "name": "Risk Profile Assessment",
                "category": "compliance",
                "client_id": "hh_002",
                "description": "Chen Family risk profiling results",
                "file_type": "pdf",
                "file_size": 456000,
                "tags": ["risk", "compliance", "assessment"],
                "status": "active",
                "created_at": "2024-10-20T11:00:00Z"
            }
        ]
        for doc in samples:
            DOCUMENTS[doc["id"]] = doc

init_sample_documents()


@router.get("/")
async def list_documents(
    client_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """List all documents with optional filtering."""
    documents = list(DOCUMENTS.values())
    
    if client_id:
        documents = [d for d in documents if d.get("client_id") == client_id]
    if category:
        documents = [d for d in documents if d.get("category") == category]
    if search:
        search_lower = search.lower()
        documents = [d for d in documents if search_lower in d["name"].lower() or search_lower in d.get("description", "").lower()]
    
    return {
        "documents": documents,
        "total": len(documents)
    }


@router.get("/{document_id}")
async def get_document(document_id: str):
    """Get a specific document."""
    document = DOCUMENTS.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/")
async def create_document(request: DocumentCreate):
    """Create a new document record."""
    document_id = f"doc_{uuid.uuid4().hex[:8]}"
    
    document = {
        "id": document_id,
        "name": request.name,
        "category": request.category,
        "client_id": request.client_id,
        "description": request.description,
        "tags": request.tags,
        "file_type": "pdf",
        "file_size": 0,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    DOCUMENTS[document_id] = document
    return document


@router.put("/{document_id}")
async def update_document(document_id: str, request: DocumentUpdate):
    """Update a document."""
    if document_id not in DOCUMENTS:
        raise HTTPException(status_code=404, detail="Document not found")
    
    updates = request.dict(exclude_none=True)
    DOCUMENTS[document_id].update(updates)
    DOCUMENTS[document_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return DOCUMENTS[document_id]


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document."""
    if document_id not in DOCUMENTS:
        raise HTTPException(status_code=404, detail="Document not found")
    
    del DOCUMENTS[document_id]
    return {"success": True, "message": "Document deleted"}


@router.get("/categories/list")
async def get_document_categories():
    """Get list of document categories."""
    return {
        "categories": [
            {"id": "financial_plan", "name": "Financial Plans", "icon": "file-text"},
            {"id": "soa", "name": "Statement of Advice", "icon": "clipboard"},
            {"id": "compliance", "name": "Compliance Documents", "icon": "shield"},
            {"id": "tax", "name": "Tax Documents", "icon": "calculator"},
            {"id": "insurance", "name": "Insurance Documents", "icon": "umbrella"},
            {"id": "super", "name": "Superannuation", "icon": "piggy-bank"},
            {"id": "property", "name": "Property Documents", "icon": "home"},
            {"id": "legal", "name": "Legal Documents", "icon": "scale"},
            {"id": "other", "name": "Other Documents", "icon": "folder"}
        ]
    }


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = "other",
    client_id: Optional[str] = None
):
    """Upload a document file."""
    document_id = f"doc_{uuid.uuid4().hex[:8]}"
    
    # Read file content (in production, save to storage)
    content = await file.read()
    file_size = len(content)
    
    document = {
        "id": document_id,
        "name": file.filename,
        "category": category,
        "client_id": client_id,
        "file_type": file.filename.split(".")[-1] if "." in file.filename else "unknown",
        "file_size": file_size,
        "content_type": file.content_type,
        "tags": [],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    DOCUMENTS[document_id] = document
    
    return {
        "success": True,
        "document": document
    }


@router.post("/analyze/{document_id}")
async def analyze_document(document_id: str):
    """Analyze a document using AI."""
    document = DOCUMENTS.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Mock AI analysis
    return {
        "document_id": document_id,
        "analysis": {
            "document_type": document.get("category"),
            "summary": f"Analysis of {document['name']}",
            "key_findings": [
                "Document appears to be in good order",
                "All required sections present",
                "Signatures and dates verified"
            ],
            "recommendations": [
                "Consider updating beneficiary information",
                "Review fee disclosure section"
            ],
            "risk_flags": [],
            "confidence_score": 0.95
        },
        "analyzed_at": datetime.now(timezone.utc).isoformat()
    }
