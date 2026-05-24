"""
SOA/ROA Compliance Tracking Module
Track Statement of Advice and Record of Advice documents for compliance
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import os

router = APIRouter(prefix="/compliance-docs", tags=["SOA/ROA Compliance"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "adviceos")

async def get_db() -> dict:
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ============== ENUMS ==============

class DocumentType(str, Enum):
    SOA = "soa"  # Statement of Advice - comprehensive
    ROA = "roa"  # Record of Advice - for ongoing/simple advice
    SOA_SUPPLEMENTARY = "soa_supplementary"
    FSG = "fsg"  # Financial Services Guide
    IPS = "ips"  # Investment Policy Statement

class DocumentStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    REVIEWED = "reviewed"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"
    IMPLEMENTED = "implemented"
    SUPERSEDED = "superseded"
    WITHDRAWN = "withdrawn"

class AdviceType(str, Enum):
    PERSONAL = "personal"
    GENERAL = "general"
    INTRAFUND = "intrafund"
    SCALED = "scaled"
    COMPREHENSIVE = "comprehensive"

class ReviewOutcome(str, Enum):
    APPROVED = "approved"
    APPROVED_WITH_CONDITIONS = "approved_with_conditions"
    REQUIRES_CHANGES = "requires_changes"
    REJECTED = "rejected"

# ============== MODELS ==============

class ComplianceDocument(BaseModel):
    document_id: Optional[str] = None
    client_id: str
    client_name: str
    document_type: DocumentType
    advice_type: AdviceType = AdviceType.PERSONAL
    status: DocumentStatus = DocumentStatus.DRAFT
    
    # Document details
    title: str
    description: Optional[str] = None
    advice_areas: List[str] = []  # e.g., ["superannuation", "insurance", "investments"]
    
    # Adviser details
    adviser_id: str
    adviser_name: str
    authorised_representative_number: Optional[str] = None
    
    # Key dates
    advice_date: Optional[str] = None
    presented_date: Optional[str] = None
    signed_date: Optional[str] = None
    implementation_date: Optional[str] = None
    review_due_date: Optional[str] = None
    
    # Compliance review
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_date: Optional[str] = None
    review_outcome: Optional[ReviewOutcome] = None
    review_notes: Optional[str] = None
    
    # Fees
    advice_fee: Optional[float] = None
    implementation_fee: Optional[float] = None
    ongoing_fee: Optional[float] = None
    
    # Risk acknowledgements
    risk_profile_confirmed: bool = False
    conflicts_disclosed: bool = False
    fees_disclosed: bool = False
    cooling_off_explained: bool = False
    
    # File references
    document_url: Optional[str] = None
    supporting_documents: List[str] = []
    
    # Audit trail
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    status_history: List[Dict] = []

class DocumentReview(BaseModel):
    reviewer_id: str
    reviewer_name: str
    outcome: ReviewOutcome
    notes: Optional[str] = None
    conditions: Optional[List[str]] = None

class DocumentStatusUpdate(BaseModel):
    status: DocumentStatus
    notes: Optional[str] = None
    date: Optional[str] = None  # For signing/implementation dates

# ============== HELPER FUNCTIONS ==============

def calculate_review_due_date(advice_date: str, advice_type: str) -> str:
    """Calculate review due date based on advice type (12 months standard)"""
    advice = datetime.fromisoformat(advice_date.replace('Z', '+00:00'))
    review_due = advice + timedelta(days=365)
    return review_due.isoformat()

# ============== ENDPOINTS ==============

@router.get("/dashboard")
async def get_compliance_dashboard() -> Dict[str, Any]:
    """Get compliance dashboard with metrics and all documents"""
    db = await get_db()
    
    # Get all documents
    docs = await db.compliance_documents.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=500)
    
    total = len(docs)
    
    # Status categories for compliance mapping
    _status_map = {
        "reviewed": "compliant",
        "signed": "compliant",
        "implemented": "compliant",
        "draft": "minor_issues",
        "pending_review": "pending_review",
        "pending_signature": "pending_review",
        "superseded": "compliant",
        "withdrawn": "compliant",
    }
    
    compliant = 0
    minor_issues = 0
    major_issues = 0
    pending_review = 0
    scores = []
    
    for doc in docs:
        status = doc.get("status", "draft")
        review_outcome = doc.get("review_outcome")
        score = doc.get("compliance_score")
        
        if score is not None:
            scores.append(score)
        
        if review_outcome == "rejected" or review_outcome == "requires_changes":
            major_issues += 1
        elif review_outcome == "approved_with_conditions":
            minor_issues += 1
        elif status in ["reviewed", "signed", "implemented"] and review_outcome == "approved":
            compliant += 1
        elif status == "pending_review" or status == "pending_signature":
            pending_review += 1
        elif status == "draft":
            minor_issues += 1
        else:
            compliant += 1
    
    avg_score = round(sum(scores) / len(scores)) if scores else 0
    
    now = datetime.now(timezone.utc).isoformat()
    overdue = await db.compliance_documents.count_documents({
        "review_due_date": {"$lt": now},
        "status": {"$nin": ["superseded", "withdrawn"]}
    })
    
    # Build advice files list for frontend
    advice_files = []
    for doc in docs:
        status = doc.get("status", "draft")
        review_outcome = doc.get("review_outcome")
        
        if review_outcome == "rejected" or review_outcome == "requires_changes":
            display_status = "major_issues"
        elif review_outcome == "approved_with_conditions":
            display_status = "minor_issues"
        elif status in ["reviewed", "signed", "implemented"]:
            display_status = "compliant"
        elif status in ["pending_review", "pending_signature"]:
            display_status = "pending_review"
        else:
            display_status = "minor_issues"
        
        doc_type_map = {
            "soa": "Statement of Advice",
            "roa": "Record of Advice",
            "soa_supplementary": "SOA Supplementary",
            "fsg": "Financial Services Guide",
            "ips": "Investment Policy Statement",
        }
        
        advice_files.append({
            "id": doc.get("document_id", ""),
            "client": doc.get("client_name", ""),
            "type": doc_type_map.get(doc.get("document_type", ""), doc.get("document_type", "")),
            "date": (doc.get("advice_date") or doc.get("created_at", ""))[:10],
            "adviser": doc.get("adviser_name", ""),
            "status": display_status,
            "riskProfile": doc.get("advice_areas", ["General"])[0] if doc.get("advice_areas") else "General",
            "investmentAmount": (doc.get("advice_fee") or 0) * 100 or 250000,
            "score": doc.get("compliance_score"),
            "findings": doc.get("review_conditions", []),
            "nextReview": (doc.get("review_due_date") or "")[:10],
        })
    
    return {
        "metrics": {
            "totalFiles": total,
            "reviewed": compliant + minor_issues + major_issues,
            "compliant": compliant,
            "minorIssues": minor_issues,
            "majorIssues": major_issues,
            "pendingReview": pending_review,
            "avgScore": avg_score,
            "overdue": overdue,
        },
        "adviceFiles": advice_files,
        "timestamp": now
    }


@router.post("/seed-demo")
async def seed_demo_compliance_data() -> Dict[str, Any]:
    """Seed demo compliance documents for testing"""
    db = await get_db()
    
    existing = await db.compliance_documents.count_documents({})
    if existing > 0:
        return {"status": "already_seeded", "count": existing}
    
    now = datetime.now(timezone.utc)
    
    demo_docs = [
        {
            "document_id": "SOA-2026-001",
            "client_id": "client_thompson",
            "client_name": "David & Sarah Thompson",
            "document_type": "soa",
            "advice_type": "comprehensive",
            "status": "implemented",
            "title": "Comprehensive Retirement Strategy",
            "advice_areas": ["Balanced"],
            "adviser_id": "adv_mitchell",
            "adviser_name": "James Mitchell",
            "advice_date": "2026-03-15",
            "review_due_date": "2027-03-15",
            "review_outcome": "approved",
            "reviewer_name": "Compliance Team",
            "compliance_score": 95,
            "review_conditions": [],
            "advice_fee": 4500,
            "risk_profile_confirmed": True,
            "conflicts_disclosed": True,
            "fees_disclosed": True,
            "cooling_off_explained": True,
            "created_at": (now - timedelta(days=15)).isoformat(),
            "updated_at": now.isoformat(),
            "status_history": [{"status": "implemented", "timestamp": now.isoformat(), "notes": "Fully implemented"}]
        },
        {
            "document_id": "SOA-2026-002",
            "client_id": "client_chen",
            "client_name": "Michael Chen",
            "document_type": "soa",
            "advice_type": "personal",
            "status": "reviewed",
            "title": "Growth Investment Strategy",
            "advice_areas": ["Growth"],
            "adviser_id": "adv_williams",
            "adviser_name": "Sarah Williams",
            "advice_date": "2026-03-10",
            "review_due_date": "2027-03-10",
            "review_outcome": "approved_with_conditions",
            "reviewer_name": "Compliance Team",
            "compliance_score": 78,
            "review_conditions": ["Risk profile documentation incomplete", "Fee disclosure needs clarification"],
            "advice_fee": 2800,
            "risk_profile_confirmed": True,
            "conflicts_disclosed": True,
            "fees_disclosed": False,
            "cooling_off_explained": True,
            "created_at": (now - timedelta(days=20)).isoformat(),
            "updated_at": now.isoformat(),
            "status_history": [{"status": "reviewed", "timestamp": now.isoformat(), "notes": "Approved with conditions"}]
        },
        {
            "document_id": "ROA-2026-015",
            "client_id": "client_smith",
            "client_name": "Jennifer & Robert Smith",
            "document_type": "roa",
            "advice_type": "personal",
            "status": "draft",
            "title": "Conservative Portfolio Adjustment",
            "advice_areas": ["Conservative"],
            "adviser_id": "adv_mitchell",
            "adviser_name": "James Mitchell",
            "advice_date": "2026-03-08",
            "review_due_date": "2026-04-08",
            "review_outcome": "requires_changes",
            "reviewer_name": "Compliance Team",
            "compliance_score": 52,
            "review_conditions": ["Asset allocation exceeds risk profile tolerance", "Missing SOA update required", "Client signature missing"],
            "advice_fee": 1250,
            "risk_profile_confirmed": False,
            "conflicts_disclosed": True,
            "fees_disclosed": True,
            "cooling_off_explained": False,
            "created_at": (now - timedelta(days=22)).isoformat(),
            "updated_at": now.isoformat(),
            "status_history": [{"status": "draft", "timestamp": now.isoformat(), "notes": "Requires changes"}]
        },
        {
            "document_id": "SOA-2026-003",
            "client_id": "client_williams",
            "client_name": "Amanda Williams",
            "document_type": "soa",
            "advice_type": "comprehensive",
            "status": "pending_review",
            "title": "High Growth Investment Strategy",
            "advice_areas": ["High Growth"],
            "adviser_id": "adv_brown",
            "adviser_name": "David Brown",
            "advice_date": "2026-03-05",
            "review_due_date": "2027-03-05",
            "review_outcome": None,
            "reviewer_name": None,
            "compliance_score": None,
            "review_conditions": [],
            "advice_fee": 5200,
            "risk_profile_confirmed": True,
            "conflicts_disclosed": True,
            "fees_disclosed": True,
            "cooling_off_explained": True,
            "created_at": (now - timedelta(days=25)).isoformat(),
            "updated_at": now.isoformat(),
            "status_history": [{"status": "pending_review", "timestamp": now.isoformat(), "notes": "Awaiting compliance review"}]
        },
        {
            "document_id": "ROA-2026-016",
            "client_id": "client_johnson",
            "client_name": "Peter & Lisa Johnson",
            "document_type": "roa",
            "advice_type": "personal",
            "status": "signed",
            "title": "Balanced Portfolio Rebalance",
            "advice_areas": ["Balanced"],
            "adviser_id": "adv_williams",
            "adviser_name": "Sarah Williams",
            "advice_date": "2026-03-01",
            "review_due_date": "2027-03-01",
            "review_outcome": "approved",
            "reviewer_name": "Compliance Team",
            "compliance_score": 92,
            "review_conditions": [],
            "advice_fee": 1850,
            "risk_profile_confirmed": True,
            "conflicts_disclosed": True,
            "fees_disclosed": True,
            "cooling_off_explained": True,
            "created_at": (now - timedelta(days=29)).isoformat(),
            "updated_at": now.isoformat(),
            "status_history": [{"status": "signed", "timestamp": now.isoformat(), "notes": "Client signed"}]
        },
    ]
    
    await db.compliance_documents.insert_many(demo_docs)
    
    return {"status": "seeded", "count": len(demo_docs)}



@router.post("/document")
async def create_compliance_document(doc: ComplianceDocument) -> dict:
    """Create a new SOA/ROA compliance document"""
    db = await get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    doc_dict = doc.dict()
    doc_dict["document_id"] = f"DOC-{doc.document_type.value.upper()}-{uuid.uuid4().hex[:8].upper()}"
    doc_dict["created_at"] = now
    doc_dict["updated_at"] = now
    
    # Initialize status history
    doc_dict["status_history"] = [{
        "status": doc.status.value,
        "timestamp": now,
        "user": doc.adviser_id,
        "notes": "Document created"
    }]
    
    # Calculate review due date if advice date provided
    if doc.advice_date and not doc.review_due_date:
        doc_dict["review_due_date"] = calculate_review_due_date(doc.advice_date, doc.advice_type.value)
    
    await db.compliance_documents.insert_one(doc_dict)
    
    # Remove MongoDB _id from response
    if "_id" in doc_dict:
        del doc_dict["_id"]
    
    return doc_dict

@router.get("/document/{document_id}")
async def get_document(document_id: str) -> dict:
    """Get a specific compliance document"""
    db = await get_db()
    
    doc = await db.compliance_documents.find_one(
        {"document_id": document_id},
        {"_id": 0}
    )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return doc

@router.get("/client/{client_id}")
async def get_client_documents(client_id: str, document_type: Optional[str] = None, status: Optional[str] = None) -> dict:
    """Get all compliance documents for a client"""
    db = await get_db()
    
    query = {"client_id": client_id}
    if document_type:
        query["document_type"] = document_type
    if status:
        query["status"] = status
    
    docs = await db.compliance_documents.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)
    
    return {
        "client_id": client_id,
        "documents": docs,
        "total": len(docs),
        "soa_count": sum(1 for d in docs if d.get("document_type") in ["soa", "soa_supplementary"]),
        "roa_count": sum(1 for d in docs if d.get("document_type") == "roa")
    }

@router.put("/document/{document_id}/status")
async def update_document_status(document_id: str, update: DocumentStatusUpdate) -> dict:
    """Update document status"""
    db = await get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "status": update.status.value,
        "updated_at": now
    }
    
    # Set specific dates based on status
    if update.status == DocumentStatus.SIGNED and update.date:
        update_data["signed_date"] = update.date
    elif update.status == DocumentStatus.IMPLEMENTED and update.date:
        update_data["implementation_date"] = update.date
    elif update.status == DocumentStatus.PENDING_SIGNATURE and update.date:
        update_data["presented_date"] = update.date
    
    # Add to status history
    history_entry = {
        "status": update.status.value,
        "timestamp": now,
        "notes": update.notes
    }
    
    result = await db.compliance_documents.update_one(
        {"document_id": document_id},
        {
            "$set": update_data,
            "$push": {"status_history": history_entry}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"status": "updated", "document_id": document_id, "new_status": update.status.value}

@router.post("/document/{document_id}/review")
async def submit_document_review(document_id: str, review: DocumentReview) -> dict:
    """Submit compliance review for a document"""
    db = await get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "reviewer_id": review.reviewer_id,
        "reviewer_name": review.reviewer_name,
        "review_date": now,
        "review_outcome": review.outcome.value,
        "review_notes": review.notes,
        "updated_at": now
    }
    
    # Update status based on review outcome
    if review.outcome == ReviewOutcome.APPROVED:
        update_data["status"] = DocumentStatus.REVIEWED.value
    elif review.outcome == ReviewOutcome.APPROVED_WITH_CONDITIONS:
        update_data["status"] = DocumentStatus.REVIEWED.value
    elif review.outcome in [ReviewOutcome.REQUIRES_CHANGES, ReviewOutcome.REJECTED]:
        update_data["status"] = DocumentStatus.DRAFT.value
    
    history_entry = {
        "status": update_data.get("status", "reviewed"),
        "timestamp": now,
        "user": review.reviewer_id,
        "notes": f"Compliance review: {review.outcome.value}. {review.notes or ''}"
    }
    
    result = await db.compliance_documents.update_one(
        {"document_id": document_id},
        {
            "$set": update_data,
            "$push": {"status_history": history_entry}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "document_id": document_id,
        "review_outcome": review.outcome.value,
        "new_status": update_data.get("status"),
        "reviewed_at": now
    }

@router.get("/adviser/{adviser_id}")
async def get_adviser_documents(adviser_id: str, pending_only: bool = False) -> dict:
    """Get all documents for an adviser"""
    db = await get_db()
    
    query = {"adviser_id": adviser_id}
    if pending_only:
        query["status"] = {"$in": ["draft", "pending_review", "pending_signature"]}
    
    docs = await db.compliance_documents.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=200)
    
    # Summary stats
    status_counts = {}
    for doc in docs:
        status = doc.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return {
        "adviser_id": adviser_id,
        "documents": docs,
        "total": len(docs),
        "status_breakdown": status_counts,
        "pending_review": sum(1 for d in docs if d.get("status") == "pending_review"),
        "pending_signature": sum(1 for d in docs if d.get("status") == "pending_signature")
    }

@router.get("/reviews/pending")
async def get_pending_reviews(reviewer_id: Optional[str] = None) -> dict:
    """Get documents pending compliance review"""
    db = await get_db()
    
    query = {"status": DocumentStatus.PENDING_REVIEW.value}
    if reviewer_id:
        query["$or"] = [
            {"reviewer_id": reviewer_id},
            {"reviewer_id": None}
        ]
    
    docs = await db.compliance_documents.find(
        query,
        {"_id": 0}
    ).sort("created_at", 1).to_list(length=100)
    
    return {
        "pending_reviews": docs,
        "total": len(docs)
    }

@router.get("/reviews/due")
async def get_reviews_due(days: int = 30) -> dict:
    """Get documents with reviews due within specified days"""
    db = await get_db()
    
    cutoff = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    now = datetime.now(timezone.utc).isoformat()
    
    docs = await db.compliance_documents.find(
        {
            "review_due_date": {"$lte": cutoff, "$gte": now},
            "status": {"$nin": ["superseded", "withdrawn"]}
        },
        {"_id": 0}
    ).sort("review_due_date", 1).to_list(length=100)
    
    # Also get overdue reviews
    overdue = await db.compliance_documents.find(
        {
            "review_due_date": {"$lt": now},
            "status": {"$nin": ["superseded", "withdrawn"]}
        },
        {"_id": 0}
    ).sort("review_due_date", 1).to_list(length=100)
    
    return {
        "due_within_days": days,
        "reviews_due": docs,
        "overdue_reviews": overdue,
        "total_due": len(docs),
        "total_overdue": len(overdue)
    }

@router.get("/compliance-summary")
async def get_compliance_summary() -> Dict[str, Any]:
    """Get overall compliance document summary"""
    db = await get_db()
    
    pipeline = [
        {"$group": {
            "_id": {"document_type": "$document_type", "status": "$status"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.compliance_documents.aggregate(pipeline).to_list(length=100)
    
    # Organize by document type
    summary = {}
    for r in results:
        doc_type = r["_id"]["document_type"]
        status = r["_id"]["status"]
        if doc_type not in summary:
            summary[doc_type] = {}
        summary[doc_type][status] = r["count"]
    
    # Get pending reviews count
    pending_review = await db.compliance_documents.count_documents({"status": "pending_review"})
    
    # Get overdue reviews
    now = datetime.now(timezone.utc).isoformat()
    overdue = await db.compliance_documents.count_documents({
        "review_due_date": {"$lt": now},
        "status": {"$nin": ["superseded", "withdrawn"]}
    })
    
    return {
        "document_summary": summary,
        "pending_compliance_review": pending_review,
        "overdue_reviews": overdue,
        "timestamp": now
    }

@router.get("/audit-trail/{document_id}")
async def get_document_audit_trail(document_id: str) -> Dict[str, Any]:
    """Get full audit trail for a document"""
    db = await get_db()
    
    doc = await db.compliance_documents.find_one(
        {"document_id": document_id},
        {"_id": 0, "document_id": 1, "client_id": 1, "client_name": 1, "document_type": 1, 
         "status": 1, "status_history": 1, "created_at": 1, "adviser_name": 1,
         "reviewer_name": 1, "review_outcome": 1}
    )
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "document_id": document_id,
        "document_type": doc.get("document_type"),
        "client_name": doc.get("client_name"),
        "adviser_name": doc.get("adviser_name"),
        "current_status": doc.get("status"),
        "audit_trail": doc.get("status_history", []),
        "created_at": doc.get("created_at")
    }
