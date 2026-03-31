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
        "name": "James Wheeler",
        "email": "james.wheeler@email.com",
        "household_name": "Wheeler Family",
        "advisor_name": "Sarah Chen",
        "advisor_email": "sarah.chen@wealthcommand.io",
        "relationship_start": "2019-03-15",
        "net_worth": {
            "total": 3040000,
            "change_30d": 52000,
            "change_pct_30d": 1.74,
            "breakdown": {
                "stocks": 389500,
                "etfs": 1191000,
                "managed_funds": 114800,
                "bonds": 128500,
                "hybrids": 118730,
                "crypto": 85000,
                "cash": 145000,
                "superannuation": 680000,
                "property": 850000,
                "other_assets": 95000,
                "liabilities": -757530
            }
        },
        "portfolios": [
            {
                "portfolio_id": "pf_001",
                "name": "Growth Portfolio",
                "value": 1850000,
                "change_ytd": 12.4,
                "risk_profile": "Growth",
                "holdings": [
                    {"symbol": "AAPL", "name": "Apple Inc", "type": "stock", "shares": 500, "value": 91000, "change_1d": 1.2},
                    {"symbol": "MSFT", "name": "Microsoft Corp", "type": "stock", "shares": 300, "value": 118500, "change_1d": 0.8},
                    {"symbol": "NVDA", "name": "NVIDIA Corp", "type": "stock", "shares": 150, "value": 180000, "change_1d": 2.1},
                    {"symbol": "VGS", "name": "Vanguard Intl Shares", "type": "etf", "units": 2000, "value": 180000, "change_1d": 0.5},
                    {"symbol": "VAS", "name": "Vanguard Aus Shares", "type": "etf", "units": 3000, "value": 285000, "change_1d": 0.3},
                    {"symbol": "MGF", "name": "Magellan Global Fund", "type": "fund", "units": 3500, "value": 114800, "change_1d": -0.2},
                ],
                "allocation": {"us_equities": 45, "intl_equities": 25, "aus_equities": 20, "fixed_income": 5, "cash": 5}
            },
            {
                "portfolio_id": "pf_002",
                "name": "Fixed Income & Hybrids",
                "value": 280000,
                "change_ytd": 6.2,
                "risk_profile": "Conservative",
                "holdings": [
                    {"symbol": "CBAPD", "name": "CBA PERLS XI", "type": "hybrid", "units": 500, "value": 49250, "yield": 7.35, "change_1d": 0.1},
                    {"symbol": "WBCPI", "name": "Westpac Cap Notes 8", "type": "hybrid", "units": 300, "value": 30360, "yield": 7.25, "change_1d": 0.05},
                    {"symbol": "ANZPJ", "name": "ANZ Cap Notes 7", "type": "hybrid", "units": 400, "value": 39120, "yield": 7.45, "change_1d": -0.1},
                    {"symbol": "ACGB-34", "name": "Aus Govt 10Y Bond", "type": "bond", "units": 50000, "value": 51000, "yield": 4.2, "change_1d": 0.02},
                    {"symbol": "BOND", "name": "Corporate Bond Fund", "type": "bond", "units": 30000, "value": 31500, "yield": 5.1, "change_1d": 0.0},
                    {"symbol": "VAF", "name": "Vanguard Aus Fixed Interest", "type": "bond_etf", "units": 1000, "value": 46000, "yield": 4.8, "change_1d": 0.05},
                ],
                "allocation": {"hybrids": 43, "bonds": 45, "cash": 12}
            },
            {
                "portfolio_id": "pf_003",
                "name": "Cryptocurrency",
                "value": 85000,
                "change_ytd": 45.2,
                "risk_profile": "Aggressive",
                "holdings": [
                    {"symbol": "BTC", "name": "Bitcoin", "type": "crypto", "units": 0.65, "value": 62475, "change_1d": 2.5},
                    {"symbol": "ETH", "name": "Ethereum", "type": "crypto", "units": 5.2, "value": 15600, "change_1d": 1.8},
                    {"symbol": "SOL", "name": "Solana", "type": "crypto", "units": 35, "value": 6125, "change_1d": 3.2},
                ],
                "allocation": {"btc": 74, "eth": 18, "altcoins": 8}
            },
            {
                "portfolio_id": "pf_004",
                "name": "Cash & Term Deposits",
                "value": 145000,
                "change_ytd": 4.8,
                "risk_profile": "Defensive",
                "holdings": [
                    {"symbol": "ING-SAV", "name": "High Interest Savings", "type": "cash", "value": 65000, "rate": 5.0},
                    {"symbol": "CBA-TD6", "name": "Term Deposit 6M", "type": "term_deposit", "value": 50000, "rate": 4.8, "maturity": "2026-06-15"},
                    {"symbol": "WBC-TD12", "name": "Term Deposit 12M", "type": "term_deposit", "value": 30000, "rate": 5.1, "maturity": "2026-12-01"},
                ],
                "allocation": {"savings": 45, "term_deposits": 55}
            },
            {
                "portfolio_id": "pf_005",
                "name": "Superannuation",
                "value": 680000,
                "change_ytd": 9.8,
                "risk_profile": "Balanced",
                "holdings": [
                    {"symbol": "VDHG", "name": "Vanguard Diversified High Growth", "type": "etf", "units": 5000, "value": 340000, "change_1d": 0.4},
                    {"symbol": "IVV", "name": "iShares S&P 500", "type": "etf", "units": 500, "value": 280000, "change_1d": 0.6},
                    {"symbol": "IAF", "name": "iShares Composite Bond", "type": "bond_etf", "units": 500, "value": 60000, "change_1d": 0.1},
                ],
                "allocation": {"growth": 70, "defensive": 30}
            }
        ],
        "goals": [
            {
                "goal_id": "goal_001",
                "name": "Retirement at 60",
                "target_amount": 3500000,
                "current_amount": 2530000,
                "target_date": "2039-06-30",
                "progress_pct": 72.3,
                "status": GoalStatus.ON_TRACK,
                "monthly_contribution": 5000,
                "projected_amount": 3850000,
                "confidence": 85
            },
            {
                "goal_id": "goal_002",
                "name": "Children's Education Fund",
                "target_amount": 200000,
                "current_amount": 125000,
                "target_date": "2030-01-01",
                "progress_pct": 62.5,
                "status": GoalStatus.ON_TRACK,
                "monthly_contribution": 1500,
                "projected_amount": 215000,
                "confidence": 90
            },
            {
                "goal_id": "goal_003",
                "name": "Investment Property",
                "target_amount": 150000,
                "current_amount": 85000,
                "target_date": "2026-12-31",
                "progress_pct": 56.7,
                "status": GoalStatus.AT_RISK,
                "monthly_contribution": 2000,
                "projected_amount": 133000,
                "confidence": 65
            }
        ],
        "insights": [
            {"insight_id": "ins_001", "type": "performance", "title": "Strong Quarter", "message": "Your portfolio outperformed the benchmark by 2.3% this quarter.", "date": "2025-12-01"},
            {"insight_id": "ins_002", "type": "opportunity", "title": "Tax-Loss Harvesting Available", "message": "There's an opportunity to save approximately $2,400 in taxes through strategic selling.", "date": "2025-12-10"},
            {"insight_id": "ins_003", "type": "milestone", "title": "Goal Progress", "message": "Your retirement fund has crossed $2.5M! You're 72% towards your goal.", "date": "2025-12-15"}
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
