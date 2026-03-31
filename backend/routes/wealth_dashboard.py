"""
Wealth Dashboard Routes
Comprehensive wealth tracking across all asset classes:
Cash, Stocks, ETFs, Managed Accounts, Funds, Property, Crypto, Super
"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import secrets
_rng = secrets.SystemRandom()
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/wealth", tags=["Wealth Dashboard"])


class WealthOverviewRequest(BaseModel):
    client_id: str = "default"
    include_projections: bool = True


@router.get("/overview/{client_id}")
async def get_wealth_overview(client_id: str):
    """
    Get comprehensive wealth overview across all asset classes.
    
    Includes:
    - Cash & Bank Accounts
    - Direct Shares (ASX/International)
    - ETFs
    - Managed Funds
    - Property (Investment & PPOR)
    - Superannuation
    - Cryptocurrency
    - Other Assets
    """
    
    # Comprehensive wealth data
    wealth_data = {
        "client_id": client_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "currency": "AUD",
        
        "summary": {
            "total_assets": 2850000,
            "total_liabilities": 650000,
            "net_worth": 2200000,
            "net_worth_change_mtd": 45000,
            "net_worth_change_ytd": 185000,
            "net_worth_change_percent_ytd": 9.2
        },
        
        "asset_allocation": {
            "cash": {"value": 125000, "percent": 4.4, "target": 5.0},
            "shares": {"value": 450000, "percent": 15.8, "target": 20.0},
            "etfs": {"value": 280000, "percent": 9.8, "target": 10.0},
            "managed_funds": {"value": 320000, "percent": 11.2, "target": 10.0},
            "property": {"value": 1200000, "percent": 42.1, "target": 35.0},
            "super": {"value": 420000, "percent": 14.7, "target": 15.0},
            "crypto": {"value": 35000, "percent": 1.2, "target": 2.0},
            "other": {"value": 20000, "percent": 0.7, "target": 3.0}
        },
        
        "cash": {
            "total": 125000,
            "accounts": [
                {"name": "CBA Smart Access", "balance": 15000, "type": "transaction", "interest_rate": 0.01},
                {"name": "CBA Goal Saver", "balance": 50000, "type": "savings", "interest_rate": 4.75},
                {"name": "Westpac Term Deposit", "balance": 40000, "type": "term_deposit", "maturity": "2025-06-15", "interest_rate": 5.10},
                {"name": "ING Savings Maximiser", "balance": 20000, "type": "savings", "interest_rate": 5.50}
            ],
            "total_interest_earned_ytd": 3250
        },
        
        "shares": {
            "total_value": 450000,
            "total_cost_base": 380000,
            "unrealized_gain": 70000,
            "unrealized_gain_percent": 18.4,
            "dividend_income_ytd": 12500,
            "holdings": [
                {"ticker": "BHP", "name": "BHP Group", "units": 1200, "avg_cost": 38.50, "current_price": 45.20, "value": 54240, "gain_percent": 17.4, "dividend_yield": 5.2},
                {"ticker": "CBA", "name": "Commonwealth Bank", "units": 400, "avg_cost": 95.00, "current_price": 108.50, "value": 43400, "gain_percent": 14.2, "dividend_yield": 3.8},
                {"ticker": "CSL", "name": "CSL Limited", "units": 150, "avg_cost": 250.00, "current_price": 285.00, "value": 42750, "gain_percent": 14.0, "dividend_yield": 1.2},
                {"ticker": "WES", "name": "Wesfarmers", "units": 500, "avg_cost": 52.00, "current_price": 62.50, "value": 31250, "gain_percent": 20.2, "dividend_yield": 2.8},
                {"ticker": "RIO", "name": "Rio Tinto", "units": 200, "avg_cost": 100.00, "current_price": 115.50, "value": 23100, "gain_percent": 15.5, "dividend_yield": 6.8},
                {"ticker": "NAB", "name": "National Australia Bank", "units": 600, "avg_cost": 28.00, "current_price": 32.80, "value": 19680, "gain_percent": 17.1, "dividend_yield": 4.5}
            ],
            "sector_breakdown": {
                "Financials": 35,
                "Materials": 30,
                "Healthcare": 15,
                "Consumer Discretionary": 12,
                "Other": 8
            }
        },
        
        "etfs": {
            "total_value": 280000,
            "total_cost_base": 245000,
            "unrealized_gain": 35000,
            "holdings": [
                {"ticker": "VAS", "name": "Vanguard Australian Shares", "units": 2500, "current_price": 92.50, "value": 231250, "expense_ratio": 0.10},
                {"ticker": "VGS", "name": "Vanguard International Shares", "units": 300, "current_price": 95.80, "value": 28740, "expense_ratio": 0.18},
                {"ticker": "VDHG", "name": "Vanguard Diversified High Growth", "units": 200, "current_price": 62.50, "value": 12500, "expense_ratio": 0.27},
                {"ticker": "NDQ", "name": "BetaShares NASDAQ 100", "units": 100, "current_price": 38.50, "value": 3850, "expense_ratio": 0.48}
            ]
        },
        
        "managed_funds": {
            "total_value": 320000,
            "holdings": [
                {"name": "Magellan Global Fund", "value": 150000, "units": 52000, "unit_price": 2.88, "return_1y": 12.5, "management_fee": 1.35},
                {"name": "Platinum International Fund", "value": 85000, "units": 15000, "unit_price": 5.67, "return_1y": 8.2, "management_fee": 1.45},
                {"name": "Hyperion Global Growth", "value": 85000, "units": 22000, "unit_price": 3.86, "return_1y": 18.5, "management_fee": 0.95}
            ]
        },
        
        "property": {
            "total_value": 1200000,
            "total_debt": 580000,
            "equity": 620000,
            "properties": [
                {
                    "address": "123 Main St, Sydney NSW",
                    "type": "ppor",
                    "value": 1200000,
                    "purchase_price": 850000,
                    "purchase_date": "2018-03-15",
                    "mortgage_balance": 450000,
                    "mortgage_rate": 6.25,
                    "rental_income": None,
                    "equity": 750000
                },
                {
                    "address": "456 Beach Rd, Gold Coast QLD",
                    "type": "investment",
                    "value": 650000,
                    "purchase_price": 520000,
                    "purchase_date": "2020-08-22",
                    "mortgage_balance": 380000,
                    "mortgage_rate": 6.45,
                    "rental_income": 650,
                    "rental_yield": 5.2,
                    "equity": 270000
                }
            ],
            "total_rental_income_pa": 33800
        },
        
        "super": {
            "total_balance": 420000,
            "funds": [
                {
                    "fund_name": "Australian Super",
                    "balance": 320000,
                    "investment_option": "Balanced",
                    "return_1y": 9.5,
                    "return_5y": 7.8,
                    "insurance": {
                        "death": 500000,
                        "tpd": 500000,
                        "income_protection": True
                    },
                    "fees_pa": 1250
                },
                {
                    "fund_name": "REST Super",
                    "balance": 100000,
                    "investment_option": "Growth",
                    "return_1y": 11.2,
                    "return_5y": 8.5,
                    "insurance": None,
                    "fees_pa": 420
                }
            ],
            "contributions_ytd": {
                "concessional": 18500,
                "non_concessional": 0,
                "employer": 15000,
                "personal": 3500
            },
            "caps": {
                "concessional_remaining": 9000,
                "non_concessional_remaining": 120000
            }
        },
        
        "crypto": {
            "total_value": 35000,
            "total_cost_base": 28000,
            "unrealized_gain": 7000,
            "holdings": [
                {"symbol": "BTC", "name": "Bitcoin", "units": 0.35, "current_price": 68500, "value": 23975, "cost_base": 18000},
                {"symbol": "ETH", "name": "Ethereum", "units": 2.5, "current_price": 3850, "value": 9625, "cost_base": 8500},
                {"symbol": "SOL", "name": "Solana", "units": 8, "current_price": 175, "value": 1400, "cost_base": 1500}
            ],
            "exchange": "Swyftx",
            "last_sync": datetime.now(timezone.utc).isoformat()
        },
        
        "other_assets": {
            "total_value": 20000,
            "items": [
                {"name": "Classic Car (1972 Porsche 911)", "value": 15000, "type": "collectible"},
                {"name": "Art Collection", "value": 5000, "type": "collectible"}
            ]
        },
        
        "liabilities": {
            "total": 650000,
            "breakdown": [
                {"type": "mortgage_ppor", "balance": 450000, "interest_rate": 6.25, "repayment_monthly": 3200},
                {"type": "mortgage_investment", "balance": 380000, "interest_rate": 6.45, "repayment_monthly": 2850},
                {"type": "credit_card", "balance": 5000, "interest_rate": 19.99, "available": 15000},
                {"type": "car_loan", "balance": 15000, "interest_rate": 7.99, "repayment_monthly": 450}
            ]
        },
        
        "performance": {
            "returns": {
                "1_month": 1.8,
                "3_month": 4.2,
                "6_month": 7.5,
                "1_year": 12.8,
                "3_year_pa": 8.5,
                "5_year_pa": 7.2,
                "since_inception": 145000
            },
            "benchmark_comparison": {
                "portfolio_return_1y": 12.8,
                "benchmark_return_1y": 10.5,
                "alpha": 2.3
            }
        }
    }
    
    return wealth_data


@router.get("/performance/{client_id}")
async def get_performance_analysis(client_id: str, period: str = "1y"):
    """Get detailed performance analysis."""
    
    # Generate performance data points
    data_points = []
    now = datetime.now()
    
    periods = {"1m": 30, "3m": 90, "6m": 180, "1y": 365, "3y": 1095, "5y": 1825}
    days = periods.get(period, 365)
    
    base_value = 1800000
    for i in range(days, 0, -7):  # Weekly data points
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        value = base_value * (1 + _rng.uniform(-0.02, 0.03))
        base_value = value
        data_points.append({"date": date, "value": round(value, 2)})
    
    return {
        "client_id": client_id,
        "period": period,
        "data_points": data_points,
        "summary": {
            "start_value": data_points[0]["value"] if data_points else 0,
            "end_value": data_points[-1]["value"] if data_points else 0,
            "absolute_return": round(data_points[-1]["value"] - data_points[0]["value"], 2) if data_points else 0,
            "percentage_return": round(((data_points[-1]["value"] / data_points[0]["value"]) - 1) * 100, 2) if data_points else 0
        }
    }


@router.get("/income/{client_id}")
async def get_income_summary(client_id: str, year: int = None):
    """Get income summary from all wealth sources."""
    year = year or datetime.now().year
    
    return {
        "client_id": client_id,
        "year": year,
        "income_summary": {
            "dividends": {
                "total": 12500,
                "franking_credits": 5357,
                "gross_amount": 17857,
                "by_stock": [
                    {"ticker": "BHP", "amount": 2821, "franking": 100},
                    {"ticker": "CBA", "amount": 1649, "franking": 100},
                    {"ticker": "WES", "amount": 875, "franking": 100},
                    {"ticker": "NAB", "amount": 886, "franking": 100}
                ]
            },
            "interest": {
                "total": 3250,
                "by_account": [
                    {"account": "CBA Goal Saver", "amount": 1425},
                    {"account": "Westpac Term Deposit", "amount": 1540},
                    {"account": "ING Savings Maximiser", "amount": 825}
                ]
            },
            "rental_income": {
                "gross": 33800,
                "expenses": 8500,
                "net": 25300,
                "by_property": [
                    {"address": "456 Beach Rd, Gold Coast", "gross": 33800, "net": 25300}
                ]
            },
            "distributions": {
                "total": 8500,
                "by_fund": [
                    {"fund": "Magellan Global Fund", "amount": 4500},
                    {"fund": "Platinum International Fund", "amount": 2100},
                    {"fund": "Hyperion Global Growth", "amount": 1900}
                ]
            },
            "super_earnings": {
                "estimated": 38000,
                "note": "Unrealized - within super"
            }
        },
        "total_passive_income": 49550,
        "total_with_franking": 54907
    }


@router.get("/rebalance/{client_id}")
async def get_rebalance_recommendations(client_id: str):
    """Get portfolio rebalancing recommendations."""
    
    current = {
        "cash": 4.4,
        "shares": 15.8,
        "etfs": 9.8,
        "managed_funds": 11.2,
        "property": 42.1,
        "super": 14.7,
        "crypto": 1.2,
        "other": 0.7
    }
    
    target = {
        "cash": 5.0,
        "shares": 20.0,
        "etfs": 10.0,
        "managed_funds": 10.0,
        "property": 35.0,
        "super": 15.0,
        "crypto": 2.0,
        "other": 3.0
    }
    
    total_value = 2850000
    recommendations = []
    
    for asset_class in current:
        diff = target[asset_class] - current[asset_class]
        if abs(diff) > 0.5:  # Only recommend if diff > 0.5%
            amount = total_value * (diff / 100)
            recommendations.append({
                "asset_class": asset_class,
                "current_percent": current[asset_class],
                "target_percent": target[asset_class],
                "difference_percent": round(diff, 1),
                "action": "increase" if diff > 0 else "decrease",
                "amount": round(abs(amount), 0),
                "priority": "high" if abs(diff) > 5 else "medium" if abs(diff) > 2 else "low"
            })
    
    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order[x["priority"]])
    
    return {
        "client_id": client_id,
        "current_allocation": current,
        "target_allocation": target,
        "recommendations": recommendations,
        "total_rebalance_value": sum(r["amount"] for r in recommendations if r["action"] == "increase"),
        "drift_score": round(sum(abs(target[k] - current[k]) for k in current) / len(current), 2),
        "last_rebalance": "2024-09-15",
        "next_suggested_review": "2025-03-15"
    }
