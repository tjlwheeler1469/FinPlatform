"""
Client Capture (Xplan-style Key Dates & Disclosures)
====================================================
Stores the comprehensive client capture data shown on Xplan's
"Key dates & disclosures" snapshot screen. Per-client document
in `client_capture_data` collection. Idempotent upsert API.

Surface area exposed: GET, PUT.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from db import db


router = APIRouter(prefix="/client-capture", tags=["client-capture"])
COL = "client_capture_data"


# ---- Schemas ----------------------------------------------------------------

class ContactBlock(BaseModel):
    is_master: Optional[bool] = True
    client_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None  # YYYY-MM-DD
    marital_status: Optional[str] = None
    tax_resident_status: Optional[str] = None
    tax_file_number: Optional[str] = None
    advice_delivery_method: Optional[str] = None
    preferred_email: Optional[str] = None
    preferred_phone: Optional[str] = None
    street: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    comments: Optional[str] = None


class ServiceOverviewBlock(BaseModel):
    client_adviser: Optional[str] = None
    paraplanner: Optional[str] = None
    administrator: Optional[str] = None
    created_on_xplan: Optional[str] = None
    client_active_date: Optional[str] = None
    entity_status: Optional[str] = "Client"
    category: Optional[str] = None
    annual_fee: Optional[float] = 0.0
    fact_find_signed_date: Optional[str] = None
    last_risk_profile_date: Optional[str] = None
    aml_completion_date: Optional[str] = None
    politically_exposed_person: Optional[bool] = False
    first_personal_advice_date: Optional[str] = None
    last_implemented_soa_date: Optional[str] = None
    last_review_roa_date: Optional[str] = None
    applicable_soa_date: Optional[str] = None


class ServiceAgreementBlock(BaseModel):
    service_agreement_required: Optional[bool] = False
    service_agreement_anniversary_date: Optional[str] = None
    service_agreement_status: Optional[str] = None


class ReviewItem(BaseModel):
    action: Optional[str] = None
    type: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    responsibility: Optional[str] = None


class ReviewsBlock(BaseModel):
    last_review_date: Optional[str] = None
    items: List[ReviewItem] = Field(default_factory=list)


class FSGBlock(BaseModel):
    version_number: Optional[str] = None
    fsg_provided: Optional[bool] = False
    fsg_method_of_delivery: Optional[str] = "Email"
    fsg_issuer: Optional[str] = None


class RiskProfileBlock(BaseModel):
    profile: Optional[str] = "Balanced"
    last_completed_date: Optional[str] = None
    score: Optional[int] = None
    notes: Optional[str] = None


class ClientCapture(BaseModel):
    client_id: str
    contact: ContactBlock = Field(default_factory=ContactBlock)
    service_overview: ServiceOverviewBlock = Field(default_factory=ServiceOverviewBlock)
    service_agreements: ServiceAgreementBlock = Field(default_factory=ServiceAgreementBlock)
    reviews: ReviewsBlock = Field(default_factory=ReviewsBlock)
    fsg: FSGBlock = Field(default_factory=FSGBlock)
    risk_profile: RiskProfileBlock = Field(default_factory=RiskProfileBlock)
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


def _strip_id(d: Dict[str, Any]) -> Dict[str, Any]:
    if d and "_id" in d:
        d.pop("_id", None)
    return d


# ---- Routes -----------------------------------------------------------------

@router.get("/{client_id}", response_model=ClientCapture)
async def get_capture(client_id: str):
    doc = await db[COL].find_one({"client_id": client_id}, {"_id": 0})
    if not doc:
        # Return an empty record so the form can render straight away.
        return ClientCapture(client_id=client_id)
    return ClientCapture(**doc)


@router.put("/{client_id}", response_model=ClientCapture)
async def upsert_capture(client_id: str, payload: ClientCapture):
    if payload.client_id != client_id:
        raise HTTPException(status_code=400, detail="client_id mismatch")
    payload.updated_at = datetime.now(timezone.utc).isoformat()
    data = payload.model_dump()
    await db[COL].update_one(
        {"client_id": client_id},
        {"$set": data},
        upsert=True,
    )
    return payload


@router.get("")
async def list_captures():
    cur = db[COL].find({}, {"_id": 0, "client_id": 1, "contact.client_name": 1, "updated_at": 1})
    out = []
    async for d in cur:
        out.append(_strip_id(d))
    return {"records": out, "count": len(out)}
