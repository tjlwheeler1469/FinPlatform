"""
Financial Product Marketplace Service
Insurance, investments, and loan product recommendations with providers.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime


# Insurance providers and products
INSURANCE_PRODUCTS = [
    {
        "id": "life-001",
        "provider": "TAL",
        "product_name": "TAL Life Insurance",
        "category": "life",
        "coverage_amount": 2000000,
        "premium_monthly": 145,
        "premium_annual": 1680,
        "features": ["Terminal illness benefit", "Grief counselling", "Premium waiver on TPD"],
        "rating": 4.5,
        "logo_url": "/logos/tal.png"
    },
    {
        "id": "life-002",
        "provider": "AIA",
        "product_name": "AIA Priority Protection",
        "category": "life",
        "coverage_amount": 2000000,
        "premium_monthly": 152,
        "premium_annual": 1760,
        "features": ["Premium guarantee", "Financial planning benefit", "Crisis support"],
        "rating": 4.7,
        "logo_url": "/logos/aia.png"
    },
    {
        "id": "income-001",
        "provider": "TAL",
        "product_name": "TAL Income Protection",
        "category": "income_protection",
        "coverage_amount": 180000,  # Annual benefit
        "benefit_period": "Age 65",
        "waiting_period": "30 days",
        "premium_monthly": 185,
        "premium_annual": 2145,
        "features": ["75% of income", "Tax deductible", "Rehabilitation support"],
        "rating": 4.4,
        "logo_url": "/logos/tal.png"
    },
    {
        "id": "income-002",
        "provider": "Zurich",
        "product_name": "Zurich Income Replacement",
        "category": "income_protection",
        "coverage_amount": 180000,
        "benefit_period": "5 years",
        "waiting_period": "30 days",
        "premium_monthly": 165,
        "premium_annual": 1915,
        "features": ["75% of income", "Return to work support", "Accident benefit"],
        "rating": 4.3,
        "logo_url": "/logos/zurich.png"
    },
    {
        "id": "tpd-001",
        "provider": "MLC",
        "product_name": "MLC TPD Insurance",
        "category": "tpd",
        "coverage_amount": 1000000,
        "premium_monthly": 95,
        "premium_annual": 1100,
        "features": ["Any occupation", "Lump sum payment", "Rehabilitation program"],
        "rating": 4.2,
        "logo_url": "/logos/mlc.png"
    },
]

# Investment products
INVESTMENT_PRODUCTS = [
    {
        "id": "super-001",
        "provider": "Australian Super",
        "product_name": "Australian Super - High Growth",
        "category": "super",
        "asset_allocation": {"growth": 91, "defensive": 9},
        "return_5yr": 8.2,
        "return_10yr": 9.1,
        "fees_percent": 0.70,
        "features": ["Low fees", "Strong performance", "Insurance options"],
        "rating": 4.8,
        "minimum": 0
    },
    {
        "id": "super-002",
        "provider": "Hostplus",
        "product_name": "Hostplus Indexed Balanced",
        "category": "super",
        "asset_allocation": {"growth": 76, "defensive": 24},
        "return_5yr": 7.8,
        "return_10yr": 8.5,
        "fees_percent": 0.08,
        "features": ["Ultra-low fees", "Index tracking", "Diversified"],
        "rating": 4.6,
        "minimum": 0
    },
    {
        "id": "etf-001",
        "provider": "Vanguard",
        "product_name": "VAS - Australian Shares ETF",
        "category": "etf",
        "asset_class": "Australian Equities",
        "return_5yr": 7.5,
        "return_10yr": 8.2,
        "fees_percent": 0.07,
        "features": ["Low cost", "Diversified", "Dividend income"],
        "rating": 4.9,
        "minimum": 500
    },
    {
        "id": "etf-002",
        "provider": "Vanguard",
        "product_name": "VGS - International Shares ETF",
        "category": "etf",
        "asset_class": "International Equities",
        "return_5yr": 10.2,
        "return_10yr": 11.5,
        "fees_percent": 0.18,
        "features": ["Global exposure", "Developed markets", "Currency hedging available"],
        "rating": 4.8,
        "minimum": 500
    },
    {
        "id": "managed-001",
        "provider": "Magellan",
        "product_name": "Magellan Global Fund",
        "category": "managed_fund",
        "asset_class": "Global Equities",
        "return_5yr": 9.8,
        "return_10yr": 12.1,
        "fees_percent": 1.35,
        "features": ["Active management", "Quality focus", "Risk management"],
        "rating": 4.4,
        "minimum": 10000
    },
]

# Loan products
LOAN_PRODUCTS = [
    {
        "id": "home-001",
        "provider": "CBA",
        "product_name": "CBA Standard Variable",
        "category": "home_loan",
        "interest_rate": 6.19,
        "comparison_rate": 6.21,
        "features": ["Offset account", "Redraw", "Split loan available"],
        "max_lvr": 80,
        "rating": 4.3
    },
    {
        "id": "home-002",
        "provider": "Athena",
        "product_name": "Athena Variable",
        "category": "home_loan",
        "interest_rate": 5.89,
        "comparison_rate": 5.89,
        "features": ["No fees", "Rate drops automatically", "Online only"],
        "max_lvr": 80,
        "rating": 4.6
    },
    {
        "id": "invest-001",
        "provider": "Macquarie",
        "product_name": "Macquarie Investment Loan",
        "category": "investment_loan",
        "interest_rate": 6.49,
        "comparison_rate": 6.52,
        "features": ["Interest only available", "Tax deductible", "Offset account"],
        "max_lvr": 80,
        "rating": 4.4
    },
]


def get_product_recommendations(
    annual_income: float,
    net_worth: float,
    age: int,
    existing_insurance: Dict = None,
    risk_tolerance: str = "moderate",
    goals: List[str] = None
) -> Dict[str, Any]:
    """
    Generate personalized product recommendations based on client profile.
    """
    
    recommendations = {
        "insurance": [],
        "investments": [],
        "loans": [],
        "summary": {
            "insurance_gaps_identified": 0,
            "investment_opportunities": 0,
            "potential_savings": 0
        }
    }
    
    # Insurance recommendations
    # Life insurance recommendation
    life_coverage_needed = annual_income * 10  # 10x income rule
    recommendations["insurance"].append({
        "category": "Life Insurance",
        "gap_identified": True,
        "recommended_coverage": life_coverage_needed,
        "reason": f"10x annual income provides family protection",
        "products": [p for p in INSURANCE_PRODUCTS if p["category"] == "life"][:2]
    })
    recommendations["summary"]["insurance_gaps_identified"] += 1
    
    # Income protection
    if annual_income > 80000:
        recommendations["insurance"].append({
            "category": "Income Protection",
            "gap_identified": True,
            "recommended_coverage": annual_income * 0.75,
            "reason": "Protect 75% of income if unable to work",
            "products": [p for p in INSURANCE_PRODUCTS if p["category"] == "income_protection"][:2]
        })
        recommendations["summary"]["insurance_gaps_identified"] += 1
    
    # TPD
    if net_worth < 1000000:
        recommendations["insurance"].append({
            "category": "TPD Insurance",
            "gap_identified": True,
            "recommended_coverage": 1000000,
            "reason": "Provides lump sum if permanently disabled",
            "products": [p for p in INSURANCE_PRODUCTS if p["category"] == "tpd"][:2]
        })
        recommendations["summary"]["insurance_gaps_identified"] += 1
    
    # Investment recommendations
    # Super consolidation/optimization
    recommendations["investments"].append({
        "category": "Superannuation",
        "opportunity": "Super optimization",
        "reason": "Ensure your super is in a high-performing, low-fee fund",
        "products": [p for p in INVESTMENT_PRODUCTS if p["category"] == "super"][:2],
        "potential_benefit": "Could save $2,000+/year in fees"
    })
    recommendations["summary"]["investment_opportunities"] += 1
    
    # ETF portfolio
    if net_worth > 100000:
        recommendations["investments"].append({
            "category": "ETF Portfolio",
            "opportunity": "Low-cost diversification",
            "reason": "Build a diversified portfolio with low-cost ETFs",
            "products": [p for p in INVESTMENT_PRODUCTS if p["category"] == "etf"][:2],
            "potential_benefit": "Lower fees than managed funds"
        })
        recommendations["summary"]["investment_opportunities"] += 1
    
    # Loan recommendations
    # Refinancing opportunity
    recommendations["loans"].append({
        "category": "Home Loan Refinance",
        "opportunity": "Potential rate savings",
        "reason": "Current rates may be lower than your existing loan",
        "products": [p for p in LOAN_PRODUCTS if p["category"] == "home_loan"][:2],
        "potential_benefit": "Could save $5,000+/year"
    })
    recommendations["summary"]["potential_savings"] = 7000  # Estimated annual savings
    
    return recommendations


def search_products(
    category: str = None,
    min_rating: float = 0,
    max_fees: float = 100,
    provider: str = None
) -> Dict[str, Any]:
    """
    Search and filter available products.
    """
    
    all_products = INSURANCE_PRODUCTS + INVESTMENT_PRODUCTS + LOAN_PRODUCTS
    filtered = []
    
    for product in all_products:
        if category and product.get("category") != category:
            continue
        if product.get("rating", 0) < min_rating:
            continue
        if product.get("fees_percent", 0) > max_fees:
            continue
        if provider and product.get("provider", "").lower() != provider.lower():
            continue
        filtered.append(product)
    
    return {
        "total_results": len(filtered),
        "products": filtered,
        "categories": list(set(p["category"] for p in all_products)),
        "providers": list(set(p["provider"] for p in all_products))
    }


def get_product_comparison(product_ids: List[str]) -> Dict[str, Any]:
    """
    Compare multiple products side by side.
    """
    
    all_products = INSURANCE_PRODUCTS + INVESTMENT_PRODUCTS + LOAN_PRODUCTS
    products = [p for p in all_products if p["id"] in product_ids]
    
    if not products:
        return {"error": "No products found"}
    
    # Get common attributes for comparison
    comparison_attributes = {}
    for product in products:
        for key, value in product.items():
            if key not in comparison_attributes:
                comparison_attributes[key] = []
            comparison_attributes[key].append({"product_id": product["id"], "value": value})
    
    return {
        "products": products,
        "comparison": comparison_attributes,
        "recommendation": products[0] if products else None  # Best match based on rating
    }
