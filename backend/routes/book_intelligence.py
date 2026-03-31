"""
Book Intelligence Module - Cross-Client Analytics
Analyzes the entire client book for macro opportunities, risks, and trends.
This is the "advisor intelligence" layer that sees patterns humans miss.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/book-intelligence", tags=["Book Intelligence"])


class InsightCategory(str, Enum):
    RISK = "risk"
    OPPORTUNITY = "opportunity"
    COMPLIANCE = "compliance"
    REVENUE = "revenue"
    RETENTION = "retention"
    MARKET = "market"


class InsightPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# Simulated client book data for analysis
CLIENT_BOOK = {
    "client_1": {"name": "Wheeler Family", "aum": 2920000, "risk_profile": "Balanced", "sector_exposure": {"tech": 25, "finance": 18, "healthcare": 15, "energy": 12, "consumer": 30}, "age": 45, "years_to_retire": 20, "engagement": 85, "last_review": "2024-11-15", "unrealized_gains": 125000, "unrealized_losses": 28000},
    "client_2": {"name": "Chen Investment Trust", "aum": 4200000, "risk_profile": "Growth", "sector_exposure": {"tech": 42, "finance": 10, "healthcare": 8, "energy": 5, "consumer": 35}, "age": 52, "years_to_retire": 13, "engagement": 92, "last_review": "2024-10-20", "unrealized_gains": 380000, "unrealized_losses": 42000},
    "client_3": {"name": "Thompson SMSF", "aum": 890000, "risk_profile": "Conservative", "sector_exposure": {"tech": 8, "finance": 35, "healthcare": 20, "energy": 15, "consumer": 22}, "age": 62, "years_to_retire": 3, "engagement": 55, "last_review": "2024-08-01", "unrealized_gains": 45000, "unrealized_losses": 12000},
    "client_4": {"name": "Patel Holdings", "aum": 7500000, "risk_profile": "High Growth", "sector_exposure": {"tech": 55, "finance": 8, "healthcare": 12, "energy": 5, "consumer": 20}, "age": 48, "years_to_retire": 17, "engagement": 95, "last_review": "2024-09-15", "unrealized_gains": 890000, "unrealized_losses": 185000},
    "client_5": {"name": "Garcia Family", "aum": 820000, "risk_profile": "Balanced", "sector_exposure": {"tech": 22, "finance": 20, "healthcare": 18, "energy": 15, "consumer": 25}, "age": 38, "years_to_retire": 27, "engagement": 42, "last_review": None, "unrealized_gains": 35000, "unrealized_losses": 8000},
    "client_6": {"name": "Anderson SMSF", "aum": 1250000, "risk_profile": "Conservative", "sector_exposure": {"tech": 12, "finance": 32, "healthcare": 22, "energy": 14, "consumer": 20}, "age": 58, "years_to_retire": 7, "engagement": 68, "last_review": "2024-08-20", "unrealized_gains": 78000, "unrealized_losses": 32000},
    "client_7": {"name": "Liu Family Trust", "aum": 3100000, "risk_profile": "Growth", "sector_exposure": {"tech": 35, "finance": 15, "healthcare": 18, "energy": 8, "consumer": 24}, "age": 42, "years_to_retire": 23, "engagement": 88, "last_review": "2024-11-30", "unrealized_gains": 210000, "unrealized_losses": 55000},
    "client_8": {"name": "Morrison Super", "aum": 580000, "risk_profile": "Balanced", "sector_exposure": {"tech": 18, "finance": 25, "healthcare": 20, "energy": 17, "consumer": 20}, "age": 55, "years_to_retire": 10, "engagement": 35, "last_review": "2024-07-15", "unrealized_gains": 28000, "unrealized_losses": 18000},
    "client_9": {"name": "Park Investment Co", "aum": 5200000, "risk_profile": "Growth", "sector_exposure": {"tech": 38, "finance": 12, "healthcare": 15, "energy": 10, "consumer": 25}, "age": 50, "years_to_retire": 15, "engagement": 90, "last_review": "2024-12-01", "unrealized_gains": 450000, "unrealized_losses": 95000},
    "client_10": {"name": "Williams Family", "aum": 1100000, "risk_profile": "Balanced", "sector_exposure": {"tech": 20, "finance": 22, "healthcare": 18, "energy": 18, "consumer": 22}, "age": 47, "years_to_retire": 18, "engagement": 72, "last_review": "2024-09-30", "unrealized_gains": 65000, "unrealized_losses": 22000},
    "client_11": {"name": "Johnson SMSF", "aum": 920000, "risk_profile": "Conservative", "sector_exposure": {"tech": 10, "finance": 38, "healthcare": 22, "energy": 12, "consumer": 18}, "age": 60, "years_to_retire": 5, "engagement": 60, "last_review": "2024-10-15", "unrealized_gains": 52000, "unrealized_losses": 15000},
    "client_12": {"name": "Taylor Holdings", "aum": 2400000, "risk_profile": "Growth", "sector_exposure": {"tech": 32, "finance": 18, "healthcare": 20, "energy": 8, "consumer": 22}, "age": 44, "years_to_retire": 21, "engagement": 82, "last_review": "2024-11-20", "unrealized_gains": 185000, "unrealized_losses": 48000},
}


def analyze_sector_concentration() -> dict:
    """Analyze sector concentration across the book."""
    sector_totals = {}
    total_aum = sum(c["aum"] for c in CLIENT_BOOK.values())
    
    for client in CLIENT_BOOK.values():
        for sector, pct in client["sector_exposure"].items():
            weighted_exposure = (pct / 100) * client["aum"]
            sector_totals[sector] = sector_totals.get(sector, 0) + weighted_exposure
    
    # Calculate book-level sector allocation
    book_allocation = {
        sector: round((value / total_aum) * 100, 1)
        for sector, value in sector_totals.items()
    }
    
    # Find concentration risks
    concentration_risks = []
    for sector, pct in book_allocation.items():
        if pct > 30:
            clients_overweight = [
                {"name": c["name"], "exposure": c["sector_exposure"].get(sector, 0)}
                for c in CLIENT_BOOK.values()
                if c["sector_exposure"].get(sector, 0) > 30
            ]
            concentration_risks.append({
                "sector": sector,
                "book_exposure": pct,
                "threshold": 30,
                "clients_overweight": len(clients_overweight),
                "clients": clients_overweight[:5]
            })
    
    return {
        "book_allocation": book_allocation,
        "concentration_risks": concentration_risks,
        "total_aum_analyzed": total_aum
    }


def analyze_risk_distribution() -> dict:
    """Analyze risk profile distribution across the book."""
    risk_profiles = {}
    
    for client in CLIENT_BOOK.values():
        profile = client["risk_profile"]
        if profile not in risk_profiles:
            risk_profiles[profile] = {"count": 0, "total_aum": 0, "clients": []}
        risk_profiles[profile]["count"] += 1
        risk_profiles[profile]["total_aum"] += client["aum"]
        risk_profiles[profile]["clients"].append(client["name"])
    
    total_aum = sum(c["aum"] for c in CLIENT_BOOK.values())
    
    return {
        "distribution": {
            profile: {
                "count": data["count"],
                "aum": data["total_aum"],
                "aum_percentage": round((data["total_aum"] / total_aum) * 100, 1),
                "clients": data["clients"]
            }
            for profile, data in risk_profiles.items()
        },
        "total_clients": len(CLIENT_BOOK),
        "total_aum": total_aum
    }


def analyze_tax_opportunities() -> dict:
    """Analyze tax-loss harvesting opportunities across the book."""
    opportunities = []
    total_harvestable = 0
    
    for client_id, client in CLIENT_BOOK.items():
        if client["unrealized_losses"] > 5000:
            tax_savings = client["unrealized_losses"] * 0.39  # Assume 39% marginal rate
            total_harvestable += client["unrealized_losses"]
            opportunities.append({
                "client_id": client_id,
                "client_name": client["name"],
                "unrealized_losses": client["unrealized_losses"],
                "potential_tax_savings": round(tax_savings, 2),
                "priority": "high" if client["unrealized_losses"] > 30000 else "medium"
            })
    
    opportunities.sort(key=lambda x: x["unrealized_losses"], reverse=True)
    
    return {
        "total_harvestable_losses": total_harvestable,
        "total_potential_tax_savings": round(total_harvestable * 0.39, 2),
        "clients_with_opportunities": len(opportunities),
        "opportunities": opportunities
    }


def analyze_engagement_health() -> dict:
    """Analyze client engagement and identify at-risk relationships."""
    at_risk = []
    healthy = []
    
    for client_id, client in CLIENT_BOOK.items():
        if client["engagement"] < 50:
            at_risk.append({
                "client_id": client_id,
                "client_name": client["name"],
                "engagement_score": client["engagement"],
                "aum": client["aum"],
                "revenue_at_risk": round(client["aum"] * 0.01, 2),  # 1% fee assumption
                "last_review": client.get("last_review"),
                "recommended_action": "Urgent outreach required"
            })
        elif client["engagement"] < 70:
            at_risk.append({
                "client_id": client_id,
                "client_name": client["name"],
                "engagement_score": client["engagement"],
                "aum": client["aum"],
                "revenue_at_risk": round(client["aum"] * 0.01, 2),
                "last_review": client.get("last_review"),
                "recommended_action": "Schedule check-in"
            })
        else:
            healthy.append({
                "client_name": client["name"],
                "engagement_score": client["engagement"]
            })
    
    at_risk.sort(key=lambda x: x["engagement_score"])
    
    return {
        "at_risk_count": len(at_risk),
        "healthy_count": len(healthy),
        "total_revenue_at_risk": sum(c["revenue_at_risk"] for c in at_risk),
        "at_risk_clients": at_risk,
        "average_engagement": round(sum(c["engagement"] for c in CLIENT_BOOK.values()) / len(CLIENT_BOOK), 1)
    }


def analyze_retirement_readiness() -> dict:
    """Analyze retirement readiness across the book."""
    near_retirement = []  # Within 10 years
    mid_term = []  # 10-20 years
    long_term = []  # 20+ years
    
    for client_id, client in CLIENT_BOOK.items():
        years = client["years_to_retire"]
        entry = {
            "client_id": client_id,
            "client_name": client["name"],
            "years_to_retire": years,
            "current_aum": client["aum"],
            "risk_profile": client["risk_profile"]
        }
        
        if years <= 10:
            # Check if risk profile is appropriate
            if client["risk_profile"] in ["High Growth", "Growth"]:
                entry["concern"] = "Risk profile may be too aggressive for retirement timeline"
                entry["action_required"] = True
            near_retirement.append(entry)
        elif years <= 20:
            mid_term.append(entry)
        else:
            long_term.append(entry)
    
    return {
        "summary": {
            "near_retirement": len(near_retirement),
            "mid_term": len(mid_term),
            "long_term": len(long_term)
        },
        "near_retirement_clients": near_retirement,
        "clients_needing_review": [c for c in near_retirement if c.get("action_required")]
    }


def generate_book_insights() -> dict:
    """Generate comprehensive insights for the entire book."""
    insights = []
    now = datetime.now(timezone.utc)
    
    # Sector concentration insight
    sector_analysis = analyze_sector_concentration()
    if sector_analysis["concentration_risks"]:
        for risk in sector_analysis["concentration_risks"]:
            insights.append({
                "id": f"insight_{uuid.uuid4().hex[:8]}",
                "category": InsightCategory.RISK,
                "priority": InsightPriority.HIGH,
                "title": f"Book Overweight: {risk['sector'].title()} Sector",
                "description": f"Your book has {risk['book_exposure']}% exposure to {risk['sector']}, exceeding the 30% threshold. {risk['clients_overweight']} clients are significantly overweight.",
                "affected_clients": risk["clients_overweight"],
                "impact": f"{risk['book_exposure'] - 30:.1f}% over threshold",
                "recommended_action": f"Consider rebalancing {risk['sector']} exposure across affected portfolios",
                "action_type": "rebalance",
                "generated_at": now.isoformat()
            })
    
    # Tax harvesting insight
    tax_analysis = analyze_tax_opportunities()
    if tax_analysis["total_harvestable_losses"] > 50000:
        insights.append({
            "id": f"insight_{uuid.uuid4().hex[:8]}",
            "category": InsightCategory.OPPORTUNITY,
            "priority": InsightPriority.HIGH,
            "title": "Tax-Loss Harvesting Opportunity",
            "description": f"${tax_analysis['total_harvestable_losses']:,.0f} in harvestable losses across {tax_analysis['clients_with_opportunities']} clients could save ${tax_analysis['total_potential_tax_savings']:,.0f} in taxes.",
            "affected_clients": tax_analysis["clients_with_opportunities"],
            "impact": f"${tax_analysis['total_potential_tax_savings']:,.0f} potential savings",
            "recommended_action": "Execute tax-loss harvesting before EOFY",
            "action_type": "tax_harvest",
            "deadline": "June 30, 2025",
            "generated_at": now.isoformat()
        })
    
    # Engagement risk insight
    engagement_analysis = analyze_engagement_health()
    if engagement_analysis["at_risk_count"] > 0:
        insights.append({
            "id": f"insight_{uuid.uuid4().hex[:8]}",
            "category": InsightCategory.RETENTION,
            "priority": InsightPriority.HIGH if engagement_analysis["total_revenue_at_risk"] > 50000 else InsightPriority.MEDIUM,
            "title": "Client Engagement Warning",
            "description": f"{engagement_analysis['at_risk_count']} clients have low engagement scores, putting ${engagement_analysis['total_revenue_at_risk']:,.0f} in annual revenue at risk.",
            "affected_clients": engagement_analysis["at_risk_count"],
            "impact": f"${engagement_analysis['total_revenue_at_risk']:,.0f} revenue at risk",
            "recommended_action": "Initiate proactive outreach campaign",
            "action_type": "outreach",
            "generated_at": now.isoformat()
        })
    
    # Retirement readiness insight
    retirement_analysis = analyze_retirement_readiness()
    if retirement_analysis["clients_needing_review"]:
        insights.append({
            "id": f"insight_{uuid.uuid4().hex[:8]}",
            "category": InsightCategory.RISK,
            "priority": InsightPriority.HIGH,
            "title": "Retirement Risk Mismatch",
            "description": f"{len(retirement_analysis['clients_needing_review'])} clients approaching retirement have potentially inappropriate risk profiles.",
            "affected_clients": len(retirement_analysis["clients_needing_review"]),
            "impact": "Portfolio risk may exceed tolerance",
            "recommended_action": "Review and adjust risk profiles for near-retirees",
            "action_type": "risk_review",
            "clients": [c["client_name"] for c in retirement_analysis["clients_needing_review"]],
            "generated_at": now.isoformat()
        })
    
    # Sort by priority
    priority_order = {InsightPriority.CRITICAL: 0, InsightPriority.HIGH: 1, InsightPriority.MEDIUM: 2, InsightPriority.LOW: 3}
    insights.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return insights


# ==================== API ENDPOINTS ====================

@router.get("/overview")
async def get_book_overview() -> dict:
    """Get high-level overview of the entire client book."""
    total_aum = sum(c["aum"] for c in CLIENT_BOOK.values())
    total_unrealized_gains = sum(c["unrealized_gains"] for c in CLIENT_BOOK.values())
    total_unrealized_losses = sum(c["unrealized_losses"] for c in CLIENT_BOOK.values())
    avg_engagement = sum(c["engagement"] for c in CLIENT_BOOK.values()) / len(CLIENT_BOOK)
    
    return {
        "book_summary": {
            "total_clients": len(CLIENT_BOOK),
            "total_aum": total_aum,
            "average_client_aum": round(total_aum / len(CLIENT_BOOK), 2),
            "total_unrealized_gains": total_unrealized_gains,
            "total_unrealized_losses": total_unrealized_losses,
            "net_unrealized_pnl": total_unrealized_gains - total_unrealized_losses,
            "average_engagement_score": round(avg_engagement, 1)
        },
        "risk_distribution": analyze_risk_distribution()["distribution"],
        "sector_allocation": analyze_sector_concentration()["book_allocation"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/insights")
async def get_book_insights(limit: int = 10) -> dict:
    """Get AI-generated insights for the book."""
    insights = generate_book_insights()
    
    return {
        "insights": insights[:limit],
        "total_insights": len(insights),
        "critical_count": len([i for i in insights if i["priority"] == InsightPriority.CRITICAL]),
        "high_priority_count": len([i for i in insights if i["priority"] == InsightPriority.HIGH]),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/sector-analysis")
async def get_sector_analysis() -> dict:
    """Get detailed sector concentration analysis."""
    analysis = analyze_sector_concentration()
    
    return {
        "book_allocation": analysis["book_allocation"],
        "concentration_risks": analysis["concentration_risks"],
        "total_aum": analysis["total_aum_analyzed"],
        "recommended_thresholds": {
            "max_single_sector": 30,
            "max_correlated_sectors": 50
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/tax-opportunities")
async def get_tax_opportunities() -> dict:
    """Get tax-loss harvesting opportunities across the book."""
    return {
        **analyze_tax_opportunities(),
        "days_to_eofy": max(0, (datetime(2025, 6, 30) - datetime.now()).days),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/engagement-health")
async def get_engagement_health() -> dict:
    """Get client engagement and retention analysis."""
    return {
        **analyze_engagement_health(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/retirement-analysis")
async def get_retirement_analysis() -> dict:
    """Get retirement readiness analysis across the book."""
    return {
        **analyze_retirement_readiness(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/risk-analysis")
async def get_risk_analysis() -> dict:
    """Get risk profile distribution analysis."""
    return {
        **analyze_risk_distribution(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/clients-needing-action")
async def get_clients_needing_action() -> dict:
    """Get all clients that need immediate attention."""
    
    # Combine multiple analyses
    tax_ops = analyze_tax_opportunities()
    engagement = analyze_engagement_health()
    retirement = analyze_retirement_readiness()
    
    action_items = []
    
    # Tax harvesting actions
    for opp in tax_ops["opportunities"][:5]:
        action_items.append({
            "client_name": opp["client_name"],
            "action_type": "tax_harvest",
            "priority": opp["priority"],
            "description": f"Harvest ${opp['unrealized_losses']:,} in losses",
            "potential_value": opp["potential_tax_savings"]
        })
    
    # Engagement actions
    for client in engagement["at_risk_clients"][:5]:
        action_items.append({
            "client_name": client["client_name"],
            "action_type": "engagement",
            "priority": "high" if client["engagement_score"] < 50 else "medium",
            "description": client["recommended_action"],
            "potential_value": client["revenue_at_risk"]
        })
    
    # Retirement review actions
    for client in retirement["clients_needing_review"]:
        action_items.append({
            "client_name": client["client_name"],
            "action_type": "risk_review",
            "priority": "high",
            "description": client.get("concern", "Review risk profile"),
            "potential_value": None
        })
    
    # Sort by priority
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    action_items.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return {
        "action_items": action_items,
        "total_actions": len(action_items),
        "by_type": {
            "tax_harvest": len([a for a in action_items if a["action_type"] == "tax_harvest"]),
            "engagement": len([a for a in action_items if a["action_type"] == "engagement"]),
            "risk_review": len([a for a in action_items if a["action_type"] == "risk_review"])
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/performance-attribution")
async def get_performance_attribution() -> dict:
    """Get book-level performance attribution analysis."""
    
    # Simulate performance data
    total_gains = sum(c["unrealized_gains"] for c in CLIENT_BOOK.values())
    total_losses = sum(c["unrealized_losses"] for c in CLIENT_BOOK.values())
    total_aum = sum(c["aum"] for c in CLIENT_BOOK.values())
    
    # Attribution by sector (simulated)
    sector_attribution = {
        "tech": {"contribution": 2.8, "weight": 28},
        "finance": {"contribution": 0.9, "weight": 20},
        "healthcare": {"contribution": 1.2, "weight": 17},
        "energy": {"contribution": -0.4, "weight": 11},
        "consumer": {"contribution": 1.1, "weight": 24}
    }
    
    # Top/bottom performers
    clients_by_performance = sorted(
        CLIENT_BOOK.items(),
        key=lambda x: (x[1]["unrealized_gains"] - x[1]["unrealized_losses"]) / x[1]["aum"],
        reverse=True
    )
    
    return {
        "book_performance": {
            "total_unrealized_pnl": total_gains - total_losses,
            "pnl_as_percentage": round((total_gains - total_losses) / total_aum * 100, 2),
            "total_aum": total_aum
        },
        "sector_attribution": sector_attribution,
        "top_performers": [
            {"name": c[1]["name"], "return_pct": round((c[1]["unrealized_gains"] - c[1]["unrealized_losses"]) / c[1]["aum"] * 100, 2)}
            for c in clients_by_performance[:3]
        ],
        "bottom_performers": [
            {"name": c[1]["name"], "return_pct": round((c[1]["unrealized_gains"] - c[1]["unrealized_losses"]) / c[1]["aum"] * 100, 2)}
            for c in clients_by_performance[-3:]
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/generate-report")
async def generate_book_report(report_type: str = "comprehensive") -> dict:
    """Generate a comprehensive book intelligence report."""
    
    overview = await get_book_overview()
    insights = await get_book_insights()
    sector = await get_sector_analysis()
    tax = await get_tax_opportunities()
    engagement = await get_engagement_health()
    
    return {
        "report_id": f"report_{uuid.uuid4().hex[:8]}",
        "report_type": report_type,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sections": {
            "executive_summary": {
                "total_clients": overview["book_summary"]["total_clients"],
                "total_aum": overview["book_summary"]["total_aum"],
                "key_insights": len(insights["insights"]),
                "critical_actions": insights["critical_count"] + insights["high_priority_count"]
            },
            "book_overview": overview["book_summary"],
            "key_insights": insights["insights"][:5],
            "sector_analysis": sector,
            "tax_opportunities": {
                "total_harvestable": tax["total_harvestable_losses"],
                "potential_savings": tax["total_potential_tax_savings"],
                "clients_affected": tax["clients_with_opportunities"]
            },
            "engagement_health": {
                "at_risk_clients": engagement["at_risk_count"],
                "revenue_at_risk": engagement["total_revenue_at_risk"],
                "average_score": engagement["average_engagement"]
            }
        },
        "recommendations": [
            "Execute tax-loss harvesting before EOFY" if tax["total_harvestable_losses"] > 50000 else None,
            "Rebalance tech-heavy portfolios" if any(r["sector"] == "tech" for r in sector["concentration_risks"]) else None,
            "Initiate outreach to low-engagement clients" if engagement["at_risk_count"] > 0 else None
        ]
    }
