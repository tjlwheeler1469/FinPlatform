"""
Automated Portfolio Rebalancing Engine
Tax-aware, one-click portfolio rebalancing with trade optimization.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rebalance", tags=["Portfolio Rebalancing"])

# Sample portfolio data
PORTFOLIOS = {
    "client_1": {
        "name": "Wheeler Family",
        "aum": 320210,
        "current_allocation": {
            "Australian Equities": {"percent": 35, "value": 112074},
            "International Equities": {"percent": 22, "value": 70446},
            "Fixed Income": {"percent": 18, "value": 57638},
            "Property": {"percent": 11, "value": 35223},
            "Cash": {"percent": 14, "value": 44829}
        },
        "target_allocation": {
            "Australian Equities": {"percent": 30, "target_value": 96063},
            "International Equities": {"percent": 30, "target_value": 96063},
            "Fixed Income": {"percent": 20, "target_value": 64042},
            "Property": {"percent": 15, "target_value": 48032},
            "Cash": {"percent": 5, "target_value": 16011}
        },
        "holdings": {
            "Australian Equities": [
                {"symbol": "CBA.AX", "units": 200, "price": 118.50, "value": 23700, "cost": 98.50, "gain": 4000},
                {"symbol": "BHP.AX", "units": 300, "price": 42.80, "value": 12840, "cost": 45.20, "gain": -720},
                {"symbol": "CSL.AX", "units": 50, "price": 298.00, "value": 14900, "cost": 285.00, "gain": 650},
                {"symbol": "VAS.AX", "units": 500, "price": 96.50, "value": 48250, "cost": 88.00, "gain": 4250},
                {"symbol": "NAB.AX", "units": 400, "price": 34.20, "value": 13680, "cost": 32.00, "gain": 880}
            ],
            "International Equities": [
                {"symbol": "VGS.AX", "units": 300, "price": 118.40, "value": 35520, "cost": 102.00, "gain": 4920},
                {"symbol": "IVV.AX", "units": 100, "price": 625.00, "value": 62500, "cost": 580.00, "gain": 4500}
            ],
            "Fixed Income": [
                {"symbol": "VAF.AX", "units": 500, "price": 49.50, "value": 24750, "cost": 50.00, "gain": -250},
                {"symbol": "VGB.AX", "units": 400, "price": 44.72, "value": 17888, "cost": 46.00, "gain": -512}
            ],
            "Property": [
                {"symbol": "VAP.AX", "units": 250, "price": 72.45, "value": 18113, "cost": 68.00, "gain": 1113}
            ],
            "Cash": [
                {"symbol": "CASH", "units": 1, "price": 44829, "value": 44829, "cost": 44829, "gain": 0}
            ]
        }
    }
}


class RebalanceRequest(BaseModel):
    client_id: str
    tax_aware: bool = True
    use_new_cash: bool = False
    new_cash_amount: float = 0


class RebalanceResult(BaseModel):
    success: bool
    trades: List[Dict]
    summary: Dict


def calculate_rebalance_trades(
    client_id: str,
    tax_aware: bool = True,
    new_cash: float = 0
) -> Dict:
    """Calculate optimal rebalance trades."""
    if client_id not in PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Client portfolio not found")
    
    portfolio = PORTFOLIOS[client_id]
    total_value = portfolio["aum"] + new_cash
    
    trades = []
    sells = []
    buys = []
    
    for asset_class, current in portfolio["current_allocation"].items():
        target = portfolio["target_allocation"].get(asset_class, {})
        
        current_value = current["value"]
        target_value = total_value * (target.get("percent", 0) / 100)
        difference = target_value - current_value
        
        if abs(difference) < 500:  # Skip small differences
            continue
        
        if difference < 0:
            # Need to sell
            sell_amount = abs(difference)
            
            # If tax-aware, prefer selling losers first
            holdings = portfolio["holdings"].get(asset_class, [])
            if tax_aware:
                # Sort by gain (sell losers first)
                holdings_sorted = sorted(holdings, key=lambda h: h.get("gain", 0))
            else:
                holdings_sorted = holdings
            
            remaining_to_sell = sell_amount
            for holding in holdings_sorted:
                if remaining_to_sell <= 0:
                    break
                if holding["symbol"] == "CASH":
                    continue
                
                sell_value = min(holding["value"], remaining_to_sell)
                sell_units = int(sell_value / holding["price"])
                
                if sell_units > 0:
                    realized_gain = (holding["price"] - holding["cost"]) * sell_units
                    cgt = max(0, realized_gain * 0.5 * 0.39) if realized_gain > 0 else 0  # 50% discount, 39% rate
                    
                    trade = {
                        "action": "SELL",
                        "asset_class": asset_class,
                        "symbol": holding["symbol"],
                        "units": sell_units,
                        "price": holding["price"],
                        "value": round(sell_units * holding["price"], 2),
                        "realized_gain": round(realized_gain, 2),
                        "estimated_cgt": round(cgt, 2),
                        "reason": "Overweight - reduce allocation"
                    }
                    trades.append(trade)
                    sells.append(trade)
                    remaining_to_sell -= sell_value
        else:
            # Need to buy
            buy_amount = difference
            
            # Determine which holdings to add to
            holdings = portfolio["holdings"].get(asset_class, [])
            
            # Simple approach: buy more of existing holdings proportionally
            # or create a new holding recommendation
            if holdings and holdings[0]["symbol"] != "CASH":
                # Add to largest existing holding
                largest = max(holdings, key=lambda h: h.get("value", 0))
                buy_units = int(buy_amount / largest["price"])
                
                if buy_units > 0:
                    trade = {
                        "action": "BUY",
                        "asset_class": asset_class,
                        "symbol": largest["symbol"],
                        "units": buy_units,
                        "price": largest["price"],
                        "value": round(buy_units * largest["price"], 2),
                        "reason": "Underweight - increase allocation"
                    }
                    trades.append(trade)
                    buys.append(trade)
    
    # Calculate summary
    total_sell_value = sum(t["value"] for t in sells)
    total_buy_value = sum(t["value"] for t in buys)
    total_realized_gains = sum(t.get("realized_gain", 0) for t in sells)
    total_cgt = sum(t.get("estimated_cgt", 0) for t in sells)
    
    # Estimate transaction costs (0.1% brokerage)
    transaction_costs = (total_sell_value + total_buy_value) * 0.001
    
    return {
        "client_id": client_id,
        "client_name": portfolio["name"],
        "current_aum": portfolio["aum"],
        "new_cash_added": new_cash,
        "total_value_after": total_value,
        "trades": trades,
        "summary": {
            "total_trades": len(trades),
            "sell_trades": len(sells),
            "buy_trades": len(buys),
            "total_sell_value": round(total_sell_value, 2),
            "total_buy_value": round(total_buy_value, 2),
            "net_cash_flow": round(total_sell_value - total_buy_value, 2),
            "total_realized_gains": round(total_realized_gains, 2),
            "estimated_cgt": round(total_cgt, 2),
            "estimated_transaction_costs": round(transaction_costs, 2),
            "tax_aware": tax_aware
        },
        "allocation_before": {
            k: v["percent"] for k, v in portfolio["current_allocation"].items()
        },
        "allocation_after": {
            k: v["percent"] for k, v in portfolio["target_allocation"].items()
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/preview/{client_id}")
async def preview_rebalance(
    client_id: str,
    tax_aware: bool = True,
    new_cash: float = 0
):
    """Preview rebalance trades without executing."""
    return calculate_rebalance_trades(client_id, tax_aware, new_cash)


@router.post("/execute")
async def execute_rebalance(request: RebalanceRequest):
    """Execute rebalance trades (in production, this would submit orders)."""
    trades_preview = calculate_rebalance_trades(
        request.client_id,
        request.tax_aware,
        request.new_cash_amount if request.use_new_cash else 0
    )
    
    # In production, this would:
    # 1. Validate trades
    # 2. Submit orders to broker
    # 3. Track execution status
    # 4. Update portfolio holdings
    
    execution_id = f"rebal_{uuid.uuid4().hex[:8]}"
    
    return {
        "success": True,
        "execution_id": execution_id,
        "status": "submitted",
        "message": "Rebalance trades submitted for execution (DEMO MODE)",
        "trades": trades_preview["trades"],
        "summary": trades_preview["summary"],
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/drift-report/{client_id}")
async def get_drift_report(client_id: str):
    """Get detailed allocation drift report."""
    if client_id not in PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Client portfolio not found")
    
    portfolio = PORTFOLIOS[client_id]
    drift_report = []
    max_drift = 0
    
    for asset_class, current in portfolio["current_allocation"].items():
        target = portfolio["target_allocation"].get(asset_class, {})
        
        drift = current["percent"] - target.get("percent", 0)
        abs_drift = abs(drift)
        max_drift = max(max_drift, abs_drift)
        
        drift_report.append({
            "asset_class": asset_class,
            "current_percent": current["percent"],
            "current_value": current["value"],
            "target_percent": target.get("percent", 0),
            "target_value": portfolio["aum"] * target.get("percent", 0) / 100,
            "drift_percent": round(drift, 1),
            "drift_value": round(current["value"] - (portfolio["aum"] * target.get("percent", 0) / 100), 2),
            "action_needed": "reduce" if drift > 2 else "increase" if drift < -2 else "hold",
            "within_tolerance": abs_drift <= 5
        })
    
    return {
        "client_id": client_id,
        "client_name": portfolio["name"],
        "aum": portfolio["aum"],
        "max_drift": round(max_drift, 1),
        "needs_rebalance": max_drift > 5,
        "last_rebalance": "2024-09-15",
        "days_since_rebalance": 182,
        "drift_by_asset_class": drift_report,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/optimal-trades/{client_id}")
async def get_optimal_trades(client_id: str, minimize_taxes: bool = True):
    """Get tax-optimized trade recommendations."""
    if client_id not in PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Client portfolio not found")
    
    portfolio = PORTFOLIOS[client_id]
    recommendations = []
    
    for asset_class, holdings in portfolio["holdings"].items():
        for holding in holdings:
            if holding["symbol"] == "CASH":
                continue
            
            gain = holding.get("gain", 0)
            
            if gain < -500 and minimize_taxes:
                # Tax-loss harvesting candidate
                tax_saving = abs(gain) * 0.39  # Assume top marginal rate
                recommendations.append({
                    "type": "tax_loss_harvest",
                    "asset_class": asset_class,
                    "symbol": holding["symbol"],
                    "action": "SELL",
                    "units": holding["units"],
                    "current_value": holding["value"],
                    "unrealized_loss": abs(gain),
                    "potential_tax_saving": round(tax_saving, 2),
                    "recommendation": f"Sell to realize ${abs(gain):,.0f} loss and save ${tax_saving:,.0f} in tax",
                    "priority": "high"
                })
            elif gain > holding["value"] * 0.5:
                # Large unrealized gain - consider implications
                cgt = gain * 0.5 * 0.39  # 50% discount, top rate
                recommendations.append({
                    "type": "large_gain_alert",
                    "asset_class": asset_class,
                    "symbol": holding["symbol"],
                    "action": "REVIEW",
                    "units": holding["units"],
                    "current_value": holding["value"],
                    "unrealized_gain": gain,
                    "estimated_cgt_if_sold": round(cgt, 2),
                    "recommendation": f"Consider tax implications before selling - CGT would be ${cgt:,.0f}",
                    "priority": "medium"
                })
    
    return {
        "client_id": client_id,
        "client_name": portfolio["name"],
        "recommendations": recommendations,
        "total_recommendations": len(recommendations),
        "tax_optimization_enabled": minimize_taxes,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/batch-rebalance")
async def get_batch_rebalance_opportunities():
    """Identify portfolios that can be batch rebalanced together."""
    batch_opportunities = []
    
    for client_id, portfolio in PORTFOLIOS.items():
        trades = calculate_rebalance_trades(client_id, tax_aware=True)
        
        if trades["summary"]["total_trades"] > 0:
            batch_opportunities.append({
                "client_id": client_id,
                "client_name": portfolio["name"],
                "aum": portfolio["aum"],
                "trades_needed": trades["summary"]["total_trades"],
                "net_cash_flow": trades["summary"]["net_cash_flow"],
                "estimated_cgt": trades["summary"]["estimated_cgt"]
            })
    
    # Group by similar trades
    total_trades = sum(p["trades_needed"] for p in batch_opportunities)
    total_aum = sum(p["aum"] for p in batch_opportunities)
    
    return {
        "batch_opportunities": batch_opportunities,
        "summary": {
            "portfolios_needing_rebalance": len(batch_opportunities),
            "total_aum_affected": total_aum,
            "total_trades_needed": total_trades,
            "efficiency_gain": "Batch trading can reduce transaction costs by 15-20%"
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
