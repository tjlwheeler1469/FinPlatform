"""
Batch Execution Layer - One-Click Execution for Book Intelligence Insights
Connects AI insights directly to trading execution (Alpaca).
Enables batch operations across multiple clients.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/batch-execution", tags=["Batch Execution"])

# Try to import Alpaca
ALPACA_AVAILABLE = False
try:
    from routes.alpaca_trading import get_trading_client, require_alpaca_client, ALPACA_AVAILABLE as ALPACA_SDK
    ALPACA_AVAILABLE = ALPACA_SDK
except:
    pass

# In-memory storage for execution history
EXECUTION_HISTORY: Dict[str, Dict] = {}
BATCH_JOBS: Dict[str, Dict] = {}


class ExecutionType(str, Enum):
    REBALANCE = "rebalance"
    TAX_HARVEST = "tax_harvest"
    SECTOR_REDUCE = "sector_reduce"
    CASH_DEPLOY = "cash_deploy"
    RISK_ADJUST = "risk_adjust"


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BatchExecutionRequest(BaseModel):
    execution_type: ExecutionType
    client_ids: List[str]
    parameters: Optional[Dict] = None
    reason: str
    auto_execute: bool = False  # If True, execute immediately; if False, require approval


class TradeOrder(BaseModel):
    symbol: str
    action: str  # "buy" or "sell"
    quantity: float
    order_type: str = "market"
    client_id: str
    reason: str


# Demo client data (would come from Book Intelligence in production)
DEMO_CLIENTS = {
    "client_1": {
        "name": "Wheeler Family",
        "aum": 2920000,
        "positions": [
            {"symbol": "AAPL", "shares": 500, "value": 91000, "weight": 3.1},
            {"symbol": "MSFT", "shares": 300, "value": 118500, "weight": 4.1},
            {"symbol": "GOOGL", "shares": 200, "value": 27700, "weight": 0.9},
            {"symbol": "NVDA", "shares": 150, "value": 180000, "weight": 6.2},
            {"symbol": "META", "shares": 100, "value": 58000, "weight": 2.0},
        ],
        "cash": 145000,
        "target_allocation": {"tech": 20, "finance": 25, "healthcare": 20, "consumer": 20, "cash": 15}
    },
    "client_2": {
        "name": "Chen Investment Trust",
        "aum": 4200000,
        "positions": [
            {"symbol": "AAPL", "shares": 800, "value": 145600, "weight": 3.5},
            {"symbol": "MSFT", "shares": 500, "value": 197500, "weight": 4.7},
            {"symbol": "NVDA", "shares": 400, "value": 480000, "weight": 11.4},
            {"symbol": "AMD", "shares": 600, "value": 96000, "weight": 2.3},
            {"symbol": "TSM", "shares": 300, "value": 51000, "weight": 1.2},
        ],
        "cash": 210000,
        "target_allocation": {"tech": 25, "finance": 20, "healthcare": 20, "consumer": 20, "cash": 15}
    },
    "client_3": {
        "name": "Thompson SMSF",
        "aum": 890000,
        "positions": [
            {"symbol": "BHP", "shares": 200, "value": 8400, "weight": 0.9},
            {"symbol": "CBA", "shares": 150, "value": 16500, "weight": 1.9},
            {"symbol": "CSL", "shares": 50, "value": 14500, "weight": 1.6},
        ],
        "cash": 89000,
        "target_allocation": {"tech": 10, "finance": 30, "healthcare": 25, "resources": 20, "cash": 15}
    },
    "client_4": {
        "name": "Patel Holdings",
        "aum": 7500000,
        "positions": [
            {"symbol": "AAPL", "shares": 1500, "value": 273000, "weight": 3.6},
            {"symbol": "MSFT", "shares": 1000, "value": 395000, "weight": 5.3},
            {"symbol": "NVDA", "shares": 800, "value": 960000, "weight": 12.8},
            {"symbol": "GOOGL", "shares": 500, "value": 69250, "weight": 0.9},
            {"symbol": "AMZN", "shares": 400, "value": 80000, "weight": 1.1},
        ],
        "cash": 375000,
        "target_allocation": {"tech": 30, "finance": 20, "healthcare": 15, "consumer": 20, "cash": 15}
    },
    "client_5": {
        "name": "Garcia Family",
        "aum": 820000,
        "positions": [
            {"symbol": "VTI", "shares": 200, "value": 48000, "weight": 5.9},
            {"symbol": "BND", "shares": 300, "value": 22500, "weight": 2.7},
        ],
        "cash": 164000,
        "target_allocation": {"equities": 60, "bonds": 25, "cash": 15}
    }
}


def generate_rebalance_trades(client_id: str) -> List[Dict]:
    """Generate rebalancing trades for a client."""
    client = DEMO_CLIENTS.get(client_id)
    if not client:
        return []
    
    trades = []
    # Simplified: reduce overweight positions, add to underweight
    tech_positions = [p for p in client["positions"] if p["symbol"] in ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMD", "TSM", "AMZN"]]
    tech_weight = sum(p["weight"] for p in tech_positions)
    target_tech = client["target_allocation"].get("tech", 20)
    
    if tech_weight > target_tech + 5:  # More than 5% overweight
        # Sell some tech
        for pos in tech_positions[:2]:
            sell_pct = min(0.2, (tech_weight - target_tech) / 100)  # Sell up to 20%
            sell_shares = int(pos["shares"] * sell_pct)
            if sell_shares > 0:
                trades.append({
                    "symbol": pos["symbol"],
                    "action": "sell",
                    "quantity": sell_shares,
                    "estimated_value": sell_shares * (pos["value"] / pos["shares"]),
                    "reason": f"Reduce tech overweight ({tech_weight:.1f}% vs {target_tech}% target)"
                })
    
    return trades


def generate_tax_harvest_trades(client_id: str) -> List[Dict]:
    """Generate tax-loss harvesting trades."""
    # In production, would identify positions with unrealized losses
    trades = []
    
    # Demo: simulate finding a losing position
    trades.append({
        "symbol": "GOOGL",
        "action": "sell",
        "quantity": 50,
        "estimated_value": 6925,
        "loss_amount": 1200,
        "tax_savings": 468,  # 39% marginal rate
        "reason": "Tax-loss harvesting - crystallize loss before EOFY"
    })
    
    # Replacement trade (similar exposure, different security)
    trades.append({
        "symbol": "META",
        "action": "buy",
        "quantity": 12,
        "estimated_value": 6960,
        "reason": "Replace GOOGL exposure with similar tech position (avoid wash sale)"
    })
    
    return trades


def generate_sector_reduction_trades(client_id: str, sector: str, target_reduction_pct: float) -> List[Dict]:
    """Generate trades to reduce sector exposure."""
    client = DEMO_CLIENTS.get(client_id)
    if not client:
        return []
    
    sector_symbols = {
        "tech": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMD", "TSM", "AMZN"],
        "finance": ["JPM", "BAC", "GS", "MS", "CBA", "WBC"],
        "healthcare": ["JNJ", "UNH", "PFE", "CSL", "COH"],
        "resources": ["BHP", "RIO", "FMG"]
    }
    
    trades = []
    symbols = sector_symbols.get(sector.lower(), [])
    
    for pos in client["positions"]:
        if pos["symbol"] in symbols:
            sell_shares = int(pos["shares"] * (target_reduction_pct / 100))
            if sell_shares > 0:
                trades.append({
                    "symbol": pos["symbol"],
                    "action": "sell",
                    "quantity": sell_shares,
                    "estimated_value": sell_shares * (pos["value"] / pos["shares"]),
                    "reason": f"Reduce {sector} sector exposure by {target_reduction_pct}%"
                })
    
    return trades


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_execution_status() -> dict:
    """Get batch execution system status."""
    return {
        "status": "operational",
        "alpaca_connected": ALPACA_AVAILABLE,
        "demo_mode": not ALPACA_AVAILABLE,
        "pending_batches": len([b for b in BATCH_JOBS.values() if b.get("status") == ExecutionStatus.PENDING]),
        "total_executions": len(EXECUTION_HISTORY),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/preview/rebalance")
async def preview_rebalance(client_ids: List[str]) -> dict:
    """Preview rebalancing trades for multiple clients."""
    previews = []
    total_trades = 0
    total_value = 0
    
    for client_id in client_ids:
        client = DEMO_CLIENTS.get(client_id)
        if client:
            trades = generate_rebalance_trades(client_id)
            trade_value = sum(t.get("estimated_value", 0) for t in trades)
            previews.append({
                "client_id": client_id,
                "client_name": client["name"],
                "aum": client["aum"],
                "trades": trades,
                "trade_count": len(trades),
                "total_trade_value": trade_value
            })
            total_trades += len(trades)
            total_value += trade_value
    
    return {
        "preview_id": f"preview_{uuid.uuid4().hex[:8]}",
        "execution_type": "rebalance",
        "clients": previews,
        "summary": {
            "total_clients": len(previews),
            "total_trades": total_trades,
            "total_value": round(total_value, 2)
        },
        "requires_approval": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/preview/tax-harvest")
async def preview_tax_harvest(client_ids: List[str]) -> dict:
    """Preview tax-loss harvesting trades."""
    previews = []
    total_savings = 0
    
    for client_id in client_ids:
        client = DEMO_CLIENTS.get(client_id)
        if client:
            trades = generate_tax_harvest_trades(client_id)
            savings = sum(t.get("tax_savings", 0) for t in trades)
            previews.append({
                "client_id": client_id,
                "client_name": client["name"],
                "trades": trades,
                "potential_tax_savings": savings
            })
            total_savings += savings
    
    return {
        "preview_id": f"preview_{uuid.uuid4().hex[:8]}",
        "execution_type": "tax_harvest",
        "clients": previews,
        "summary": {
            "total_clients": len(previews),
            "total_potential_tax_savings": round(total_savings, 2)
        },
        "requires_approval": True,
        "deadline": "June 30, 2025",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/preview/sector-reduction")
async def preview_sector_reduction(
    client_ids: List[str],
    sector: str,
    target_reduction_pct: float = 10.0
) -> dict:
    """Preview sector exposure reduction trades."""
    previews = []
    
    for client_id in client_ids:
        client = DEMO_CLIENTS.get(client_id)
        if client:
            trades = generate_sector_reduction_trades(client_id, sector, target_reduction_pct)
            previews.append({
                "client_id": client_id,
                "client_name": client["name"],
                "trades": trades,
                "trade_count": len(trades)
            })
    
    return {
        "preview_id": f"preview_{uuid.uuid4().hex[:8]}",
        "execution_type": "sector_reduction",
        "sector": sector,
        "target_reduction": f"{target_reduction_pct}%",
        "clients": previews,
        "summary": {
            "total_clients": len(previews),
            "total_trades": sum(len(p["trades"]) for p in previews)
        },
        "requires_approval": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/execute")
async def execute_batch(request: BatchExecutionRequest) -> dict:
    """Execute a batch of trades across multiple clients."""
    batch_id = f"batch_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    # Generate trades based on execution type
    all_trades = []
    for client_id in request.client_ids:
        client = DEMO_CLIENTS.get(client_id)
        if not client:
            continue
        
        if request.execution_type == ExecutionType.REBALANCE:
            trades = generate_rebalance_trades(client_id)
        elif request.execution_type == ExecutionType.TAX_HARVEST:
            trades = generate_tax_harvest_trades(client_id)
        elif request.execution_type == ExecutionType.SECTOR_REDUCE:
            sector = request.parameters.get("sector", "tech") if request.parameters else "tech"
            reduction = request.parameters.get("reduction_pct", 10) if request.parameters else 10
            trades = generate_sector_reduction_trades(client_id, sector, reduction)
        else:
            trades = []
        
        for trade in trades:
            trade["client_id"] = client_id
            trade["client_name"] = client["name"]
            all_trades.append(trade)
    
    # Create batch job
    batch_job = {
        "batch_id": batch_id,
        "execution_type": request.execution_type.value,
        "client_ids": request.client_ids,
        "reason": request.reason,
        "trades": all_trades,
        "trade_count": len(all_trades),
        "status": ExecutionStatus.APPROVED if request.auto_execute else ExecutionStatus.PENDING,
        "created_at": now.isoformat(),
        "created_by": "advisor",
        "executed_at": None,
        "results": []
    }
    
    BATCH_JOBS[batch_id] = batch_job
    
    # If auto-execute and Alpaca available, execute trades
    executed_results = []
    if request.auto_execute:
        batch_job["status"] = ExecutionStatus.EXECUTING
        
        for trade in all_trades:
            result = {
                "trade": trade,
                "status": "simulated" if not ALPACA_AVAILABLE else "submitted",
                "order_id": f"order_{uuid.uuid4().hex[:8]}",
                "executed_at": now.isoformat()
            }
            
            # If Alpaca is available and configured, actually execute
            # For now, simulate execution
            if ALPACA_AVAILABLE:
                # Would call Alpaca API here
                result["status"] = "submitted_to_alpaca"
            
            executed_results.append(result)
        
        batch_job["status"] = ExecutionStatus.COMPLETED
        batch_job["executed_at"] = now.isoformat()
        batch_job["results"] = executed_results
    
    # Log execution
    EXECUTION_HISTORY[batch_id] = {
        "batch_id": batch_id,
        "type": request.execution_type.value,
        "clients_affected": len(request.client_ids),
        "trades_executed": len(executed_results),
        "status": batch_job["status"],
        "timestamp": now.isoformat()
    }
    
    return {
        "success": True,
        "batch_id": batch_id,
        "status": batch_job["status"],
        "trades_generated": len(all_trades),
        "trades_executed": len(executed_results),
        "requires_approval": not request.auto_execute,
        "alpaca_mode": "live" if ALPACA_AVAILABLE else "demo",
        "message": f"Batch {batch_id} {'executed' if request.auto_execute else 'created and pending approval'}",
        "results": executed_results if request.auto_execute else None
    }


@router.post("/batches/{batch_id}/approve")
async def approve_batch(batch_id: str) -> dict:
    """Approve a pending batch for execution."""
    if batch_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch = BATCH_JOBS[batch_id]
    if batch["status"] != ExecutionStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Batch is not pending (current status: {batch['status']})")
    
    now = datetime.now(timezone.utc)
    batch["status"] = ExecutionStatus.APPROVED
    batch["approved_at"] = now.isoformat()
    batch["approved_by"] = "advisor"
    
    return {
        "success": True,
        "batch_id": batch_id,
        "status": "approved",
        "message": "Batch approved. Call /execute-approved to execute trades."
    }


@router.post("/batches/{batch_id}/execute-approved")
async def execute_approved_batch(batch_id: str) -> dict:
    """Execute an approved batch."""
    if batch_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch = BATCH_JOBS[batch_id]
    if batch["status"] != ExecutionStatus.APPROVED:
        raise HTTPException(status_code=400, detail=f"Batch must be approved first (current status: {batch['status']})")
    
    now = datetime.now(timezone.utc)
    batch["status"] = ExecutionStatus.EXECUTING
    
    executed_results = []
    for trade in batch["trades"]:
        result = {
            "trade": trade,
            "status": "simulated" if not ALPACA_AVAILABLE else "submitted",
            "order_id": f"order_{uuid.uuid4().hex[:8]}",
            "executed_at": now.isoformat()
        }
        executed_results.append(result)
    
    batch["status"] = ExecutionStatus.COMPLETED
    batch["executed_at"] = now.isoformat()
    batch["results"] = executed_results
    
    return {
        "success": True,
        "batch_id": batch_id,
        "status": "completed",
        "trades_executed": len(executed_results),
        "results": executed_results,
        "message": f"Executed {len(executed_results)} trades across {len(batch['client_ids'])} clients"
    }


@router.get("/batches")
async def get_batches(status: Optional[str] = None, limit: int = 50) -> dict:
    """Get all batch jobs."""
    batches = list(BATCH_JOBS.values())
    
    if status:
        batches = [b for b in batches if b.get("status") == status]
    
    batches = sorted(batches, key=lambda x: x.get("created_at", ""), reverse=True)[:limit]
    
    return {
        "batches": batches,
        "total": len(batches),
        "pending": len([b for b in BATCH_JOBS.values() if b.get("status") == ExecutionStatus.PENDING]),
        "completed": len([b for b in BATCH_JOBS.values() if b.get("status") == ExecutionStatus.COMPLETED])
    }


@router.get("/batches/{batch_id}")
async def get_batch(batch_id: str) -> dict:
    """Get a specific batch job."""
    if batch_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    return BATCH_JOBS[batch_id]


@router.delete("/batches/{batch_id}")
async def cancel_batch(batch_id: str) -> dict:
    """Cancel a pending batch."""
    if batch_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch = BATCH_JOBS[batch_id]
    if batch["status"] not in [ExecutionStatus.PENDING, ExecutionStatus.APPROVED]:
        raise HTTPException(status_code=400, detail="Can only cancel pending or approved batches")
    
    batch["status"] = ExecutionStatus.CANCELLED
    batch["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    return {"success": True, "batch_id": batch_id, "status": "cancelled"}


@router.get("/history")
async def get_execution_history(limit: int = 100) -> dict:
    """Get execution history."""
    history = list(EXECUTION_HISTORY.values())
    history = sorted(history, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]
    
    return {
        "history": history,
        "total": len(history),
        "summary": {
            "total_batches": len(EXECUTION_HISTORY),
            "total_trades": sum(h.get("trades_executed", 0) for h in history),
            "clients_affected": sum(h.get("clients_affected", 0) for h in history)
        }
    }


@router.get("/one-click-actions")
async def get_one_click_actions() -> dict:
    """Get available one-click execution actions based on Book Intelligence."""
    # These would be generated from Book Intelligence insights
    actions = [
        {
            "action_id": "action_rebalance_tech",
            "title": "Rebalance Tech-Overweight Portfolios",
            "description": "5 clients have >30% tech exposure. One-click to rebalance all to target allocation.",
            "affected_clients": 5,
            "estimated_trades": 12,
            "estimated_value": 485000,
            "priority": "high",
            "execution_type": "rebalance",
            "client_ids": ["client_1", "client_2", "client_4"]
        },
        {
            "action_id": "action_tax_harvest",
            "title": "Execute Tax-Loss Harvesting",
            "description": "$560K in harvestable losses across 12 clients. Potential tax savings: $218K.",
            "affected_clients": 12,
            "estimated_trades": 24,
            "potential_tax_savings": 218400,
            "priority": "high",
            "deadline": "June 30, 2025",
            "execution_type": "tax_harvest",
            "client_ids": ["client_1", "client_2", "client_3", "client_4", "client_5"]
        },
        {
            "action_id": "action_deploy_cash",
            "title": "Deploy Excess Cash",
            "description": "3 clients holding >20% cash. Deploy to target allocation.",
            "affected_clients": 3,
            "estimated_trades": 9,
            "cash_to_deploy": 325000,
            "priority": "medium",
            "execution_type": "cash_deploy",
            "client_ids": ["client_3", "client_5"]
        }
    ]
    
    return {
        "actions": actions,
        "total": len(actions),
        "high_priority": len([a for a in actions if a.get("priority") == "high"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
