"""
Product Marketplace Routes
Financial product distribution - Insurance, Mortgages, Investments with referral tracking.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/marketplace", tags=["Product Marketplace"])

# In-memory storage
PRODUCT_REFERRALS: Dict[str, Dict] = {}
PRODUCT_INQUIRIES: Dict[str, Dict] = {}


class ProductInquiry(BaseModel):
    client_id: str
    client_name: str
    product_type: str
    provider_id: str
    notes: Optional[str] = None


class ReferralCreate(BaseModel):
    client_id: str
    client_name: str
    product_type: str
    provider_id: str
    provider_name: str
    estimated_value: float = 0
    commission_rate: float = 0


# Product catalog
INSURANCE_PROVIDERS = [
    {
        "id": "allianz", 
        "name": "Allianz Australia",
        "products": ["life", "income_protection", "tpd", "trauma"],
        "commission_rate": 0.30,
        "features": ["Premium waiver on disability", "CPI indexation", "Guaranteed renewable"],
        "rating": 4.5
    },
    {
        "id": "aia",
        "name": "AIA Australia", 
        "products": ["life", "income_protection", "tpd", "trauma"],
        "commission_rate": 0.28,
        "features": ["Priority protection", "Health boosts", "Family support benefit"],
        "rating": 4.6
    },
    {
        "id": "zurich",
        "name": "Zurich Australia",
        "products": ["life", "income_protection", "tpd"],
        "commission_rate": 0.25,
        "features": ["Mental health cover", "Rehabilitation support", "Worldwide cover"],
        "rating": 4.4
    },
    {
        "id": "tal",
        "name": "TAL Life",
        "products": ["life", "income_protection", "tpd", "trauma"],
        "commission_rate": 0.27,
        "features": ["Accelerated claims", "Health improvements rewards", "Best doctors service"],
        "rating": 4.7
    },
    {
        "id": "mlc",
        "name": "MLC Life Insurance",
        "products": ["life", "income_protection", "tpd"],
        "commission_rate": 0.26,
        "features": ["Active plus benefits", "Recovery support", "Mental health support"],
        "rating": 4.3
    }
]

MORTGAGE_PROVIDERS = [
    {
        "id": "cba_mortgage",
        "name": "Commonwealth Bank",
        "rate": 6.49,
        "comparison_rate": 6.52,
        "features": ["Offset account", "Redraw facility", "Split loan option"],
        "referral_fee": 0.004,
        "max_lvr": 95
    },
    {
        "id": "westpac_mortgage",
        "name": "Westpac",
        "rate": 6.44,
        "comparison_rate": 6.48,
        "features": ["Rate lock", "Construction loans", "Package discounts"],
        "referral_fee": 0.0045,
        "max_lvr": 90
    },
    {
        "id": "anz_mortgage",
        "name": "ANZ",
        "rate": 6.39,
        "comparison_rate": 6.42,
        "features": ["Breakfree package", "Offset saver", "Equity manager"],
        "referral_fee": 0.004,
        "max_lvr": 95
    },
    {
        "id": "macquarie_mortgage",
        "name": "Macquarie Bank",
        "rate": 6.24,
        "comparison_rate": 6.27,
        "features": ["Offset account", "Professional packages", "Investor specials"],
        "referral_fee": 0.005,
        "max_lvr": 90
    },
    {
        "id": "ing_mortgage",
        "name": "ING",
        "rate": 6.19,
        "comparison_rate": 6.21,
        "features": ["Orange advantage", "No monthly fees", "Unlimited redraws"],
        "referral_fee": 0.0035,
        "max_lvr": 85
    }
]

INVESTMENT_PRODUCTS = [
    {
        "id": "vanguard_growth",
        "name": "Vanguard Growth Index Fund",
        "type": "managed_fund",
        "asset_class": "multi-asset",
        "fee": 0.29,
        "min_investment": 5000,
        "risk_level": "growth",
        "referral_fee": 0.001
    },
    {
        "id": "magellan_global",
        "name": "Magellan Global Fund",
        "type": "managed_fund",
        "asset_class": "international_equities",
        "fee": 1.35,
        "min_investment": 10000,
        "risk_level": "high_growth",
        "referral_fee": 0.002
    },
    {
        "id": "betashares_aus",
        "name": "BetaShares Australia 200 ETF",
        "type": "etf",
        "asset_class": "australian_equities",
        "fee": 0.07,
        "min_investment": 500,
        "risk_level": "growth",
        "referral_fee": 0.0005
    },
    {
        "id": "hyperion_small",
        "name": "Hyperion Small Companies Fund",
        "type": "managed_fund",
        "asset_class": "small_caps",
        "fee": 0.95,
        "min_investment": 20000,
        "risk_level": "high_growth",
        "referral_fee": 0.0015
    }
]


@router.get("/products/insurance")
async def get_insurance_providers(product_type: Optional[str] = None):
    """Get available insurance providers."""
    providers = INSURANCE_PROVIDERS
    
    if product_type:
        providers = [p for p in providers if product_type in p.get("products", [])]
    
    return {
        "providers": providers,
        "product_types": ["life", "income_protection", "tpd", "trauma"],
        "total": len(providers)
    }


@router.get("/products/mortgages")
async def get_mortgage_providers(max_lvr: Optional[int] = None):
    """Get available mortgage providers."""
    providers = MORTGAGE_PROVIDERS
    
    if max_lvr:
        providers = [p for p in providers if p.get("max_lvr", 0) >= max_lvr]
    
    # Sort by rate
    providers = sorted(providers, key=lambda x: x.get("rate", 99))
    
    return {
        "providers": providers,
        "lowest_rate": providers[0]["rate"] if providers else None,
        "total": len(providers)
    }


@router.get("/products/investments")
async def get_investment_products(
    asset_class: Optional[str] = None,
    risk_level: Optional[str] = None
):
    """Get available investment products."""
    products = INVESTMENT_PRODUCTS
    
    if asset_class:
        products = [p for p in products if p.get("asset_class") == asset_class]
    if risk_level:
        products = [p for p in products if p.get("risk_level") == risk_level]
    
    return {
        "products": products,
        "asset_classes": list(set(p["asset_class"] for p in INVESTMENT_PRODUCTS)),
        "total": len(products)
    }


@router.post("/inquiry")
async def create_product_inquiry(request: ProductInquiry):
    """Create a product inquiry for a client."""
    inquiry_id = f"inq_{uuid.uuid4().hex[:8]}"
    
    inquiry = {
        "id": inquiry_id,
        "client_id": request.client_id,
        "client_name": request.client_name,
        "product_type": request.product_type,
        "provider_id": request.provider_id,
        "notes": request.notes,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    PRODUCT_INQUIRIES[inquiry_id] = inquiry
    
    return {
        "success": True,
        "inquiry": inquiry
    }


@router.post("/referral")
async def create_referral(request: ReferralCreate):
    """Create a product referral with commission tracking."""
    referral_id = f"ref_{uuid.uuid4().hex[:8]}"
    
    commission = request.estimated_value * request.commission_rate
    
    referral = {
        "id": referral_id,
        "client_id": request.client_id,
        "client_name": request.client_name,
        "product_type": request.product_type,
        "provider_id": request.provider_id,
        "provider_name": request.provider_name,
        "estimated_value": request.estimated_value,
        "commission_rate": request.commission_rate,
        "estimated_commission": commission,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    PRODUCT_REFERRALS[referral_id] = referral
    
    return {
        "success": True,
        "referral": referral,
        "estimated_commission": commission
    }


@router.get("/referrals")
async def get_referrals(
    status: Optional[str] = None,
    product_type: Optional[str] = None
):
    """Get all referrals with optional filtering."""
    referrals = list(PRODUCT_REFERRALS.values())
    
    if status:
        referrals = [r for r in referrals if r.get("status") == status]
    if product_type:
        referrals = [r for r in referrals if r.get("product_type") == product_type]
    
    total_pending_commission = sum(
        r.get("estimated_commission", 0) 
        for r in referrals 
        if r.get("status") == "pending"
    )
    
    total_paid_commission = sum(
        r.get("estimated_commission", 0) 
        for r in referrals 
        if r.get("status") == "paid"
    )
    
    return {
        "referrals": referrals,
        "total": len(referrals),
        "commission_summary": {
            "pending": total_pending_commission,
            "paid": total_paid_commission,
            "total": total_pending_commission + total_paid_commission
        }
    }


@router.put("/referrals/{referral_id}/status")
async def update_referral_status(referral_id: str, status: str):
    """Update referral status (pending, approved, paid, cancelled)."""
    if referral_id not in PRODUCT_REFERRALS:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    PRODUCT_REFERRALS[referral_id]["status"] = status
    PRODUCT_REFERRALS[referral_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return PRODUCT_REFERRALS[referral_id]


@router.get("/ai-recommendations/{client_id}")
async def get_ai_product_recommendations(client_id: str):
    """Get AI-powered product recommendations for a client."""
    # In production, this would analyze the client's actual data
    recommendations = [
        {
            "product_type": "insurance",
            "reason": "Income protection coverage below recommended level",
            "recommendation": "Increase income protection to 75% of salary",
            "suggested_providers": ["aia", "tal"],
            "estimated_premium": 1800,
            "priority": "high",
            "impact": "Protects $150,000+ annual income"
        },
        {
            "product_type": "insurance",
            "reason": "No trauma cover detected",
            "recommendation": "Add $200,000 trauma cover",
            "suggested_providers": ["allianz", "aia"],
            "estimated_premium": 950,
            "priority": "medium",
            "impact": "Lump sum for critical illness events"
        },
        {
            "product_type": "mortgage",
            "reason": "Current rate above market average",
            "recommendation": "Refinance to lower rate",
            "suggested_providers": ["ing_mortgage", "macquarie_mortgage"],
            "potential_savings": 3600,
            "priority": "medium",
            "impact": "Save $3,600/year in interest"
        },
        {
            "product_type": "investment",
            "reason": "Portfolio underweight in international equities",
            "recommendation": "Add international exposure",
            "suggested_products": ["vanguard_growth", "magellan_global"],
            "suggested_amount": 50000,
            "priority": "low",
            "impact": "Improved diversification"
        }
    ]
    
    return {
        "client_id": client_id,
        "recommendations": recommendations,
        "total_potential_value": sum(r.get("potential_savings", 0) for r in recommendations),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/revenue-dashboard")
async def get_revenue_dashboard():
    """Get product distribution revenue dashboard for the practice."""
    referrals = list(PRODUCT_REFERRALS.values())
    
    # Group by product type
    by_type = {}
    for r in referrals:
        ptype = r.get("product_type", "other")
        if ptype not in by_type:
            by_type[ptype] = {"count": 0, "value": 0, "commission": 0}
        by_type[ptype]["count"] += 1
        by_type[ptype]["value"] += r.get("estimated_value", 0)
        by_type[ptype]["commission"] += r.get("estimated_commission", 0)
    
    # Monthly trend (mock data)
    monthly_trend = [
        {"month": "Jul", "referrals": 8, "commission": 4500},
        {"month": "Aug", "referrals": 12, "commission": 6200},
        {"month": "Sep", "referrals": 10, "commission": 5100},
        {"month": "Oct", "referrals": 15, "commission": 8400},
        {"month": "Nov", "referrals": 11, "commission": 5800},
        {"month": "Dec", "referrals": 14, "commission": 7200}
    ]
    
    return {
        "summary": {
            "total_referrals": len(referrals),
            "total_value": sum(r.get("estimated_value", 0) for r in referrals),
            "total_commission": sum(r.get("estimated_commission", 0) for r in referrals),
            "ytd_commission": 37200,
            "projected_annual": 44640
        },
        "by_product_type": by_type,
        "monthly_trend": monthly_trend,
        "top_providers": [
            {"name": "AIA Australia", "referrals": 12, "commission": 8500},
            {"name": "Macquarie Bank", "referrals": 8, "commission": 12000},
            {"name": "Vanguard", "referrals": 15, "commission": 3200}
        ],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
