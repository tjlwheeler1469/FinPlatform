"""
Cross-Client Intelligence Engine
AI-powered analysis across the entire client book to identify patterns, opportunities, and risks.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from datetime import datetime, timezone
import logging
import secrets
_rng = secrets.SystemRandom()
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/intelligence", tags=["Cross-Client Intelligence"])

# Try to import AI service
try:
    from emergentintegrations.llm.chat import chat, LlmMessage
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    logger.warning("AI service not available for intelligence engine")


# Mock client data for analysis
MOCK_CLIENTS = [
    {
        "id": "client_1", "name": "Wheeler Family", "type": "Family",
        "aum": 2920000, "risk_profile": "Balanced", "age": 45,
        "allocation": {"aus_equities": 35, "intl_equities": 25, "bonds": 20, "property": 15, "cash": 5},
        "target_allocation": {"aus_equities": 30, "intl_equities": 30, "bonds": 20, "property": 15, "cash": 5},
        "last_review": "2024-11-15", "last_login": "2025-03-10",
        "unrealized_gains": 125000, "unrealized_losses": 28000,
        "super_contrib_ytd": 15000, "super_cap": 27500,
        "goals": [{"name": "Retirement at 65", "progress": 72, "on_track": True}]
    },
    {
        "id": "client_2", "name": "Chen Investment Trust", "type": "Trust",
        "aum": 4200000, "risk_profile": "Growth", "age": 52,
        "allocation": {"aus_equities": 45, "intl_equities": 30, "bonds": 10, "property": 10, "cash": 5},
        "target_allocation": {"aus_equities": 40, "intl_equities": 35, "bonds": 10, "property": 10, "cash": 5},
        "last_review": "2024-10-20", "last_login": "2025-03-15",
        "unrealized_gains": 380000, "unrealized_losses": 42000,
        "super_contrib_ytd": 27500, "super_cap": 27500,
        "goals": [{"name": "Income Generation", "progress": 85, "on_track": True}]
    },
    {
        "id": "client_3", "name": "Thompson SMSF", "type": "SMSF",
        "aum": 890000, "risk_profile": "Conservative", "age": 62,
        "allocation": {"aus_equities": 25, "intl_equities": 15, "bonds": 40, "property": 10, "cash": 10},
        "target_allocation": {"aus_equities": 20, "intl_equities": 15, "bonds": 45, "property": 10, "cash": 10},
        "last_review": "2024-12-01", "last_login": "2025-02-28",
        "unrealized_gains": 45000, "unrealized_losses": 12000,
        "super_contrib_ytd": 27500, "super_cap": 27500,
        "goals": [{"name": "Pension Phase Transition", "progress": 90, "on_track": True}]
    },
    {
        "id": "client_4", "name": "Patel Holdings", "type": "Company",
        "aum": 7500000, "risk_profile": "High Growth", "age": 48,
        "allocation": {"aus_equities": 50, "intl_equities": 35, "bonds": 5, "property": 5, "cash": 5},
        "target_allocation": {"aus_equities": 45, "intl_equities": 35, "bonds": 10, "property": 5, "cash": 5},
        "last_review": "2024-09-15", "last_login": "2025-03-16",
        "unrealized_gains": 890000, "unrealized_losses": 125000,
        "super_contrib_ytd": 10000, "super_cap": 27500,
        "goals": [{"name": "Business Exit", "progress": 45, "on_track": False}]
    },
    {
        "id": "client_5", "name": "Garcia Family", "type": "Family",
        "aum": 820000, "risk_profile": "Balanced", "age": 38,
        "allocation": {"aus_equities": 40, "intl_equities": 30, "bonds": 15, "property": 10, "cash": 5},
        "target_allocation": {"aus_equities": 35, "intl_equities": 30, "bonds": 15, "property": 15, "cash": 5},
        "last_review": None, "last_login": "2024-12-01",
        "unrealized_gains": 35000, "unrealized_losses": 8000,
        "super_contrib_ytd": 5000, "super_cap": 27500,
        "goals": [{"name": "First Home", "progress": 30, "on_track": True}]
    },
    {
        "id": "client_6", "name": "Anderson SMSF", "type": "SMSF",
        "aum": 1250000, "risk_profile": "Conservative", "age": 58,
        "allocation": {"aus_equities": 30, "intl_equities": 20, "bonds": 35, "property": 10, "cash": 5},
        "target_allocation": {"aus_equities": 25, "intl_equities": 20, "bonds": 40, "property": 10, "cash": 5},
        "last_review": "2024-08-20", "last_login": "2025-01-15",
        "unrealized_gains": 78000, "unrealized_losses": 22000,
        "super_contrib_ytd": 27500, "super_cap": 27500,
        "goals": [{"name": "Retirement at 60", "progress": 82, "on_track": True}]
    },
    {
        "id": "client_7", "name": "Liu Family Trust", "type": "Trust",
        "aum": 3100000, "risk_profile": "Growth", "age": 42,
        "allocation": {"aus_equities": 42, "intl_equities": 33, "bonds": 12, "property": 8, "cash": 5},
        "target_allocation": {"aus_equities": 35, "intl_equities": 35, "bonds": 15, "property": 10, "cash": 5},
        "last_review": "2024-11-30", "last_login": "2025-03-14",
        "unrealized_gains": 210000, "unrealized_losses": 55000,
        "super_contrib_ytd": 20000, "super_cap": 27500,
        "goals": [{"name": "Children's Education", "progress": 65, "on_track": True}]
    },
    {
        "id": "client_8", "name": "Morrison Super", "type": "SMSF",
        "aum": 580000, "risk_profile": "Balanced", "age": 55,
        "allocation": {"aus_equities": 35, "intl_equities": 25, "bonds": 25, "property": 10, "cash": 5},
        "target_allocation": {"aus_equities": 30, "intl_equities": 25, "bonds": 30, "property": 10, "cash": 5},
        "last_review": "2024-07-15", "last_login": "2024-11-20",
        "unrealized_gains": 28000, "unrealized_losses": 15000,
        "super_contrib_ytd": 12000, "super_cap": 27500,
        "goals": [{"name": "Retirement at 60", "progress": 58, "on_track": False}]
    },
]


def calculate_drift(allocation: Dict, target: Dict) -> float:
    """Calculate portfolio drift from target allocation."""
    total_drift = 0
    for asset_class in set(allocation.keys()) | set(target.keys()):
        current = allocation.get(asset_class, 0)
        target_val = target.get(asset_class, 0)
        total_drift += abs(current - target_val)
    return total_drift / 2  # Divide by 2 as drift is counted twice


def analyze_portfolio_drift() -> Dict:
    """Analyze portfolio drift patterns across all clients."""
    drift_analysis = []
    high_drift_clients = []
    
    for client in MOCK_CLIENTS:
        drift = calculate_drift(client["allocation"], client["target_allocation"])
        drift_analysis.append({
            "client_id": client["id"],
            "client_name": client["name"],
            "drift_percentage": drift,
            "needs_rebalance": drift > 5,
            "overweight": [],
            "underweight": []
        })
        
        # Identify over/underweight assets
        for asset in client["allocation"]:
            diff = client["allocation"][asset] - client["target_allocation"].get(asset, 0)
            if diff > 3:
                drift_analysis[-1]["overweight"].append({"asset": asset, "diff": diff})
            elif diff < -3:
                drift_analysis[-1]["underweight"].append({"asset": asset, "diff": abs(diff)})
        
        if drift > 5:
            high_drift_clients.append(client)
    
    # Find common patterns
    overweight_patterns = {}
    for d in drift_analysis:
        for ow in d.get("overweight", []):
            asset = ow["asset"]
            if asset not in overweight_patterns:
                overweight_patterns[asset] = 0
            overweight_patterns[asset] += 1
    
    return {
        "total_clients": len(MOCK_CLIENTS),
        "clients_needing_rebalance": len(high_drift_clients),
        "average_drift": round(sum(d["drift_percentage"] for d in drift_analysis) / len(drift_analysis), 2),
        "drift_by_client": drift_analysis,
        "common_overweight_assets": sorted(overweight_patterns.items(), key=lambda x: x[1], reverse=True)[:3],
        "batch_rebalance_opportunity": len(high_drift_clients) >= 3,
        "estimated_trades": len(high_drift_clients) * 4  # Avg 4 trades per rebalance
    }


def analyze_tax_opportunities() -> Dict:
    """Identify tax-loss harvesting and contribution opportunities."""
    tax_opportunities = []
    total_harvestable_losses = 0
    total_unused_super_cap = 0
    
    for client in MOCK_CLIENTS:
        opp = {
            "client_id": client["id"],
            "client_name": client["name"],
            "opportunities": []
        }
        
        # Tax-loss harvesting
        if client["unrealized_losses"] > 5000:
            estimated_tax_saving = client["unrealized_losses"] * 0.39  # Top marginal rate
            total_harvestable_losses += client["unrealized_losses"]
            opp["opportunities"].append({
                "type": "tax_loss_harvest",
                "description": f"${client['unrealized_losses']:,} in unrealized losses available",
                "potential_saving": estimated_tax_saving,
                "priority": "high" if client["unrealized_losses"] > 20000 else "medium"
            })
        
        # Super contribution optimization
        unused_cap = client["super_cap"] - client["super_contrib_ytd"]
        if unused_cap > 5000:
            tax_saving = unused_cap * 0.22  # Difference between 37% marginal and 15% super
            total_unused_super_cap += unused_cap
            opp["opportunities"].append({
                "type": "super_contribution",
                "description": f"${unused_cap:,} unused concessional cap",
                "potential_saving": tax_saving,
                "priority": "high" if unused_cap > 15000 else "medium"
            })
        
        if opp["opportunities"]:
            tax_opportunities.append(opp)
    
    total_potential_savings = (total_harvestable_losses * 0.39) + (total_unused_super_cap * 0.22)
    
    return {
        "total_clients_with_opportunities": len(tax_opportunities),
        "total_harvestable_losses": total_harvestable_losses,
        "total_unused_super_cap": total_unused_super_cap,
        "total_potential_tax_savings": round(total_potential_savings, 2),
        "opportunities_by_client": tax_opportunities,
        "eofy_deadline": "June 30, 2025",
        "days_until_eofy": max(0, (datetime(2025, 6, 30) - datetime.now()).days),
        "urgency": "high" if (datetime(2025, 6, 30) - datetime.now()).days < 90 else "medium"
    }


def analyze_engagement() -> Dict:
    """Analyze client engagement patterns."""
    now = datetime.now()
    engagement_issues = []
    at_risk_clients = []
    
    for client in MOCK_CLIENTS:
        days_since_login = 0
        if client["last_login"]:
            last_login = datetime.strptime(client["last_login"], "%Y-%m-%d")
            days_since_login = (now - last_login).days
        
        days_since_review = 0
        review_overdue = False
        if client["last_review"]:
            last_review = datetime.strptime(client["last_review"], "%Y-%m-%d")
            days_since_review = (now - last_review).days
            review_overdue = days_since_review > 365
        else:
            review_overdue = True
            days_since_review = 999
        
        engagement_score = 100
        if days_since_login > 90:
            engagement_score -= 30
        if days_since_login > 60:
            engagement_score -= 15
        if review_overdue:
            engagement_score -= 25
        
        client_engagement = {
            "client_id": client["id"],
            "client_name": client["name"],
            "days_since_login": days_since_login,
            "days_since_review": days_since_review,
            "review_overdue": review_overdue,
            "engagement_score": max(0, engagement_score),
            "at_risk": engagement_score < 60
        }
        
        engagement_issues.append(client_engagement)
        
        if client_engagement["at_risk"]:
            at_risk_clients.append(client)
    
    return {
        "total_clients": len(MOCK_CLIENTS),
        "at_risk_count": len(at_risk_clients),
        "reviews_overdue": len([e for e in engagement_issues if e["review_overdue"]]),
        "average_engagement_score": round(sum(e["engagement_score"] for e in engagement_issues) / len(engagement_issues), 1),
        "clients_not_logged_90_days": len([e for e in engagement_issues if e["days_since_login"] > 90]),
        "engagement_by_client": engagement_issues,
        "recommended_actions": [
            {
                "action": "proactive_outreach",
                "description": f"Contact {len([e for e in engagement_issues if e['days_since_login'] > 90])} clients who haven't logged in for 90+ days",
                "priority": "high"
            },
            {
                "action": "schedule_reviews",
                "description": f"Schedule {len([e for e in engagement_issues if e['review_overdue']])} overdue annual reviews",
                "priority": "high"
            }
        ]
    }


def analyze_fee_optimization() -> Dict:
    """Analyze fee optimization opportunities across the practice."""
    total_aum = sum(c["aum"] for c in MOCK_CLIENTS)
    
    # Platform fee tiers (example)
    fee_tiers = [
        {"min_aum": 0, "max_aum": 5000000, "fee": 0.85},
        {"min_aum": 5000000, "max_aum": 10000000, "fee": 0.70},
        {"min_aum": 10000000, "max_aum": 20000000, "fee": 0.55},
        {"min_aum": 20000000, "max_aum": float('inf'), "fee": 0.45}
    ]
    
    # Current fees (assuming 0.85%)
    current_fee_rate = 0.85
    current_annual_fees = total_aum * (current_fee_rate / 100)
    
    # Find optimal tier
    optimal_tier = None
    for tier in fee_tiers:
        if tier["min_aum"] <= total_aum < tier["max_aum"]:
            optimal_tier = tier
            break
    
    if optimal_tier:
        optimal_fee_rate = optimal_tier["fee"]
        optimal_annual_fees = total_aum * (optimal_fee_rate / 100)
        annual_savings = current_annual_fees - optimal_annual_fees
    else:
        optimal_fee_rate = current_fee_rate
        annual_savings = 0
    
    return {
        "total_aum": total_aum,
        "current_fee_rate": current_fee_rate,
        "current_annual_fees": round(current_annual_fees, 2),
        "optimal_fee_rate": optimal_fee_rate,
        "optimal_annual_fees": round(optimal_annual_fees, 2) if optimal_tier else current_annual_fees,
        "potential_annual_savings": round(annual_savings, 2),
        "recommendation": f"Your combined AUM of ${total_aum:,.0f} qualifies for institutional pricing at {optimal_fee_rate}%",
        "action_required": annual_savings > 5000,
        "platforms_to_contact": ["Netwealth", "HUB24", "Praemium"] if annual_savings > 5000 else []
    }


def analyze_goals() -> Dict:
    """Analyze goal progress across all clients."""
    all_goals = []
    at_risk_goals = []
    
    for client in MOCK_CLIENTS:
        for goal in client.get("goals", []):
            goal_data = {
                "client_id": client["id"],
                "client_name": client["name"],
                "goal_name": goal["name"],
                "progress": goal["progress"],
                "on_track": goal["on_track"]
            }
            all_goals.append(goal_data)
            
            if not goal["on_track"]:
                at_risk_goals.append(goal_data)
    
    return {
        "total_goals": len(all_goals),
        "goals_on_track": len([g for g in all_goals if g["on_track"]]),
        "goals_at_risk": len(at_risk_goals),
        "success_rate": round(len([g for g in all_goals if g["on_track"]]) / len(all_goals) * 100, 1) if all_goals else 0,
        "at_risk_goals": at_risk_goals,
        "all_goals": all_goals
    }


@router.get("/comprehensive-analysis")
async def get_comprehensive_analysis():
    """Get comprehensive cross-client intelligence analysis."""
    portfolio_analysis = analyze_portfolio_drift()
    tax_analysis = analyze_tax_opportunities()
    engagement_analysis = analyze_engagement()
    fee_analysis = analyze_fee_optimization()
    goal_analysis = analyze_goals()
    
    # Calculate practice-wide metrics
    total_aum = sum(c["aum"] for c in MOCK_CLIENTS)
    total_clients = len(MOCK_CLIENTS)
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "practice_summary": {
            "total_aum": total_aum,
            "total_clients": total_clients,
            "average_client_aum": round(total_aum / total_clients, 2),
            "health_score": round((
                (100 - portfolio_analysis["average_drift"] * 5) * 0.3 +
                engagement_analysis["average_engagement_score"] * 0.3 +
                goal_analysis["success_rate"] * 0.4
            ), 1)
        },
        "portfolio_drift": portfolio_analysis,
        "tax_opportunities": tax_analysis,
        "engagement": engagement_analysis,
        "fee_optimization": fee_analysis,
        "goals": goal_analysis,
        "priority_actions": [
            {
                "priority": 1,
                "category": "Tax Planning",
                "action": f"Execute tax-loss harvesting for {tax_analysis['total_clients_with_opportunities']} clients",
                "impact": f"${tax_analysis['total_potential_tax_savings']:,.0f} potential savings",
                "deadline": tax_analysis["eofy_deadline"]
            },
            {
                "priority": 2,
                "category": "Rebalancing",
                "action": f"Batch rebalance {portfolio_analysis['clients_needing_rebalance']} portfolios",
                "impact": f"Reduce average drift from {portfolio_analysis['average_drift']}% to <2%",
                "deadline": None
            },
            {
                "priority": 3,
                "category": "Client Retention",
                "action": f"Proactive outreach to {engagement_analysis['at_risk_count']} at-risk clients",
                "impact": "Improve engagement and reduce churn risk",
                "deadline": None
            },
            {
                "priority": 4,
                "category": "Fee Optimization",
                "action": "Negotiate institutional pricing with platforms",
                "impact": f"${fee_analysis['potential_annual_savings']:,.0f} annual savings",
                "deadline": None
            }
        ]
    }


@router.get("/portfolio-drift")
async def get_portfolio_drift_analysis():
    """Get detailed portfolio drift analysis."""
    return analyze_portfolio_drift()


@router.get("/tax-opportunities")
async def get_tax_opportunities():
    """Get tax optimization opportunities."""
    return analyze_tax_opportunities()


@router.get("/engagement")
async def get_engagement_analysis():
    """Get client engagement analysis."""
    return analyze_engagement()


@router.get("/fee-optimization")
async def get_fee_optimization():
    """Get fee optimization analysis."""
    return analyze_fee_optimization()


@router.get("/goals-analysis")
async def get_goals_analysis():
    """Get goals progress analysis across all clients."""
    return analyze_goals()


@router.post("/generate-ai-insights")
async def generate_ai_insights():
    """Generate AI-powered insights using LLM."""
    if not AI_AVAILABLE:
        return {
            "success": False,
            "error": "AI service not available",
            "fallback_insights": [
                "Consider batch rebalancing portfolios with drift > 5%",
                "Tax-loss harvesting opportunities available before EOFY",
                "Several clients haven't logged in for 90+ days - consider proactive outreach"
            ]
        }
    
    try:
        # Gather data for AI analysis
        portfolio_analysis = analyze_portfolio_drift()
        tax_analysis = analyze_tax_opportunities()
        engagement_analysis = analyze_engagement()
        
        prompt = f"""As a financial adviser's AI assistant, analyze this practice data and provide 3-5 actionable insights:

Practice Overview:
- Total Clients: {len(MOCK_CLIENTS)}
- Total AUM: ${sum(c['aum'] for c in MOCK_CLIENTS):,.0f}
- Clients needing rebalance: {portfolio_analysis['clients_needing_rebalance']}
- Average portfolio drift: {portfolio_analysis['average_drift']}%
- Tax opportunities: ${tax_analysis['total_potential_tax_savings']:,.0f} potential savings
- At-risk clients (engagement): {engagement_analysis['at_risk_count']}
- Days until EOFY: {tax_analysis['days_until_eofy']}

Provide specific, actionable insights for the adviser. Focus on immediate opportunities and risks."""

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
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "data_summary": {
                "total_clients": len(MOCK_CLIENTS),
                "total_aum": sum(c["aum"] for c in MOCK_CLIENTS),
                "key_metrics": {
                    "portfolio_drift": portfolio_analysis["average_drift"],
                    "tax_savings_potential": tax_analysis["total_potential_tax_savings"],
                    "at_risk_clients": engagement_analysis["at_risk_count"]
                }
            }
        }
    except Exception as e:
        logger.error(f"AI insights generation failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback_insights": [
                "Consider batch rebalancing portfolios with drift > 5%",
                "Tax-loss harvesting opportunities available before EOFY",
                "Several clients haven't logged in for 90+ days - consider proactive outreach"
            ]
        }


@router.get("/client/{client_id}/peer-comparison")
async def get_peer_comparison(client_id: str):
    """Compare a client's metrics against similar clients."""
    # Find the client
    client = next((c for c in MOCK_CLIENTS if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Find similar clients (same type and similar AUM)
    similar_clients = [
        c for c in MOCK_CLIENTS 
        if c["id"] != client_id and 
        (c["type"] == client["type"] or abs(c["aum"] - client["aum"]) / client["aum"] < 0.5)
    ]
    
    if not similar_clients:
        similar_clients = [c for c in MOCK_CLIENTS if c["id"] != client_id]
    
    avg_return = sum(c["unrealized_gains"] / c["aum"] * 100 for c in similar_clients) / len(similar_clients)
    client_return = client["unrealized_gains"] / client["aum"] * 100
    
    return {
        "client_id": client_id,
        "client_name": client["name"],
        "peer_group_size": len(similar_clients),
        "comparisons": {
            "return_performance": {
                "client": round(client_return, 2),
                "peer_average": round(avg_return, 2),
                "percentile": 75 if client_return > avg_return else 50
            },
            "risk_profile_alignment": {
                "client_profile": client["risk_profile"],
                "allocation_appropriate": True
            },
            "engagement": {
                "client_login_days_ago": (datetime.now() - datetime.strptime(client["last_login"], "%Y-%m-%d")).days if client["last_login"] else 999,
                "peer_average_days": 45
            }
        },
        "recommendations": [
            "Portfolio performing above peer average" if client_return > avg_return else "Consider reviewing investment strategy",
            "Engagement level is healthy" if client["last_login"] and (datetime.now() - datetime.strptime(client["last_login"], "%Y-%m-%d")).days < 60 else "Schedule check-in call"
        ]
    }
