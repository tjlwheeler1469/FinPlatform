"""
Advisor Intelligence Dashboard
Daily insights, client alerts, and opportunity identification
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/adviser-insights", tags=["Adviser Intelligence"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ==================== MODELS ====================

class ClientAlert(BaseModel):
    alert_id: str
    client_id: str
    client_name: str
    alert_type: str  # below_target, at_risk, opportunity, review_due
    severity: str  # critical, high, medium, low
    confidence_score: float
    target_score: float = 80.0
    gap: float
    primary_risk: str
    recommended_action: str
    created_at: str

class DailyInsight(BaseModel):
    insight_id: str
    insight_type: str  # market_update, client_milestone, opportunity, warning
    title: str
    description: str
    affected_clients: List[str] = []
    action_required: bool = False
    created_at: str

class ClientOpportunity(BaseModel):
    opportunity_id: str
    client_id: str
    client_name: str
    opportunity_type: str  # contribution_boost, rebalance, tax_optimization, insurance_review
    potential_improvement: float  # Confidence score improvement
    description: str
    estimated_value: float = 0
    priority: str

# ==================== DEMO DATA GENERATION ====================

def generate_demo_clients() -> List[Dict]:
    """Generate demo client data for testing"""
    return [
        {
            "client_id": "CLI-001",
            "name": "James & Sarah Mitchell",
            "confidence_score": 72.5,
            "target_score": 80.0,
            "primary_risk": "spending_risk",
            "net_worth": 2600000,
            "annual_income": 245000,
            "retirement_age": 65,
            "current_age": 45,
            "last_review": (datetime.now() - timedelta(days=120)).isoformat(),
            "adviser_id": "ADV-001"
        },
        {
            "client_id": "CLI-002",
            "name": "Robert Smith",
            "confidence_score": 45.3,
            "target_score": 80.0,
            "primary_risk": "longevity_risk",
            "net_worth": 850000,
            "annual_income": 95000,
            "retirement_age": 62,
            "current_age": 58,
            "last_review": (datetime.now() - timedelta(days=200)).isoformat(),
            "adviser_id": "ADV-001"
        },
        {
            "client_id": "CLI-003",
            "name": "Emma Thompson",
            "confidence_score": 91.2,
            "target_score": 80.0,
            "primary_risk": "market_risk",
            "net_worth": 3200000,
            "annual_income": 180000,
            "retirement_age": 60,
            "current_age": 52,
            "last_review": (datetime.now() - timedelta(days=30)).isoformat(),
            "adviser_id": "ADV-001"
        },
        {
            "client_id": "CLI-004",
            "name": "Michael & Linda Chen",
            "confidence_score": 63.8,
            "target_score": 80.0,
            "primary_risk": "inflation_risk",
            "net_worth": 1450000,
            "annual_income": 175000,
            "retirement_age": 67,
            "current_age": 50,
            "last_review": (datetime.now() - timedelta(days=90)).isoformat(),
            "adviser_id": "ADV-001"
        },
        {
            "client_id": "CLI-005",
            "name": "Patricia Williams",
            "confidence_score": 28.5,
            "target_score": 80.0,
            "primary_risk": "spending_risk",
            "net_worth": 420000,
            "annual_income": 72000,
            "retirement_age": 65,
            "current_age": 61,
            "last_review": (datetime.now() - timedelta(days=365)).isoformat(),
            "adviser_id": "ADV-001"
        }
    ]

# ==================== API ENDPOINTS ====================

@router.get("/dashboard")
async def get_adviser_dashboard(adviser_id: str = "ADV-001"):
    """Get comprehensive adviser intelligence dashboard"""
    db = await get_db()
    
    # Get or generate client data
    clients = await db.adviser_clients.find(
        {"adviser_id": adviser_id},
        {"_id": 0}
    ).to_list(length=100)
    
    if not clients:
        # Use demo data
        clients = generate_demo_clients()
        # Store for future use
        for client in clients:
            await db.adviser_clients.update_one(
                {"client_id": client["client_id"]},
                {"$set": client},
                upsert=True
            )
    
    # Calculate metrics
    total_clients = len(clients)
    avg_confidence = sum(c.get("confidence_score", 0) for c in clients) / max(1, total_clients)
    clients_below_target = [c for c in clients if c.get("confidence_score", 0) < c.get("target_score", 80)]
    clients_at_risk = [c for c in clients if c.get("confidence_score", 0) < 50]
    
    # Generate alerts
    alerts = []
    for client in clients:
        score = client.get("confidence_score", 0)
        target = client.get("target_score", 80)
        
        if score < 30:
            severity = "critical"
            action = "Urgent review required - retirement plan at risk"
        elif score < 50:
            severity = "high"
            action = "Schedule comprehensive review and create action plan"
        elif score < target:
            severity = "medium"
            action = "Review contribution strategy and spending assumptions"
        else:
            continue  # No alert needed
        
        alerts.append(ClientAlert(
            alert_id=f"ALERT-{client['client_id'][-3:]}",
            client_id=client["client_id"],
            client_name=client["name"],
            alert_type="below_target" if score >= 50 else "at_risk",
            severity=severity,
            confidence_score=score,
            target_score=target,
            gap=target - score,
            primary_risk=client.get("primary_risk", "unknown"),
            recommended_action=action,
            created_at=datetime.now(timezone.utc).isoformat()
        ).model_dump())
    
    # Sort alerts by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: severity_order.get(x["severity"], 3))
    
    # Generate opportunities
    opportunities = []
    for client in clients:
        score = client.get("confidence_score", 0)
        if score < 90 and client.get("current_age", 50) < client.get("retirement_age", 65):
            years_to_ret = client["retirement_age"] - client["current_age"]
            
            opportunities.append(ClientOpportunity(
                opportunity_id=f"OPP-{client['client_id'][-3:]}",
                client_id=client["client_id"],
                client_name=client["name"],
                opportunity_type="contribution_boost",
                potential_improvement=min(15, (80 - score) * 0.4),
                description=f"Increasing super contributions by $10,000/year could improve score by ~{min(15, (80 - score) * 0.4):.0f}%",
                estimated_value=10000 * years_to_ret,
                priority="high" if score < 60 else "medium"
            ).model_dump())
    
    # Generate daily insights
    insights = [
        DailyInsight(
            insight_id="INS-001",
            insight_type="market_update",
            title="Market Update: ASX up 0.8%",
            description="Positive market sentiment may improve client confidence scores slightly.",
            affected_clients=[],
            action_required=False,
            created_at=datetime.now(timezone.utc).isoformat()
        ).model_dump(),
        DailyInsight(
            insight_id="INS-002",
            insight_type="warning",
            title=f"{len(clients_at_risk)} Clients Below 50% Confidence",
            description="These clients need immediate attention to avoid retirement shortfalls.",
            affected_clients=[c["client_id"] for c in clients_at_risk],
            action_required=True,
            created_at=datetime.now(timezone.utc).isoformat()
        ).model_dump(),
        DailyInsight(
            insight_id="INS-003",
            insight_type="opportunity",
            title="End of Financial Year Approaching",
            description="Review clients for contribution optimization opportunities before June 30.",
            affected_clients=[c["client_id"] for c in clients if c.get("confidence_score", 0) < 80],
            action_required=True,
            created_at=datetime.now(timezone.utc).isoformat()
        ).model_dump()
    ]
    
    # Reviews due (more than 6 months since last review)
    reviews_due = []
    for client in clients:
        last_review = client.get("last_review")
        if last_review:
            try:
                last_review_date = datetime.fromisoformat(last_review.replace("Z", "+00:00"))
                if last_review_date.tzinfo is None:
                    last_review_date = last_review_date.replace(tzinfo=timezone.utc)
                days_since = (datetime.now(timezone.utc) - last_review_date).days
                if days_since > 180:
                    reviews_due.append({
                        "client_id": client["client_id"],
                        "client_name": client["name"],
                        "days_since_review": days_since,
                        "confidence_score": client.get("confidence_score", 0)
                    })
            except Exception as e:
                logger.warning(f"Error parsing last_review date: {e}")
    
    return {
        "summary": {
            "total_clients": total_clients,
            "average_confidence": round(avg_confidence, 1),
            "clients_below_target": len(clients_below_target),
            "clients_at_risk": len(clients_at_risk),
            "clients_on_track": total_clients - len(clients_below_target),
            "reviews_overdue": len(reviews_due)
        },
        "alerts": alerts[:10],  # Top 10 alerts
        "opportunities": opportunities[:10],  # Top 10 opportunities
        "insights": insights,
        "reviews_due": sorted(reviews_due, key=lambda x: -x["days_since_review"])[:5],
        "confidence_distribution": {
            "excellent": len([c for c in clients if c.get("confidence_score", 0) >= 90]),
            "good": len([c for c in clients if 75 <= c.get("confidence_score", 0) < 90]),
            "moderate": len([c for c in clients if 50 <= c.get("confidence_score", 0) < 75]),
            "concerning": len([c for c in clients if 25 <= c.get("confidence_score", 0) < 50]),
            "critical": len([c for c in clients if c.get("confidence_score", 0) < 25])
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/clients")
async def get_client_list(
    adviser_id: str = "ADV-001",
    sort_by: str = "confidence_score",
    order: str = "asc"
):
    """Get list of clients with confidence scores"""
    db = await get_db()
    
    clients = await db.adviser_clients.find(
        {"adviser_id": adviser_id},
        {"_id": 0}
    ).to_list(length=100)
    
    if not clients:
        clients = generate_demo_clients()
    
    # Sort
    reverse = order == "desc"
    clients.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)
    
    return {
        "clients": clients,
        "total": len(clients)
    }

@router.get("/client/{client_id}")
async def get_client_detail(client_id: str):
    """Get detailed client information"""
    db = await get_db()
    
    client = await db.adviser_clients.find_one(
        {"client_id": client_id},
        {"_id": 0}
    )
    
    if not client:
        # Check demo data
        demo_clients = generate_demo_clients()
        client = next((c for c in demo_clients if c["client_id"] == client_id), None)
    
    if not client:
        raise HTTPException(404, f"Client {client_id} not found")
    
    # Get confidence history
    history = await db.confidence_calculations.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(length=10)
    
    # Generate recommendations
    score = client.get("confidence_score", 0)
    recommendations = []
    
    if score < 80:
        recommendations.append({
            "action": "Increase super contributions",
            "impact": "Could improve score by 5-10%",
            "priority": "high" if score < 50 else "medium"
        })
    
    if client.get("primary_risk") == "spending_risk":
        recommendations.append({
            "action": "Review retirement spending assumptions",
            "impact": "Reducing expenses by 10% could improve score by 8%",
            "priority": "high"
        })
    
    if client.get("primary_risk") == "market_risk":
        recommendations.append({
            "action": "Consider rebalancing portfolio",
            "impact": "Reducing volatility could improve score by 3-5%",
            "priority": "medium"
        })
    
    return {
        "client": client,
        "confidence_history": history,
        "recommendations": recommendations,
        "next_review_due": (datetime.now() + timedelta(days=180)).isoformat()
    }

@router.get("/alerts")
async def get_all_alerts(adviser_id: str = "ADV-001", severity: Optional[str] = None):
    """Get all client alerts"""
    dashboard = await get_adviser_dashboard(adviser_id)
    
    alerts = dashboard["alerts"]
    
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]
    
    return {
        "alerts": alerts,
        "total": len(alerts),
        "by_severity": {
            "critical": len([a for a in alerts if a["severity"] == "critical"]),
            "high": len([a for a in alerts if a["severity"] == "high"]),
            "medium": len([a for a in alerts if a["severity"] == "medium"]),
            "low": len([a for a in alerts if a["severity"] == "low"])
        }
    }

@router.get("/opportunities")
async def get_opportunities(adviser_id: str = "ADV-001"):
    """Get all client opportunities"""
    dashboard = await get_adviser_dashboard(adviser_id)
    
    opportunities = dashboard["opportunities"]
    
    total_potential = sum(o.get("potential_improvement", 0) for o in opportunities)
    total_value = sum(o.get("estimated_value", 0) for o in opportunities)
    
    return {
        "opportunities": opportunities,
        "total": len(opportunities),
        "total_potential_improvement": round(total_potential, 1),
        "total_estimated_value": total_value
    }

@router.post("/update-client-score")
async def update_client_score(
    client_id: str,
    confidence_score: float,
    risk_breakdown: Dict[str, float] = None
):
    """Update a client's confidence score"""
    db = await get_db()
    
    primary_risk = "unknown"
    if risk_breakdown:
        primary_risk = max(risk_breakdown, key=risk_breakdown.get)
    
    await db.adviser_clients.update_one(
        {"client_id": client_id},
        {
            "$set": {
                "confidence_score": confidence_score,
                "primary_risk": primary_risk,
                "last_calculation": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "client_id": client_id, "new_score": confidence_score}

@router.get("/bulk-actions")
async def get_bulk_action_recommendations(adviser_id: str = "ADV-001"):
    """Get bulk action recommendations for multiple clients"""
    db = await get_db()
    
    clients = await db.adviser_clients.find(
        {"adviser_id": adviser_id},
        {"_id": 0}
    ).to_list(length=100)
    
    if not clients:
        clients = generate_demo_clients()
    
    # Group clients by recommended action
    contribution_review = [c for c in clients if c.get("confidence_score", 0) < 75 and c.get("current_age", 50) < c.get("retirement_age", 65)]
    portfolio_review = [c for c in clients if c.get("primary_risk") == "market_risk"]
    spending_review = [c for c in clients if c.get("primary_risk") == "spending_risk"]
    urgent_review = [c for c in clients if c.get("confidence_score", 0) < 50]
    
    return {
        "bulk_actions": [
            {
                "action": "Contribution Strategy Review",
                "clients": [{"id": c["client_id"], "name": c["name"], "score": c.get("confidence_score", 0)} for c in contribution_review],
                "count": len(contribution_review),
                "description": "Review and optimize super contribution strategies"
            },
            {
                "action": "Portfolio Rebalancing",
                "clients": [{"id": c["client_id"], "name": c["name"], "score": c.get("confidence_score", 0)} for c in portfolio_review],
                "count": len(portfolio_review),
                "description": "Review asset allocation to manage market risk"
            },
            {
                "action": "Spending Analysis",
                "clients": [{"id": c["client_id"], "name": c["name"], "score": c.get("confidence_score", 0)} for c in spending_review],
                "count": len(spending_review),
                "description": "Review retirement spending assumptions"
            },
            {
                "action": "Urgent Client Reviews",
                "clients": [{"id": c["client_id"], "name": c["name"], "score": c.get("confidence_score", 0)} for c in urgent_review],
                "count": len(urgent_review),
                "description": "Clients requiring immediate attention"
            }
        ],
        "total_clients_requiring_action": len(set([c["client_id"] for c in contribution_review + portfolio_review + spending_review + urgent_review]))
    }
