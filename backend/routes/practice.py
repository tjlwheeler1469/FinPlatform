"""
Practice Management Routes
Time tracking, invoicing, compliance, and adviser dashboard.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/practice", tags=["Practice Management"])

# In-memory data stores
TIME_ENTRIES: Dict[str, Dict] = {}
INVOICES: Dict[str, Dict] = {}
COMPLIANCE_RECORDS: Dict[str, Dict] = {}
ADVISERS: Dict[str, Dict] = {}


class TimeEntryCreate(BaseModel):
    client_id: str
    date: str
    hours: float
    description: str
    category: str = "advisory"
    billable: bool = True


class InvoiceCreate(BaseModel):
    client_id: str
    amount: float
    description: str
    due_date: Optional[str] = None
    items: List[Dict[str, Any]] = []


class ComplianceCreate(BaseModel):
    client_id: str
    compliance_type: str
    status: str
    notes: Optional[str] = None
    due_date: Optional[str] = None


# Initialize sample adviser data
def init_sample_advisers():
    if not ADVISERS:
        ADVISERS["adv_001"] = {
            "id": "adv_001",
            "name": "James Wheeler",
            "email": "james@halcyonwealth.com",
            "role": "Senior Financial Adviser",
            "license": "AFP123456",
            "clients_count": 45,
            "aum": 52000000,
            "revenue_ytd": 485000,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

init_sample_advisers()


@router.get("/dashboard")
async def get_practice_dashboard():
    """Get practice management dashboard data."""
    time_entries = list(TIME_ENTRIES.values())
    invoices = list(INVOICES.values())
    
    # Calculate stats
    total_hours_this_month = sum(t.get("hours", 0) for t in time_entries)
    billable_hours = sum(t.get("hours", 0) for t in time_entries if t.get("billable"))
    total_revenue = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")
    outstanding = sum(i.get("amount", 0) for i in invoices if i.get("status") in ["pending", "sent"])
    
    return {
        "summary": {
            "total_clients": 45,
            "active_clients": 38,
            "total_aum": 52000000,
            "revenue_ytd": 485000,
            "outstanding_invoices": outstanding
        },
        "time_tracking": {
            "hours_this_month": total_hours_this_month,
            "billable_hours": billable_hours,
            "utilization_rate": (billable_hours / 160 * 100) if total_hours_this_month > 0 else 0
        },
        "compliance": {
            "reviews_due": 5,
            "soa_pending": 3,
            "kyc_updates_needed": 2
        },
        "upcoming": [
            {"date": "2025-01-15", "event": "Portfolio Review - Wheeler Family", "type": "meeting"},
            {"date": "2025-01-18", "event": "SOA Due - Chen Family", "type": "compliance"},
            {"date": "2025-01-20", "event": "Annual Review - Thompson", "type": "meeting"}
        ]
    }


# Time entries endpoints
@router.post("/time-entries")
async def create_time_entry(request: TimeEntryCreate):
    """Create a new time entry."""
    entry_id = f"time_{uuid.uuid4().hex[:8]}"
    
    entry = {
        "id": entry_id,
        "client_id": request.client_id,
        "date": request.date,
        "hours": request.hours,
        "description": request.description,
        "category": request.category,
        "billable": request.billable,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    TIME_ENTRIES[entry_id] = entry
    return entry


@router.get("/time-entries")
async def get_time_entries(
    client_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get time entries with optional filtering."""
    entries = list(TIME_ENTRIES.values())
    
    if client_id:
        entries = [e for e in entries if e.get("client_id") == client_id]
    
    return {"time_entries": entries}


@router.delete("/time-entries/{entry_id}")
async def delete_time_entry(entry_id: str):
    """Delete a time entry."""
    if entry_id not in TIME_ENTRIES:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    del TIME_ENTRIES[entry_id]
    return {"success": True}


# Invoice endpoints
@router.post("/invoices")
async def create_invoice(request: InvoiceCreate):
    """Create a new invoice."""
    invoice_id = f"inv_{uuid.uuid4().hex[:8]}"
    
    invoice = {
        "id": invoice_id,
        "invoice_number": f"INV-{datetime.now().strftime('%Y%m')}-{len(INVOICES) + 1:04d}",
        "client_id": request.client_id,
        "amount": request.amount,
        "description": request.description,
        "due_date": request.due_date,
        "items": request.items,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    INVOICES[invoice_id] = invoice
    return invoice


@router.get("/invoices")
async def get_invoices(
    client_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get invoices with optional filtering."""
    invoices = list(INVOICES.values())
    
    if client_id:
        invoices = [i for i in invoices if i.get("client_id") == client_id]
    if status:
        invoices = [i for i in invoices if i.get("status") == status]
    
    return {"invoices": invoices}


@router.put("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str):
    """Update invoice status."""
    if invoice_id not in INVOICES:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    INVOICES[invoice_id]["status"] = status
    INVOICES[invoice_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return INVOICES[invoice_id]


# Compliance endpoints
@router.post("/compliance")
async def create_compliance_record(request: ComplianceCreate):
    """Create a new compliance record."""
    record_id = f"comp_{uuid.uuid4().hex[:8]}"
    
    record = {
        "id": record_id,
        "client_id": request.client_id,
        "compliance_type": request.compliance_type,
        "status": request.status,
        "notes": request.notes,
        "due_date": request.due_date,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    COMPLIANCE_RECORDS[record_id] = record
    return record


@router.get("/compliance/{client_id}")
async def get_compliance_records(client_id: str):
    """Get compliance records for a client."""
    records = [r for r in COMPLIANCE_RECORDS.values() if r.get("client_id") == client_id]
    return {"compliance_records": records}


@router.put("/compliance/{record_id}")
async def update_compliance_record(record_id: str, updates: Dict[str, Any]):
    """Update a compliance record."""
    if record_id not in COMPLIANCE_RECORDS:
        raise HTTPException(status_code=404, detail="Compliance record not found")
    
    COMPLIANCE_RECORDS[record_id].update(updates)
    COMPLIANCE_RECORDS[record_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return COMPLIANCE_RECORDS[record_id]


# Adviser endpoints
@router.get("/advisers")
async def get_advisers():
    """Get all advisers."""
    return {"advisers": list(ADVISERS.values())}


@router.get("/advisers/{adviser_id}")
async def get_adviser(adviser_id: str):
    """Get a specific adviser."""
    adviser = ADVISERS.get(adviser_id)
    if not adviser:
        raise HTTPException(status_code=404, detail="Adviser not found")
    return adviser


@router.get("/revenue/{adviser_id}")
async def get_adviser_revenue(adviser_id: str):
    """Get revenue data for an adviser."""
    return {
        "adviser_id": adviser_id,
        "revenue": {
            "ytd": 485000,
            "last_month": 42000,
            "this_month": 38500,
            "projected_annual": 580000
        },
        "breakdown": {
            "advisory_fees": 380000,
            "implementation_fees": 65000,
            "insurance_commissions": 40000
        },
        "monthly_trend": [
            {"month": "Jul", "revenue": 38000},
            {"month": "Aug", "revenue": 41000},
            {"month": "Sep", "revenue": 39500},
            {"month": "Oct", "revenue": 42000},
            {"month": "Nov", "revenue": 40500},
            {"month": "Dec", "revenue": 38500}
        ]
    }
