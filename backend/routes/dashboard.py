"""
Dashboard Routes
Main dashboard endpoints including health score, net worth, and summary data.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary() -> Dict[str, Any]:
    """Get comprehensive dashboard summary data."""
    return {
        "net_worth": {
            "total": 1978000,
            "change_30d": 45000,
            "change_percent": 2.3
        },
        "retirement_readiness": {
            "score": 72,
            "target_age": 65,
            "projected_wealth": 3250000,
            "monthly_income_at_retirement": 12500
        },
        "investment_performance": {
            "ytd_return": 8.5,
            "total_invested": 890000,
            "total_gain": 156000
        },
        "alerts": [
            {"type": "tax", "message": "Super contributions due before June 30", "priority": "high"},
            {"type": "rebalance", "message": "Portfolio 5% overweight in financials", "priority": "medium"}
        ],
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.get("/widgets")
async def get_dashboard_widgets() -> Dict[str, Any]:
    """Get data for dashboard widgets."""
    return {
        "net_worth_chart": {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "data": [1850000, 1890000, 1920000, 1950000, 1965000, 1978000]
        },
        "asset_allocation": {
            "property": 45,
            "shares": 25,
            "super": 20,
            "cash": 10
        },
        "upcoming_events": [
            {"date": "2025-06-30", "title": "Super contribution deadline", "type": "tax"},
            {"date": "2025-07-15", "title": "Quarterly review meeting", "type": "meeting"}
        ]
    }


@router.get("/quick-stats")
async def get_quick_stats() -> Dict[str, Any]:
    """Get quick statistics for header display."""
    return {
        "net_worth": 1978000,
        "monthly_income": 19475,
        "monthly_expenses": 11783,
        "savings_rate": 39.5,
        "investment_return_ytd": 8.5
    }
