"""
Document Vault Service
Secure document storage for tax returns, insurance policies, investment statements.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid


# Simulated document storage (in production, would use cloud storage like S3)
DOCUMENT_STORE = {}

# Document categories
DOCUMENT_CATEGORIES = [
    {"id": "tax", "name": "Tax Returns", "icon": "Calculator", "color": "blue"},
    {"id": "insurance", "name": "Insurance Policies", "icon": "Shield", "color": "green"},
    {"id": "investments", "name": "Investment Statements", "icon": "TrendingUp", "color": "purple"},
    {"id": "super", "name": "Superannuation", "icon": "PiggyBank", "color": "amber"},
    {"id": "property", "name": "Property Documents", "icon": "Home", "color": "red"},
    {"id": "legal", "name": "Legal Documents", "icon": "FileText", "color": "slate"},
    {"id": "estate", "name": "Estate Planning", "icon": "Users", "color": "emerald"},
    {"id": "other", "name": "Other Documents", "icon": "Folder", "color": "gray"},
]

# Mock documents for demo
MOCK_DOCUMENTS = [
    {
        "id": "doc-001",
        "name": "2025 Tax Return - James Wheeler",
        "category": "tax",
        "file_type": "pdf",
        "size": 245000,
        "uploaded_at": "2025-09-15T10:30:00Z",
        "uploaded_by": "James Wheeler",
        "description": "Individual tax return for FY2024-25",
        "tags": ["tax", "2025", "individual"],
        "client_id": "wheeler-family"
    },
    {
        "id": "doc-002",
        "name": "Income Protection Policy",
        "category": "insurance",
        "file_type": "pdf",
        "size": 180000,
        "uploaded_at": "2025-03-20T14:15:00Z",
        "uploaded_by": "Financial Advisor",
        "description": "TAL Income Protection policy - James Wheeler",
        "tags": ["insurance", "income-protection", "tal"],
        "expiry_date": "2026-03-20",
        "client_id": "wheeler-family"
    },
    {
        "id": "doc-003",
        "name": "Vanguard Statement Q4 2025",
        "category": "investments",
        "file_type": "pdf",
        "size": 320000,
        "uploaded_at": "2026-01-15T09:00:00Z",
        "uploaded_by": "Auto-import",
        "description": "Quarterly investment statement",
        "tags": ["investment", "vanguard", "q4-2025"],
        "client_id": "wheeler-family"
    },
    {
        "id": "doc-004",
        "name": "SMSF Annual Return 2025",
        "category": "super",
        "file_type": "pdf",
        "size": 450000,
        "uploaded_at": "2025-10-30T11:45:00Z",
        "uploaded_by": "Accountant",
        "description": "Wheeler Family SMSF annual return",
        "tags": ["smsf", "annual", "2025"],
        "client_id": "wheeler-family"
    },
    {
        "id": "doc-005",
        "name": "Property Valuation - 42 Collins St",
        "category": "property",
        "file_type": "pdf",
        "size": 890000,
        "uploaded_at": "2025-11-20T16:30:00Z",
        "uploaded_by": "Real Estate Agent",
        "description": "Professional valuation report",
        "tags": ["property", "valuation", "collins-st"],
        "client_id": "wheeler-family"
    },
    {
        "id": "doc-006",
        "name": "Will and Testament",
        "category": "estate",
        "file_type": "pdf",
        "size": 125000,
        "uploaded_at": "2024-06-15T10:00:00Z",
        "uploaded_by": "Solicitor",
        "description": "Last Will and Testament - James & Sarah Wheeler",
        "tags": ["estate", "will", "legal"],
        "client_id": "wheeler-family"
    },
    {
        "id": "doc-007",
        "name": "Life Insurance Policy",
        "category": "insurance",
        "file_type": "pdf",
        "size": 210000,
        "uploaded_at": "2025-01-10T08:30:00Z",
        "uploaded_by": "Financial Advisor",
        "description": "AIA Life Insurance - $2M cover",
        "tags": ["insurance", "life", "aia"],
        "expiry_date": "2026-01-10",
        "client_id": "wheeler-family"
    },
]


def get_all_documents(client_id: str = "wheeler-family") -> Dict[str, Any]:
    """Get all documents for a client"""
    documents = [d for d in MOCK_DOCUMENTS if d.get("client_id") == client_id]
    
    # Group by category
    by_category = {}
    for cat in DOCUMENT_CATEGORIES:
        cat_docs = [d for d in documents if d["category"] == cat["id"]]
        by_category[cat["id"]] = {
            "category": cat,
            "documents": cat_docs,
            "count": len(cat_docs),
            "total_size": sum(d["size"] for d in cat_docs)
        }
    
    return {
        "client_id": client_id,
        "total_documents": len(documents),
        "total_size": sum(d["size"] for d in documents),
        "categories": DOCUMENT_CATEGORIES,
        "by_category": by_category,
        "recent_documents": sorted(documents, key=lambda x: x["uploaded_at"], reverse=True)[:5],
        "all_documents": documents
    }


def upload_document(
    name: str,
    category: str,
    file_type: str,
    size: int,
    description: str = "",
    tags: List[str] = None,
    client_id: str = "wheeler-family"
) -> Dict[str, Any]:
    """Upload a new document"""
    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    
    document = {
        "id": doc_id,
        "name": name,
        "category": category,
        "file_type": file_type,
        "size": size,
        "uploaded_at": datetime.now().isoformat(),
        "uploaded_by": "User",
        "description": description,
        "tags": tags or [],
        "client_id": client_id
    }
    
    MOCK_DOCUMENTS.append(document)
    
    return {
        "success": True,
        "document": document,
        "message": f"Document '{name}' uploaded successfully"
    }


def delete_document(doc_id: str) -> Dict[str, Any]:
    """Delete a document"""
    global MOCK_DOCUMENTS
    MOCK_DOCUMENTS = [d for d in MOCK_DOCUMENTS if d["id"] != doc_id]
    
    return {
        "success": True,
        "message": f"Document {doc_id} deleted successfully"
    }


def search_documents(query: str, client_id: str = "wheeler-family") -> List[Dict]:
    """Search documents by name, description, or tags"""
    query_lower = query.lower()
    results = []
    
    for doc in MOCK_DOCUMENTS:
        if doc.get("client_id") != client_id:
            continue
            
        if (query_lower in doc["name"].lower() or 
            query_lower in doc.get("description", "").lower() or
            any(query_lower in tag.lower() for tag in doc.get("tags", []))):
            results.append(doc)
    
    return results
