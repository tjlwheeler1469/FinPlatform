"""
Portfolio Analyzer Service
Risk analysis, allocation diagnostics, and rebalancing recommendations.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np


def analyze_portfolio(
    portfolio: Dict[str, float],
    risk_tolerance: str = "moderate",
    age: int = 45,
    years_to_retirement: int = 15
) -> Dict[str, Any]:
    """
    Comprehensive portfolio analysis with risk metrics and recommendations.
    """
    
    # Define target allocations based on risk tolerance
    target_allocations = {
        "conservative": {"australian_equities": 20, "international_equities": 15, "fixed_income": 40, "property": 10, "cash": 15},
        "moderate": {"australian_equities": 30, "international_equities": 25, "fixed_income": 25, "property": 12, "cash": 8},
        "aggressive": {"australian_equities": 35, "international_equities": 35, "fixed_income": 15, "property": 10, "cash": 5}
    }
    
    target = target_allocations.get(risk_tolerance, target_allocations["moderate"])
    
    # Default portfolio if none provided
    if not portfolio:
        portfolio = {
            "australian_equities": 450000,
            "international_equities": 280000,
            "fixed_income": 120000,
            "property": 180000,
            "cash": 70000
        }
    
    total_value = sum(portfolio.values())
    
    # Calculate current allocation percentages
    current_allocation = {}
    for asset_class, value in portfolio.items():
        current_allocation[asset_class] = round((value / total_value) * 100, 1) if total_value > 0 else 0
    
    # Calculate deviation from target
    deviations = {}
    for asset_class, target_pct in target.items():
        current_pct = current_allocation.get(asset_class, 0)
        deviations[asset_class] = {
            "current": current_pct,
            "target": target_pct,
            "deviation": round(current_pct - target_pct, 1),
            "status": "overweight" if current_pct > target_pct + 5 else ("underweight" if current_pct < target_pct - 5 else "on_target")
        }
    
    # Calculate growth vs defensive split
    growth_assets = sum([portfolio.get(a, 0) for a in ["australian_equities", "international_equities", "property"]])
    defensive_assets = sum([portfolio.get(a, 0) for a in ["fixed_income", "cash"]])
    
    growth_percentage = (growth_assets / total_value * 100) if total_value > 0 else 0
    defensive_percentage = (defensive_assets / total_value * 100) if total_value > 0 else 0
    
    # Risk metrics (simplified)
    expected_return = growth_percentage * 0.08 + defensive_percentage * 0.04  # Weighted average
    expected_volatility = growth_percentage * 0.15 + defensive_percentage * 0.03
    sharpe_ratio = (expected_return - 3) / expected_volatility if expected_volatility > 0 else 0  # 3% risk-free rate
    
    # Concentration risk
    concentration_risks = []
    for asset_class, value in portfolio.items():
        pct = (value / total_value * 100) if total_value > 0 else 0
        if pct > 40:
            concentration_risks.append({
                "asset_class": asset_class,
                "percentage": pct,
                "risk_level": "high",
                "recommendation": f"Consider reducing {asset_class} allocation"
            })
        elif pct > 30:
            concentration_risks.append({
                "asset_class": asset_class,
                "percentage": pct,
                "risk_level": "moderate",
                "recommendation": f"Monitor {asset_class} concentration"
            })
    
    # Generate rebalancing trades
    rebalancing_trades = []
    for asset_class, data in deviations.items():
        if abs(data["deviation"]) > 5:
            current_value = portfolio.get(asset_class, 0)
            target_value = total_value * (data["target"] / 100)
            trade_value = target_value - current_value
            
            rebalancing_trades.append({
                "asset_class": asset_class,
                "action": "buy" if trade_value > 0 else "sell",
                "amount": abs(trade_value),
                "current_value": current_value,
                "target_value": target_value,
                "reason": f"{'Increase' if trade_value > 0 else 'Reduce'} from {data['current']:.1f}% to {data['target']}%"
            })
    
    # Overall risk assessment
    if growth_percentage > 80:
        risk_assessment = "high"
        risk_message = "Portfolio is aggressively positioned with high growth asset exposure"
    elif growth_percentage > 60:
        risk_assessment = "moderate"
        risk_message = "Portfolio has balanced risk exposure appropriate for moderate risk tolerance"
    else:
        risk_assessment = "low"
        risk_message = "Portfolio is defensively positioned with lower growth potential"
    
    # Insights
    insights = []
    
    # Check international exposure
    intl_pct = current_allocation.get("international_equities", 0)
    if intl_pct < 20:
        insights.append({
            "type": "underweight",
            "message": "Underweight global equities - consider increasing international exposure for diversification",
            "impact": "moderate"
        })
    
    # Check fixed income in low rate environment
    fi_pct = current_allocation.get("fixed_income", 0)
    if fi_pct > 30 and age < 50:
        insights.append({
            "type": "conservative",
            "message": "High fixed income allocation may limit long-term growth given your investment horizon",
            "impact": "moderate"
        })
    
    # Check cash drag
    cash_pct = current_allocation.get("cash", 0)
    if cash_pct > 10:
        insights.append({
            "type": "cash_drag",
            "message": f"Excess cash ({cash_pct:.1f}%) may be creating performance drag",
            "impact": "low"
        })
    
    return {
        "analysis_date": datetime.now().isoformat(),
        "total_portfolio_value": total_value,
        "risk_tolerance": risk_tolerance,
        "portfolio_breakdown": portfolio,
        "current_allocation": current_allocation,
        "target_allocation": target,
        "deviations": deviations,
        "risk_metrics": {
            "growth_percentage": round(growth_percentage, 1),
            "defensive_percentage": round(defensive_percentage, 1),
            "expected_annual_return": round(expected_return, 2),
            "expected_volatility": round(expected_volatility, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "risk_assessment": risk_assessment,
            "risk_message": risk_message
        },
        "concentration_risks": concentration_risks,
        "rebalancing_required": len(rebalancing_trades) > 0,
        "rebalancing_trades": rebalancing_trades,
        "insights": insights,
        "recommendations": [
            {
                "action": "Rebalance portfolio",
                "priority": "High" if len(rebalancing_trades) > 2 else "Medium",
                "detail": f"{len(rebalancing_trades)} asset classes require adjustment"
            } if rebalancing_trades else None,
            {
                "action": "Review international allocation",
                "priority": "Medium",
                "detail": "Consider increasing global exposure for better diversification"
            } if intl_pct < 20 else None,
            {
                "action": "Review risk profile",
                "priority": "Low",
                "detail": "Ensure portfolio aligns with stated risk tolerance"
            }
        ]
    }


def get_sector_exposure(holdings: List[Dict]) -> Dict[str, Any]:
    """
    Analyze sector exposure within equity holdings.
    """
    
    # Default holdings if none provided
    if not holdings:
        holdings = [
            {"ticker": "CBA", "name": "Commonwealth Bank", "sector": "Financials", "value": 45000},
            {"ticker": "BHP", "name": "BHP Group", "sector": "Materials", "value": 38000},
            {"ticker": "CSL", "name": "CSL Limited", "sector": "Healthcare", "value": 52000},
            {"ticker": "WES", "name": "Wesfarmers", "sector": "Consumer Discretionary", "value": 28000},
            {"ticker": "WOW", "name": "Woolworths", "sector": "Consumer Staples", "value": 22000},
            {"ticker": "TLS", "name": "Telstra", "sector": "Communication Services", "value": 18000},
            {"ticker": "RIO", "name": "Rio Tinto", "sector": "Materials", "value": 35000},
            {"ticker": "NAB", "name": "National Australia Bank", "sector": "Financials", "value": 32000},
        ]
    
    total_value = sum(h["value"] for h in holdings)
    
    # Aggregate by sector
    sectors = {}
    for holding in holdings:
        sector = holding["sector"]
        if sector not in sectors:
            sectors[sector] = {"value": 0, "holdings": []}
        sectors[sector]["value"] += holding["value"]
        sectors[sector]["holdings"].append(holding)
    
    # Calculate percentages and identify risks
    sector_breakdown = []
    for sector, data in sectors.items():
        pct = (data["value"] / total_value * 100) if total_value > 0 else 0
        sector_breakdown.append({
            "sector": sector,
            "value": data["value"],
            "percentage": round(pct, 1),
            "holdings_count": len(data["holdings"]),
            "concentrated": pct > 25
        })
    
    # Sort by value
    sector_breakdown.sort(key=lambda x: x["value"], reverse=True)
    
    return {
        "total_equity_value": total_value,
        "sector_breakdown": sector_breakdown,
        "top_sector": sector_breakdown[0]["sector"] if sector_breakdown else None,
        "diversification_score": min(100, len(sectors) * 12),  # More sectors = better diversification
        "recommendations": [
            {
                "action": f"Reduce {sector_breakdown[0]['sector']} exposure",
                "detail": f"Currently {sector_breakdown[0]['percentage']:.1f}% - consider trimming to below 25%"
            } if sector_breakdown and sector_breakdown[0]["percentage"] > 25 else None
        ]
    }
