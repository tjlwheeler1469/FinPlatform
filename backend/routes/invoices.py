"""Client Invoicing — create, manage, and track invoices."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import os, uuid
from pymongo import MongoClient

router = APIRouter(prefix="/api/invoices", tags=["invoices"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "adviceos")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

class LineItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float
    gst: bool = True

class InvoiceCreate(BaseModel):
    client_id: str
    client_name: str
    adviser_id: str = "adviser_1"
    line_items: List[LineItem]
    notes: Optional[str] = ""
    due_days: int = 30

class InvoiceStatusUpdate(BaseModel):
    status: str  # draft, sent, paid, overdue, cancelled

@router.post("/")
async def create_invoice(data: InvoiceCreate):
    subtotal = sum(i.quantity * i.unit_price for i in data.line_items)
    gst_total = sum(i.quantity * i.unit_price * 0.1 for i in data.line_items if i.gst)
    total = subtotal + gst_total
    now = datetime.now(timezone.utc)
    invoice = {
        "invoice_id": f"INV-{now.strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}",
        "client_id": data.client_id,
        "client_name": data.client_name,
        "adviser_id": data.adviser_id,
        "line_items": [i.dict() for i in data.line_items],
        "subtotal": round(subtotal, 2),
        "gst": round(gst_total, 2),
        "total": round(total, 2),
        "notes": data.notes,
        "status": "draft",
        "created_at": now.isoformat(),
        "due_date": (now.replace(day=min(now.day + data.due_days, 28))).isoformat(),
        "paid_at": None,
    }
    db.invoices.insert_one({**invoice, "_id": invoice["invoice_id"]})
    return invoice

@router.get("/client/{client_id}")
async def get_client_invoices(client_id: str):
    invoices = list(db.invoices.find({"client_id": client_id}, {"_id": 0}).sort("created_at", -1))
    if not invoices:
        # Return demo invoices
        return [
            {"invoice_id": "INV-202604-A1B2C3", "client_id": client_id, "client_name": "Client", "status": "paid",
             "subtotal": 3300, "gst": 330, "total": 3630, "created_at": "2026-01-15T00:00:00Z",
             "due_date": "2026-02-14T00:00:00Z", "paid_at": "2026-02-10T00:00:00Z",
             "line_items": [{"description": "Annual Financial Plan Review", "quantity": 1, "unit_price": 2200, "gst": True},
                           {"description": "Portfolio Rebalancing", "quantity": 1, "unit_price": 1100, "gst": True}]},
            {"invoice_id": "INV-202604-D4E5F6", "client_id": client_id, "client_name": "Client", "status": "sent",
             "subtotal": 1650, "gst": 165, "total": 1815, "created_at": "2026-04-01T00:00:00Z",
             "due_date": "2026-05-01T00:00:00Z", "paid_at": None,
             "line_items": [{"description": "Quarterly Strategy Consultation", "quantity": 1.5, "unit_price": 1100, "gst": True}]},
        ]
    return invoices

@router.put("/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, data: InvoiceStatusUpdate):
    update = {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if data.status == "paid":
        update["paid_at"] = datetime.now(timezone.utc).isoformat()
    db.invoices.update_one({"invoice_id": invoice_id}, {"$set": update})
    return {"invoice_id": invoice_id, **update}

@router.get("/")
async def list_all_invoices():
    invoices = list(db.invoices.find({}, {"_id": 0}).sort("created_at", -1).limit(50))
    return invoices
