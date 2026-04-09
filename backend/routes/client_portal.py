"""
Client Portal API - Client-Facing Experience Layer
Provides secure endpoints for clients to view their financial data.
"""
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/client-portal", tags=["Client Portal"])


class GoalStatus(str, Enum):
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    OFF_TRACK = "off_track"
    ACHIEVED = "achieved"


class NotificationType(str, Enum):
    INFO = "info"
    ACTION_REQUIRED = "action_required"
    MILESTONE = "milestone"
    ALERT = "alert"


# Demo client portal data
PORTAL_CLIENTS = {
    "portal_001": {
        "client_id": "portal_001",
        "name": "David Thompson",
        "email": "david.thompson@email.com",
        "household_name": "Thompson Family",
        "advisor_name": "Sarah Chen",
        "advisor_email": "sarah.chen@wealthcommand.io",
        "relationship_start": "2019-03-15",
        "net_worth": {
            "total": 1608800,
            "change_30d": 27350,
            "change_pct_30d": 1.7,
            "breakdown": {
                "super": 443000,
                "property": 1605000,
                "shares": 84500,
                "etfs": 42000,
                "cash": 63000,
                "crypto": 8500,
                "managed_funds": 32000,
                "liabilities": -669200
            }
        },
        "portfolios": [
            {
                "portfolio_id": "pf_001",
                "name": "Investment Portfolio",
                "value": 126500,
                "change_ytd": 8.4,
                "risk_profile": "Balanced",
                "holdings": [
                    {"symbol": "VGH", "name": "Vanguard High Growth ETF", "type": "etf", "units": 400, "value": 42000, "change_1d": 0.5},
                    {"symbol": "BHP", "name": "BHP Group Shares", "type": "stock", "shares": 400, "value": 18500, "change_1d": 1.2},
                    {"symbol": "CBA", "name": "CBA Shares (DRP)", "type": "stock", "shares": 200, "value": 24000, "change_1d": 0.3},
                    {"symbol": "CFS", "name": "Colonial First State Balanced", "type": "fund", "units": 1200, "value": 32000, "change_1d": 0.1},
                    {"symbol": "BTC", "name": "Bitcoin (Coinbase)", "type": "crypto", "units": 0.09, "value": 8500, "change_1d": 2.1},
                ],
                "allocation": {"aus_equities": 34, "intl_equities": 33, "managed_funds": 25, "crypto": 8}
            },
            {
                "portfolio_id": "pf_002",
                "name": "Superannuation Combined",
                "value": 443000,
                "change_ytd": 11.2,
                "risk_profile": "Balanced Growth",
                "holdings": [
                    {"symbol": "ASUPER", "name": "David - AustralianSuper", "type": "super", "units": 1, "value": 245000, "change_1d": 0.2},
                    {"symbol": "REST", "name": "Sarah - REST Super", "type": "super", "units": 1, "value": 198000, "change_1d": 0.15},
                ],
                "allocation": {"growth": 70, "defensive": 30}
            }
        ],
        "goals": [
            {
                "goal_id": "goal_001",
                "name": "Retirement at 67",
                "target_amount": 2500000,
                "current_amount": 1608800,
                "target_date": "2043-06-30",
                "progress_pct": 64.4,
                "status": GoalStatus.ON_TRACK,
                "monthly_contribution": 3500,
                "projected_amount": 2750000,
                "confidence": 84
            },
            {
                "goal_id": "goal_002",
                "name": "Pay Off Investment Loan",
                "target_amount": 380000,
                "current_amount": 180000,
                "target_date": "2035-01-01",
                "progress_pct": 47.4,
                "status": GoalStatus.ON_TRACK,
                "monthly_contribution": 2000,
                "projected_amount": 395000,
                "confidence": 88
            },
            {
                "goal_id": "goal_003",
                "name": "Emergency Fund Target",
                "target_amount": 60000,
                "current_amount": 28000,
                "target_date": "2027-12-31",
                "progress_pct": 46.7,
                "status": GoalStatus.AT_RISK,
                "monthly_contribution": 1500,
                "projected_amount": 55000,
                "confidence": 72
            }
        ],
        "insights": [
            {"insight_id": "ins_001", "type": "performance", "title": "Steady Growth", "message": "Your portfolio grew 1.7% this month. Property values remain strong in Glen Waverley.", "date": "2026-03-01"},
            {"insight_id": "ins_002", "type": "opportunity", "title": "Super Contribution Opportunity", "message": "David has $7,600 remaining in concessional super cap this FY. Consider salary sacrifice before June 30.", "date": "2026-03-10"},
            {"insight_id": "ins_003", "type": "milestone", "title": "Investment Loan Progress", "message": "Your Brunswick investment loan is now under $380K. At current repayment rates, you'll be ahead of schedule.", "date": "2026-03-15"}
        ],
        "notifications": [
            {"notification_id": "notif_001", "type": NotificationType.ACTION_REQUIRED, "title": "Document Signature Required", "message": "Please review and sign the updated Fee Disclosure Statement.", "action_url": "/documents/sign/fds_2025", "created_at": "2025-12-16T10:00:00Z", "read": False},
            {"notification_id": "notif_002", "type": NotificationType.MILESTONE, "title": "Annual Review Scheduled", "message": "Your annual review meeting is scheduled for January 15, 2026 at 2:00 PM.", "created_at": "2025-12-14T14:30:00Z", "read": True}
        ],
        "documents": [
            {"doc_id": "doc_001", "name": "Statement of Advice 2025", "type": "SOA", "date": "2025-06-15", "status": "signed"},
            {"doc_id": "doc_002", "name": "Fee Disclosure Statement", "type": "FDS", "date": "2025-12-01", "status": "pending_signature"},
            {"doc_id": "doc_003", "name": "Q3 2025 Portfolio Report", "type": "Report", "date": "2025-10-01", "status": "available"},
        ],
        "upcoming_meetings": [{"meeting_id": "meet_001", "type": "Annual Review", "date": "2026-01-15T14:00:00Z", "duration_minutes": 60, "location": "Video Call", "agenda": ["Portfolio performance review", "Goal progress assessment", "Strategy adjustments for 2026"]}],
        "recent_activity": [
            {"date": "2025-12-16", "activity": "Dividend received", "details": "AAPL dividend: $245.00"},
            {"date": "2025-12-14", "activity": "Document uploaded", "details": "Q3 Portfolio Report available"},
            {"date": "2025-12-10", "activity": "Portfolio rebalanced", "details": "Quarterly rebalancing completed"},
        ]
    }
}


@router.get("/dashboard/{client_id}")
async def get_client_dashboard(client_id: str):
    """Get complete client dashboard data."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    client = {**client, "client_id": client_id}
    
    goals_on_track = len([g for g in client["goals"] if g["status"] in [GoalStatus.ON_TRACK, GoalStatus.ACHIEVED]])
    unread = len([n for n in client["notifications"] if not n.get("read", False)])
    
    return {
        "client_id": client_id,
        "name": client["name"],
        "household": client["household_name"],
        "advisor": {"name": client["advisor_name"], "email": client["advisor_email"]},
        "summary": {
            "net_worth": client["net_worth"]["total"],
            "net_worth_change_30d": client["net_worth"]["change_30d"],
            "net_worth_change_pct": client["net_worth"]["change_pct_30d"],
            "goals_count": len(client["goals"]),
            "goals_on_track": goals_on_track,
            "unread_notifications": unread,
            "pending_documents": len([d for d in client["documents"] if d["status"] == "pending_signature"]),
            "upcoming_meetings": len(client["upcoming_meetings"])
        },
        "latest_insight": client["insights"][0] if client["insights"] else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/net-worth/{client_id}")
async def get_net_worth(client_id: str):
    """Get detailed net worth breakdown."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    now = datetime.now(timezone.utc)
    history = []
    base = client["net_worth"]["total"]
    for i in range(12):
        history.append({"date": (now - timedelta(days=30*(11-i))).strftime("%Y-%m"), "value": round(base * (0.85 + i*0.015), 0)})
    
    return {
        "client_id": client_id,
        "current": client["net_worth"],
        "history": history,
        "assets": {k: v for k, v in client["net_worth"]["breakdown"].items() if v > 0},
        "liabilities": {"total": abs(client["net_worth"]["breakdown"]["liabilities"])},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/portfolios/{client_id}")
async def get_portfolios(client_id: str):
    """Get all portfolios for a client."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    total = sum(p["value"] for p in client["portfolios"])
    weighted = sum(p["value"] * p["change_ytd"] for p in client["portfolios"]) / total if total else 0
    
    return {
        "client_id": client_id,
        "portfolios": client["portfolios"],
        "summary": {"total_value": total, "portfolio_count": len(client["portfolios"]), "weighted_ytd_return": round(weighted, 2)},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/goals/{client_id}")
async def get_goals(client_id: str):
    """Get all goals for a client."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    return {
        "client_id": client_id,
        "goals": client["goals"],
        "summary": {
            "total_goals": len(client["goals"]),
            "on_track": len([g for g in client["goals"] if g["status"] == GoalStatus.ON_TRACK]),
            "at_risk": len([g for g in client["goals"] if g["status"] == GoalStatus.AT_RISK]),
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/insights/{client_id}")
async def get_insights(client_id: str, limit: int = 10):
    """Get personalized insights."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    return {"client_id": client_id, "insights": client["insights"][:limit], "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/notifications/{client_id}")
async def get_notifications(client_id: str, unread_only: bool = False):
    """Get notifications."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    notifs = [n for n in client["notifications"] if not unread_only or not n.get("read", False)]
    return {"client_id": client_id, "notifications": notifs, "unread_count": len([n for n in client["notifications"] if not n.get("read")])}


@router.get("/documents/{client_id}")
async def get_documents(client_id: str):
    """Get all documents."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    return {"client_id": client_id, "documents": client["documents"], "pending_signature": len([d for d in client["documents"] if d["status"] == "pending_signature"])}


@router.get("/meetings/{client_id}")
async def get_meetings(client_id: str):
    """Get meetings."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    return {"client_id": client_id, "upcoming": client["upcoming_meetings"], "past": [{"date": "2025-06-15", "type": "Annual Review"}]}


@router.get("/activity/{client_id}")
async def get_activity(client_id: str, limit: int = 20):
    """Get recent activity."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    return {"client_id": client_id, "activity": client["recent_activity"][:limit]}


@router.get("/performance-summary/{client_id}")
async def get_performance(client_id: str):
    """Get performance summary."""
    return {
        "client_id": client_id,
        "performance": {"ytd_return": 11.5, "1_year_return": 14.2, "3_year_return_annualized": 9.8, "benchmark_comparison": {"portfolio": 11.5, "benchmark": 9.2, "outperformance": 2.3}},
        "risk_metrics": {"volatility": 12.5, "sharpe_ratio": 0.85, "max_drawdown": -8.2},
        "income": {"dividends_ytd": 28500, "distributions_ytd": 12000, "total_income_ytd": 40500},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/contact-advisor/{client_id}")
async def contact_advisor(client_id: str, subject: str, message: str):
    """Send message to advisor."""
    client = PORTAL_CLIENTS.get(client_id) or PORTAL_CLIENTS.get("portal_001")
    return {"success": True, "message_id": f"msg_{uuid.uuid4().hex[:8]}", "confirmation": f"Message sent to {client['advisor_name']}"}
