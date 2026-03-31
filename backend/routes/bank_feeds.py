"""
Basiq CDR Integration Routes
Bank account aggregation via Australian Consumer Data Right.
"""
from fastapi import APIRouter, HTTPException
import logging

from services.basiq_service import basiq_service, get_basiq_status

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bank-feeds", tags=["Bank Feeds"])


@router.get("/status")
async def get_status():
    """Get Basiq integration status."""
    return get_basiq_status()


@router.get("/institutions")
async def get_institutions(country: str = "AU"):
    """Get list of supported financial institutions."""
    return basiq_service.get_institutions(country)


@router.post("/user")
async def create_user(email: str, mobile: str = None):
    """Create a user for consent management."""
    result = basiq_service.create_user(email, mobile)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/connect")
async def create_connection(user_id: str, institution_id: str):
    """
    Initiate connection to a financial institution.
    Returns a consent URL for the user to complete OAuth flow.
    """
    result = basiq_service.create_connection(user_id, institution_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/accounts/{user_id}")
async def get_accounts(user_id: str):
    """Get all linked accounts for a user."""
    result = basiq_service.get_accounts(user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/transactions/{user_id}")
async def get_transactions(
    user_id: str, 
    account_id: str = None, 
    days: int = 90,
    category: str = None
):
    """Get transaction history."""
    result = basiq_service.get_transactions(user_id, account_id, days, category)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/income/{user_id}")
async def get_income_summary(user_id: str, months: int = 3):
    """Get income verification summary."""
    result = basiq_service.get_income_summary(user_id, months)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/expenses/{user_id}")
async def get_expense_summary(user_id: str, months: int = 3):
    """Get categorized expense summary."""
    result = basiq_service.get_expense_summary(user_id, months)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/affordability/{user_id}")
async def get_affordability(user_id: str):
    """Calculate affordability metrics."""
    result = basiq_service.get_affordability(user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/refresh/{connection_id}")
async def refresh_connection(connection_id: str):
    """Refresh data from a connected institution."""
    result = basiq_service.refresh_connection(connection_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.delete("/connection/{connection_id}")
async def delete_connection(connection_id: str):
    """Delete a connection and revoke consent."""
    result = basiq_service.delete_connection(connection_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
