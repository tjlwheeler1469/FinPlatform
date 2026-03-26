"""
Hybrid Engine API Endpoints and Real-Time Features
Sections 12-19: Scenario Comparison, Real-Time Data, Advisor Control
"""

import os
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# Import core engine functions
from routes.hybrid_engine import (
    run_deterministic_model,
    run_monte_carlo_simulation,
    calculate_longevity_risk,
    calculate_income_stability,
    calculate_spending_flexibility,
    calculate_diversification,
    calculate_confidence_score,
    run_stress_tests,
    generate_ai_explanation,
    calculate_change_impact,
    HybridEngineRequest,
    IncomeSource,
    AssetHolding,
    ExpenseBreakdown,
    EngineMode,
    DEFAULT_PARAMS
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hybrid-engine", tags=["Hybrid Retirement Engine"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== REAL-TIME STATE MANAGEMENT ====================

class RealTimeState:
    """
    SECTION 14: Background vs Presentation Mode
    
    Manages two system states:
    1. BACKGROUND MODE - Real-time data updates, continuous recalculations
    2. PRESENTATION MODE - Advisor-controlled, no auto-overwriting
    """
    
    def __init__(self):
        # client_id -> state
        self._background_state: Dict[str, Dict[str, Any]] = {}
        self._presentation_state: Dict[str, Dict[str, Any]] = {}
        self._subscribers: Dict[str, List[WebSocket]] = {}
        self._last_update: Dict[str, datetime] = {}
    
    def get_background_confidence(self, client_id: str) -> Optional[float]:
        """Get live confidence (continuously updated)."""
        state = self._background_state.get(client_id)
        return state.get("confidence_score") if state else None
    
    def get_presentation_confidence(self, client_id: str) -> Optional[float]:
        """Get presentation confidence (advisor-defined)."""
        state = self._presentation_state.get(client_id)
        return state.get("confidence_score") if state else None
    
    def update_background(self, client_id: str, result: Dict[str, Any]):
        """Update background state (real-time)."""
        self._background_state[client_id] = {
            **result,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "mode": "background"
        }
        self._last_update[client_id] = datetime.now(timezone.utc)
    
    def update_presentation(self, client_id: str, result: Dict[str, Any]):
        """Update presentation state (advisor-controlled)."""
        self._presentation_state[client_id] = {
            **result,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "mode": "presentation"
        }
    
    def get_dual_state(self, client_id: str) -> Dict[str, Any]:
        """
        SECTION 16: Real-Time Confidence Engine
        Return both live and presentation confidence.
        """
        bg = self._background_state.get(client_id, {})
        pres = self._presentation_state.get(client_id, {})
        
        return {
            "live_confidence": bg.get("confidence_score"),
            "live_updated_at": bg.get("updated_at"),
            "presentation_confidence": pres.get("confidence_score"),
            "presentation_updated_at": pres.get("updated_at"),
            "delta": round((pres.get("confidence_score", 0) or 0) - (bg.get("confidence_score", 0) or 0), 1)
        }
    
    async def subscribe(self, client_id: str, websocket: WebSocket):
        """Subscribe to real-time updates."""
        if client_id not in self._subscribers:
            self._subscribers[client_id] = []
        self._subscribers[client_id].append(websocket)
    
    def unsubscribe(self, client_id: str, websocket: WebSocket):
        """Unsubscribe from updates."""
        if client_id in self._subscribers:
            if websocket in self._subscribers[client_id]:
                self._subscribers[client_id].remove(websocket)
    
    async def broadcast_update(self, client_id: str, update_type: str, data: Dict[str, Any]):
        """
        SECTION 18: Event-Driven Updates
        Broadcast updates to all subscribers.
        """
        if client_id not in self._subscribers:
            return
        
        message = {
            "type": update_type,
            "client_id": client_id,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        for websocket in self._subscribers[client_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast: {e}")


# Global state manager
state_manager = RealTimeState()


# ==================== MAIN CALCULATION ENDPOINT ====================

@router.post("/calculate")
async def calculate_hybrid_confidence(request: HybridEngineRequest):
    """
    Main endpoint: Run full hybrid engine calculation.
    
    Returns comprehensive confidence analysis including:
    - Deterministic model results
    - Monte Carlo simulation (10,000 runs)
    - Multi-factor confidence score
    - Risk analysis
    - AI explanation
    - Stress test results
    """
    db = await get_db()
    
    # Section 1: Deterministic Model
    deterministic = run_deterministic_model(
        current_portfolio=request.current_portfolio,
        current_age=request.current_age,
        retirement_age=request.retirement_age,
        life_expectancy=request.life_expectancy,
        annual_contributions=request.annual_contributions,
        retirement_spending=request.retirement_spending,
        expected_return=request.expected_return,
        inflation_rate=request.inflation_rate
    )
    
    # Section 2 & 3: Monte Carlo + Downside Risk
    monte_carlo = run_monte_carlo_simulation(
        current_portfolio=request.current_portfolio,
        current_age=request.current_age,
        retirement_age=request.retirement_age,
        life_expectancy=request.life_expectancy,
        annual_contributions=request.annual_contributions,
        retirement_spending=request.retirement_spending,
        expected_return=request.expected_return,
        return_volatility=request.return_volatility,
        inflation_mean=request.inflation_rate,
        num_simulations=request.num_simulations,
        enable_dynamic_spending=request.enable_dynamic_spending
    )
    
    # Section 5: Longevity Risk
    longevity = calculate_longevity_risk(
        current_portfolio=request.current_portfolio,
        current_age=request.current_age,
        retirement_age=request.retirement_age,
        life_expectancy=request.life_expectancy,
        annual_contributions=request.annual_contributions,
        retirement_spending=request.retirement_spending,
        expected_return=request.expected_return,
        inflation_rate=request.inflation_rate
    )
    
    # Section 6: Income Stability
    income_stability = calculate_income_stability(request.income_sources or [])
    
    # Section 7: Spending Flexibility
    spending_flexibility = calculate_spending_flexibility(request.expense_breakdown)
    
    # Section 8: Diversification
    diversification = calculate_diversification(request.asset_holdings)
    
    # Section 9: Confidence Score
    confidence = calculate_confidence_score(
        monte_carlo_success_rate=monte_carlo["success_rate"],
        downside_risk_score=monte_carlo["downside_risk_score"],
        income_stability_score=income_stability["income_stability_score"],
        spending_flexibility_score=spending_flexibility["spending_flexibility_score"],
        diversification_score=diversification["diversification_score"],
        longevity_risk_score=longevity["longevity_risk_score"]
    )
    
    # Section 10: Stress Tests (run with fewer simulations for speed)
    stress_tests = run_stress_tests(
        current_portfolio=request.current_portfolio,
        current_age=request.current_age,
        retirement_age=request.retirement_age,
        life_expectancy=request.life_expectancy,
        annual_contributions=request.annual_contributions,
        retirement_spending=request.retirement_spending,
        expected_return=request.expected_return,
        return_volatility=request.return_volatility,
        inflation_rate=request.inflation_rate,
        num_simulations=min(5000, request.num_simulations)
    )
    
    # Section 11: AI Explanation
    explanation = generate_ai_explanation(
        confidence_result=confidence,
        monte_carlo_result=monte_carlo,
        longevity_result=longevity,
        spending_flexibility=spending_flexibility,
        diversification=diversification,
        request=request
    )
    
    # Build result
    result = {
        "client_id": request.client_id,
        "calculation_timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": request.mode,
        
        # Primary outputs
        "confidence_score": confidence["confidence_score"],
        "confidence_rating": confidence["confidence_rating"],
        
        # Display values (Today / After Changes / After Stress)
        "display": {
            "today": confidence["confidence_score"],
            "after_stress": stress_tests["most_severe_stress"],
            "stress_delta": round(stress_tests["most_severe_stress"] - confidence["confidence_score"], 1)
        },
        
        # Detailed results
        "deterministic_model": deterministic,
        "monte_carlo": monte_carlo,
        "confidence_breakdown": confidence,
        "longevity_risk": longevity,
        "income_stability": income_stability,
        "spending_flexibility": spending_flexibility,
        "diversification": diversification,
        "stress_tests": stress_tests,
        "explanation": explanation,
        
        # Inputs used
        "inputs": {
            "current_age": request.current_age,
            "retirement_age": request.retirement_age,
            "life_expectancy": request.life_expectancy,
            "current_portfolio": request.current_portfolio,
            "annual_contributions": request.annual_contributions,
            "retirement_spending": request.retirement_spending,
            "expected_return": request.expected_return,
            "return_volatility": request.return_volatility,
            "inflation_rate": request.inflation_rate
        }
    }
    
    # Update state based on mode
    if request.mode == EngineMode.BACKGROUND:
        state_manager.update_background(request.client_id, result)
    else:
        state_manager.update_presentation(request.client_id, result)
    
    # Store calculation
    await db.hybrid_calculations.insert_one({
        "id": str(uuid.uuid4()),
        **result
    })
    
    return result


# ==================== SECTION 12: SCENARIO COMPARISON ====================

class ScenarioInput(BaseModel):
    name: str
    retirement_age: Optional[int] = None
    retirement_spending: Optional[float] = None
    annual_contributions: Optional[float] = None
    current_portfolio: Optional[float] = None


class ScenarioComparisonRequest(BaseModel):
    client_id: str
    base_request: HybridEngineRequest
    scenarios: List[ScenarioInput]


@router.post("/compare-scenarios")
async def compare_scenarios(request: ScenarioComparisonRequest):
    """
    SECTION 12: Scenario Comparison
    
    Run full engine per scenario and compare outcomes.
    """
    results = []
    base = request.base_request
    
    # Run base scenario
    base_result = await calculate_hybrid_confidence(base)
    results.append({
        "name": "Current Plan",
        "confidence": base_result["confidence_score"],
        "monte_carlo_success": base_result["monte_carlo"]["success_rate_percent"],
        "median_outcome": base_result["monte_carlo"]["percentiles"]["p50_median"],
        "stressed_confidence": base_result["stress_tests"]["most_severe_stress"]
    })
    
    # Run each scenario
    for scenario in request.scenarios:
        # Create modified request
        modified = HybridEngineRequest(
            client_id=base.client_id,
            current_age=base.current_age,
            retirement_age=scenario.retirement_age or base.retirement_age,
            life_expectancy=base.life_expectancy,
            current_portfolio=scenario.current_portfolio or base.current_portfolio,
            annual_contributions=scenario.annual_contributions if scenario.annual_contributions is not None else base.annual_contributions,
            retirement_spending=scenario.retirement_spending or base.retirement_spending,
            income_sources=base.income_sources,
            asset_holdings=base.asset_holdings,
            expense_breakdown=base.expense_breakdown,
            expected_return=base.expected_return,
            return_volatility=base.return_volatility,
            inflation_rate=base.inflation_rate,
            num_simulations=min(5000, base.num_simulations),  # Faster for comparison
            enable_dynamic_spending=base.enable_dynamic_spending,
            mode=base.mode
        )
        
        scenario_result = await calculate_hybrid_confidence(modified)
        
        results.append({
            "name": scenario.name,
            "confidence": scenario_result["confidence_score"],
            "monte_carlo_success": scenario_result["monte_carlo"]["success_rate_percent"],
            "median_outcome": scenario_result["monte_carlo"]["percentiles"]["p50_median"],
            "stressed_confidence": scenario_result["stress_tests"]["most_severe_stress"],
            "delta_vs_base": round(scenario_result["confidence_score"] - base_result["confidence_score"], 1)
        })
    
    # Sort by confidence
    results_sorted = sorted(results, key=lambda x: x["confidence"], reverse=True)
    best_scenario = results_sorted[0]
    
    return {
        "client_id": request.client_id,
        "scenarios": results,
        "best_scenario": best_scenario["name"],
        "best_confidence": best_scenario["confidence"],
        "comparison_summary": {
            "total_scenarios": len(results),
            "confidence_range": f"{results_sorted[-1]['confidence']:.1f}% - {results_sorted[0]['confidence']:.1f}%",
            "best_vs_current_delta": round(best_scenario["confidence"] - results[0]["confidence"], 1)
        }
    }


# ==================== SECTION 16: REAL-TIME CONFIDENCE ====================

@router.get("/confidence/{client_id}")
async def get_dual_confidence(client_id: str):
    """
    SECTION 16: Get both live and presentation confidence states.
    
    Display both clearly:
    - Live Confidence: Updated from market movements
    - Planned Scenario Confidence: Based on advisor inputs
    """
    dual_state = state_manager.get_dual_state(client_id)
    
    return {
        "client_id": client_id,
        **dual_state,
        "explanation": {
            "live": "Continuously updated based on real-world conditions",
            "presentation": "Based on advisor-defined assumptions for client meetings"
        }
    }


# ==================== SECTION 17: CHANGE IMPACT ====================

@router.post("/impact")
async def calculate_impact(
    base_request: HybridEngineRequest,
    change_type: str = Query(..., description="retirement_age, spending, contributions"),
    change_value: float = Query(..., description="New value")
):
    """
    SECTION 17: Change Impact Engine
    
    Show immediate change in confidence when advisor adjusts inputs.
    """
    # Calculate base confidence
    base_result = await calculate_hybrid_confidence(base_request)
    base_confidence = base_result["confidence_score"]
    
    # Create modified request based on change type
    modified = HybridEngineRequest(**base_request.dict())
    
    if change_type == "retirement_age":
        modified.retirement_age = int(change_value)
    elif change_type == "spending":
        modified.retirement_spending = change_value
    elif change_type == "contributions":
        modified.annual_contributions = change_value
    elif change_type == "portfolio":
        modified.current_portfolio = change_value
    
    # Calculate new confidence
    modified.num_simulations = 5000  # Faster for impact calculation
    new_result = await calculate_hybrid_confidence(modified)
    new_confidence = new_result["confidence_score"]
    
    delta = round(new_confidence - base_confidence, 1)
    
    return {
        "change_type": change_type,
        "change_value": change_value,
        "base_confidence": base_confidence,
        "new_confidence": new_confidence,
        "delta": delta,
        "delta_percent": f"{'+' if delta > 0 else ''}{delta}%",
        "impact_summary": f"{change_type.replace('_', ' ').title()} change: {base_confidence:.1f}% → {new_confidence:.1f}% ({'+' if delta > 0 else ''}{delta}%)"
    }


# ==================== SECTION 19: AI ASSIST (NOT AUTO-CONTROL) ====================

@router.post("/ai-suggestions")
async def get_ai_suggestions(request: HybridEngineRequest):
    """
    SECTION 19: AI Assist (Not Auto-Control)
    
    AI suggests improvements but does NOT automatically change assumptions.
    Advisor must approve all changes.
    """
    # Calculate current state
    result = await calculate_hybrid_confidence(request)
    
    # Get explanation with recommendations
    explanation = result["explanation"]
    
    # Generate specific improvement scenarios
    improvements = []
    current_confidence = result["confidence_score"]
    
    # Test retirement delay
    if request.retirement_age < request.life_expectancy - 10:
        delayed = HybridEngineRequest(**request.dict())
        delayed.retirement_age = request.retirement_age + 2
        delayed.num_simulations = 3000
        delayed_result = await calculate_hybrid_confidence(delayed)
        
        improvements.append({
            "suggestion": f"Delay retirement by 2 years (to age {delayed.retirement_age})",
            "current_confidence": current_confidence,
            "projected_confidence": delayed_result["confidence_score"],
            "delta": round(delayed_result["confidence_score"] - current_confidence, 1),
            "action_required": "Advisor approval required",
            "auto_applied": False
        })
    
    # Test spending reduction
    reduced_spending = HybridEngineRequest(**request.dict())
    reduced_spending.retirement_spending = request.retirement_spending * 0.9
    reduced_spending.num_simulations = 3000
    spending_result = await calculate_hybrid_confidence(reduced_spending)
    
    improvements.append({
        "suggestion": f"Reduce retirement spending by 10% (to ${reduced_spending.retirement_spending:,.0f}/year)",
        "current_confidence": current_confidence,
        "projected_confidence": spending_result["confidence_score"],
        "delta": round(spending_result["confidence_score"] - current_confidence, 1),
        "action_required": "Advisor approval required",
        "auto_applied": False
    })
    
    # Test contribution increase
    if request.retirement_age > request.current_age:
        increased_contrib = HybridEngineRequest(**request.dict())
        increased_contrib.annual_contributions = request.annual_contributions + 20000
        increased_contrib.num_simulations = 3000
        contrib_result = await calculate_hybrid_confidence(increased_contrib)
        
        improvements.append({
            "suggestion": f"Increase contributions by $20,000/year (to ${increased_contrib.annual_contributions:,.0f}/year)",
            "current_confidence": current_confidence,
            "projected_confidence": contrib_result["confidence_score"],
            "delta": round(contrib_result["confidence_score"] - current_confidence, 1),
            "action_required": "Advisor approval required",
            "auto_applied": False
        })
    
    # Sort by impact
    improvements.sort(key=lambda x: x["delta"], reverse=True)
    
    return {
        "client_id": request.client_id,
        "current_confidence": current_confidence,
        "identified_risks": explanation["identified_risks"],
        "ai_suggestions": improvements,
        "important_notice": "AI suggestions require advisor approval. No automatic changes will be made.",
        "best_improvement": improvements[0] if improvements else None
    }


# ==================== WEBSOCKET FOR REAL-TIME UPDATES ====================

@router.websocket("/ws/{client_id}")
async def realtime_updates(websocket: WebSocket, client_id: str):
    """
    SECTION 13 & 18: Real-Time Data Engine & Event-Driven Updates
    
    WebSocket endpoint for real-time confidence updates.
    """
    await websocket.accept()
    await state_manager.subscribe(client_id, websocket)
    
    try:
        # Send current state
        dual_state = state_manager.get_dual_state(client_id)
        await websocket.send_json({
            "type": "initial_state",
            "data": dual_state,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "input_change":
                # SECTION 15: Advisor Control Layer
                # Inputs manually adjusted by advisor
                field = data.get("field")
                value = data.get("value")
                
                await websocket.send_json({
                    "type": "input_acknowledged",
                    "field": field,
                    "value": value,
                    "message": "Input change recorded. Recalculation required.",
                    "auto_recalculate": False  # Advisor must initiate
                })
            
            elif message_type == "recalculate":
                # Advisor initiates recalculation
                await websocket.send_json({
                    "type": "recalculation_started",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        state_manager.unsubscribe(client_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        state_manager.unsubscribe(client_id, websocket)


# ==================== QUICK CALCULATION ENDPOINTS ====================

@router.get("/quick-calculate")
async def quick_calculate(
    current_portfolio: float = Query(...),
    current_age: int = Query(...),
    retirement_age: int = Query(default=65),
    life_expectancy: int = Query(default=90),
    annual_contributions: float = Query(default=0),
    retirement_spending: float = Query(default=80000),
    num_simulations: int = Query(default=5000)
):
    """Quick calculation without detailed inputs."""
    request = HybridEngineRequest(
        client_id="quick_calc",
        current_portfolio=current_portfolio,
        current_age=current_age,
        retirement_age=retirement_age,
        life_expectancy=life_expectancy,
        annual_contributions=annual_contributions,
        retirement_spending=retirement_spending,
        num_simulations=num_simulations
    )
    
    result = await calculate_hybrid_confidence(request)
    
    return {
        "confidence_score": result["confidence_score"],
        "confidence_rating": result["confidence_rating"],
        "display": result["display"],
        "monte_carlo_success": result["monte_carlo"]["success_rate_percent"],
        "percentiles": result["monte_carlo"]["percentiles"],
        "top_recommendation": result["explanation"]["top_improvement"]
    }


@router.get("/defaults")
async def get_default_params():
    """Get default engine parameters."""
    return {
        "defaults": DEFAULT_PARAMS,
        "confidence_weights": {
            "monte_carlo_success": "35%",
            "downside_protection": "20%",
            "income_stability": "15%",
            "spending_flexibility": "10%",
            "diversification": "10%",
            "longevity_protection": "10%"
        }
    }
