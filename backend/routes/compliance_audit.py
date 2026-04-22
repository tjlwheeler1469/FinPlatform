"""
Compliance & Audit Layer
Full audit logs, KYC/AML workflows, document management, approvals.
Enterprise-grade compliance for wealth management.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compliance-audit", tags=["Compliance & Audit"])


class AuditAction(str, Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    APPROVE = "approve"
    REJECT = "reject"
    TRADE = "trade"
    TRANSFER = "transfer"
    DOCUMENT_UPLOAD = "document_upload"
    DOCUMENT_VIEW = "document_view"
    COMPLIANCE_CHECK = "compliance_check"
    KYC_UPDATE = "kyc_update"
    AML_CHECK = "aml_check"


class KYCStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class AMLRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class DocumentType(str, Enum):
    ID_PASSPORT = "id_passport"
    ID_DRIVERS_LICENSE = "id_drivers_license"
    ID_PROOF_OF_ADDRESS = "id_proof_of_address"
    SOA = "statement_of_advice"
    ROA = "record_of_advice"
    FSG = "financial_services_guide"
    PDS = "product_disclosure_statement"
    RISK_PROFILE = "risk_profile"
    TAX_RETURN = "tax_return"
    TRUST_DEED = "trust_deed"
    COMPANY_EXTRACT = "company_extract"
    WILL = "will"
    POWER_OF_ATTORNEY = "power_of_attorney"
    INSURANCE_POLICY = "insurance_policy"
    OTHER = "other"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"


class ApprovalType(str, Enum):
    TRADE = "trade"
    TRANSFER = "transfer"
    NEW_CLIENT = "new_client"
    SOA_ISSUE = "soa_issue"
    RISK_OVERRIDE = "risk_override"
    FEE_CHANGE = "fee_change"
    DOCUMENT_RELEASE = "document_release"


# ==================== IN-MEMORY STORAGE ====================

AUDIT_LOG: List[Dict] = []
KYC_RECORDS: Dict[str, Dict] = {}
AML_RECORDS: Dict[str, Dict] = {}
DOCUMENTS: Dict[str, Dict] = {}
APPROVALS: Dict[str, Dict] = {}
READINESS_EVENTS: List[Dict] = []  # compliance trail of every readiness compute


# Pre-populate with demo data
def _init_demo_data() -> dict:
    # Add some audit logs
    global AUDIT_LOG
    AUDIT_LOG = [
        {
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "user_id": "advisor_001",
            "user_name": "John Advisor",
            "action": AuditAction.LOGIN,
            "resource_type": "session",
            "resource_id": "sess_001",
            "ip_address": "203.45.67.89",
            "user_agent": "Mozilla/5.0 Chrome/120.0",
            "details": {"method": "password"},
            "success": True
        },
        {
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=1, minutes=45)).isoformat(),
            "user_id": "advisor_001",
            "user_name": "John Advisor",
            "action": AuditAction.READ,
            "resource_type": "client",
            "resource_id": "client_1",
            "ip_address": "203.45.67.89",
            "details": {"client_name": "Wheeler Family"},
            "success": True
        },
        {
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=1, minutes=30)).isoformat(),
            "user_id": "advisor_001",
            "user_name": "John Advisor",
            "action": AuditAction.TRADE,
            "resource_type": "portfolio",
            "resource_id": "portfolio_001",
            "ip_address": "203.45.67.89",
            "details": {"symbol": "VAS.AX", "action": "buy", "quantity": 100, "value": 9234.50},
            "success": True
        },
        {
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(),
            "user_id": "advisor_001",
            "user_name": "John Advisor",
            "action": AuditAction.DOCUMENT_UPLOAD,
            "resource_type": "document",
            "resource_id": "doc_001",
            "ip_address": "203.45.67.89",
            "details": {"document_type": "statement_of_advice", "client_id": "client_1"},
            "success": True
        },
        {
            "log_id": f"log_{uuid.uuid4().hex[:8]}",
            "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=20)).isoformat(),
            "user_id": "advisor_001",
            "user_name": "John Advisor",
            "action": AuditAction.APPROVE,
            "resource_type": "approval",
            "resource_id": "appr_001",
            "ip_address": "203.45.67.89",
            "details": {"approval_type": "trade", "approved_amount": 50000},
            "success": True
        }
    ]
    
    # KYC Records
    global KYC_RECORDS
    KYC_RECORDS = {
        "client_1": {
            "client_id": "client_1",
            "client_name": "John Wheeler",
            "status": KYCStatus.APPROVED,
            "verification_date": "2024-06-15",
            "expiry_date": "2026-06-15",
            "verified_by": "advisor_001",
            "documents_verified": ["id_passport", "id_proof_of_address"],
            "pep_check": False,
            "sanctions_check": True,
            "risk_rating": AMLRisk.LOW,
            "notes": "All documents verified. No adverse findings.",
            "history": [
                {"date": "2024-06-15", "action": "approved", "by": "advisor_001", "notes": "Initial verification complete"}
            ]
        },
        "client_2": {
            "client_id": "client_2",
            "client_name": "Sarah Chen",
            "status": KYCStatus.PENDING_REVIEW,
            "verification_date": None,
            "expiry_date": None,
            "verified_by": None,
            "documents_verified": ["id_passport"],
            "documents_pending": ["id_proof_of_address"],
            "pep_check": False,
            "sanctions_check": True,
            "risk_rating": AMLRisk.MEDIUM,
            "notes": "Awaiting proof of address",
            "history": [
                {"date": "2025-03-10", "action": "started", "by": "advisor_001", "notes": "KYC process initiated"}
            ]
        }
    }
    
    # Documents
    global DOCUMENTS
    DOCUMENTS = {
        "doc_001": {
            "document_id": "doc_001",
            "client_id": "client_1",
            "document_type": DocumentType.SOA,
            "title": "Statement of Advice - Investment Strategy",
            "filename": "Wheeler_SOA_March2025.pdf",
            "file_size": 1245678,
            "mime_type": "application/pdf",
            "uploaded_by": "advisor_001",
            "uploaded_at": "2025-03-15T10:30:00Z",
            "version": 1,
            "status": "active",
            "tags": ["investment", "soa", "2025"],
            "access_log": [
                {"user_id": "advisor_001", "action": "upload", "timestamp": "2025-03-15T10:30:00Z"},
                {"user_id": "client_1", "action": "view", "timestamp": "2025-03-15T14:22:00Z"}
            ]
        },
        "doc_002": {
            "document_id": "doc_002",
            "client_id": "client_1",
            "document_type": DocumentType.RISK_PROFILE,
            "title": "Risk Profile Assessment 2025",
            "filename": "Wheeler_RiskProfile_2025.pdf",
            "file_size": 456789,
            "mime_type": "application/pdf",
            "uploaded_by": "advisor_001",
            "uploaded_at": "2025-02-20T09:15:00Z",
            "version": 2,
            "status": "active",
            "tags": ["risk", "assessment", "2025"]
        },
        "doc_003": {
            "document_id": "doc_003",
            "client_id": "client_1",
            "document_type": DocumentType.ID_PASSPORT,
            "title": "Passport - John Wheeler",
            "filename": "Wheeler_Passport.pdf",
            "file_size": 234567,
            "mime_type": "application/pdf",
            "uploaded_by": "advisor_001",
            "uploaded_at": "2024-06-15T11:00:00Z",
            "version": 1,
            "status": "active",
            "expiry_date": "2029-05-15",
            "tags": ["id", "kyc", "passport"]
        }
    }
    
    # Approvals
    global APPROVALS
    APPROVALS = {
        "appr_001": {
            "approval_id": "appr_001",
            "approval_type": ApprovalType.TRADE,
            "status": ApprovalStatus.APPROVED,
            "requested_by": "advisor_001",
            "requested_at": "2025-03-17T08:30:00Z",
            "approved_by": "senior_001",
            "approved_at": "2025-03-17T09:15:00Z",
            "client_id": "client_1",
            "details": {
                "trade_type": "buy",
                "symbol": "NVDA",
                "quantity": 50,
                "estimated_value": 43945.00,
                "reason": "Model portfolio update"
            },
            "notes": "Approved - within risk parameters"
        },
        "appr_002": {
            "approval_id": "appr_002",
            "approval_type": ApprovalType.SOA_ISSUE,
            "status": ApprovalStatus.PENDING,
            "requested_by": "advisor_001",
            "requested_at": "2025-03-17T10:00:00Z",
            "approved_by": None,
            "approved_at": None,
            "client_id": "client_2",
            "details": {
                "soa_type": "comprehensive",
                "recommendations": ["super consolidation", "investment rebalancing", "insurance review"],
                "estimated_fees": 3300.00
            },
            "notes": "Awaiting compliance review"
        },
        "appr_003": {
            "approval_id": "appr_003",
            "approval_type": ApprovalType.RISK_OVERRIDE,
            "status": ApprovalStatus.ESCALATED,
            "requested_by": "advisor_001",
            "requested_at": "2025-03-16T14:30:00Z",
            "approved_by": None,
            "approved_at": None,
            "client_id": "client_3",
            "details": {
                "current_risk": "conservative",
                "requested_risk": "growth",
                "reason": "Client request - approaching retirement but has sufficient pension"
            },
            "notes": "Escalated to compliance manager"
        }
    }

_init_demo_data()


# ==================== AUDIT LOG ENDPOINTS ====================

@router.get("/audit-log")
async def get_audit_log(
    limit: int = 100,
    user_id: Optional[str] = None,
    action: Optional[AuditAction] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> dict:
    """Get audit log with filtering options."""
    logs = AUDIT_LOG.copy()
    
    # Apply filters
    if user_id:
        logs = [item for item in logs if item.get("user_id") == user_id]
    if action:
        logs = [item for item in logs if item.get("action") == action]
    if resource_type:
        logs = [item for item in logs if item.get("resource_type") == resource_type]
    if start_date:
        logs = [item for item in logs if item.get("timestamp", "") >= start_date]
    if end_date:
        logs = [item for item in logs if item.get("timestamp", "") <= end_date]
    
    # Sort by timestamp descending
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "logs": logs[:limit],
        "total": len(logs),
        "filters_applied": {
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "start_date": start_date,
            "end_date": end_date
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/audit-log")
async def create_audit_entry(
    user_id: str,
    user_name: str,
    action: AuditAction,
    resource_type: str,
    resource_id: str,
    details: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    success: bool = True
) -> dict:
    """Create a new audit log entry."""
    entry = {
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "ip_address": ip_address,
        "details": details or {},
        "success": success
    }
    
    AUDIT_LOG.append(entry)
    
    return {
        "success": True,
        "log_entry": entry
    }


@router.get("/audit-log/summary")
async def get_audit_summary(days: int = 7) -> dict:
    """Get summary of audit activity."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    recent_logs = [item for item in AUDIT_LOG if item.get("timestamp", "") >= cutoff]
    
    # Count by action
    by_action = {}
    for log in recent_logs:
        action = log.get("action", "unknown")
        by_action[action] = by_action.get(action, 0) + 1
    
    # Count by user
    by_user = {}
    for log in recent_logs:
        user = log.get("user_name", "unknown")
        by_user[user] = by_user.get(user, 0) + 1
    
    # Count by resource type
    by_resource = {}
    for log in recent_logs:
        resource = log.get("resource_type", "unknown")
        by_resource[resource] = by_resource.get(resource, 0) + 1
    
    return {
        "period_days": days,
        "total_events": len(recent_logs),
        "by_action": by_action,
        "by_user": by_user,
        "by_resource_type": by_resource,
        "failed_events": len([item for item in recent_logs if not item.get("success", True)]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== KYC/AML ENDPOINTS ====================

@router.get("/kyc/dashboard")
async def get_kyc_dashboard() -> dict:
    """Get KYC dashboard with status overview."""
    statuses = {}
    for record in KYC_RECORDS.values():
        status = record.get("status", KYCStatus.NOT_STARTED)
        statuses[status] = statuses.get(status, 0) + 1
    
    # Find expiring soon (within 90 days)
    expiring_soon = []
    cutoff = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()[:10]
    for record in KYC_RECORDS.values():
        if record.get("expiry_date") and record["expiry_date"] <= cutoff:
            expiring_soon.append({
                "client_id": record["client_id"],
                "client_name": record["client_name"],
                "expiry_date": record["expiry_date"]
            })
    
    # Pending reviews
    pending = [r for r in KYC_RECORDS.values() if r.get("status") == KYCStatus.PENDING_REVIEW]
    
    return {
        "summary": {
            "total_clients": len(KYC_RECORDS),
            "by_status": statuses,
            "expiring_within_90_days": len(expiring_soon),
            "pending_review": len(pending)
        },
        "expiring_soon": expiring_soon,
        "pending_reviews": pending,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/kyc/{client_id}")
async def get_kyc_status(client_id: str) -> dict:
    """Get KYC status for a client."""
    if client_id not in KYC_RECORDS:
        return {
            "client_id": client_id,
            "status": KYCStatus.NOT_STARTED,
            "message": "KYC not yet initiated for this client"
        }
    
    record = KYC_RECORDS[client_id]
    
    # Check if expired
    if record.get("expiry_date"):
        expiry = datetime.strptime(record["expiry_date"], "%Y-%m-%d")
        if expiry < datetime.now():
            record["status"] = KYCStatus.EXPIRED
    
    return {
        **record,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/kyc/{client_id}/initiate")
async def initiate_kyc(
    client_id: str,
    client_name: str,
    initiated_by: str
) -> dict:
    """Initiate KYC process for a client."""
    if client_id in KYC_RECORDS and KYC_RECORDS[client_id]["status"] == KYCStatus.APPROVED:
        raise HTTPException(status_code=400, detail="KYC already approved for this client")
    
    KYC_RECORDS[client_id] = {
        "client_id": client_id,
        "client_name": client_name,
        "status": KYCStatus.IN_PROGRESS,
        "verification_date": None,
        "expiry_date": None,
        "verified_by": None,
        "documents_verified": [],
        "documents_pending": ["id_passport", "id_proof_of_address"],
        "pep_check": None,
        "sanctions_check": None,
        "risk_rating": None,
        "notes": "",
        "history": [
            {
                "date": datetime.now(timezone.utc).isoformat()[:10],
                "action": "initiated",
                "by": initiated_by,
                "notes": "KYC process started"
            }
        ]
    }
    
    # Log audit
    await create_audit_entry(
        user_id=initiated_by,
        user_name=initiated_by,
        action=AuditAction.KYC_UPDATE,
        resource_type="kyc",
        resource_id=client_id,
        details={"action": "initiate"}
    )
    
    return {
        "success": True,
        "kyc_record": KYC_RECORDS[client_id],
        "next_steps": [
            "Collect passport or driver's license",
            "Collect proof of address (utility bill, bank statement)",
            "Complete PEP and sanctions screening"
        ]
    }


@router.post("/kyc/{client_id}/verify-document")
async def verify_kyc_document(
    client_id: str,
    document_type: str,
    verified_by: str,
    notes: Optional[str] = None
) -> dict:
    """Mark a KYC document as verified."""
    if client_id not in KYC_RECORDS:
        raise HTTPException(status_code=404, detail="KYC record not found")
    
    record = KYC_RECORDS[client_id]
    
    if document_type not in record.get("documents_verified", []):
        record["documents_verified"].append(document_type)
    
    if document_type in record.get("documents_pending", []):
        record["documents_pending"].remove(document_type)
    
    record["history"].append({
        "date": datetime.now(timezone.utc).isoformat()[:10],
        "action": "document_verified",
        "by": verified_by,
        "notes": f"Verified: {document_type}. {notes or ''}"
    })
    
    # Check if all documents verified
    if not record.get("documents_pending"):
        record["status"] = KYCStatus.PENDING_REVIEW
    
    return {
        "success": True,
        "kyc_record": record,
        "documents_remaining": record.get("documents_pending", [])
    }


@router.post("/kyc/{client_id}/approve")
async def approve_kyc(
    client_id: str,
    approved_by: str,
    risk_rating: AMLRisk,
    notes: Optional[str] = None
) -> dict:
    """Approve KYC for a client."""
    if client_id not in KYC_RECORDS:
        raise HTTPException(status_code=404, detail="KYC record not found")
    
    record = KYC_RECORDS[client_id]
    
    record["status"] = KYCStatus.APPROVED
    record["verification_date"] = datetime.now(timezone.utc).isoformat()[:10]
    record["expiry_date"] = (datetime.now(timezone.utc) + timedelta(days=730)).isoformat()[:10]  # 2 years
    record["verified_by"] = approved_by
    record["risk_rating"] = risk_rating
    record["pep_check"] = True
    record["sanctions_check"] = True
    record["notes"] = notes or "KYC approved"
    record["history"].append({
        "date": datetime.now(timezone.utc).isoformat()[:10],
        "action": "approved",
        "by": approved_by,
        "notes": notes or "KYC verification complete"
    })
    
    return {
        "success": True,
        "kyc_record": record,
        "message": f"KYC approved for {record['client_name']}. Valid until {record['expiry_date']}"
    }


# ==================== DOCUMENT MANAGEMENT ====================

@router.get("/documents")
async def list_documents(
    client_id: Optional[str] = None,
    document_type: Optional[DocumentType] = None,
    limit: int = 50
) -> dict:
    """List documents with filtering."""
    docs = list(DOCUMENTS.values())
    
    if client_id:
        docs = [d for d in docs if d.get("client_id") == client_id]
    if document_type:
        docs = [d for d in docs if d.get("document_type") == document_type]
    
    # Sort by upload date descending
    docs.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    
    return {
        "documents": docs[:limit],
        "total": len(docs),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/documents/{document_id}")
async def get_document(document_id: str) -> dict:
    """Get document details."""
    if document_id not in DOCUMENTS:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        **DOCUMENTS[document_id],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/documents/upload")
async def upload_document(
    client_id: str,
    document_type: DocumentType,
    title: str,
    filename: str,
    uploaded_by: str,
    tags: Optional[List[str]] = None,
    expiry_date: Optional[str] = None
) -> dict:
    """Upload a new document (metadata only - actual file would go to S3/storage)."""
    doc_id = f"doc_{uuid.uuid4().hex[:6]}"
    
    document = {
        "document_id": doc_id,
        "client_id": client_id,
        "document_type": document_type,
        "title": title,
        "filename": filename,
        "file_size": 0,  # Would be set from actual file
        "mime_type": "application/pdf",
        "uploaded_by": uploaded_by,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "version": 1,
        "status": "active",
        "tags": tags or [],
        "expiry_date": expiry_date,
        "access_log": [
            {"user_id": uploaded_by, "action": "upload", "timestamp": datetime.now(timezone.utc).isoformat()}
        ]
    }
    
    DOCUMENTS[doc_id] = document
    
    # Log audit
    await create_audit_entry(
        user_id=uploaded_by,
        user_name=uploaded_by,
        action=AuditAction.DOCUMENT_UPLOAD,
        resource_type="document",
        resource_id=doc_id,
        details={"document_type": document_type, "client_id": client_id}
    )
    
    return {
        "success": True,
        "document": document,
        "message": f"Document '{title}' uploaded successfully"
    }


@router.get("/documents/client/{client_id}")
async def get_client_documents(client_id: str) -> dict:
    """Get all documents for a client, grouped by type."""
    docs = [d for d in DOCUMENTS.values() if d.get("client_id") == client_id]
    
    by_type = {}
    for doc in docs:
        dtype = doc.get("document_type", "other")
        if dtype not in by_type:
            by_type[dtype] = []
        by_type[dtype].append(doc)
    
    return {
        "client_id": client_id,
        "documents": docs,
        "by_type": by_type,
        "total": len(docs),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== APPROVAL WORKFLOWS ====================

@router.get("/approvals")
async def list_approvals(
    status: Optional[ApprovalStatus] = None,
    approval_type: Optional[ApprovalType] = None,
    limit: int = 50
) -> dict:
    """List approval requests."""
    approvals = list(APPROVALS.values())
    
    if status:
        approvals = [a for a in approvals if a.get("status") == status]
    if approval_type:
        approvals = [a for a in approvals if a.get("approval_type") == approval_type]
    
    # Sort by requested date descending
    approvals.sort(key=lambda x: x.get("requested_at", ""), reverse=True)
    
    return {
        "approvals": approvals[:limit],
        "total": len(approvals),
        "pending_count": len([a for a in APPROVALS.values() if a.get("status") == ApprovalStatus.PENDING]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/approvals/request")
async def request_approval(
    approval_type: ApprovalType,
    requested_by: str,
    client_id: str,
    details: Dict,
    notes: Optional[str] = None
) -> dict:
    """Request approval for an action."""
    appr_id = f"appr_{uuid.uuid4().hex[:6]}"
    
    approval = {
        "approval_id": appr_id,
        "approval_type": approval_type,
        "status": ApprovalStatus.PENDING,
        "requested_by": requested_by,
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "approved_by": None,
        "approved_at": None,
        "client_id": client_id,
        "details": details,
        "notes": notes
    }
    
    APPROVALS[appr_id] = approval
    
    return {
        "success": True,
        "approval": approval,
        "message": f"Approval request {appr_id} created"
    }


@router.post("/approvals/{approval_id}/approve")
async def approve_request(
    approval_id: str,
    approved_by: str,
    notes: Optional[str] = None
) -> dict:
    """Approve a pending request."""
    if approval_id not in APPROVALS:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    approval = APPROVALS[approval_id]
    approval["status"] = ApprovalStatus.APPROVED
    approval["approved_by"] = approved_by
    approval["approved_at"] = datetime.now(timezone.utc).isoformat()
    approval["notes"] = (approval.get("notes", "") + f"\nApproved: {notes or ''}").strip()
    
    # Log audit
    await create_audit_entry(
        user_id=approved_by,
        user_name=approved_by,
        action=AuditAction.APPROVE,
        resource_type="approval",
        resource_id=approval_id,
        details={"approval_type": approval["approval_type"]}
    )
    
    return {
        "success": True,
        "approval": approval,
        "message": "Request approved"
    }


@router.post("/approvals/{approval_id}/reject")
async def reject_request(
    approval_id: str,
    rejected_by: str,
    reason: str
) -> dict:
    """Reject a pending request."""
    if approval_id not in APPROVALS:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    approval = APPROVALS[approval_id]
    approval["status"] = ApprovalStatus.REJECTED
    approval["approved_by"] = rejected_by
    approval["approved_at"] = datetime.now(timezone.utc).isoformat()
    approval["notes"] = (approval.get("notes", "") + f"\nRejected: {reason}").strip()
    
    return {
        "success": True,
        "approval": approval,
        "message": "Request rejected"
    }


@router.get("/approvals/dashboard")
async def get_approvals_dashboard() -> dict:
    """Get approvals dashboard with pending items."""
    pending = [a for a in APPROVALS.values() if a.get("status") == ApprovalStatus.PENDING]
    escalated = [a for a in APPROVALS.values() if a.get("status") == ApprovalStatus.ESCALATED]
    
    # Count by type
    by_type = {}
    for appr in APPROVALS.values():
        atype = appr.get("approval_type", "other")
        by_type[atype] = by_type.get(atype, 0) + 1
    
    # Count by status
    by_status = {}
    for appr in APPROVALS.values():
        status = appr.get("status", "unknown")
        by_status[status] = by_status.get(status, 0) + 1
    
    return {
        "summary": {
            "total_approvals": len(APPROVALS),
            "pending": len(pending),
            "escalated": len(escalated),
            "by_type": by_type,
            "by_status": by_status
        },
        "pending_approvals": pending,
        "escalated_approvals": escalated,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== COMPLIANCE DASHBOARD ====================

@router.get("/dashboard")
async def get_compliance_dashboard() -> dict:
    """Get comprehensive compliance dashboard."""
    # KYC Summary
    kyc_statuses = {}
    for record in KYC_RECORDS.values():
        status = record.get("status", "not_started")
        kyc_statuses[status] = kyc_statuses.get(status, 0) + 1
    
    # Approvals Summary
    approval_statuses = {}
    for appr in APPROVALS.values():
        status = appr.get("status", "unknown")
        approval_statuses[status] = approval_statuses.get(status, 0) + 1
    
    # Recent Audit Activity
    recent_audits = AUDIT_LOG[-10:] if AUDIT_LOG else []
    
    # Document counts
    doc_types = {}
    for doc in DOCUMENTS.values():
        dtype = doc.get("document_type", "other")
        doc_types[dtype] = doc_types.get(dtype, 0) + 1
    
    # Compliance alerts
    alerts = []
    
    # Check for expiring KYC
    cutoff = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()[:10]
    for record in KYC_RECORDS.values():
        if record.get("expiry_date") and record["expiry_date"] <= cutoff:
            alerts.append({
                "type": "kyc_expiring",
                "severity": "warning",
                "message": f"KYC expiring for {record['client_name']} on {record['expiry_date']}"
            })
    
    # Check for pending approvals older than 24 hours
    cutoff_time = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    for appr in APPROVALS.values():
        if appr.get("status") == ApprovalStatus.PENDING and appr.get("requested_at", "") < cutoff_time:
            alerts.append({
                "type": "approval_overdue",
                "severity": "warning",
                "message": f"Approval {appr['approval_id']} pending for more than 24 hours"
            })
    
    return {
        "kyc": {
            "total_clients": len(KYC_RECORDS),
            "by_status": kyc_statuses
        },
        "approvals": {
            "total": len(APPROVALS),
            "by_status": approval_statuses,
            "pending": len([a for a in APPROVALS.values() if a.get("status") == ApprovalStatus.PENDING])
        },
        "documents": {
            "total": len(DOCUMENTS),
            "by_type": doc_types
        },
        "audit": {
            "total_events": len(AUDIT_LOG),
            "recent": recent_audits[-5:]
        },
        "alerts": alerts,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== READINESS COMPLIANCE EVENTS ====================
# Every time the readiness engine computes a score for a client, the frontend
# fires a beacon here. These events form the compliance-by-design audit trail:
# regulators can see exactly what inputs drove a given recommendation.

from fastapi import Body


@router.post("/readiness-events")
async def log_readiness_event(payload: Dict = Body(...)) -> dict:
    """Log a retirement-readiness compute event for compliance audit.

    Payload (all optional except client_id):
      - client_id (str, required)
      - client_name (str)
      - score (int/float)
      - classification (str)
      - factors (list[{id, score}])
      - inputs (dict)
      - num_sims (int)
      - actor (str)  # 'adviser' | 'client'
    """
    client_id = payload.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="client_id required")

    event = {
        "event_id": f"rre_{uuid.uuid4().hex[:10]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "client_id": client_id,
        "client_name": payload.get("client_name", ""),
        "score": payload.get("score"),
        "classification": payload.get("classification"),
        "factors": payload.get("factors", []),
        "inputs": payload.get("inputs", {}),
        "num_sims": payload.get("num_sims"),
        "actor": payload.get("actor", "system"),
    }
    READINESS_EVENTS.append(event)

    # Cap in-memory store
    if len(READINESS_EVENTS) > 5000:
        del READINESS_EVENTS[:1000]

    # Also stamp into the main audit log (so the dashboard view shows it)
    AUDIT_LOG.append({
        "log_id": f"log_{uuid.uuid4().hex[:8]}",
        "timestamp": event["timestamp"],
        "user_id": event["actor"],
        "user_name": event["actor"],
        "action": AuditAction.COMPLIANCE_CHECK,
        "resource_type": "readiness",
        "resource_id": client_id,
        "details": {"score": event["score"], "classification": event["classification"], "num_sims": event["num_sims"]},
        "success": True,
    })

    return {"success": True, "event_id": event["event_id"]}


@router.get("/readiness-events")
async def list_readiness_events(
    client_id: Optional[str] = None,
    limit: int = 100,
) -> dict:
    """List readiness audit events, optionally filtered by client."""
    events = READINESS_EVENTS
    if client_id:
        events = [e for e in events if e.get("client_id") == client_id]
    events = sorted(events, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]
    return {
        "events": events,
        "total": len(events),
        "total_all": len(READINESS_EVENTS),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/readiness-events/summary")
async def readiness_events_summary() -> dict:
    """Aggregate summary of readiness events (for compliance dashboard)."""
    by_client: Dict[str, int] = {}
    by_day: Dict[str, int] = {}
    score_buckets = {"strong": 0, "on_track": 0, "watchlist": 0, "at_risk": 0}

    for e in READINESS_EVENTS:
        cid = e.get("client_id", "unknown")
        by_client[cid] = by_client.get(cid, 0) + 1
        day = (e.get("timestamp", "")[:10]) or "unknown"
        by_day[day] = by_day.get(day, 0) + 1
        score = e.get("score") or 0
        if score >= 90:
            score_buckets["strong"] += 1
        elif score >= 75:
            score_buckets["on_track"] += 1
        elif score >= 60:
            score_buckets["watchlist"] += 1
        else:
            score_buckets["at_risk"] += 1

    return {
        "total_events": len(READINESS_EVENTS),
        "unique_clients": len(by_client),
        "by_client": by_client,
        "by_day": by_day,
        "score_buckets": score_buckets,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
