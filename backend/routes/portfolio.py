"""
Portfolio Routes
Portfolio management, account aggregation, and investment tracking.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

# Import services
try:
    from services.account_aggregation import AccountAggregationService
    from services.portfolio_analyzer import PortfolioAnalyzer
except ImportError as e:
    logger.warning(f"Portfolio services not fully available: {e}")


class ConnectAccountRequest(BaseModel):
    institution_id: str
    account_type: str
    credentials: Optional[Dict[str, Any]] = None


class SyncRequest(BaseModel):
    force_refresh: bool = False


# Sample portfolio data
SAMPLE_PORTFOLIO = {
    "hh_001": {
        "net_worth": 1978000,
        "assets": {
            "cash": 75000,
            "investments": 465000,
            "super": 580000,
            "property": 1570000
        },
        "liabilities": {
            "mortgage": 942000,
            "other": 0
        },
        "accounts": [
            {
                "id": "acc_001",
                "institution": "Commonwealth Bank",
                "institution_id": "cba",
                "type": "savings",
                "name": "Smart Saver",
                "balance": 45000,
                "currency": "AUD",
                "last_synced": "2025-01-10T08:00:00Z"
            },
            {
                "id": "acc_002",
                "institution": "Commonwealth Bank",
                "institution_id": "cba",
                "type": "checking",
                "name": "Complete Access",
                "balance": 12500,
                "currency": "AUD",
                "last_synced": "2025-01-10T08:00:00Z"
            },
            {
                "id": "acc_003",
                "institution": "Vanguard",
                "institution_id": "vanguard",
                "type": "investment",
                "name": "Diversified ETF Portfolio",
                "balance": 145000,
                "currency": "AUD",
                "holdings": [
                    {"symbol": "VAS", "name": "Vanguard Australian Shares ETF", "units": 500, "price": 96.50, "value": 48250},
                    {"symbol": "VGS", "name": "Vanguard MSCI Index International", "units": 300, "price": 125.80, "value": 37740},
                    {"symbol": "VGB", "name": "Vanguard Australian Government Bond", "units": 400, "price": 48.20, "value": 19280}
                ],
                "last_synced": "2025-01-10T08:00:00Z"
            },
            {
                "id": "acc_004",
                "institution": "Australian Super",
                "institution_id": "aussuper",
                "type": "super",
                "name": "Superannuation",
                "balance": 580000,
                "currency": "AUD",
                "last_synced": "2025-01-09T10:00:00Z"
            }
        ],
        "connected_institutions": [
            {"id": "cba", "name": "Commonwealth Bank", "status": "connected", "accounts_count": 2},
            {"id": "vanguard", "name": "Vanguard", "status": "connected", "accounts_count": 1},
            {"id": "aussuper", "name": "Australian Super", "status": "connected", "accounts_count": 1}
        ]
    }
}


@router.get("/aggregated/{household_id}")
async def get_aggregated_portfolio(household_id: str):
    """Get aggregated portfolio data for a household."""
    portfolio = SAMPLE_PORTFOLIO.get(household_id)
    if not portfolio:
        # Return empty structure for new households
        return {
            "household_id": household_id,
            "net_worth": 0,
            "assets": {"cash": 0, "investments": 0, "super": 0, "property": 0},
            "liabilities": {"mortgage": 0, "other": 0},
            "accounts": [],
            "connected_institutions": [],
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "household_id": household_id,
        **portfolio,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.post("/connect-account")
async def connect_account(request: ConnectAccountRequest):
    """Connect a new financial account."""
    # In production, this would initiate OAuth flow with the institution
    account_id = f"acc_{uuid.uuid4().hex[:8]}"
    
    return {
        "success": True,
        "account_id": account_id,
        "institution_id": request.institution_id,
        "status": "pending_verification",
        "message": "Account connection initiated. Please complete verification.",
        "next_step": "verify_credentials"
    }


@router.post("/sync/{household_id}")
async def sync_portfolio(household_id: str, request: SyncRequest = SyncRequest()):
    """Sync portfolio data from connected accounts."""
    return {
        "success": True,
        "household_id": household_id,
        "accounts_synced": 4,
        "last_sync": datetime.now(timezone.utc).isoformat(),
        "next_sync_available": "2025-01-10T14:00:00Z",
        "changes": [
            {"account": "Smart Saver", "type": "balance_update", "change": "+$1,250"},
            {"account": "Diversified ETF Portfolio", "type": "balance_update", "change": "+$3,420"}
        ]
    }


@router.get("/institutions")
async def get_supported_institutions():
    """Get list of supported financial institutions."""
    return {
        "institutions": [
            {"id": "cba", "name": "Commonwealth Bank", "type": "bank", "logo": "cba.png", "supported_accounts": ["savings", "checking", "credit"]},
            {"id": "westpac", "name": "Westpac", "type": "bank", "logo": "westpac.png", "supported_accounts": ["savings", "checking", "credit"]},
            {"id": "nab", "name": "NAB", "type": "bank", "logo": "nab.png", "supported_accounts": ["savings", "checking", "credit"]},
            {"id": "anz", "name": "ANZ", "type": "bank", "logo": "anz.png", "supported_accounts": ["savings", "checking", "credit"]},
            {"id": "vanguard", "name": "Vanguard", "type": "investment", "logo": "vanguard.png", "supported_accounts": ["investment", "super"]},
            {"id": "aussuper", "name": "Australian Super", "type": "super", "logo": "aussuper.png", "supported_accounts": ["super"]},
            {"id": "rest", "name": "REST Super", "type": "super", "logo": "rest.png", "supported_accounts": ["super"]},
            {"id": "unisuper", "name": "UniSuper", "type": "super", "logo": "unisuper.png", "supported_accounts": ["super"]},
            {"id": "selfwealth", "name": "SelfWealth", "type": "broker", "logo": "selfwealth.png", "supported_accounts": ["investment"]},
            {"id": "commsec", "name": "CommSec", "type": "broker", "logo": "commsec.png", "supported_accounts": ["investment"]},
            {"id": "macquarie", "name": "Macquarie", "type": "bank", "logo": "macquarie.png", "supported_accounts": ["savings", "investment", "super"]}
        ]
    }


@router.get("/analyze/{household_id}")
async def analyze_portfolio(household_id: str):
    """Analyze portfolio composition and risk."""
    portfolio = SAMPLE_PORTFOLIO.get(household_id, {})
    
    total_assets = sum(portfolio.get("assets", {}).values())
    total_liabilities = sum(portfolio.get("liabilities", {}).values())
    
    return {
        "household_id": household_id,
        "analysis": {
            "net_worth": portfolio.get("net_worth", 0),
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "debt_to_asset_ratio": (total_liabilities / total_assets * 100) if total_assets > 0 else 0,
            "asset_allocation": {
                "cash": round(portfolio.get("assets", {}).get("cash", 0) / total_assets * 100, 1) if total_assets > 0 else 0,
                "investments": round(portfolio.get("assets", {}).get("investments", 0) / total_assets * 100, 1) if total_assets > 0 else 0,
                "super": round(portfolio.get("assets", {}).get("super", 0) / total_assets * 100, 1) if total_assets > 0 else 0,
                "property": round(portfolio.get("assets", {}).get("property", 0) / total_assets * 100, 1) if total_assets > 0 else 0
            },
            "risk_profile": "growth",
            "diversification_score": 78,
            "liquidity_ratio": 0.25
        },
        "recommendations": [
            {"type": "rebalance", "message": "Consider reducing property allocation from 53% to 45%", "priority": "medium"},
            {"type": "cash", "message": "Cash allocation of 2.5% is below recommended 5-10%", "priority": "low"},
            {"type": "diversification", "message": "Add international equity exposure for better diversification", "priority": "medium"}
        ],
        "analyzed_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/performance/{household_id}")
async def get_portfolio_performance(
    household_id: str,
    period: str = "1y"
):
    """Get portfolio performance metrics."""
    return {
        "household_id": household_id,
        "period": period,
        "performance": {
            "total_return": 8.5,
            "total_return_amount": 156000,
            "benchmark_return": 7.2,
            "alpha": 1.3,
            "volatility": 12.5,
            "sharpe_ratio": 0.68,
            "max_drawdown": -8.2
        },
        "breakdown": {
            "shares": {"return": 12.3, "allocation": 25},
            "property": {"return": 5.2, "allocation": 45},
            "super": {"return": 9.1, "allocation": 20},
            "cash": {"return": 4.5, "allocation": 10}
        },
        "historical": [
            {"date": "2024-07", "value": 1820000},
            {"date": "2024-08", "value": 1850000},
            {"date": "2024-09", "value": 1890000},
            {"date": "2024-10", "value": 1920000},
            {"date": "2024-11", "value": 1950000},
            {"date": "2024-12", "value": 1978000}
        ]
    }


@router.delete("/disconnect/{account_id}")
async def disconnect_account(account_id: str):
    """Disconnect a linked account."""
    return {
        "success": True,
        "account_id": account_id,
        "message": "Account disconnected successfully"
    }
