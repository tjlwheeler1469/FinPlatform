"""
Portfolio Execution Engine
Block trading, model portfolios, automated rebalancing.
"Execute once → Allocate to 50 clients"
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio-engine", tags=["Portfolio Execution Engine"])


# ==================== MODEL PORTFOLIOS ====================

class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    BALANCED = "balanced"
    GROWTH = "growth"
    AGGRESSIVE = "aggressive"


class ModelPortfolio(BaseModel):
    """Model portfolio template."""
    model_id: str
    name: str
    description: str
    risk_profile: RiskProfile
    target_allocation: Dict[str, float]  # {symbol: percentage}
    benchmark: str
    rebalance_frequency: str  # monthly, quarterly, annual
    min_investment: float
    created_at: str
    updated_at: str
    performance_ytd: float = 0
    aum_total: float = 0
    clients_count: int = 0


# Pre-defined model portfolios
MODEL_PORTFOLIOS: Dict[str, ModelPortfolio] = {
    "conservative_income": ModelPortfolio(
        model_id="conservative_income",
        name="Conservative Income",
        description="Capital preservation with steady income focus",
        risk_profile=RiskProfile.CONSERVATIVE,
        target_allocation={
            "VAS.AX": 15,    # Australian Equities
            "VGS": 10,       # International Equities
            "VAF.AX": 40,    # Australian Bonds
            "VIF.AX": 20,    # International Bonds
            "AAA.AX": 15     # Cash/Money Market
        },
        benchmark="50% Bloomberg AusBond / 50% S&P/ASX 200",
        rebalance_frequency="quarterly",
        min_investment=50000,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2025-01-01T00:00:00Z",
        performance_ytd=4.2,
        aum_total=15000000,
        clients_count=45
    ),
    "balanced_growth": ModelPortfolio(
        model_id="balanced_growth",
        name="Balanced Growth",
        description="Balanced approach between growth and income",
        risk_profile=RiskProfile.BALANCED,
        target_allocation={
            "VAS.AX": 25,    # Australian Equities
            "VGS": 25,       # International Equities
            "VGE": 5,        # Emerging Markets
            "VAF.AX": 25,    # Australian Bonds
            "VAP.AX": 10,    # Australian Property
            "AAA.AX": 10     # Cash
        },
        benchmark="60% MSCI World / 40% Bloomberg Global Agg",
        rebalance_frequency="quarterly",
        min_investment=100000,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2025-01-01T00:00:00Z",
        performance_ytd=8.5,
        aum_total=45000000,
        clients_count=120
    ),
    "growth_focused": ModelPortfolio(
        model_id="growth_focused",
        name="Growth Focused",
        description="Higher growth with managed risk",
        risk_profile=RiskProfile.GROWTH,
        target_allocation={
            "VAS.AX": 30,    # Australian Equities
            "VGS": 35,       # International Equities
            "VGE": 10,       # Emerging Markets
            "NDQ": 10,       # NASDAQ 100
            "VAF.AX": 10,    # Bonds
            "AAA.AX": 5      # Cash
        },
        benchmark="MSCI World Index",
        rebalance_frequency="quarterly",
        min_investment=250000,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2025-01-01T00:00:00Z",
        performance_ytd=12.3,
        aum_total=78000000,
        clients_count=85
    ),
    "aggressive_tech": ModelPortfolio(
        model_id="aggressive_tech",
        name="Aggressive Tech Growth",
        description="Maximum growth through technology exposure",
        risk_profile=RiskProfile.AGGRESSIVE,
        target_allocation={
            "NDQ": 30,       # NASDAQ 100
            "FANG": 20,      # FAANG stocks
            "HACK": 10,      # Cybersecurity
            "ROBO": 10,      # Robotics & AI
            "VGS": 20,       # International Equities
            "AAA.AX": 10     # Cash
        },
        benchmark="NASDAQ 100 Index",
        rebalance_frequency="monthly",
        min_investment=500000,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2025-01-01T00:00:00Z",
        performance_ytd=18.7,
        aum_total=32000000,
        clients_count=28
    ),
    "crypto_allocation": ModelPortfolio(
        model_id="crypto_allocation",
        name="Crypto Allocation Strategy",
        description="Diversified crypto exposure within risk limits",
        risk_profile=RiskProfile.AGGRESSIVE,
        target_allocation={
            "BTC": 50,       # Bitcoin
            "ETH": 30,       # Ethereum
            "SOL": 10,       # Solana
            "LINK": 5,       # Chainlink
            "USDC": 5        # Stablecoin buffer
        },
        benchmark="Bitcoin Index",
        rebalance_frequency="monthly",
        min_investment=100000,
        created_at="2024-01-01T00:00:00Z",
        updated_at="2025-01-01T00:00:00Z",
        performance_ytd=45.2,
        aum_total=8500000,
        clients_count=15
    )
}


# ==================== CLIENT PORTFOLIO ASSIGNMENTS ====================

CLIENT_PORTFOLIOS: Dict[str, Dict] = {
    "client_1": {
        "client_id": "client_1",
        "client_name": "Wheeler Family",
        "model_id": "balanced_growth",
        "current_allocation": {
            "VAS.AX": 27, "VGS": 23, "VGE": 4, "VAF.AX": 24, "VAP.AX": 12, "AAA.AX": 10
        },
        "aum": 920000,
        "last_rebalance": "2025-02-15",
        "drift": 3.2
    },
    "client_2": {
        "client_id": "client_2",
        "client_name": "Chen Investment Trust",
        "model_id": "growth_focused",
        "current_allocation": {
            "VAS.AX": 28, "VGS": 38, "VGE": 8, "NDQ": 12, "VAF.AX": 9, "AAA.AX": 5
        },
        "aum": 4200000,
        "last_rebalance": "2025-01-20",
        "drift": 5.8
    },
    "client_3": {
        "client_id": "client_3",
        "client_name": "Thompson SMSF",
        "model_id": "conservative_income",
        "current_allocation": {
            "VAS.AX": 18, "VGS": 12, "VAF.AX": 38, "VIF.AX": 17, "AAA.AX": 15
        },
        "aum": 890000,
        "last_rebalance": "2025-03-01",
        "drift": 4.1
    }
}


# ==================== REBALANCING ENGINE ====================

class RebalanceAction(BaseModel):
    """Single rebalancing trade."""
    symbol: str
    action: str  # buy or sell
    current_weight: float
    target_weight: float
    drift: float
    shares: float
    estimated_value: float
    tax_impact: Optional[float] = None


class RebalancePlan(BaseModel):
    """Complete rebalancing plan for a client."""
    plan_id: str
    client_id: str
    model_id: str
    current_allocation: Dict[str, float]
    target_allocation: Dict[str, float]
    total_drift: float
    actions: List[RebalanceAction]
    estimated_trades: int
    estimated_commission: float
    tax_implications: Dict[str, Any]
    status: str = "pending"  # pending, approved, executing, completed
    created_at: str


REBALANCE_PLANS: Dict[str, RebalancePlan] = {}


def calculate_drift(current: Dict[str, float], target: Dict[str, float]) -> float:
    """Calculate total portfolio drift from target."""
    all_symbols = set(current.keys()) | set(target.keys())
    total_drift = sum(
        abs(current.get(s, 0) - target.get(s, 0))
        for s in all_symbols
    ) / 2
    return round(total_drift, 2)


def generate_rebalance_actions(
    client_id: str,
    current: Dict[str, float],
    target: Dict[str, float],
    aum: float,
    tax_aware: bool = True
) -> List[RebalanceAction]:
    """Generate specific rebalancing trades."""
    actions = []
    
    # Demo prices
    prices = {
        "VAS.AX": 92.50, "VGS": 108.30, "VGE": 72.15, "VAF.AX": 48.90,
        "VIF.AX": 51.20, "VAP.AX": 85.40, "AAA.AX": 50.00, "NDQ": 42.80,
        "FANG": 185.00, "HACK": 62.30, "ROBO": 45.60,
        "BTC": 67500, "ETH": 3450, "SOL": 145, "LINK": 14.50, "USDC": 1.0
    }
    
    all_symbols = set(current.keys()) | set(target.keys())
    
    for symbol in all_symbols:
        current_weight = current.get(symbol, 0)
        target_weight = target.get(symbol, 0)
        drift = target_weight - current_weight
        
        if abs(drift) < 1.0:  # Skip small drifts
            continue
        
        value_change = aum * drift / 100
        price = prices.get(symbol, 100)
        shares = abs(value_change / price)
        
        # Estimate tax impact for sells
        tax_impact = None
        if drift < 0 and tax_aware:
            # Assume 30% of sold position is gain, 23% tax rate
            estimated_gain = abs(value_change) * 0.30
            tax_impact = estimated_gain * 0.23
        
        actions.append(RebalanceAction(
            symbol=symbol,
            action="buy" if drift > 0 else "sell",
            current_weight=current_weight,
            target_weight=target_weight,
            drift=abs(drift),
            shares=round(shares, 4),
            estimated_value=abs(value_change),
            tax_impact=tax_impact
        ))
    
    # Sort by drift (largest first)
    actions.sort(key=lambda x: x.drift, reverse=True)
    return actions


# ==================== API ENDPOINTS ====================

@router.get("/models")
async def get_model_portfolios():
    """Get all model portfolios."""
    return {
        "models": [m.model_dump() for m in MODEL_PORTFOLIOS.values()],
        "total": len(MODEL_PORTFOLIOS)
    }


@router.get("/models/{model_id}")
async def get_model_portfolio(model_id: str):
    """Get specific model portfolio details."""
    if model_id not in MODEL_PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    return MODEL_PORTFOLIOS[model_id].model_dump()


@router.post("/models")
async def create_model_portfolio(model: ModelPortfolio):
    """Create a new model portfolio."""
    if model.model_id in MODEL_PORTFOLIOS:
        raise HTTPException(status_code=400, detail="Model already exists")
    
    model.created_at = datetime.now(timezone.utc).isoformat()
    model.updated_at = model.created_at
    MODEL_PORTFOLIOS[model.model_id] = model
    
    return {"success": True, "model_id": model.model_id}


@router.get("/clients")
async def get_client_portfolios():
    """Get all client portfolio assignments."""
    return {
        "clients": list(CLIENT_PORTFOLIOS.values()),
        "total": len(CLIENT_PORTFOLIOS)
    }


@router.get("/clients/{client_id}")
async def get_client_portfolio(client_id: str):
    """Get client portfolio assignment and drift analysis."""
    if client_id not in CLIENT_PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_PORTFOLIOS[client_id]
    model = MODEL_PORTFOLIOS.get(client["model_id"])
    
    if model:
        drift = calculate_drift(client["current_allocation"], model.target_allocation)
        client["drift"] = drift
        client["needs_rebalance"] = drift > 3.0
    
    return {
        "client": client,
        "model": model.model_dump() if model else None
    }


@router.post("/assign")
async def assign_model_portfolio(client_id: str, model_id: str):
    """Assign a model portfolio to a client."""
    if model_id not in MODEL_PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    
    model = MODEL_PORTFOLIOS[model_id]
    
    CLIENT_PORTFOLIOS[client_id] = {
        "client_id": client_id,
        "model_id": model_id,
        "current_allocation": model.target_allocation.copy(),
        "aum": 0,
        "last_rebalance": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "drift": 0
    }
    
    # Update model stats
    model.clients_count += 1
    
    return {
        "success": True,
        "client_id": client_id,
        "model_id": model_id,
        "message": f"Client assigned to {model.name}"
    }


@router.get("/rebalance/analyze/{client_id}")
async def analyze_rebalance(client_id: str, tax_aware: bool = True):
    """Analyze rebalancing needs for a client."""
    if client_id not in CLIENT_PORTFOLIOS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_PORTFOLIOS[client_id]
    model = MODEL_PORTFOLIOS.get(client["model_id"])
    
    if not model:
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    
    current = client["current_allocation"]
    target = model.target_allocation
    aum = client["aum"]
    
    drift = calculate_drift(current, target)
    actions = generate_rebalance_actions(client_id, current, target, aum, tax_aware)
    
    # Calculate totals
    total_trades = len(actions)
    total_commission = total_trades * 9.50  # $9.50 per trade
    total_tax = sum(a.tax_impact or 0 for a in actions)
    
    plan = RebalancePlan(
        plan_id=f"REB_{uuid.uuid4().hex[:8]}",
        client_id=client_id,
        model_id=client["model_id"],
        current_allocation=current,
        target_allocation=target,
        total_drift=drift,
        actions=[a.model_dump() for a in actions],
        estimated_trades=total_trades,
        estimated_commission=total_commission,
        tax_implications={
            "estimated_cgt": total_tax,
            "tax_aware": tax_aware,
            "recommendation": "Consider tax-loss harvesting opportunities" if total_tax > 1000 else "Tax impact minimal"
        },
        status="pending",
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    REBALANCE_PLANS[plan.plan_id] = plan
    
    return {
        "plan_id": plan.plan_id,
        "client_id": client_id,
        "client_name": client.get("client_name", "Unknown"),
        "model_name": model.name,
        "analysis": {
            "current_drift": drift,
            "drift_threshold": 3.0,
            "needs_rebalance": drift > 3.0,
            "days_since_last": (datetime.now() - datetime.strptime(client["last_rebalance"], "%Y-%m-%d")).days
        },
        "actions": [a.model_dump() for a in actions],
        "summary": {
            "buys": len([a for a in actions if a.action == "buy"]),
            "sells": len([a for a in actions if a.action == "sell"]),
            "total_trades": total_trades,
            "estimated_commission": total_commission,
            "estimated_tax": total_tax
        }
    }


@router.post("/rebalance/execute/{plan_id}")
async def execute_rebalance(plan_id: str, background_tasks: BackgroundTasks):
    """Execute a rebalancing plan."""
    if plan_id not in REBALANCE_PLANS:
        raise HTTPException(status_code=404, detail="Rebalance plan not found")
    
    plan = REBALANCE_PLANS[plan_id]
    
    if plan.status != "pending":
        raise HTTPException(status_code=400, detail=f"Plan already {plan.status}")
    
    plan.status = "executing"
    
    # Simulate execution
    executed_orders = []
    for action in plan.actions:
        order_id = f"ORD_{uuid.uuid4().hex[:8]}"
        executed_orders.append({
            "order_id": order_id,
            "symbol": action["symbol"],
            "action": action["action"],
            "shares": action["shares"],
            "estimated_value": action["estimated_value"],
            "status": "filled"
        })
    
    # Update client allocation
    if plan.client_id in CLIENT_PORTFOLIOS:
        CLIENT_PORTFOLIOS[plan.client_id]["current_allocation"] = plan.target_allocation.copy()
        CLIENT_PORTFOLIOS[plan.client_id]["last_rebalance"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        CLIENT_PORTFOLIOS[plan.client_id]["drift"] = 0
    
    plan.status = "completed"
    
    return {
        "success": True,
        "plan_id": plan_id,
        "status": "completed",
        "orders_executed": len(executed_orders),
        "orders": executed_orders,
        "message": f"Rebalancing complete: {len(executed_orders)} trades executed"
    }


@router.get("/rebalance/all")
async def get_all_rebalance_needs():
    """Get rebalancing needs across all clients."""
    needs_rebalance = []
    
    for client_id, client in CLIENT_PORTFOLIOS.items():
        model = MODEL_PORTFOLIOS.get(client["model_id"])
        if not model:
            continue
        
        drift = calculate_drift(client["current_allocation"], model.target_allocation)
        
        if drift > 2.0:  # Show clients with >2% drift
            needs_rebalance.append({
                "client_id": client_id,
                "client_name": client.get("client_name", "Unknown"),
                "model_name": model.name,
                "aum": client["aum"],
                "drift": drift,
                "last_rebalance": client["last_rebalance"],
                "priority": "high" if drift > 5 else "medium" if drift > 3 else "low"
            })
    
    # Sort by drift
    needs_rebalance.sort(key=lambda x: x["drift"], reverse=True)
    
    return {
        "clients_needing_rebalance": len(needs_rebalance),
        "total_aum_affected": sum(c["aum"] for c in needs_rebalance),
        "clients": needs_rebalance
    }


@router.post("/rebalance/batch")
async def batch_rebalance(client_ids: List[str], background_tasks: BackgroundTasks):
    """Execute batch rebalancing for multiple clients."""
    results = []
    
    for client_id in client_ids:
        try:
            # Analyze
            analysis = await analyze_rebalance(client_id)
            plan_id = analysis["plan_id"]
            
            # Execute
            execution = await execute_rebalance(plan_id, background_tasks)
            
            results.append({
                "client_id": client_id,
                "status": "success",
                "orders": execution["orders_executed"]
            })
        except Exception as e:
            results.append({
                "client_id": client_id,
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "batch_id": f"BATCH_{uuid.uuid4().hex[:8]}",
        "total_clients": len(client_ids),
        "successful": len([r for r in results if r["status"] == "success"]),
        "failed": len([r for r in results if r["status"] == "failed"]),
        "results": results
    }


@router.get("/drift-report")
async def get_drift_report():
    """Get comprehensive drift report across all model portfolios."""
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "models": [],
        "summary": {
            "total_clients": 0,
            "total_aum": 0,
            "clients_in_drift": 0,
            "aum_in_drift": 0
        }
    }
    
    for model_id, model in MODEL_PORTFOLIOS.items():
        model_clients = [c for c in CLIENT_PORTFOLIOS.values() if c["model_id"] == model_id]
        
        in_drift = []
        for client in model_clients:
            drift = calculate_drift(client["current_allocation"], model.target_allocation)
            if drift > 2.0:
                in_drift.append({
                    "client_id": client["client_id"],
                    "drift": drift,
                    "aum": client["aum"]
                })
        
        model_report = {
            "model_id": model_id,
            "model_name": model.name,
            "total_clients": len(model_clients),
            "total_aum": sum(c["aum"] for c in model_clients),
            "clients_in_drift": len(in_drift),
            "aum_in_drift": sum(c["aum"] for c in in_drift),
            "clients": in_drift
        }
        
        report["models"].append(model_report)
        report["summary"]["total_clients"] += len(model_clients)
        report["summary"]["total_aum"] += model_report["total_aum"]
        report["summary"]["clients_in_drift"] += len(in_drift)
        report["summary"]["aum_in_drift"] += model_report["aum_in_drift"]
    
    return report
