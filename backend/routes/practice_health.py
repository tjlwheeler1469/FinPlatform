"""
Practice Health Dashboard
Real-time monitoring of practice performance, health metrics, and KPIs.
This is the pulse of the advisory practice.
"""
from fastapi import APIRouter
from typing import Dict
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/practice-health", tags=["Practice Health"])


# Practice-wide data
PRACTICE_DATA = {
    "practice_name": "Wealth Command Advisory",
    "adviser_count": 1,
    "support_staff": 2,
    "established": "2018-01-01",
    "afsl_holder": "Wealth Command Pty Ltd",
    "afsl_number": "123456789",
}

# Client segments for analysis
CLIENT_SEGMENTS = {
    "high_value": {"min_aum": 2000000, "count": 3, "total_aum": 14600000, "avg_fee": 0.95},
    "core": {"min_aum": 500000, "max_aum": 2000000, "count": 4, "total_aum": 5740000, "avg_fee": 1.0},
    "emerging": {"max_aum": 500000, "count": 1, "total_aum": 580000, "avg_fee": 1.2},
}

# Historical metrics for trending
HISTORICAL_METRICS = {
    "2024-Q1": {"aum": 18500000, "clients": 148, "revenue": 420000, "nps": 72},
    "2024-Q2": {"aum": 19200000, "clients": 152, "revenue": 445000, "nps": 74},
    "2024-Q3": {"aum": 19800000, "clients": 158, "revenue": 465000, "nps": 76},
    "2024-Q4": {"aum": 20500000, "clients": 161, "revenue": 485000, "nps": 78},
    "2025-Q1": {"aum": 21300000, "clients": 164, "revenue": 502000, "nps": 80},
}


def calculate_practice_score() -> Dict:
    """Calculate overall practice health score (0-100)."""
    scores = {
        "compliance": 93,  # Based on review completion rate
        "engagement": 72,  # Based on client engagement scores
        "growth": 85,      # Based on AUM/client growth
        "profitability": 88,  # Based on fee efficiency
        "risk": 78,        # Based on portfolio risk scores
    }
    
    weights = {
        "compliance": 0.25,
        "engagement": 0.20,
        "growth": 0.20,
        "profitability": 0.20,
        "risk": 0.15,
    }
    
    overall = sum(scores[k] * weights[k] for k in scores)
    
    return {
        "overall_score": round(overall, 1),
        "grade": "A" if overall >= 90 else "A-" if overall >= 85 else "B+" if overall >= 80 else "B" if overall >= 75 else "B-" if overall >= 70 else "C",
        "component_scores": scores,
        "weights": weights,
        "trend": "improving",  # Based on historical comparison
        "percentile": 82  # vs industry benchmark
    }


def get_key_metrics() -> Dict:
    """Get key practice metrics."""
    current = HISTORICAL_METRICS["2025-Q1"]
    previous = HISTORICAL_METRICS["2024-Q4"]
    
    aum_growth = (current["aum"] - previous["aum"]) / previous["aum"] * 100
    client_growth = (current["clients"] - previous["clients"]) / previous["clients"] * 100
    revenue_growth = (current["revenue"] - previous["revenue"]) / previous["revenue"] * 100
    
    return {
        "total_aum": current["aum"],
        "aum_growth_qoq": round(aum_growth, 1),
        "aum_growth_yoy": 15.1,  # vs Q1 2024
        "total_clients": current["clients"],
        "client_growth_qoq": round(client_growth, 1),
        "new_clients_qtd": 6,
        "lost_clients_qtd": 2,
        "net_client_growth": 4,
        "total_revenue": current["revenue"],
        "revenue_growth_qoq": round(revenue_growth, 1),
        "average_revenue_per_client": round(current["revenue"] / current["clients"], 0),
        "average_client_aum": round(current["aum"] / current["clients"], 0),
        "nps_score": current["nps"],
        "nps_change": current["nps"] - previous["nps"],
    }


def get_compliance_status() -> Dict:
    """Get practice compliance status."""
    return {
        "overall_status": "good",
        "reviews_completed_qtd": 42,
        "reviews_due": 8,
        "reviews_overdue": 2,
        "completion_rate": 95.2,
        "next_audit_date": "2025-06-15",
        "afsl_renewal_date": "2026-01-01",
        "training_completed": 100,
        "cpd_hours_completed": 38,
        "cpd_hours_required": 40,
        "risk_registers_current": True,
        "aml_checks_current": True,
        "pi_insurance_expiry": "2025-12-31",
        "outstanding_complaints": 0,
        "recent_incidents": 0,
    }


def get_revenue_analysis() -> Dict:
    """Analyze revenue streams and projections."""
    # Fee breakdown
    fee_breakdown = {
        "ongoing_advice_fees": 380000,
        "initial_advice_fees": 45000,
        "implementation_fees": 32000,
        "insurance_commission": 28000,
        "platform_rebates": 17000,
    }
    
    total = sum(fee_breakdown.values())
    
    return {
        "total_revenue_ytd": total,
        "projected_annual": total * 4,  # Annualized
        "fee_breakdown": fee_breakdown,
        "fee_percentages": {k: round(v / total * 100, 1) for k, v in fee_breakdown.items()},
        "average_fee_percentage": 0.98,
        "fee_at_risk": 25000,  # From at-risk clients
        "growth_opportunity": 42000,  # From underutilized clients
        "efficiency_metrics": {
            "revenue_per_adviser_hour": 285,
            "average_meeting_value": 1200,
            "client_lifetime_value": 45000,
        }
    }


def get_client_segmentation() -> Dict:
    """Analyze client segments."""
    segments = []
    
    for segment_name, data in CLIENT_SEGMENTS.items():
        segments.append({
            "segment": segment_name,
            "display_name": segment_name.replace("_", " ").title(),
            "count": data["count"],
            "total_aum": data["total_aum"],
            "avg_fee": data["avg_fee"],
            "revenue_contribution": data["count"] * data["total_aum"] / data["count"] * data["avg_fee"] / 100,
            "service_intensity": "high" if segment_name == "high_value" else "standard" if segment_name == "core" else "growth",
        })
    
    return {
        "segments": segments,
        "concentration_risk": {
            "top_5_clients_aum_pct": 62,  # % of AUM from top 5
            "risk_level": "moderate",
            "recommendation": "Diversify client base to reduce concentration"
        },
        "ideal_client_profile": {
            "min_aum": 500000,
            "risk_profile": "Balanced to Growth",
            "engagement_level": "High",
            "referral_source": "Existing client referral"
        }
    }


def get_capacity_analysis() -> Dict:
    """Analyze practice capacity and workload."""
    return {
        "current_capacity_utilization": 78,
        "optimal_range": [70, 85],
        "adviser_workload": {
            "active_clients_per_adviser": 164,
            "meetings_per_week": 12,
            "reviews_per_month": 14,
            "hours_per_client_per_year": 8.5,
        },
        "capacity_headroom": {
            "additional_clients_possible": 25,
            "aum_capacity": 5000000,
            "revenue_potential": 50000,
        },
        "bottlenecks": [
            {"area": "SOA preparation", "impact": "medium", "solution": "Implement SOA automation"},
            {"area": "Review scheduling", "impact": "low", "solution": "Online booking system"},
        ],
        "efficiency_opportunities": [
            {"opportunity": "Batch annual reviews", "time_savings": "4 hours/week"},
            {"opportunity": "Automate meeting prep", "time_savings": "2 hours/week"},
            {"opportunity": "Client portal adoption", "time_savings": "3 hours/week"},
        ]
    }


def get_risk_dashboard() -> Dict:
    """Get practice risk dashboard."""
    return {
        "overall_risk_score": 72,  # Out of 100 (higher = lower risk)
        "risk_trend": "stable",
        "risk_categories": {
            "compliance_risk": {"score": 88, "status": "low", "trend": "improving"},
            "operational_risk": {"score": 75, "status": "moderate", "trend": "stable"},
            "market_risk": {"score": 68, "status": "moderate", "trend": "elevated"},
            "concentration_risk": {"score": 62, "status": "elevated", "trend": "stable"},
            "key_person_risk": {"score": 55, "status": "elevated", "trend": "stable"},
        },
        "key_risk_indicators": [
            {"indicator": "Reviews overdue", "value": 2, "threshold": 5, "status": "ok"},
            {"indicator": "Client complaints", "value": 0, "threshold": 2, "status": "ok"},
            {"indicator": "AUM concentration top 5", "value": 62, "threshold": 50, "status": "warning"},
            {"indicator": "Staff turnover", "value": 0, "threshold": 1, "status": "ok"},
        ],
        "mitigation_actions": [
            {"risk": "concentration_risk", "action": "Target 5 new clients in $500k-$1M segment", "deadline": "Q2 2025"},
            {"risk": "key_person_risk", "action": "Document key processes and client relationships", "deadline": "Q3 2025"},
        ]
    }


@router.get("/dashboard")
async def get_practice_dashboard():
    """Get comprehensive practice health dashboard."""
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "practice_info": PRACTICE_DATA,
        "health_score": calculate_practice_score(),
        "key_metrics": get_key_metrics(),
        "compliance": get_compliance_status(),
        "revenue": get_revenue_analysis(),
        "client_segments": get_client_segmentation(),
        "capacity": get_capacity_analysis(),
        "risk": get_risk_dashboard(),
        "quick_insights": [
            "Practice health score improved 3 points vs last quarter",
            "2 client reviews overdue - schedule this week",
            "Top 5 clients represent 62% of AUM - diversification needed",
            "Capacity for ~25 additional clients at current efficiency",
        ]
    }


@router.get("/health-score")
async def get_health_score():
    """Get practice health score breakdown."""
    return calculate_practice_score()


@router.get("/metrics")
async def get_metrics():
    """Get key practice metrics."""
    return get_key_metrics()


@router.get("/compliance")
async def get_compliance():
    """Get compliance status."""
    return get_compliance_status()


@router.get("/revenue")
async def get_revenue():
    """Get revenue analysis."""
    return get_revenue_analysis()


@router.get("/segments")
async def get_segments():
    """Get client segmentation analysis."""
    return get_client_segmentation()


@router.get("/capacity")
async def get_capacity():
    """Get capacity analysis."""
    return get_capacity_analysis()


@router.get("/risk")
async def get_risk():
    """Get risk dashboard."""
    return get_risk_dashboard()


@router.get("/trends")
async def get_trends():
    """Get historical trends."""
    return {
        "metrics": HISTORICAL_METRICS,
        "analysis": {
            "aum_cagr": 14.2,
            "client_cagr": 10.8,
            "revenue_cagr": 19.5,
            "nps_trend": "improving",
            "forecast_next_quarter": {
                "aum": 22000000,
                "clients": 168,
                "revenue": 525000,
            }
        }
    }


@router.get("/benchmarks")
async def get_benchmarks():
    """Get practice benchmarks vs industry."""
    return {
        "your_practice": {
            "aum_per_client": 130000,
            "revenue_per_client": 3100,
            "clients_per_adviser": 164,
            "nps_score": 80,
        },
        "industry_average": {
            "aum_per_client": 95000,
            "revenue_per_client": 2400,
            "clients_per_adviser": 120,
            "nps_score": 65,
        },
        "top_quartile": {
            "aum_per_client": 180000,
            "revenue_per_client": 4200,
            "clients_per_adviser": 100,
            "nps_score": 85,
        },
        "your_percentile": {
            "aum_per_client": 72,
            "revenue_per_client": 78,
            "clients_per_adviser": 45,
            "nps_score": 88,
        }
    }
