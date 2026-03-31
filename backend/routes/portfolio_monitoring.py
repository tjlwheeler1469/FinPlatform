"""
Portfolio Monitoring Engine
AI-powered daily portfolio scanning with real-time alerts and actionable insights.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid
import logging
import secrets
_rng = secrets.SystemRandom()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/monitoring", tags=["Portfolio Monitoring"])

# Monitoring thresholds (configurable)
THRESHOLDS = {
    "allocation_drift": 5.0,  # % drift from target
    "concentration_risk": 25.0,  # % in single holding
    "sector_concentration": 40.0,  # % in single sector
    "idle_cash": 50000,  # $ threshold
    "idle_cash_days": 30,
    "fund_underperformance": -5.0,  # % vs benchmark
    "tax_loss_threshold": 5000,  # $ unrealized loss
}

# Enhanced client data with full financial picture
MONITORED_PORTFOLIOS = {
    "client_1": {
        "name": "Wheeler Family",
        "aum": 2920000,
        "adviser_id": "adviser_001",
        "risk_profile": "Balanced",
        "holdings": {
            "CBA.AX": {"units": 200, "value": 23700, "cost": 19700, "sector": "Financials"},
            "BHP.AX": {"units": 300, "value": 12840, "cost": 13560, "sector": "Materials"},
            "CSL.AX": {"units": 50, "value": 14900, "cost": 14250, "sector": "Healthcare"},
            "VAS.AX": {"units": 500, "value": 48250, "cost": 44000, "sector": "Diversified"},
            "VGS.AX": {"units": 300, "value": 35520, "cost": 30600, "sector": "International"},
            "CASH": {"units": 1, "value": 185000, "cost": 185000, "sector": "Cash"},
        },
        "target_allocation": {"Equities": 60, "Fixed Income": 20, "Property": 15, "Cash": 5},
        "current_allocation": {"Equities": 52, "Fixed Income": 18, "Property": 16, "Cash": 14},
        "last_rebalance": "2024-09-15",
        "retirement_target": 3500000,
        "retirement_date": "2045-01-01",
        "spouse": "Sarah Wheeler",
        "dependents": ["Emily (18)", "James (15)"],
    },
    "client_2": {
        "name": "Chen Investment Trust",
        "aum": 4200000,
        "adviser_id": "adviser_001",
        "risk_profile": "Growth",
        "holdings": {
            "NVDA": {"units": 150, "value": 135000, "cost": 45000, "sector": "Technology"},
            "MSFT": {"units": 200, "value": 84000, "cost": 52000, "sector": "Technology"},
            "AAPL": {"units": 300, "value": 54000, "cost": 42000, "sector": "Technology"},
            "GOOGL": {"units": 100, "value": 17500, "cost": 14000, "sector": "Technology"},
            "VGS.AX": {"units": 1000, "value": 118400, "cost": 95000, "sector": "International"},
            "CASH": {"units": 1, "value": 220000, "cost": 220000, "sector": "Cash"},
        },
        "target_allocation": {"Equities": 75, "Fixed Income": 15, "Property": 5, "Cash": 5},
        "current_allocation": {"Equities": 68, "Fixed Income": 12, "Property": 8, "Cash": 12},
        "last_rebalance": "2024-06-20",
        "retirement_target": 8000000,
        "retirement_date": "2038-01-01",
    },
    "client_3": {
        "name": "Thompson SMSF",
        "aum": 890000,
        "adviser_id": "adviser_001", 
        "risk_profile": "Conservative",
        "holdings": {
            "VAS.AX": {"units": 200, "value": 19300, "cost": 17600, "sector": "Diversified"},
            "VAF.AX": {"units": 500, "value": 24500, "cost": 25000, "sector": "Bonds"},
            "CASH": {"units": 1, "value": 320000, "cost": 320000, "sector": "Cash"},
        },
        "target_allocation": {"Equities": 25, "Fixed Income": 45, "Property": 10, "Cash": 20},
        "current_allocation": {"Equities": 22, "Fixed Income": 28, "Property": 8, "Cash": 42},
        "last_rebalance": "2024-03-10",
        "retirement_target": 1200000,
        "retirement_date": "2027-01-01",
    },
    "client_4": {
        "name": "Patel Holdings",
        "aum": 7500000,
        "adviser_id": "adviser_001",
        "risk_profile": "High Growth",
        "holdings": {
            "TSLA": {"units": 200, "value": 52000, "cost": 85000, "sector": "Technology"},
            "AMZN": {"units": 150, "value": 27750, "cost": 24000, "sector": "Technology"},
            "META": {"units": 180, "value": 99000, "cost": 45000, "sector": "Technology"},
            "BTC": {"units": 2.5, "value": 246250, "cost": 125000, "sector": "Crypto"},
            "CASH": {"units": 1, "value": 450000, "cost": 450000, "sector": "Cash"},
        },
        "target_allocation": {"Equities": 80, "Fixed Income": 5, "Property": 5, "Cash": 10},
        "current_allocation": {"Equities": 72, "Fixed Income": 3, "Property": 8, "Cash": 17},
        "last_rebalance": "2024-01-15",
        "retirement_target": 15000000,
        "retirement_date": "2042-01-01",
    },
    "client_5": {
        "name": "Garcia Family",
        "aum": 820000,
        "adviser_id": "adviser_001",
        "risk_profile": "Balanced",
        "holdings": {
            "VAS.AX": {"units": 150, "value": 14475, "cost": 13200, "sector": "Diversified"},
            "VDHG.AX": {"units": 100, "value": 6850, "cost": 6200, "sector": "Diversified"},
            "CASH": {"units": 1, "value": 125000, "cost": 125000, "sector": "Cash"},
        },
        "target_allocation": {"Equities": 50, "Fixed Income": 25, "Property": 20, "Cash": 5},
        "current_allocation": {"Equities": 35, "Fixed Income": 18, "Property": 24, "Cash": 23},
        "last_rebalance": None,
        "retirement_target": 2000000,
        "retirement_date": "2052-01-01",
    },
}

# Real-time alerts storage
MONITORING_ALERTS: List[Dict] = []


def calculate_allocation_drift(current: Dict, target: Dict) -> Dict:
    """Calculate drift from target allocation."""
    drift_details = {}
    max_drift = 0
    
    for asset_class in set(current.keys()) | set(target.keys()):
        curr = current.get(asset_class, 0)
        tgt = target.get(asset_class, 0)
        drift = curr - tgt
        drift_details[asset_class] = {
            "current": curr,
            "target": tgt,
            "drift": drift,
            "action": "reduce" if drift > 0 else "increase" if drift < 0 else "hold"
        }
        max_drift = max(max_drift, abs(drift))
    
    return {
        "max_drift": max_drift,
        "needs_rebalance": max_drift > THRESHOLDS["allocation_drift"],
        "details": drift_details
    }


def check_concentration_risk(holdings: Dict) -> List[Dict]:
    """Check for concentration risk in individual holdings."""
    issues = []
    total_value = sum(h.get("value", 0) for h in holdings.values())
    
    # Check individual holding concentration
    for symbol, holding in holdings.items():
        if symbol == "CASH":
            continue
        weight = (holding.get("value", 0) / total_value * 100) if total_value > 0 else 0
        if weight > THRESHOLDS["concentration_risk"]:
            issues.append({
                "type": "holding_concentration",
                "symbol": symbol,
                "weight": round(weight, 1),
                "threshold": THRESHOLDS["concentration_risk"],
                "severity": "high" if weight > 35 else "medium"
            })
    
    # Check sector concentration
    sector_totals = {}
    for symbol, holding in holdings.items():
        sector = holding.get("sector", "Other")
        sector_totals[sector] = sector_totals.get(sector, 0) + holding.get("value", 0)
    
    for sector, value in sector_totals.items():
        if sector == "Cash":
            continue
        weight = (value / total_value * 100) if total_value > 0 else 0
        if weight > THRESHOLDS["sector_concentration"]:
            issues.append({
                "type": "sector_concentration",
                "sector": sector,
                "weight": round(weight, 1),
                "threshold": THRESHOLDS["sector_concentration"],
                "severity": "high" if weight > 50 else "medium"
            })
    
    return issues


def check_idle_cash(holdings: Dict, client_data: Dict) -> Optional[Dict]:
    """Check for excessive idle cash."""
    cash_holding = holdings.get("CASH", {})
    cash_value = cash_holding.get("value", 0)
    
    if cash_value > THRESHOLDS["idle_cash"]:
        total_value = sum(h.get("value", 0) for h in holdings.values())
        cash_percent = (cash_value / total_value * 100) if total_value > 0 else 0
        target_cash = client_data.get("target_allocation", {}).get("Cash", 5)
        
        if cash_percent > target_cash + 5:  # Allow 5% buffer
            return {
                "type": "idle_cash",
                "amount": cash_value,
                "percent": round(cash_percent, 1),
                "target_percent": target_cash,
                "excess": cash_value - (total_value * target_cash / 100),
                "opportunity_cost": round(cash_value * 0.05, 2),  # 5% opportunity cost
                "severity": "high" if cash_value > 200000 else "medium"
            }
    return None


def check_tax_loss_opportunities(holdings: Dict) -> List[Dict]:
    """Identify tax-loss harvesting opportunities."""
    opportunities = []
    
    for symbol, holding in holdings.items():
        if symbol == "CASH":
            continue
        cost = holding.get("cost", 0)
        value = holding.get("value", 0)
        loss = cost - value
        
        if loss > THRESHOLDS["tax_loss_threshold"]:
            tax_saving = loss * 0.39  # Top marginal rate
            opportunities.append({
                "symbol": symbol,
                "unrealized_loss": loss,
                "potential_tax_saving": round(tax_saving, 2),
                "current_value": value,
                "cost_basis": cost,
                "severity": "high" if tax_saving > 5000 else "medium"
            })
    
    return opportunities


def check_retirement_funding(client_data: Dict) -> Optional[Dict]:
    """Check retirement funding trajectory."""
    target = client_data.get("retirement_target", 0)
    current = client_data.get("aum", 0)
    retirement_date = client_data.get("retirement_date")
    
    if not target or not retirement_date:
        return None
    
    try:
        retire_dt = datetime.strptime(retirement_date, "%Y-%m-%d")
        years_to_retirement = (retire_dt - datetime.now()).days / 365
        
        if years_to_retirement <= 0:
            return None
        
        # Simple projection (7% annual return)
        projected = current * ((1.07) ** years_to_retirement)
        funding_ratio = projected / target * 100
        shortfall = max(0, target - projected)
        
        if funding_ratio < 90:  # Less than 90% funded
            return {
                "type": "retirement_shortfall",
                "current_aum": current,
                "target": target,
                "projected": round(projected, 0),
                "funding_ratio": round(funding_ratio, 1),
                "shortfall": round(shortfall, 0),
                "years_to_retirement": round(years_to_retirement, 1),
                "severity": "high" if funding_ratio < 70 else "medium"
            }
    except Exception as e:
        logger.error(f"Error calculating retirement funding: {e}")
    
    return None


def scan_portfolio(client_id: str, client_data: Dict) -> Dict:
    """Perform comprehensive portfolio scan."""
    holdings = client_data.get("holdings", {})
    alerts = []
    
    # 1. Check allocation drift
    drift = calculate_allocation_drift(
        client_data.get("current_allocation", {}),
        client_data.get("target_allocation", {})
    )
    if drift["needs_rebalance"]:
        alerts.append({
            "type": "allocation_drift",
            "severity": "high" if drift["max_drift"] > 10 else "medium",
            "max_drift": drift["max_drift"],
            "details": drift["details"]
        })
    
    # 2. Check concentration risk
    concentration_issues = check_concentration_risk(holdings)
    alerts.extend(concentration_issues)
    
    # 3. Check idle cash
    idle_cash = check_idle_cash(holdings, client_data)
    if idle_cash:
        alerts.append(idle_cash)
    
    # 4. Check tax-loss opportunities
    tax_opportunities = check_tax_loss_opportunities(holdings)
    alerts.extend([{"type": "tax_loss_opportunity", **opp} for opp in tax_opportunities])
    
    # 5. Check retirement funding
    retirement_issue = check_retirement_funding(client_data)
    if retirement_issue:
        alerts.append(retirement_issue)
    
    return {
        "client_id": client_id,
        "client_name": client_data.get("name"),
        "aum": client_data.get("aum"),
        "risk_profile": client_data.get("risk_profile"),
        "alerts": alerts,
        "alert_count": len(alerts),
        "high_priority": len([a for a in alerts if a.get("severity") == "high"]),
        "medium_priority": len([a for a in alerts if a.get("severity") == "medium"]),
        "scanned_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/daily-scan")
async def run_daily_scan():
    """Run comprehensive daily portfolio scan across all clients."""
    results = {
        "scan_time": datetime.now(timezone.utc).isoformat(),
        "total_clients": len(MONITORED_PORTFOLIOS),
        "total_aum": sum(p.get("aum", 0) for p in MONITORED_PORTFOLIOS.values()),
        "clients_with_alerts": 0,
        "total_alerts": 0,
        "high_priority_alerts": 0,
        "alert_summary": {
            "allocation_drift": 0,
            "concentration_risk": 0,
            "idle_cash": 0,
            "tax_opportunities": 0,
            "retirement_shortfall": 0
        },
        "client_results": []
    }
    
    for client_id, client_data in MONITORED_PORTFOLIOS.items():
        scan_result = scan_portfolio(client_id, client_data)
        results["client_results"].append(scan_result)
        
        if scan_result["alert_count"] > 0:
            results["clients_with_alerts"] += 1
            results["total_alerts"] += scan_result["alert_count"]
            results["high_priority_alerts"] += scan_result["high_priority"]
            
            # Count by type
            for alert in scan_result["alerts"]:
                alert_type = alert.get("type", "other")
                if "drift" in alert_type:
                    results["alert_summary"]["allocation_drift"] += 1
                elif "concentration" in alert_type:
                    results["alert_summary"]["concentration_risk"] += 1
                elif "idle_cash" in alert_type:
                    results["alert_summary"]["idle_cash"] += 1
                elif "tax" in alert_type:
                    results["alert_summary"]["tax_opportunities"] += 1
                elif "retirement" in alert_type:
                    results["alert_summary"]["retirement_shortfall"] += 1
    
    return results


@router.get("/client/{client_id}")
async def scan_single_client(client_id: str):
    """Scan a single client's portfolio."""
    if client_id not in MONITORED_PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return scan_portfolio(client_id, MONITORED_PORTFOLIOS[client_id])


@router.get("/alerts/summary")
async def get_alerts_summary():
    """Get summary of all current alerts across practice."""
    all_alerts = []
    
    for client_id, client_data in MONITORED_PORTFOLIOS.items():
        scan_result = scan_portfolio(client_id, client_data)
        for alert in scan_result["alerts"]:
            alert["client_id"] = client_id
            alert["client_name"] = client_data.get("name")
            all_alerts.append(alert)
    
    # Sort by severity
    severity_order = {"high": 0, "medium": 1, "low": 2}
    all_alerts.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 3))
    
    return {
        "total_alerts": len(all_alerts),
        "high_priority": len([a for a in all_alerts if a.get("severity") == "high"]),
        "alerts": all_alerts,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/thresholds")
async def get_thresholds():
    """Get current monitoring thresholds."""
    return THRESHOLDS


@router.post("/thresholds")
async def update_thresholds(new_thresholds: Dict[str, float]):
    """Update monitoring thresholds."""
    for key, value in new_thresholds.items():
        if key in THRESHOLDS:
            THRESHOLDS[key] = value
    return {"success": True, "thresholds": THRESHOLDS}


@router.get("/book-insights")
async def get_book_insights():
    """Get aggregated insights across entire client book."""
    total_aum = sum(p.get("aum", 0) for p in MONITORED_PORTFOLIOS.values())
    
    # Aggregate sector exposure
    sector_totals = {}
    for client_data in MONITORED_PORTFOLIOS.values():
        for symbol, holding in client_data.get("holdings", {}).items():
            sector = holding.get("sector", "Other")
            sector_totals[sector] = sector_totals.get(sector, 0) + holding.get("value", 0)
    
    # Calculate book-wide metrics
    cash_total = sector_totals.get("Cash", 0)
    tech_total = sector_totals.get("Technology", 0)
    
    # Find clients with specific issues
    clients_over_cash = []
    clients_tech_heavy = []
    clients_retirement_risk = []
    
    for client_id, client_data in MONITORED_PORTFOLIOS.items():
        cash = client_data.get("holdings", {}).get("CASH", {}).get("value", 0)
        if cash > 100000:
            clients_over_cash.append({
                "client_id": client_id,
                "name": client_data.get("name"),
                "cash_amount": cash
            })
        
        # Check tech exposure
        tech_value = sum(
            h.get("value", 0) for h in client_data.get("holdings", {}).values()
            if h.get("sector") == "Technology"
        )
        if tech_value / client_data.get("aum", 1) > 0.25:
            clients_tech_heavy.append({
                "client_id": client_id,
                "name": client_data.get("name"),
                "tech_exposure": round(tech_value / client_data.get("aum", 1) * 100, 1)
            })
        
        # Check retirement funding
        retirement_issue = check_retirement_funding(client_data)
        if retirement_issue:
            clients_retirement_risk.append({
                "client_id": client_id,
                "name": client_data.get("name"),
                "funding_ratio": retirement_issue.get("funding_ratio"),
                "shortfall": retirement_issue.get("shortfall")
            })
    
    return {
        "book_summary": {
            "total_aum": total_aum,
            "total_clients": len(MONITORED_PORTFOLIOS),
            "average_client_aum": round(total_aum / len(MONITORED_PORTFOLIOS), 0)
        },
        "sector_exposure": {
            sector: {
                "value": value,
                "percent": round(value / total_aum * 100, 1) if total_aum > 0 else 0
            }
            for sector, value in sector_totals.items()
        },
        "book_wide_insights": [
            {
                "insight": f"{len(clients_over_cash)} clients holding >${150000:,}+ idle cash",
                "count": len(clients_over_cash),
                "clients": clients_over_cash,
                "action": "Consider investment opportunities"
            },
            {
                "insight": f"{len(clients_tech_heavy)} clients overweight technology stocks",
                "count": len(clients_tech_heavy),
                "clients": clients_tech_heavy,
                "action": "Review concentration risk"
            },
            {
                "insight": f"{len(clients_retirement_risk)} clients with retirement funding shortfall",
                "count": len(clients_retirement_risk),
                "clients": clients_retirement_risk,
                "action": "Increase contributions or adjust goals"
            }
        ],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
