"""Adviser Notification Settings — customise which notifications to receive."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os
from pymongo import MongoClient

router = APIRouter(prefix="/adviser-notifications", tags=["adviser-notifications"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "adviceos")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

DEFAULT_SETTINGS = {
    "review_due": True,
    "market_alerts": True,
    "compliance_deadlines": True,
    "client_contact": True,
    "portfolio_rebalance": True,
    "fee_disclosure": True,
    "document_signed": True,
    "new_client_onboarding": True,
    "insurance_renewal": False,
    "birthday_reminders": False,
}

class NotificationSettings(BaseModel):
    review_due: Optional[bool] = True
    market_alerts: Optional[bool] = True
    compliance_deadlines: Optional[bool] = True
    client_contact: Optional[bool] = True
    portfolio_rebalance: Optional[bool] = True
    fee_disclosure: Optional[bool] = True
    document_signed: Optional[bool] = True
    new_client_onboarding: Optional[bool] = True
    insurance_renewal: Optional[bool] = False
    birthday_reminders: Optional[bool] = False

@router.get("/settings/{adviser_id}")
async def get_notification_settings(adviser_id: str):
    doc = db.notification_settings.find_one({"adviser_id": adviser_id}, {"_id": 0})
    if not doc:
        return {"adviser_id": adviser_id, **DEFAULT_SETTINGS}
    return doc

@router.put("/settings/{adviser_id}")
async def update_notification_settings(adviser_id: str, settings: NotificationSettings):
    data = settings.dict()
    data["adviser_id"] = adviser_id
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    db.notification_settings.update_one(
        {"adviser_id": adviser_id},
        {"$set": data},
        upsert=True
    )
    return {"status": "saved", **data}
