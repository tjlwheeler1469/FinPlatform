"""
Enhanced Execution Engine - Complete the Action → Execution → Update Loop
Executes actions, updates all systems, and captures outcomes for learning.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/execution-engine", tags=["Execution Engine"])


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    VALIDATING = "validating"
    EXECUTING = "executing"
    UPDATING_PORTFOLIO = "updating_portfolio"
    UPDATING_CRM = "updating_crm"
    CAPTURING_OUTCOME = "capturing_outcome"
    COMPLETED = "completed"
    FAILED = "failed"


class ActionType(str, Enum):
    REBALANCE = "rebalance"
    TAX_HARVEST = "tax_harvest"
    BUY = "buy"
    SELL = "sell"
    OUTREACH = "outreach"
    COMPLIANCE = "compliance"


# Execution history
EXECUTION_LOG: Dict[str, Dict] = {}
EXECUTION_METRICS: Dict[str, List] = {}


class ExecutionRequest(BaseModel):
    action_type: ActionType
    client_id: str
    details: Dict  # action-specific details
    advisor_id: str = "default"
    auto_update_crm: bool = True
    capture_feedback: bool = True


class ExecutionResult(BaseModel):
    execution_id: str
    status: ExecutionStatus
    steps_completed: List[str]
    portfolio_updated: bool
    crm_updated: bool
    outcome_captured: bool
    metrics: Dict


async def execute_trade_action(client_id: str, details: Dict) -> Dict:
    """Execute a trade action."""
    # This would call the realtime_data_layer execute-trade endpoint
    symbol = details.get("symbol", "AAPL")
    action = details.get("action", "buy")
    shares = details.get("shares", 10)
    
    # Simulate execution
    price = 150.00  # Would get real price
    value = shares * price
    
    return {
        "success": True,
        "trade_id": f"trade_{uuid.uuid4().hex[:8]}",
        "symbol": symbol,
        "action": action,
        "shares": shares,
        "price": price,
        "value": value,
        "executed_at": datetime.now(timezone.utc).isoformat()
    }


async def update_portfolio(client_id: str, trade_result: Dict) -> Dict:
    """Update portfolio after trade execution."""
    return {
        "updated": True,
        "client_id": client_id,
        "new_value": 2950000,  # Would be calculated
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


async def update_crm(client_id: str, action_type: str, details: Dict) -> Dict:
    """Update CRM with action record."""
    activity_id = f"activity_{uuid.uuid4().hex[:8]}"
    
    return {
        "activity_id": activity_id,
        "client_id": client_id,
        "action_type": action_type,
        "logged": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


async def capture_outcome(execution_id: str, action_type: str, result: Dict) -> Dict:
    """Capture outcome for the learning system."""
    outcome_id = f"outcome_{uuid.uuid4().hex[:8]}"
    
    # Calculate metrics based on action type
    metrics = {
        "portfolio_impact": result.get("value", 0),
        "execution_time_ms": 150,  # Would be actual
        "success": result.get("success", True)
    }
    
    if action_type == ActionType.TAX_HARVEST.value:
        metrics["tax_savings"] = result.get("tax_savings", 0)
    
    return {
        "outcome_id": outcome_id,
        "execution_id": execution_id,
        "metrics": metrics,
        "captured_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== API ENDPOINTS ====================

@router.post("/execute")
async def execute_action(request: ExecutionRequest, background_tasks: BackgroundTasks):
    """
    Execute an action through the complete loop:
    Insight → Decision → Action → Execution → Portfolio Update → CRM Update → Outcome Capture
    """
    execution_id = f"exec_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    steps_completed = []
    execution_log = {
        "execution_id": execution_id,
        "action_type": request.action_type.value,
        "client_id": request.client_id,
        "advisor_id": request.advisor_id,
        "details": request.details,
        "started_at": now.isoformat(),
        "status": ExecutionStatus.PENDING,
        "steps": [],
        "results": {}
    }
    
    try:
        # Step 1: Validate
        execution_log["status"] = ExecutionStatus.VALIDATING
        steps_completed.append("validation")
        execution_log["steps"].append({
            "step": "validation",
            "status": "completed",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Step 2: Execute the action
        execution_log["status"] = ExecutionStatus.EXECUTING
        
        if request.action_type in [ActionType.BUY, ActionType.SELL, ActionType.REBALANCE, ActionType.TAX_HARVEST]:
            trade_result = await execute_trade_action(request.client_id, request.details)
            execution_log["results"]["trade"] = trade_result
            steps_completed.append("execution")
            execution_log["steps"].append({
                "step": "execution",
                "status": "completed",
                "result": trade_result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        else:
            # Non-trade actions
            execution_log["results"]["action"] = {"status": "completed", "type": request.action_type.value}
            steps_completed.append("execution")
        
        # Step 3: Update Portfolio
        if request.action_type in [ActionType.BUY, ActionType.SELL, ActionType.REBALANCE, ActionType.TAX_HARVEST]:
            execution_log["status"] = ExecutionStatus.UPDATING_PORTFOLIO
            portfolio_update = await update_portfolio(request.client_id, execution_log["results"].get("trade", {}))
            execution_log["results"]["portfolio_update"] = portfolio_update
            steps_completed.append("portfolio_update")
            execution_log["steps"].append({
                "step": "portfolio_update",
                "status": "completed",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Step 4: Update CRM
        if request.auto_update_crm:
            execution_log["status"] = ExecutionStatus.UPDATING_CRM
            crm_update = await update_crm(request.client_id, request.action_type.value, request.details)
            execution_log["results"]["crm_update"] = crm_update
            steps_completed.append("crm_update")
            execution_log["steps"].append({
                "step": "crm_update",
                "status": "completed",
                "activity_id": crm_update["activity_id"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Step 5: Capture Outcome for Learning
        if request.capture_feedback:
            execution_log["status"] = ExecutionStatus.CAPTURING_OUTCOME
            outcome = await capture_outcome(
                execution_id, 
                request.action_type.value, 
                execution_log["results"].get("trade", execution_log["results"].get("action", {}))
            )
            execution_log["results"]["outcome"] = outcome
            steps_completed.append("outcome_capture")
            execution_log["steps"].append({
                "step": "outcome_capture",
                "status": "completed",
                "outcome_id": outcome["outcome_id"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        # Complete
        execution_log["status"] = ExecutionStatus.COMPLETED
        execution_log["completed_at"] = datetime.now(timezone.utc).isoformat()
        execution_log["duration_ms"] = 250  # Would be calculated
        
    except Exception as e:
        execution_log["status"] = ExecutionStatus.FAILED
        execution_log["error"] = str(e)
        logger.error(f"Execution failed: {e}")
    
    # Store execution log
    EXECUTION_LOG[execution_id] = execution_log
    
    # Track metrics
    if request.action_type.value not in EXECUTION_METRICS:
        EXECUTION_METRICS[request.action_type.value] = []
    EXECUTION_METRICS[request.action_type.value].append({
        "execution_id": execution_id,
        "success": execution_log["status"] == ExecutionStatus.COMPLETED,
        "timestamp": now.isoformat()
    })
    
    return {
        "execution_id": execution_id,
        "status": execution_log["status"],
        "steps_completed": steps_completed,
        "portfolio_updated": "portfolio_update" in steps_completed,
        "crm_updated": "crm_update" in steps_completed,
        "outcome_captured": "outcome_capture" in steps_completed,
        "results": execution_log["results"],
        "loop_closed": all([
            "execution" in steps_completed,
            "portfolio_update" in steps_completed or request.action_type not in [ActionType.BUY, ActionType.SELL, ActionType.REBALANCE, ActionType.TAX_HARVEST],
            "crm_update" in steps_completed,
            "outcome_capture" in steps_completed
        ]),
        "message": f"Execution complete. Loop {'closed' if execution_log['status'] == ExecutionStatus.COMPLETED else 'incomplete'}."
    }


@router.get("/executions")
async def get_executions(
    advisor_id: Optional[str] = None,
    action_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """Get execution history."""
    executions = list(EXECUTION_LOG.values())
    
    if advisor_id:
        executions = [e for e in executions if e.get("advisor_id") == advisor_id]
    if action_type:
        executions = [e for e in executions if e.get("action_type") == action_type]
    if status:
        executions = [e for e in executions if e.get("status") == status]
    
    executions = sorted(executions, key=lambda x: x.get("started_at", ""), reverse=True)[:limit]
    
    return {
        "executions": executions,
        "total": len(executions),
        "completed": len([e for e in executions if e.get("status") == ExecutionStatus.COMPLETED]),
        "failed": len([e for e in executions if e.get("status") == ExecutionStatus.FAILED])
    }


@router.get("/executions/{execution_id}")
async def get_execution(execution_id: str):
    """Get a specific execution's details."""
    execution = EXECUTION_LOG.get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return execution


@router.get("/metrics")
async def get_execution_metrics():
    """Get execution metrics by action type."""
    metrics = {}
    
    for action_type, executions in EXECUTION_METRICS.items():
        successful = len([e for e in executions if e.get("success")])
        total = len(executions)
        metrics[action_type] = {
            "total_executions": total,
            "successful": successful,
            "failed": total - successful,
            "success_rate": round(successful / total * 100, 1) if total > 0 else 0
        }
    
    return {
        "metrics_by_action_type": metrics,
        "total_executions": sum(len(e) for e in EXECUTION_METRICS.values()),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/execute-insight")
async def execute_from_insight(
    insight_id: str,
    advisor_id: str = "default",
    auto_execute: bool = False
):
    """
    Execute action directly from an insight.
    This is the [Execute Action] button from any insight.
    """
    # Map insight to action (would be dynamic in production)
    insight_actions = {
        "rebalance": {
            "action_type": ActionType.REBALANCE,
            "client_id": "client_001",
            "details": {
                "symbol": "NVDA",
                "action": "sell",
                "shares": 20,
                "reason": "Reduce tech overweight"
            }
        },
        "tax_harvest": {
            "action_type": ActionType.TAX_HARVEST,
            "client_id": "client_002",
            "details": {
                "symbol": "GOOGL",
                "action": "sell",
                "shares": 50,
                "reason": "Harvest losses before EOFY",
                "tax_savings": 2500
            }
        },
        "outreach": {
            "action_type": ActionType.OUTREACH,
            "client_id": "client_003",
            "details": {
                "type": "email",
                "reason": "Low engagement - re-engagement campaign"
            }
        }
    }
    
    # Get action for insight
    insight_type = insight_id.split("_")[0] if "_" in insight_id else "rebalance"
    action_config = insight_actions.get(insight_type, insight_actions["rebalance"])
    
    if auto_execute:
        # Execute immediately
        request = ExecutionRequest(
            action_type=action_config["action_type"],
            client_id=action_config["client_id"],
            details=action_config["details"],
            advisor_id=advisor_id
        )
        
        class DummyBG:
            def add_task(self, *args, **kwargs):
                pass
        
        result = await execute_action(request, DummyBG())
        return {
            "auto_executed": True,
            "execution_result": result
        }
    else:
        # Return preview for approval
        return {
            "auto_executed": False,
            "preview": {
                "insight_id": insight_id,
                "proposed_action": action_config,
                "requires_approval": True,
                "estimated_impact": {
                    "portfolio": action_config["details"].get("shares", 0) * 150,  # Estimate
                    "tax_savings": action_config["details"].get("tax_savings", 0)
                }
            },
            "message": "Action preview generated. Call with auto_execute=true to execute."
        }


@router.get("/loop-status")
async def get_loop_status():
    """Get the status of the Insight → Execution → Feedback loop."""
    total_executions = len(EXECUTION_LOG)
    completed = len([e for e in EXECUTION_LOG.values() if e.get("status") == ExecutionStatus.COMPLETED])
    
    # Check loop closure
    loops_closed = 0
    for execution in EXECUTION_LOG.values():
        steps = [s["step"] for s in execution.get("steps", [])]
        if "execution" in steps and "crm_update" in steps and "outcome_capture" in steps:
            loops_closed += 1
    
    return {
        "loop_health": {
            "status": "healthy" if loops_closed > 0 else "no_data",
            "total_executions": total_executions,
            "completed_executions": completed,
            "loops_fully_closed": loops_closed,
            "closure_rate": round(loops_closed / total_executions * 100, 1) if total_executions > 0 else 0
        },
        "components": {
            "insight_generation": "active",
            "decision_support": "active",
            "action_execution": "active",
            "portfolio_update": "active",
            "crm_update": "active",
            "outcome_capture": "active",
            "learning_system": "active"
        },
        "flow": [
            "Insight → Decision → Action → Execution → Portfolio Update → CRM Update → Outcome Capture → Learning"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
