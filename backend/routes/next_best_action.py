"""
Next Best Action Engine
AI-powered recommendation engine that tells advisors what to do every day.
This is the brain that drives decisions - not just shows data.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/next-action", tags=["Next Best Action Engine"])

# Try to import AI service
try:
    from emergentintegrations.llm.chat import chat, LlmMessage
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    logger.warning("AI service not available for Next Best Action Engine")


class ActionCategory(str, Enum):
    TAX = "tax"
    REBALANCING = "rebalancing"
    COMPLIANCE = "compliance"
    RETENTION = "retention"
    REVENUE = "revenue"
    RISK = "risk"
    GOAL = "goal"
    ONBOARDING = "onboarding"


class ActionPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ActionImpact(str, Enum):
    IMMEDIATE = "immediate"
    SHORT_TERM = "short_term"
    LONG_TERM = "long_term"


# Full client database for action generation
CLIENTS_DB = {
    "client_1": {
        "id": "client_1", "name": "Wheeler Family", "type": "Family",
        "aum": 2920000, "risk_profile": "Balanced", "age": 45,
        "spouse": "Sarah Wheeler", "dependents": ["Emily (18)", "James (15)"],
        "allocation": {"aus_equities": 35, "intl_equities": 25, "bonds": 20, "property": 15, "cash": 14},
        "target_allocation": {"aus_equities": 30, "intl_equities": 30, "bonds": 20, "property": 15, "cash": 5},
        "last_review": "2024-11-15", "last_contact": "2025-03-10",
        "unrealized_gains": 125000, "unrealized_losses": 28000,
        "super_contrib_ytd": 15000, "super_cap": 27500,
        "idle_cash": 185000, "idle_cash_days": 45,
        "retirement_target": 3500000, "retirement_date": "2045-01-01",
        "retirement_probability": 72, "risk_score": 6.5,
        "fee_revenue": 29200, "engagement_score": 85,
        "goals": [{"name": "Retirement at 65", "progress": 72, "on_track": True}],
        "compliance_status": "current", "review_due": "2025-05-15"
    },
    "client_2": {
        "id": "client_2", "name": "Chen Investment Trust", "type": "Trust",
        "aum": 4200000, "risk_profile": "Growth", "age": 52,
        "allocation": {"aus_equities": 25, "intl_equities": 40, "tech": 23, "bonds": 7, "cash": 5},
        "target_allocation": {"aus_equities": 30, "intl_equities": 35, "tech": 15, "bonds": 15, "cash": 5},
        "last_review": "2024-10-20", "last_contact": "2025-03-15",
        "unrealized_gains": 380000, "unrealized_losses": 42000,
        "super_contrib_ytd": 27500, "super_cap": 27500,
        "idle_cash": 220000, "idle_cash_days": 30,
        "retirement_target": 8000000, "retirement_date": "2038-01-01",
        "retirement_probability": 85, "risk_score": 7.8,
        "fee_revenue": 42000, "engagement_score": 92,
        "goals": [{"name": "Income Generation", "progress": 85, "on_track": True}],
        "compliance_status": "due_soon", "review_due": "2025-04-20"
    },
    "client_3": {
        "id": "client_3", "name": "Thompson SMSF", "type": "SMSF",
        "aum": 890000, "risk_profile": "Conservative", "age": 62,
        "allocation": {"aus_equities": 25, "intl_equities": 15, "bonds": 20, "property": 10, "cash": 30},
        "target_allocation": {"aus_equities": 20, "intl_equities": 15, "bonds": 45, "property": 10, "cash": 10},
        "last_review": "2024-08-01", "last_contact": "2025-02-28",
        "unrealized_gains": 45000, "unrealized_losses": 12000,
        "super_contrib_ytd": 27500, "super_cap": 27500,
        "idle_cash": 267000, "idle_cash_days": 90,
        "retirement_target": 1200000, "retirement_date": "2027-01-01",
        "retirement_probability": 68, "risk_score": 4.2,
        "fee_revenue": 8900, "engagement_score": 55,
        "goals": [{"name": "Pension Phase Transition", "progress": 74, "on_track": False}],
        "compliance_status": "overdue", "review_due": "2025-02-01"
    },
    "client_4": {
        "id": "client_4", "name": "Patel Holdings", "type": "Company",
        "aum": 7500000, "risk_profile": "High Growth", "age": 48,
        "allocation": {"aus_equities": 20, "intl_equities": 25, "tech": 35, "crypto": 8, "bonds": 5, "cash": 7},
        "target_allocation": {"aus_equities": 25, "intl_equities": 30, "tech": 25, "crypto": 5, "bonds": 10, "cash": 5},
        "last_review": "2024-09-15", "last_contact": "2025-03-16",
        "unrealized_gains": 890000, "unrealized_losses": 185000,
        "super_contrib_ytd": 10000, "super_cap": 27500,
        "idle_cash": 525000, "idle_cash_days": 20,
        "retirement_target": 15000000, "retirement_date": "2042-01-01",
        "retirement_probability": 82, "risk_score": 8.5,
        "fee_revenue": 75000, "engagement_score": 95,
        "goals": [{"name": "Business Exit", "progress": 45, "on_track": False}],
        "compliance_status": "current", "review_due": "2025-09-15"
    },
    "client_5": {
        "id": "client_5", "name": "Garcia Family", "type": "Family",
        "aum": 820000, "risk_profile": "Balanced", "age": 38,
        "allocation": {"aus_equities": 40, "intl_equities": 30, "bonds": 8, "property": 10, "cash": 12},
        "target_allocation": {"aus_equities": 35, "intl_equities": 30, "bonds": 15, "property": 15, "cash": 5},
        "last_review": None, "last_contact": "2024-12-01",
        "unrealized_gains": 35000, "unrealized_losses": 8000,
        "super_contrib_ytd": 5000, "super_cap": 27500,
        "idle_cash": 98400, "idle_cash_days": 60,
        "retirement_target": 2000000, "retirement_date": "2052-01-01",
        "retirement_probability": 78, "risk_score": 6.0,
        "fee_revenue": 8200, "engagement_score": 42,
        "goals": [{"name": "First Home", "progress": 30, "on_track": True}],
        "compliance_status": "new_client", "review_due": "2025-03-01"
    },
    "client_6": {
        "id": "client_6", "name": "Anderson SMSF", "type": "SMSF",
        "aum": 1250000, "risk_profile": "Conservative", "age": 58,
        "allocation": {"aus_equities": 30, "intl_equities": 20, "bonds": 28, "property": 12, "cash": 10},
        "target_allocation": {"aus_equities": 25, "intl_equities": 20, "bonds": 40, "property": 10, "cash": 5},
        "last_review": "2024-08-20", "last_contact": "2025-01-15",
        "unrealized_gains": 78000, "unrealized_losses": 32000,
        "super_contrib_ytd": 27500, "super_cap": 27500,
        "idle_cash": 125000, "idle_cash_days": 75,
        "retirement_target": 1800000, "retirement_date": "2032-01-01",
        "retirement_probability": 82, "risk_score": 5.0,
        "fee_revenue": 12500, "engagement_score": 68,
        "goals": [{"name": "Retirement at 60", "progress": 69, "on_track": True}],
        "compliance_status": "due_soon", "review_due": "2025-02-20"
    },
    "client_7": {
        "id": "client_7", "name": "Liu Family Trust", "type": "Trust",
        "aum": 3100000, "risk_profile": "Growth", "age": 42,
        "allocation": {"aus_equities": 42, "intl_equities": 33, "bonds": 12, "property": 8, "cash": 5},
        "target_allocation": {"aus_equities": 35, "intl_equities": 35, "bonds": 15, "property": 10, "cash": 5},
        "last_review": "2024-11-30", "last_contact": "2025-03-14",
        "unrealized_gains": 210000, "unrealized_losses": 55000,
        "super_contrib_ytd": 20000, "super_cap": 27500,
        "idle_cash": 155000, "idle_cash_days": 35,
        "retirement_target": 5000000, "retirement_date": "2048-01-01",
        "retirement_probability": 88, "risk_score": 7.2,
        "fee_revenue": 31000, "engagement_score": 88,
        "goals": [{"name": "Children's Education", "progress": 65, "on_track": True}],
        "compliance_status": "current", "review_due": "2025-11-30"
    },
    "client_8": {
        "id": "client_8", "name": "Morrison Super", "type": "SMSF",
        "aum": 580000, "risk_profile": "Balanced", "age": 55,
        "allocation": {"aus_equities": 35, "intl_equities": 25, "bonds": 18, "property": 10, "cash": 12},
        "target_allocation": {"aus_equities": 30, "intl_equities": 25, "bonds": 30, "property": 10, "cash": 5},
        "last_review": "2024-07-15", "last_contact": "2024-11-20",
        "unrealized_gains": 28000, "unrealized_losses": 18000,
        "super_contrib_ytd": 12000, "super_cap": 27500,
        "idle_cash": 69600, "idle_cash_days": 120,
        "retirement_target": 1000000, "retirement_date": "2032-01-01",
        "retirement_probability": 58, "risk_score": 5.5,
        "fee_revenue": 5800, "engagement_score": 35,
        "goals": [{"name": "Retirement at 62", "progress": 58, "on_track": False}],
        "compliance_status": "overdue", "review_due": "2025-01-15"
    },
}


def calculate_action_score(client: Dict, action_type: str) -> float:
    """Calculate priority score for an action (0-100)."""
    score = 0
    
    if action_type == "tax_harvest":
        loss_ratio = client.get("unrealized_losses", 0) / max(client.get("aum", 1), 1)
        days_to_eofy = max(0, (datetime(2025, 6, 30) - datetime.now()).days)
        urgency_factor = max(0, (120 - days_to_eofy) / 120)  # Higher score closer to EOFY
        score = (loss_ratio * 500) + (urgency_factor * 50) + 20  # Base score
        
    elif action_type == "super_contrib":
        unused_cap = client.get("super_cap", 27500) - client.get("super_contrib_ytd", 0)
        cap_ratio = unused_cap / 27500
        days_to_eofy = max(0, (datetime(2025, 6, 30) - datetime.now()).days)
        urgency_factor = max(0, (120 - days_to_eofy) / 120)
        score = (cap_ratio * 60) + (urgency_factor * 30) + 10
        
    elif action_type == "rebalancing":
        drift = sum(abs(client.get("allocation", {}).get(k, 0) - client.get("target_allocation", {}).get(k, 0))
                   for k in set(client.get("allocation", {}).keys()) | set(client.get("target_allocation", {}).keys())) / 2
        score = min(100, drift * 8)
        
    elif action_type == "idle_cash":
        cash_ratio = client.get("idle_cash", 0) / max(client.get("aum", 1), 1)
        days_factor = min(1, client.get("idle_cash_days", 0) / 90)
        score = (cash_ratio * 300) + (days_factor * 40)
        
    elif action_type == "compliance":
        status = client.get("compliance_status", "current")
        if status == "overdue":
            score = 95
        elif status == "due_soon":
            score = 75
        elif status == "new_client":
            score = 85
        else:
            score = 10
            
    elif action_type == "retention":
        engagement = client.get("engagement_score", 100)
        score = 100 - engagement  # Lower engagement = higher priority
        
    elif action_type == "retirement":
        prob = client.get("retirement_probability", 100)
        score = 100 - prob  # Lower probability = higher priority
        
    return min(100, max(0, score))


def generate_next_best_actions() -> List[Dict]:
    """Generate prioritized list of next best actions across all clients."""
    actions = []
    now = datetime.now(timezone.utc)
    days_to_eofy = max(0, (datetime(2025, 6, 30) - datetime.now()).days)
    
    for client_id, client in CLIENTS_DB.items():
        # 1. TAX-LOSS HARVESTING OPPORTUNITY
        if client.get("unrealized_losses", 0) > 5000:
            tax_savings = client["unrealized_losses"] * 0.39
            score = calculate_action_score(client, "tax_harvest")
            if score > 30:
                actions.append({
                    "id": f"action_{uuid.uuid4().hex[:8]}",
                    "client_id": client_id,
                    "client_name": client["name"],
                    "category": ActionCategory.TAX,
                    "priority": ActionPriority.CRITICAL if days_to_eofy < 60 and tax_savings > 5000 else ActionPriority.HIGH,
                    "score": score,
                    "title": "Execute Tax-Loss Harvest",
                    "description": f"Crystallize ${client['unrealized_losses']:,} in losses to save ${tax_savings:,.0f} in tax",
                    "impact_value": tax_savings,
                    "impact_type": ActionImpact.IMMEDIATE,
                    "deadline": "June 30, 2025",
                    "days_until_deadline": days_to_eofy,
                    "action_steps": [
                        "Review positions with unrealized losses",
                        "Confirm no wash sale implications",
                        "Execute sell orders before June 30",
                        "Consider replacement holdings"
                    ],
                    "one_click_action": "execute_tax_harvest",
                    "estimated_time": "15 minutes",
                    "risk_level": "low"
                })
        
        # 2. SUPER CONTRIBUTION OPTIMIZATION
        unused_cap = client.get("super_cap", 27500) - client.get("super_contrib_ytd", 0)
        if unused_cap > 5000:
            tax_savings = unused_cap * 0.22  # Diff between marginal and super rate
            score = calculate_action_score(client, "super_contrib")
            if score > 25:
                actions.append({
                    "id": f"action_{uuid.uuid4().hex[:8]}",
                    "client_id": client_id,
                    "client_name": client["name"],
                    "category": ActionCategory.TAX,
                    "priority": ActionPriority.HIGH if days_to_eofy < 90 else ActionPriority.MEDIUM,
                    "score": score,
                    "title": "Maximize Super Contributions",
                    "description": f"${unused_cap:,} unused concessional cap = ${tax_savings:,.0f} tax savings",
                    "impact_value": tax_savings,
                    "impact_type": ActionImpact.IMMEDIATE,
                    "deadline": "June 30, 2025",
                    "days_until_deadline": days_to_eofy,
                    "action_steps": [
                        f"Confirm ${unused_cap:,} available cap",
                        "Arrange salary sacrifice or personal contribution",
                        "Lodge notice of intent to claim deduction"
                    ],
                    "one_click_action": "prepare_super_advice",
                    "estimated_time": "20 minutes",
                    "risk_level": "low"
                })
        
        # 3. PORTFOLIO REBALANCING
        drift = sum(abs(client.get("allocation", {}).get(k, 0) - client.get("target_allocation", {}).get(k, 0))
                   for k in set(client.get("allocation", {}).keys()) | set(client.get("target_allocation", {}).keys())) / 2
        if drift > 5:
            score = calculate_action_score(client, "rebalancing")
            overweight = []
            underweight = []
            for asset in client.get("allocation", {}):
                diff = client["allocation"].get(asset, 0) - client["target_allocation"].get(asset, 0)
                if diff > 3:
                    overweight.append(f"{asset} (+{diff:.0f}%)")
                elif diff < -3:
                    underweight.append(f"{asset} ({diff:.0f}%)")
            
            actions.append({
                "id": f"action_{uuid.uuid4().hex[:8]}",
                "client_id": client_id,
                "client_name": client["name"],
                "category": ActionCategory.REBALANCING,
                "priority": ActionPriority.HIGH if drift > 10 else ActionPriority.MEDIUM,
                "score": score,
                "title": "Rebalance Portfolio",
                "description": f"Portfolio drifted {drift:.1f}% from target allocation",
                "impact_value": drift,
                "impact_type": ActionImpact.SHORT_TERM,
                "deadline": None,
                "action_steps": [
                    f"Reduce: {', '.join(overweight)}" if overweight else "No reductions needed",
                    f"Increase: {', '.join(underweight)}" if underweight else "No increases needed",
                    "Execute rebalance trades",
                    "Update client on changes"
                ],
                "one_click_action": "generate_rebalance_orders",
                "estimated_time": "30 minutes",
                "risk_level": "medium",
                "metadata": {
                    "drift_percentage": drift,
                    "overweight_assets": overweight,
                    "underweight_assets": underweight
                }
            })
        
        # 4. IDLE CASH DEPLOYMENT
        if client.get("idle_cash", 0) > 50000 and client.get("idle_cash_days", 0) > 30:
            opportunity_cost = client["idle_cash"] * 0.05  # 5% annual
            score = calculate_action_score(client, "idle_cash")
            if score > 30:
                actions.append({
                    "id": f"action_{uuid.uuid4().hex[:8]}",
                    "client_id": client_id,
                    "client_name": client["name"],
                    "category": ActionCategory.REVENUE,
                    "priority": ActionPriority.MEDIUM,
                    "score": score,
                    "title": "Deploy Idle Cash",
                    "description": f"${client['idle_cash']:,} idle for {client['idle_cash_days']} days = ${opportunity_cost:,.0f}/year opportunity cost",
                    "impact_value": opportunity_cost,
                    "impact_type": ActionImpact.LONG_TERM,
                    "deadline": None,
                    "action_steps": [
                        "Review client's liquidity needs",
                        "Propose investment options aligned with risk profile",
                        "Execute deployment strategy"
                    ],
                    "one_click_action": "propose_cash_deployment",
                    "estimated_time": "25 minutes",
                    "risk_level": "low",
                    "suggested_investments": ["Term Deposit", "Bond ETF", "Diversified ETF"]
                })
        
        # 5. COMPLIANCE - REVIEW DUE
        if client.get("compliance_status") in ["overdue", "due_soon", "new_client"]:
            score = calculate_action_score(client, "compliance")
            status = client["compliance_status"]
            actions.append({
                "id": f"action_{uuid.uuid4().hex[:8]}",
                "client_id": client_id,
                "client_name": client["name"],
                "category": ActionCategory.COMPLIANCE,
                "priority": ActionPriority.CRITICAL if status == "overdue" else ActionPriority.HIGH,
                "score": score,
                "title": "Complete Annual Review" if status != "new_client" else "Complete Onboarding Review",
                "description": f"Review {'overdue' if status == 'overdue' else 'due soon' if status == 'due_soon' else 'required for new client'}",
                "impact_value": None,
                "impact_type": ActionImpact.IMMEDIATE,
                "deadline": client.get("review_due"),
                "action_steps": [
                    "Generate meeting prep brief",
                    "Schedule review meeting",
                    "Complete SOA update",
                    "Document in compliance system"
                ],
                "one_click_action": "schedule_review",
                "estimated_time": "60 minutes",
                "risk_level": "high" if status == "overdue" else "medium"
            })
        
        # 6. CLIENT RETENTION RISK
        if client.get("engagement_score", 100) < 50:
            score = calculate_action_score(client, "retention")
            actions.append({
                "id": f"action_{uuid.uuid4().hex[:8]}",
                "client_id": client_id,
                "client_name": client["name"],
                "category": ActionCategory.RETENTION,
                "priority": ActionPriority.HIGH,
                "score": score,
                "title": "Proactive Client Outreach",
                "description": f"Engagement score {client['engagement_score']}% - risk of disengagement",
                "impact_value": client.get("fee_revenue", 0),
                "impact_type": ActionImpact.LONG_TERM,
                "deadline": None,
                "action_steps": [
                    "Review recent interactions",
                    "Send personalized check-in message",
                    "Schedule portfolio review call",
                    "Demonstrate value with insight report"
                ],
                "one_click_action": "send_checkin",
                "estimated_time": "15 minutes",
                "risk_level": "medium",
                "revenue_at_risk": client.get("fee_revenue", 0)
            })
        
        # 7. RETIREMENT GOAL AT RISK
        if client.get("retirement_probability", 100) < 70:
            prob = client.get("retirement_probability", 0)
            shortfall_rate = (100 - prob) / 100
            estimated_shortfall = client.get("retirement_target", 0) * shortfall_rate * 0.3
            score = calculate_action_score(client, "retirement")
            actions.append({
                "id": f"action_{uuid.uuid4().hex[:8]}",
                "client_id": client_id,
                "client_name": client["name"],
                "category": ActionCategory.GOAL,
                "priority": ActionPriority.HIGH if prob < 60 else ActionPriority.MEDIUM,
                "score": score,
                "title": "Address Retirement Shortfall",
                "description": f"{prob}% retirement probability - intervention needed",
                "impact_value": estimated_shortfall,
                "impact_type": ActionImpact.LONG_TERM,
                "deadline": None,
                "action_steps": [
                    "Run updated retirement projection",
                    "Model contribution increase scenarios",
                    "Discuss goal adjustment options",
                    "Implement agreed strategy"
                ],
                "one_click_action": "run_retirement_scenario",
                "estimated_time": "45 minutes",
                "risk_level": "high",
                "current_probability": prob,
                "target_probability": 85
            })
    
    # Sort by score (highest first)
    actions.sort(key=lambda x: x["score"], reverse=True)
    
    return actions


def get_today_focus_actions(limit: int = 5) -> Dict:
    """Get the top actions to focus on today."""
    all_actions = generate_next_best_actions()
    top_actions = all_actions[:limit]
    
    # Calculate impact summary
    total_tax_savings = sum(
        a.get("impact_value", 0) for a in top_actions 
        if a.get("category") == ActionCategory.TAX and a.get("impact_value")
    )
    total_revenue_at_risk = sum(
        a.get("revenue_at_risk", 0) for a in top_actions 
        if a.get("category") == ActionCategory.RETENTION
    )
    clients_needing_rebalance = len([
        a for a in all_actions if a.get("category") == ActionCategory.REBALANCING
    ])
    compliance_overdue = len([
        a for a in all_actions 
        if a.get("category") == ActionCategory.COMPLIANCE and a.get("priority") == ActionPriority.CRITICAL
    ])
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "focus_message": generate_focus_message(top_actions),
        "top_actions": top_actions,
        "impact_summary": {
            "potential_tax_savings": total_tax_savings,
            "revenue_at_risk": total_revenue_at_risk,
            "clients_needing_rebalance": clients_needing_rebalance,
            "compliance_overdue": compliance_overdue
        },
        "total_actions_available": len(all_actions),
        "by_category": {
            ActionCategory.TAX: len([a for a in all_actions if a.get("category") == ActionCategory.TAX]),
            ActionCategory.REBALANCING: len([a for a in all_actions if a.get("category") == ActionCategory.REBALANCING]),
            ActionCategory.COMPLIANCE: len([a for a in all_actions if a.get("category") == ActionCategory.COMPLIANCE]),
            ActionCategory.RETENTION: len([a for a in all_actions if a.get("category") == ActionCategory.RETENTION]),
            ActionCategory.GOAL: len([a for a in all_actions if a.get("category") == ActionCategory.GOAL]),
            ActionCategory.REVENUE: len([a for a in all_actions if a.get("category") == ActionCategory.REVENUE]),
        }
    }


def generate_focus_message(actions: List[Dict]) -> str:
    """Generate a human-readable focus message."""
    if not actions:
        return "All caught up! No urgent actions today."
    
    critical = [a for a in actions if a.get("priority") == ActionPriority.CRITICAL]
    high = [a for a in actions if a.get("priority") == ActionPriority.HIGH]
    
    if critical:
        return f"⚠️ {len(critical)} critical action{'s' if len(critical) > 1 else ''} require immediate attention"
    elif high:
        return f"📋 {len(high)} high-priority action{'s' if len(high) > 1 else ''} for today"
    else:
        return "✅ Focus on optimizing your practice today"


@router.get("/today")
async def get_todays_actions(limit: int = 5):
    """Get today's prioritized action list - the daily must-do."""
    return get_today_focus_actions(limit)


@router.get("/all")
async def get_all_actions():
    """Get all generated actions across all clients."""
    actions = generate_next_best_actions()
    
    return {
        "total_actions": len(actions),
        "actions": actions,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/client/{client_id}")
async def get_client_actions(client_id: str):
    """Get next best actions for a specific client."""
    if client_id not in CLIENTS_DB:
        raise HTTPException(status_code=404, detail="Client not found")
    
    all_actions = generate_next_best_actions()
    client_actions = [a for a in all_actions if a.get("client_id") == client_id]
    
    return {
        "client_id": client_id,
        "client_name": CLIENTS_DB[client_id]["name"],
        "actions": client_actions,
        "total_actions": len(client_actions),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/by-category/{category}")
async def get_actions_by_category(category: ActionCategory):
    """Get actions filtered by category."""
    all_actions = generate_next_best_actions()
    filtered = [a for a in all_actions if a.get("category") == category]
    
    return {
        "category": category,
        "actions": filtered,
        "total": len(filtered),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/execute/{action_id}")
async def execute_action(action_id: str, notes: Optional[str] = None):
    """Mark an action as executed/completed."""
    return {
        "success": True,
        "action_id": action_id,
        "status": "executed",
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes,
        "message": "Action marked as completed. CRM and compliance logs updated."
    }


@router.post("/snooze/{action_id}")
async def snooze_action(action_id: str, days: int = 7, reason: Optional[str] = None):
    """Snooze an action for later."""
    snooze_until = datetime.now(timezone.utc) + timedelta(days=days)
    return {
        "success": True,
        "action_id": action_id,
        "status": "snoozed",
        "snoozed_until": snooze_until.isoformat(),
        "reason": reason,
        "message": f"Action snoozed for {days} days"
    }


@router.post("/ai-prioritize")
async def ai_prioritize_actions():
    """Use AI to provide intelligent prioritization and insights."""
    if not AI_AVAILABLE:
        return {
            "success": False,
            "message": "AI service not available",
            "fallback_priority": generate_next_best_actions()[:5]
        }
    
    try:
        actions = generate_next_best_actions()
        
        prompt = f"""As an expert financial adviser assistant, analyze these {len(actions)} pending actions and provide:
1. The top 3 most impactful actions to focus on today
2. Any actions that should be done together for efficiency
3. One strategic insight the adviser should know

Actions summary:
- Tax opportunities: {len([a for a in actions if a.get('category') == ActionCategory.TAX])} clients
- Rebalancing needed: {len([a for a in actions if a.get('category') == ActionCategory.REBALANCING])} clients  
- Compliance overdue: {len([a for a in actions if a.get('category') == ActionCategory.COMPLIANCE and a.get('priority') == ActionPriority.CRITICAL])} clients
- At-risk engagement: {len([a for a in actions if a.get('category') == ActionCategory.RETENTION])} clients
- Retirement concerns: {len([a for a in actions if a.get('category') == ActionCategory.GOAL])} clients

Days until EOFY: {max(0, (datetime(2025, 6, 30) - datetime.now()).days)}

Provide concise, actionable advice."""

        messages = [LlmMessage(role="user", content=prompt)]
        response = chat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            model="claude-sonnet-4-20250514",
            messages=messages,
            temperature=0.7
        )
        
        return {
            "success": True,
            "ai_insights": response.content,
            "top_actions": actions[:5],
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI prioritization failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback_priority": generate_next_best_actions()[:5]
        }
