"""
Action Layer - Execution Engine
1-Click execution for insights: Portfolio rebalancing, tax loss harvesting, client communications.
This is the core of the "System of Execution" - transforming insights into actions.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/actions", tags=["Action Layer"])


class ActionType(str, Enum):
    REBALANCE = "rebalance"
    TAX_HARVEST = "tax_harvest"
    CLIENT_COMM = "client_communication"
    TRADE = "trade"
    ALERT = "alert"
    TASK = "task"


class ActionStatus(str, Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ActionPriority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# In-memory action queue (would be MongoDB in production)
ACTION_QUEUE: List[Dict] = []
EXECUTION_LOG: List[Dict] = []


class ActionRequest(BaseModel):
    action_type: ActionType
    target_id: str  # client_id, portfolio_id, etc.
    parameters: Optional[Dict[str, Any]] = {}
    priority: ActionPriority = ActionPriority.MEDIUM
    notes: Optional[str] = None


class RebalanceRequest(BaseModel):
    portfolio_id: str
    client_id: str
    target_allocation: Optional[Dict[str, float]] = None
    drift_threshold: float = 5.0
    execute_immediately: bool = True


class TaxHarvestRequest(BaseModel):
    client_id: str
    max_losses_to_harvest: float = 50000
    wash_sale_aware: bool = True
    execute_immediately: bool = True


class ClientCommRequest(BaseModel):
    client_id: str
    template_type: str  # "review_reminder", "market_update", "portfolio_alert"
    channel: str = "email"  # email, sms, app_notification
    personalize: bool = True
    send_immediately: bool = True


class TradeRequest(BaseModel):
    client_id: str
    symbol: str
    action: str  # buy, sell
    quantity: Optional[float] = None
    amount: Optional[float] = None
    order_type: str = "market"
    limit_price: Optional[float] = None
    reason: Optional[str] = None


# ==================== NEXT BEST ACTIONS ENGINE ====================

@router.get("/next-best-actions")
async def get_next_best_actions(advisor_id: str = "default", limit: int = 10):
    """
    Get prioritized list of next best actions for the advisor.
    This is the core of the daily workflow - "What should I do today?"
    """
    
    # Generate intelligent actions based on simulated portfolio analysis
    actions = [
        {
            "action_id": f"act_{uuid.uuid4().hex[:8]}",
            "type": ActionType.REBALANCE,
            "priority": ActionPriority.HIGH,
            "title": "Rebalance 12 Portfolios",
            "description": "12 client portfolios have drifted >5% from target allocation",
            "impact": {
                "clients_affected": 12,
                "estimated_trades": 34,
                "drift_reduced": "5.2% → <2%"
            },
            "execute_url": "/api/actions/execute/batch-rebalance",
            "preview_url": "/api/actions/preview/batch-rebalance",
            "one_click": True,
            "estimated_time": "2 minutes",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "action_id": f"act_{uuid.uuid4().hex[:8]}",
            "type": ActionType.TAX_HARVEST,
            "priority": ActionPriority.HIGH,
            "title": "Tax Loss Harvest - 5 Clients",
            "description": "Harvest $127,450 in losses before end of financial year",
            "impact": {
                "clients_affected": 5,
                "total_losses": 127450,
                "estimated_tax_savings": 59904,
                "positions_to_sell": 8
            },
            "execute_url": "/api/actions/execute/tax-harvest",
            "preview_url": "/api/actions/preview/tax-harvest",
            "one_click": True,
            "estimated_time": "3 minutes",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "action_id": f"act_{uuid.uuid4().hex[:8]}",
            "type": ActionType.CLIENT_COMM,
            "priority": ActionPriority.MEDIUM,
            "title": "Follow Up - 3 Clients",
            "description": "Clients haven't responded to review reminders",
            "impact": {
                "clients_affected": 3,
                "last_contact_avg": "18 days ago",
                "template": "gentle_followup"
            },
            "execute_url": "/api/actions/execute/send-followups",
            "preview_url": "/api/actions/preview/send-followups",
            "one_click": True,
            "estimated_time": "1 minute",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "action_id": f"act_{uuid.uuid4().hex[:8]}",
            "type": ActionType.TRADE,
            "priority": ActionPriority.MEDIUM,
            "title": "Execute Model Portfolio Update",
            "description": "3 clients need NVDA added per model update",
            "impact": {
                "clients_affected": 3,
                "symbol": "NVDA",
                "action": "buy",
                "total_investment": 45000
            },
            "execute_url": "/api/actions/execute/model-trade",
            "preview_url": "/api/actions/preview/model-trade",
            "one_click": True,
            "estimated_time": "1 minute",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "action_id": f"act_{uuid.uuid4().hex[:8]}",
            "type": ActionType.ALERT,
            "priority": ActionPriority.HIGH,
            "title": "Review: Tech Overweight",
            "description": "18 clients are overweight tech sector by >10%",
            "impact": {
                "clients_affected": 18,
                "avg_overweight": "12.4%",
                "recommendation": "reduce_exposure"
            },
            "execute_url": "/api/actions/execute/sector-rebalance",
            "preview_url": "/api/actions/preview/sector-rebalance",
            "one_click": True,
            "estimated_time": "5 minutes",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "action_id": f"act_{uuid.uuid4().hex[:8]}",
            "type": ActionType.TASK,
            "priority": ActionPriority.LOW,
            "title": "Update Insurance Records",
            "description": "4 clients have upcoming policy renewals",
            "impact": {
                "clients_affected": 4,
                "renewal_dates": ["2025-03-25", "2025-03-28", "2025-04-01", "2025-04-05"]
            },
            "execute_url": "/api/actions/execute/insurance-review",
            "preview_url": "/api/actions/preview/insurance-review",
            "one_click": False,
            "estimated_time": "15 minutes",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Calculate summary
    total_clients = sum(a["impact"].get("clients_affected", 0) for a in actions)
    high_priority = len([a for a in actions if a["priority"] in [ActionPriority.HIGH, ActionPriority.URGENT]])
    
    return {
        "advisor_id": advisor_id,
        "actions": actions[:limit],
        "summary": {
            "total_actions": len(actions),
            "high_priority": high_priority,
            "clients_to_action": total_clients,
            "estimated_total_time": "22 minutes"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== EXECUTION ENDPOINTS ====================

@router.post("/execute/rebalance")
async def execute_rebalance(request: RebalanceRequest):
    """Execute portfolio rebalancing with one click."""
    
    # Simulate rebalancing execution
    execution_id = f"exec_{uuid.uuid4().hex[:8]}"
    
    trades_generated = [
        {"symbol": "VAS.AX", "action": "sell", "quantity": 45, "value": 4234.56, "reason": "Reduce AU equity"},
        {"symbol": "VGS.AX", "action": "buy", "quantity": 30, "value": 3456.78, "reason": "Increase intl equity"},
        {"symbol": "VAF.AX", "action": "buy", "quantity": 50, "value": 2345.67, "reason": "Increase fixed income"},
    ]
    
    result = {
        "execution_id": execution_id,
        "status": ActionStatus.COMPLETED,
        "portfolio_id": request.portfolio_id,
        "client_id": request.client_id,
        "trades_executed": len(trades_generated),
        "trades": trades_generated,
        "before": {
            "au_equity": 45,
            "intl_equity": 30,
            "fixed_income": 15,
            "cash": 10
        },
        "after": {
            "au_equity": 40,
            "intl_equity": 35,
            "fixed_income": 18,
            "cash": 7
        },
        "drift_before": 5.2,
        "drift_after": 0.8,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "demo_mode": True
    }
    
    EXECUTION_LOG.append(result)
    
    return {
        "success": True,
        "message": f"Portfolio rebalanced successfully. {len(trades_generated)} trades executed.",
        "result": result
    }


@router.post("/execute/batch-rebalance")
async def execute_batch_rebalance(portfolio_ids: List[str] = None, drift_threshold: float = 5.0):
    """Execute batch rebalancing across multiple portfolios with one click."""
    
    # Simulate batch execution
    execution_id = f"batch_{uuid.uuid4().hex[:8]}"
    
    portfolios_rebalanced = [
        {"portfolio_id": "pf_001", "client": "Wheeler Family", "trades": 3, "drift_reduced": "6.2% → 1.1%"},
        {"portfolio_id": "pf_002", "client": "Chen Trust", "trades": 2, "drift_reduced": "5.8% → 0.9%"},
        {"portfolio_id": "pf_003", "client": "Johnson SMSF", "trades": 4, "drift_reduced": "7.1% → 1.3%"},
        {"portfolio_id": "pf_004", "client": "Smith Family", "trades": 2, "drift_reduced": "5.4% → 0.7%"},
        {"portfolio_id": "pf_005", "client": "Lee Investment", "trades": 3, "drift_reduced": "5.9% → 1.0%"},
        {"portfolio_id": "pf_006", "client": "Brown Super", "trades": 2, "drift_reduced": "5.2% → 0.8%"},
        {"portfolio_id": "pf_007", "client": "Davis Trust", "trades": 3, "drift_reduced": "6.5% → 1.2%"},
        {"portfolio_id": "pf_008", "client": "Wilson SMSF", "trades": 4, "drift_reduced": "8.2% → 1.5%"},
        {"portfolio_id": "pf_009", "client": "Taylor Family", "trades": 2, "drift_reduced": "5.1% → 0.6%"},
        {"portfolio_id": "pf_010", "client": "Anderson Trust", "trades": 3, "drift_reduced": "5.7% → 0.9%"},
        {"portfolio_id": "pf_011", "client": "Thomas Super", "trades": 3, "drift_reduced": "6.0% → 1.1%"},
        {"portfolio_id": "pf_012", "client": "Jackson Family", "trades": 3, "drift_reduced": "5.5% → 0.8%"},
    ]
    
    total_trades = sum(p["trades"] for p in portfolios_rebalanced)
    
    return {
        "success": True,
        "execution_id": execution_id,
        "status": ActionStatus.COMPLETED,
        "summary": {
            "portfolios_rebalanced": len(portfolios_rebalanced),
            "total_trades_executed": total_trades,
            "average_drift_reduction": "5.9% → 1.0%",
            "execution_time": "1.8 seconds"
        },
        "portfolios": portfolios_rebalanced,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "demo_mode": True,
        "message": f"Successfully rebalanced {len(portfolios_rebalanced)} portfolios with {total_trades} trades"
    }


@router.post("/execute/tax-harvest")
async def execute_tax_harvest(request: TaxHarvestRequest):
    """Execute tax loss harvesting with one click."""
    
    execution_id = f"harvest_{uuid.uuid4().hex[:8]}"
    
    harvested_positions = [
        {"symbol": "TSLA", "loss": 12450, "cost_basis": 45000, "current_value": 32550, "action": "sell"},
        {"symbol": "META", "loss": 8900, "cost_basis": 28000, "current_value": 19100, "action": "sell"},
        {"symbol": "NFLX", "loss": 15600, "cost_basis": 42000, "current_value": 26400, "action": "sell"},
    ]
    
    replacement_positions = [
        {"symbol": "QQQ", "action": "buy", "value": 32550, "reason": "Similar exposure to TSLA"},
        {"symbol": "GOOGL", "action": "buy", "value": 19100, "reason": "Similar exposure to META"},
        {"symbol": "DIS", "action": "buy", "value": 26400, "reason": "Similar exposure to NFLX"},
    ]
    
    total_loss = sum(p["loss"] for p in harvested_positions)
    tax_savings = total_loss * 0.47  # Assume 47% marginal rate
    
    return {
        "success": True,
        "execution_id": execution_id,
        "status": ActionStatus.COMPLETED,
        "client_id": request.client_id,
        "harvested_positions": harvested_positions,
        "replacement_positions": replacement_positions,
        "summary": {
            "total_losses_harvested": total_loss,
            "estimated_tax_savings": round(tax_savings, 2),
            "positions_sold": len(harvested_positions),
            "replacements_bought": len(replacement_positions),
            "wash_sale_compliant": request.wash_sale_aware
        },
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "demo_mode": True,
        "message": f"Harvested ${total_loss:,.0f} in losses. Estimated tax savings: ${tax_savings:,.0f}"
    }


@router.post("/execute/send-followups")
async def execute_send_followups(client_ids: List[str] = None, template: str = "gentle_followup"):
    """Send follow-up communications to clients with one click."""
    
    execution_id = f"comm_{uuid.uuid4().hex[:8]}"
    
    sent_messages = [
        {"client_id": "client_001", "client_name": "John Wheeler", "email": "j.wheeler@email.com", "status": "sent", "template": template},
        {"client_id": "client_002", "client_name": "Sarah Chen", "email": "s.chen@email.com", "status": "sent", "template": template},
        {"client_id": "client_003", "client_name": "Michael Johnson", "email": "m.johnson@email.com", "status": "sent", "template": template},
    ]
    
    return {
        "success": True,
        "execution_id": execution_id,
        "status": ActionStatus.COMPLETED,
        "messages_sent": len(sent_messages),
        "messages": sent_messages,
        "template_used": template,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "demo_mode": True,
        "message": f"Successfully sent {len(sent_messages)} follow-up messages"
    }


@router.post("/execute/trade")
async def execute_trade(request: TradeRequest):
    """Execute a single trade with one click."""
    
    execution_id = f"trade_{uuid.uuid4().hex[:8]}"
    
    # Simulate trade execution
    simulated_price = random.uniform(100, 500)
    quantity = request.quantity or (request.amount / simulated_price if request.amount else 10)
    
    return {
        "success": True,
        "execution_id": execution_id,
        "status": ActionStatus.COMPLETED,
        "order": {
            "client_id": request.client_id,
            "symbol": request.symbol,
            "action": request.action,
            "quantity": round(quantity, 2),
            "price": round(simulated_price, 2),
            "total_value": round(quantity * simulated_price, 2),
            "order_type": request.order_type,
            "reason": request.reason
        },
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "demo_mode": True,
        "message": f"Successfully executed {request.action} order for {request.symbol}"
    }


# ==================== PREVIEW ENDPOINTS ====================

@router.get("/preview/batch-rebalance")
async def preview_batch_rebalance(drift_threshold: float = 5.0):
    """Preview batch rebalancing before execution."""
    
    portfolios = [
        {"portfolio_id": "pf_001", "client": "Wheeler Family", "current_drift": 6.2, "trades_needed": 3, "estimated_cost": 45.50},
        {"portfolio_id": "pf_002", "client": "Chen Trust", "current_drift": 5.8, "trades_needed": 2, "estimated_cost": 32.00},
        {"portfolio_id": "pf_003", "client": "Johnson SMSF", "current_drift": 7.1, "trades_needed": 4, "estimated_cost": 58.00},
        {"portfolio_id": "pf_004", "client": "Smith Family", "current_drift": 5.4, "trades_needed": 2, "estimated_cost": 28.50},
        {"portfolio_id": "pf_005", "client": "Lee Investment", "current_drift": 5.9, "trades_needed": 3, "estimated_cost": 42.00},
    ]
    
    # Filter by drift threshold
    affected = [p for p in portfolios if p["current_drift"] >= drift_threshold]
    
    return {
        "preview": True,
        "drift_threshold": drift_threshold,
        "portfolios_affected": len(affected),
        "total_trades": sum(p["trades_needed"] for p in affected),
        "estimated_total_cost": sum(p["estimated_cost"] for p in affected),
        "portfolios": affected,
        "execute_url": "/api/actions/execute/batch-rebalance",
        "warnings": [] if drift_threshold >= 5 else ["Low threshold may cause excessive trading"]
    }


@router.get("/preview/tax-harvest")
async def preview_tax_harvest(client_id: str = "all"):
    """Preview tax loss harvesting opportunities."""
    
    opportunities = [
        {"client_id": "client_001", "client": "Wheeler Family", "harvestable_loss": 34500, "positions": 2, "tax_savings": 16215},
        {"client_id": "client_002", "client": "Chen Trust", "harvestable_loss": 28900, "positions": 2, "tax_savings": 13583},
        {"client_id": "client_003", "client": "Johnson SMSF", "harvestable_loss": 22100, "positions": 1, "tax_savings": 3315},
        {"client_id": "client_004", "client": "Smith Family", "harvestable_loss": 18450, "positions": 2, "tax_savings": 8671},
        {"client_id": "client_005", "client": "Lee Investment", "harvestable_loss": 23500, "positions": 1, "tax_savings": 11045},
    ]
    
    total_loss = sum(o["harvestable_loss"] for o in opportunities)
    total_savings = sum(o["tax_savings"] for o in opportunities)
    
    return {
        "preview": True,
        "client_filter": client_id,
        "opportunities": opportunities,
        "summary": {
            "total_harvestable_loss": total_loss,
            "total_estimated_tax_savings": total_savings,
            "clients_with_opportunities": len(opportunities),
            "total_positions_to_sell": sum(o["positions"] for o in opportunities)
        },
        "execute_url": "/api/actions/execute/tax-harvest",
        "notes": [
            "Wash sale rules will be observed (30-day restriction)",
            "Replacement securities will maintain similar exposure"
        ]
    }


# ==================== EXECUTION LOG ====================

@router.get("/execution-log")
async def get_execution_log(limit: int = 50):
    """Get recent execution history."""
    
    # Return stored executions plus some demo data
    demo_log = [
        {
            "execution_id": "exec_abc123",
            "type": ActionType.REBALANCE,
            "status": ActionStatus.COMPLETED,
            "summary": "Rebalanced Wheeler Family portfolio",
            "trades": 3,
            "executed_at": "2025-03-17T09:30:00Z"
        },
        {
            "execution_id": "harvest_def456",
            "type": ActionType.TAX_HARVEST,
            "status": ActionStatus.COMPLETED,
            "summary": "Harvested $34,500 losses for Chen Trust",
            "trades": 4,
            "executed_at": "2025-03-16T14:15:00Z"
        },
        {
            "execution_id": "comm_ghi789",
            "type": ActionType.CLIENT_COMM,
            "status": ActionStatus.COMPLETED,
            "summary": "Sent 5 quarterly review reminders",
            "messages": 5,
            "executed_at": "2025-03-15T10:00:00Z"
        }
    ]
    
    return {
        "executions": (EXECUTION_LOG + demo_log)[-limit:],
        "total": len(EXECUTION_LOG) + len(demo_log),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== ACTION QUEUE ====================

@router.post("/queue")
async def add_to_queue(action: ActionRequest):
    """Add an action to the execution queue."""
    
    action_item = {
        "action_id": f"act_{uuid.uuid4().hex[:8]}",
        "type": action.action_type,
        "target_id": action.target_id,
        "parameters": action.parameters,
        "priority": action.priority,
        "status": ActionStatus.PENDING,
        "notes": action.notes,
        "queued_at": datetime.now(timezone.utc).isoformat()
    }
    
    ACTION_QUEUE.append(action_item)
    
    return {
        "success": True,
        "action": action_item,
        "queue_position": len(ACTION_QUEUE)
    }


@router.get("/queue")
async def get_action_queue():
    """Get current action queue."""
    
    return {
        "queue": ACTION_QUEUE,
        "total": len(ACTION_QUEUE),
        "by_priority": {
            "urgent": len([a for a in ACTION_QUEUE if a["priority"] == ActionPriority.URGENT]),
            "high": len([a for a in ACTION_QUEUE if a["priority"] == ActionPriority.HIGH]),
            "medium": len([a for a in ACTION_QUEUE if a["priority"] == ActionPriority.MEDIUM]),
            "low": len([a for a in ACTION_QUEUE if a["priority"] == ActionPriority.LOW]),
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/execute-all-high-priority")
async def execute_all_high_priority():
    """Execute all high and urgent priority actions in queue."""
    
    high_priority = [a for a in ACTION_QUEUE if a["priority"] in [ActionPriority.URGENT, ActionPriority.HIGH]]
    
    results = []
    for action in high_priority:
        results.append({
            "action_id": action["action_id"],
            "type": action["type"],
            "status": ActionStatus.COMPLETED,
            "executed_at": datetime.now(timezone.utc).isoformat()
        })
        action["status"] = ActionStatus.COMPLETED
    
    return {
        "success": True,
        "executed": len(results),
        "results": results,
        "remaining_in_queue": len([a for a in ACTION_QUEUE if a["status"] == ActionStatus.PENDING]),
        "demo_mode": True,
        "message": f"Executed {len(results)} high-priority actions"
    }
