"""
Adviser Command Center Routes
The daily "mission control" for financial advisers - aggregating all actionable intelligence.
"""
from fastapi import APIRouter
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging
import secrets
_rng = secrets.SystemRandom()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/command-center", tags=["Command Center"])


class AlertPriority:
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertType:
    PORTFOLIO_DRIFT = "portfolio_drift"
    TAX_OPPORTUNITY = "tax_opportunity"
    COMPLIANCE_DUE = "compliance_due"
    REVIEW_DUE = "review_due"
    IDLE_CASH = "idle_cash"
    REBALANCE_NEEDED = "rebalance_needed"
    GOAL_AT_RISK = "goal_at_risk"
    MARKET_EVENT = "market_event"
    CLIENT_MILESTONE = "client_milestone"
    FEE_OPTIMIZATION = "fee_optimization"


# Mock client data for alerts generation
CLIENTS = [
    {"id": "client_1", "name": "Wheeler Family", "aum": 2920000, "risk_profile": "Balanced"},
    {"id": "client_2", "name": "Chen Investment Trust", "aum": 4200000, "risk_profile": "Growth"},
    {"id": "client_3", "name": "Thompson SMSF", "aum": 890000, "risk_profile": "Conservative"},
    {"id": "client_4", "name": "Patel Holdings", "aum": 7500000, "risk_profile": "High Growth"},
    {"id": "client_5", "name": "Garcia Family", "aum": 820000, "risk_profile": "Balanced"},
    {"id": "client_6", "name": "Anderson SMSF", "aum": 1250000, "risk_profile": "Conservative"},
    {"id": "client_7", "name": "Liu Family Trust", "aum": 3100000, "risk_profile": "Growth"},
    {"id": "client_8", "name": "Morrison Super", "aum": 580000, "risk_profile": "Balanced"},
]


def generate_daily_alerts() -> List[Dict]:
    """Generate realistic daily alerts for the adviser."""
    alerts = []
    now = datetime.now(timezone.utc)
    
    # Portfolio Drift Alerts
    drift_clients = _rng.sample(CLIENTS, 3)
    for i, client in enumerate(drift_clients):
        drift_pct = _rng.uniform(5, 15)
        alerts.append({
            "id": f"alert_{uuid.uuid4().hex[:8]}",
            "type": AlertType.PORTFOLIO_DRIFT,
            "priority": AlertPriority.HIGH if drift_pct > 10 else AlertPriority.MEDIUM,
            "client_id": client["id"],
            "client_name": client["name"],
            "title": "Portfolio Drift Detected",
            "description": f"Portfolio has drifted {drift_pct:.1f}% from target allocation. Australian equities overweight by {drift_pct:.1f}%.",
            "impact": f"Risk exposure increased - potential ${int(client['aum'] * drift_pct / 100):,} variance",
            "action_text": "Review & Rebalance",
            "action_route": "/client-wealth",
            "created_at": (now - timedelta(hours=_rng.randint(1, 12))).isoformat(),
            "metadata": {
                "drift_percentage": drift_pct,
                "overweight_asset": "Australian Equities",
                "underweight_asset": "International Bonds"
            }
        })
    
    # Tax-Loss Harvesting Opportunities
    tax_clients = _rng.sample(CLIENTS, 2)
    for client in tax_clients:
        loss_amount = _rng.randint(5000, 25000)
        tax_saved = int(loss_amount * 0.39)  # Top marginal rate
        alerts.append({
            "id": f"alert_{uuid.uuid4().hex[:8]}",
            "type": AlertType.TAX_OPPORTUNITY,
            "priority": AlertPriority.HIGH,
            "client_id": client["id"],
            "client_name": client["name"],
            "title": "Tax-Loss Harvesting Opportunity",
            "description": f"Unrealised losses of ${loss_amount:,} available. Potential tax savings of ${tax_saved:,}.",
            "impact": f"Save ${tax_saved:,} in tax this financial year",
            "action_text": "Execute Harvest",
            "action_route": "/tax-analysis",
            "created_at": (now - timedelta(hours=_rng.randint(1, 24))).isoformat(),
            "metadata": {
                "unrealised_loss": loss_amount,
                "tax_savings": tax_saved,
                "positions": ["BHP", "WOW", "QBE"]
            }
        })
    
    # Idle Cash Alerts
    cash_clients = _rng.sample(CLIENTS, 2)
    for client in cash_clients:
        idle_cash = _rng.randint(50000, 200000)
        opportunity_cost = int(idle_cash * 0.05)  # 5% opportunity cost
        alerts.append({
            "id": f"alert_{uuid.uuid4().hex[:8]}",
            "type": AlertType.IDLE_CASH,
            "priority": AlertPriority.MEDIUM,
            "client_id": client["id"],
            "client_name": client["name"],
            "title": "Excess Idle Cash",
            "description": f"${idle_cash:,} sitting idle in transaction account for 30+ days.",
            "impact": f"Annual opportunity cost: ${opportunity_cost:,}",
            "action_text": "Invest Cash",
            "action_route": "/client-wealth",
            "created_at": (now - timedelta(hours=_rng.randint(6, 48))).isoformat(),
            "metadata": {
                "idle_amount": idle_cash,
                "days_idle": _rng.randint(30, 90),
                "suggested_allocation": ["Term Deposit", "Money Market ETF", "Bond Fund"]
            }
        })
    
    # Compliance Due Alerts
    compliance_clients = _rng.sample(CLIENTS, 2)
    for client in compliance_clients:
        days_until_due = _rng.randint(-5, 14)
        alerts.append({
            "id": f"alert_{uuid.uuid4().hex[:8]}",
            "type": AlertType.COMPLIANCE_DUE,
            "priority": AlertPriority.CRITICAL if days_until_due < 0 else AlertPriority.HIGH,
            "client_id": client["id"],
            "client_name": client["name"],
            "title": "Annual Review Overdue" if days_until_due < 0 else "Annual Review Due Soon",
            "description": f"Client review {'overdue by ' + str(abs(days_until_due)) + ' days' if days_until_due < 0 else 'due in ' + str(days_until_due) + ' days'}.",
            "impact": "Compliance requirement - ASIC Reg Guide 175",
            "action_text": "Schedule Review",
            "action_route": "/compliance",
            "created_at": (now - timedelta(hours=_rng.randint(1, 6))).isoformat(),
            "metadata": {
                "days_until_due": days_until_due,
                "last_review": (now - timedelta(days=365 + abs(days_until_due))).strftime("%Y-%m-%d"),
                "review_type": "Annual Comprehensive"
            }
        })
    
    # Goal At Risk Alerts
    goal_clients = _rng.sample(CLIENTS, 1)
    for client in goal_clients:
        alerts.append({
            "id": f"alert_{uuid.uuid4().hex[:8]}",
            "type": AlertType.GOAL_AT_RISK,
            "priority": AlertPriority.HIGH,
            "client_id": client["id"],
            "client_name": client["name"],
            "title": "Retirement Goal Off Track",
            "description": "Current trajectory shows 12% shortfall vs retirement goal. Recommend increasing contributions.",
            "impact": "Projected shortfall of $245,000 at retirement",
            "action_text": "Run Scenario",
            "action_route": "/decision-center",
            "created_at": (now - timedelta(hours=_rng.randint(1, 24))).isoformat(),
            "metadata": {
                "goal_name": "Retirement at 65",
                "target_amount": 2500000,
                "projected_amount": 2255000,
                "shortfall_percentage": 9.8
            }
        })
    
    # Market Event Alerts
    alerts.append({
        "id": f"alert_{uuid.uuid4().hex[:8]}",
        "type": AlertType.MARKET_EVENT,
        "priority": AlertPriority.MEDIUM,
        "client_id": None,
        "client_name": "All Clients",
        "title": "RBA Rate Decision Tomorrow",
        "description": "Reserve Bank of Australia cash rate decision due. Markets pricing 60% chance of 25bp cut.",
        "impact": "May affect fixed income and property valuations across portfolios",
        "action_text": "Review Impact",
        "action_route": "/market-data",
        "created_at": (now - timedelta(hours=2)).isoformat(),
        "metadata": {
            "event_type": "Central Bank Decision",
            "event_date": (now + timedelta(days=1)).strftime("%Y-%m-%d"),
            "affected_assets": ["Bonds", "REITs", "Bank Stocks"]
        }
    })
    
    # Fee Optimization Alert
    fee_client = _rng.choice(CLIENTS)
    alerts.append({
        "id": f"alert_{uuid.uuid4().hex[:8]}",
        "type": AlertType.FEE_OPTIMIZATION,
        "priority": AlertPriority.LOW,
        "client_id": fee_client["id"],
        "client_name": fee_client["name"],
        "title": "Fee Optimization Available",
        "description": "Switching to institutional share class could save $3,200/year in MER fees.",
        "impact": "Annual savings of $3,200 (0.15% of AUM)",
        "action_text": "View Options",
        "action_route": "/product-marketplace",
        "created_at": (now - timedelta(hours=_rng.randint(12, 72))).isoformat(),
        "metadata": {
            "current_fee": 0.85,
            "optimized_fee": 0.70,
            "annual_savings": 3200
        }
    })
    
    # Sort by priority and time
    priority_order = {AlertPriority.CRITICAL: 0, AlertPriority.HIGH: 1, AlertPriority.MEDIUM: 2, AlertPriority.LOW: 3}
    alerts.sort(key=lambda x: (priority_order.get(x["priority"], 4), x["created_at"]), reverse=False)
    
    return alerts


def generate_daily_metrics() -> Dict:
    """Generate daily practice metrics."""
    total_aum = sum(c["aum"] for c in CLIENTS)
    return {
        "total_aum": total_aum,
        "aum_change_24h": _rng.uniform(-0.5, 1.2),
        "aum_change_mtd": _rng.uniform(-2, 4),
        "total_clients": len(CLIENTS),
        "active_clients": len(CLIENTS) - 1,
        "reviews_due_30d": 4,
        "reviews_overdue": 1,
        "compliance_score": 93.2,
        "revenue_mtd": int(total_aum * 0.01 / 12),  # ~1% annual fee / 12 months
        "meetings_today": 3,
        "meetings_this_week": 12
    }


def generate_ai_recommendations() -> List[Dict]:
    """Generate AI-powered cross-client recommendations."""
    return [
        {
            "id": "rec_001",
            "type": "macro_trend",
            "title": "Rising Bond Yields Impact",
            "description": "Analysis of your client base shows 7 clients with >30% bond allocation may be affected by rising yields. Consider reviewing duration exposure.",
            "affected_clients": 7,
            "potential_impact": "Medium",
            "action_text": "View Affected Clients",
            "confidence": 0.87
        },
        {
            "id": "rec_002",
            "type": "tax_planning",
            "title": "End of Financial Year Planning",
            "description": "15 clients have unused concessional contribution caps. Total potential tax savings of $127,500 if contributions made before June 30.",
            "affected_clients": 15,
            "potential_impact": "$127,500 tax savings",
            "action_text": "Generate Report",
            "confidence": 0.95
        },
        {
            "id": "rec_003",
            "type": "fee_review",
            "title": "Platform Fee Negotiation",
            "description": "Your total FUM of $21.3M qualifies for institutional pricing on 3 platforms. Annual savings potential: $18,400.",
            "affected_clients": len(CLIENTS),
            "potential_impact": "$18,400/year",
            "action_text": "Contact Platforms",
            "confidence": 0.92
        },
        {
            "id": "rec_004",
            "type": "client_engagement",
            "title": "Engagement Opportunity",
            "description": "3 clients haven't logged into their portal in 90+ days. Consider proactive outreach to maintain engagement.",
            "affected_clients": 3,
            "potential_impact": "Retention Risk",
            "action_text": "Send Check-in",
            "confidence": 0.78
        }
    ]


def generate_schedule() -> List[Dict]:
    """Generate today's schedule."""
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "meeting_001",
            "time": (now.replace(hour=9, minute=0)).strftime("%H:%M"),
            "duration": 60,
            "title": "Wheeler Family - Annual Review",
            "client_id": "client_1",
            "client_name": "Wheeler Family",
            "type": "Annual Review",
            "location": "Video Call",
            "prepared": True
        },
        {
            "id": "meeting_002",
            "time": (now.replace(hour=11, minute=30)).strftime("%H:%M"),
            "duration": 30,
            "title": "Patel Holdings - Tax Strategy",
            "client_id": "client_4",
            "client_name": "Patel Holdings",
            "type": "Strategy Review",
            "location": "Phone",
            "prepared": False
        },
        {
            "id": "meeting_003",
            "time": (now.replace(hour=14, minute=0)).strftime("%H:%M"),
            "duration": 45,
            "title": "Garcia Family - Onboarding",
            "client_id": "client_5",
            "client_name": "Garcia Family",
            "type": "Onboarding",
            "location": "Office",
            "prepared": True
        }
    ]


@router.get("/daily-digest")
async def get_daily_digest():
    """Get the comprehensive daily digest for the adviser command center."""
    now = datetime.now(timezone.utc)
    alerts = generate_daily_alerts()
    metrics = generate_daily_metrics()
    recommendations = generate_ai_recommendations()
    schedule = generate_schedule()
    
    # Count alerts by priority
    alert_counts = {
        "critical": len([a for a in alerts if a["priority"] == AlertPriority.CRITICAL]),
        "high": len([a for a in alerts if a["priority"] == AlertPriority.HIGH]),
        "medium": len([a for a in alerts if a["priority"] == AlertPriority.MEDIUM]),
        "low": len([a for a in alerts if a["priority"] == AlertPriority.LOW])
    }
    
    return {
        "generated_at": now.isoformat(),
        "greeting": get_time_greeting(),
        "summary": {
            "total_alerts": len(alerts),
            "alert_counts": alert_counts,
            "requires_immediate_attention": alert_counts["critical"] + alert_counts["high"],
            "meetings_today": len(schedule),
            "unprepared_meetings": len([m for m in schedule if not m["prepared"]])
        },
        "metrics": metrics,
        "alerts": alerts,
        "ai_recommendations": recommendations,
        "schedule": schedule,
        "quick_actions": [
            {"label": "Prep Next Meeting", "route": "/meeting-prep", "icon": "Calendar"},
            {"label": "Run Compliance Check", "route": "/compliance", "icon": "Shield"},
            {"label": "Market Overview", "route": "/market-data", "icon": "TrendingUp"},
            {"label": "AI Copilot", "route": "/ai-copilot", "icon": "Sparkles"}
        ]
    }


@router.get("/alerts")
async def get_alerts(
    priority: Optional[str] = None,
    alert_type: Optional[str] = None,
    client_id: Optional[str] = None,
    limit: int = 50
):
    """Get filtered alerts."""
    alerts = generate_daily_alerts()
    
    if priority:
        alerts = [a for a in alerts if a["priority"] == priority]
    if alert_type:
        alerts = [a for a in alerts if a["type"] == alert_type]
    if client_id:
        alerts = [a for a in alerts if a.get("client_id") == client_id]
    
    return {
        "alerts": alerts[:limit],
        "total": len(alerts)
    }


@router.post("/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    """Dismiss an alert."""
    return {
        "success": True,
        "alert_id": alert_id,
        "dismissed_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/alerts/{alert_id}/snooze")
async def snooze_alert(alert_id: str, hours: int = 24):
    """Snooze an alert for a specified number of hours."""
    snooze_until = datetime.now(timezone.utc) + timedelta(hours=hours)
    return {
        "success": True,
        "alert_id": alert_id,
        "snoozed_until": snooze_until.isoformat()
    }


@router.get("/metrics")
async def get_metrics(period: str = "today"):
    """Get practice metrics."""
    return generate_daily_metrics()


@router.get("/schedule")
async def get_schedule(date: Optional[str] = None):
    """Get today's schedule."""
    return {
        "date": date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "meetings": generate_schedule()
    }


@router.get("/quick-insights")
async def get_quick_insights():
    """Get AI-generated quick insights for the day."""
    return {
        "insights": generate_ai_recommendations(),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


def get_time_greeting() -> str:
    """Get appropriate greeting based on time of day."""
    hour = datetime.now().hour
    if hour < 12:
        return "Good morning"
    elif hour < 17:
        return "Good afternoon"
    else:
        return "Good evening"
