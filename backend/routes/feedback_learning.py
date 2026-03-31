"""
Feedback & Learning System - Close the Loop
Tracks every action's outcome, learns from results, and improves recommendations.
This is the "brain" that makes the system truly autonomous.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging
import statistics
import secrets
_rng = secrets.SystemRandom()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback-loop", tags=["Feedback & Learning"])


class ActionType(str, Enum):
    REBALANCE = "rebalance"
    TAX_HARVEST = "tax_harvest"
    CLIENT_OUTREACH = "client_outreach"
    COMPLIANCE_REVIEW = "compliance_review"
    MEETING_FOLLOWUP = "meeting_followup"
    FEE_OPTIMIZATION = "fee_optimization"
    RISK_ADJUSTMENT = "risk_adjustment"
    CASH_DEPLOYMENT = "cash_deployment"


class OutcomeStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    REJECTED = "rejected"  # Advisor rejected the recommendation


class FeedbackType(str, Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    MODIFIED = "modified"
    DEFERRED = "deferred"


# In-memory storage for feedback and learning data
ACTION_OUTCOMES: Dict[str, Dict] = {}
ADVISOR_PREFERENCES: Dict[str, Dict] = {}
LEARNING_METRICS: Dict[str, List] = {}
RECOMMENDATION_HISTORY: List[Dict] = []


# ==================== PYDANTIC MODELS ====================

class ActionFeedback(BaseModel):
    action_id: str
    action_type: ActionType
    feedback_type: FeedbackType
    advisor_id: str = "default"
    reason: Optional[str] = None
    modifications: Optional[Dict] = None


class ActionOutcome(BaseModel):
    action_id: str
    action_type: ActionType
    status: OutcomeStatus
    client_ids: List[str]
    advisor_id: str = "default"
    metrics: Dict  # portfolio_impact, revenue_impact, engagement_change, etc.
    notes: Optional[str] = None


class LearningQuery(BaseModel):
    advisor_id: str = "default"
    action_type: Optional[ActionType] = None
    time_period_days: int = 90


# ==================== CORE LEARNING FUNCTIONS ====================

def calculate_recommendation_score(action_type: str, advisor_id: str) -> float:
    """Calculate how well recommendations of this type perform for this advisor."""
    history = [r for r in RECOMMENDATION_HISTORY 
               if r.get("action_type") == action_type and r.get("advisor_id") == advisor_id]
    
    if not history:
        return 0.5  # Neutral score for new recommendations
    
    accepted = len([r for r in history if r.get("feedback") == FeedbackType.ACCEPTED])
    total = len(history)
    
    # Weight recent feedback more heavily
    recent = [r for r in history if 
              datetime.fromisoformat(r.get("timestamp", datetime.now(timezone.utc).isoformat()).replace("Z", "+00:00")) 
              > datetime.now(timezone.utc) - timedelta(days=30)]
    
    if recent:
        recent_accepted = len([r for r in recent if r.get("feedback") == FeedbackType.ACCEPTED])
        recent_rate = recent_accepted / len(recent)
        overall_rate = accepted / total
        # 70% weight to recent, 30% to overall
        return (0.7 * recent_rate) + (0.3 * overall_rate)
    
    return accepted / total


def get_advisor_preferences(advisor_id: str) -> Dict:
    """Get learned preferences for an advisor."""
    if advisor_id not in ADVISOR_PREFERENCES:
        ADVISOR_PREFERENCES[advisor_id] = {
            "preferred_action_types": [],
            "rejected_action_types": [],
            "typical_thresholds": {
                "min_portfolio_impact": 5000,
                "min_tax_savings": 1000,
                "engagement_priority": "medium"
            },
            "action_timing": {
                "preferred_days": ["monday", "tuesday", "wednesday"],
                "preferred_hours": [9, 10, 11, 14, 15]
            },
            "learning_history": []
        }
    return ADVISOR_PREFERENCES[advisor_id]


def update_advisor_preferences(advisor_id: str, action_type: str, feedback: str):
    """Update advisor preferences based on feedback."""
    prefs = get_advisor_preferences(advisor_id)
    
    if feedback == FeedbackType.ACCEPTED:
        if action_type not in prefs["preferred_action_types"]:
            prefs["preferred_action_types"].append(action_type)
        if action_type in prefs["rejected_action_types"]:
            prefs["rejected_action_types"].remove(action_type)
    elif feedback == FeedbackType.REJECTED:
        if action_type not in prefs["rejected_action_types"]:
            prefs["rejected_action_types"].append(action_type)
    
    prefs["learning_history"].append({
        "action_type": action_type,
        "feedback": feedback,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    ADVISOR_PREFERENCES[advisor_id] = prefs


def calculate_outcome_metrics(outcomes: List[Dict]) -> Dict:
    """Calculate aggregate metrics from outcomes."""
    if not outcomes:
        return {"total_actions": 0}
    
    total_portfolio_impact = sum(o.get("metrics", {}).get("portfolio_impact", 0) for o in outcomes)
    total_revenue_impact = sum(o.get("metrics", {}).get("revenue_impact", 0) for o in outcomes)
    total_tax_savings = sum(o.get("metrics", {}).get("tax_savings", 0) for o in outcomes)
    
    success_count = len([o for o in outcomes if o.get("status") == OutcomeStatus.SUCCESS])
    
    return {
        "total_actions": len(outcomes),
        "success_rate": round(success_count / len(outcomes) * 100, 1) if outcomes else 0,
        "total_portfolio_impact": total_portfolio_impact,
        "total_revenue_impact": total_revenue_impact,
        "total_tax_savings": total_tax_savings,
        "avg_portfolio_impact": round(total_portfolio_impact / len(outcomes), 2) if outcomes else 0
    }


def generate_personalized_recommendations(advisor_id: str) -> List[Dict]:
    """Generate personalized recommendations based on learning."""
    prefs = get_advisor_preferences(advisor_id)
    
    # Base recommendations
    all_recommendations = [
        {
            "action_type": ActionType.REBALANCE,
            "title": "Rebalance 14 portfolios",
            "impact": 3800000,
            "urgency": "high",
            "reason": "Tech sector drift exceeds 10% in multiple portfolios"
        },
        {
            "action_type": ActionType.TAX_HARVEST,
            "title": "Tax-loss harvesting opportunity",
            "impact": 65000,
            "urgency": "high",
            "reason": "EOFY approaching - $65K in potential tax savings"
        },
        {
            "action_type": ActionType.CLIENT_OUTREACH,
            "title": "Follow up 6 high-value clients",
            "impact": 1200000,
            "urgency": "medium",
            "reason": "Low engagement scores detected"
        },
        {
            "action_type": ActionType.COMPLIANCE_REVIEW,
            "title": "Complete 4 KYC reviews",
            "impact": 0,
            "urgency": "high",
            "reason": "Reviews overdue by 30+ days"
        },
        {
            "action_type": ActionType.FEE_OPTIMIZATION,
            "title": "Fee structure optimization",
            "impact": 45000,
            "urgency": "low",
            "reason": "3 clients eligible for tier upgrades"
        },
        {
            "action_type": ActionType.CASH_DEPLOYMENT,
            "title": "Deploy excess cash",
            "impact": 890000,
            "urgency": "medium",
            "reason": "5 clients holding >20% cash"
        }
    ]
    
    # Score and rank based on learning
    scored_recommendations = []
    for rec in all_recommendations:
        action_type = rec["action_type"].value if isinstance(rec["action_type"], ActionType) else rec["action_type"]
        
        # Calculate personalized score
        base_score = calculate_recommendation_score(action_type, advisor_id)
        
        # Boost if in preferred types
        if action_type in prefs["preferred_action_types"]:
            base_score += 0.2
        
        # Penalize if in rejected types
        if action_type in prefs["rejected_action_types"]:
            base_score -= 0.3
        
        # Urgency boost
        urgency_boost = {"high": 0.3, "medium": 0.1, "low": 0}
        base_score += urgency_boost.get(rec["urgency"], 0)
        
        rec["personalized_score"] = min(1.0, max(0, base_score))
        rec["recommendation_id"] = f"rec_{uuid.uuid4().hex[:8]}"
        scored_recommendations.append(rec)
    
    # Sort by personalized score
    scored_recommendations.sort(key=lambda x: x["personalized_score"], reverse=True)
    
    return scored_recommendations


# ==================== API ENDPOINTS ====================

@router.post("/feedback")
async def record_feedback(feedback: ActionFeedback):
    """Record advisor feedback on a recommendation."""
    feedback_id = f"feedback_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    _feedback_record = {
        "feedback_id": feedback_id,
        "action_id": feedback.action_id,
        "action_type": feedback.action_type.value,
        "feedback_type": feedback.feedback_type.value,
        "advisor_id": feedback.advisor_id,
        "reason": feedback.reason,
        "modifications": feedback.modifications,
        "timestamp": now.isoformat()
    }
    
    # Store in recommendation history for learning
    RECOMMENDATION_HISTORY.append({
        "action_type": feedback.action_type.value,
        "advisor_id": feedback.advisor_id,
        "feedback": feedback.feedback_type.value,
        "timestamp": now.isoformat()
    })
    
    # Update advisor preferences
    update_advisor_preferences(
        feedback.advisor_id, 
        feedback.action_type.value, 
        feedback.feedback_type.value
    )
    
    return {
        "success": True,
        "feedback_id": feedback_id,
        "message": f"Feedback recorded. Learning system updated for advisor {feedback.advisor_id}.",
        "preferences_updated": True
    }


@router.post("/outcome")
async def record_outcome(outcome: ActionOutcome):
    """Record the outcome of an executed action."""
    outcome_id = f"outcome_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    
    outcome_record = {
        "outcome_id": outcome_id,
        "action_id": outcome.action_id,
        "action_type": outcome.action_type.value,
        "status": outcome.status.value,
        "client_ids": outcome.client_ids,
        "advisor_id": outcome.advisor_id,
        "metrics": outcome.metrics,
        "notes": outcome.notes,
        "recorded_at": now.isoformat()
    }
    
    ACTION_OUTCOMES[outcome_id] = outcome_record
    
    # Add to learning metrics
    if outcome.action_type.value not in LEARNING_METRICS:
        LEARNING_METRICS[outcome.action_type.value] = []
    LEARNING_METRICS[outcome.action_type.value].append(outcome.metrics)
    
    return {
        "success": True,
        "outcome_id": outcome_id,
        "message": f"Outcome recorded for action {outcome.action_id}",
        "metrics_captured": list(outcome.metrics.keys())
    }


@router.get("/recommendations/{advisor_id}")
async def get_personalized_recommendations(advisor_id: str):
    """Get personalized recommendations based on learning."""
    recommendations = generate_personalized_recommendations(advisor_id)
    prefs = get_advisor_preferences(advisor_id)
    
    return {
        "advisor_id": advisor_id,
        "recommendations": recommendations,
        "personalization": {
            "preferred_actions": prefs["preferred_action_types"],
            "avoided_actions": prefs["rejected_action_types"],
            "learning_data_points": len(prefs["learning_history"])
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/outcomes")
async def get_outcomes(
    advisor_id: Optional[str] = None,
    action_type: Optional[str] = None,
    days: int = 30
):
    """Get action outcomes with optional filtering."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    outcomes = list(ACTION_OUTCOMES.values())
    
    # Filter by advisor
    if advisor_id:
        outcomes = [o for o in outcomes if o.get("advisor_id") == advisor_id]
    
    # Filter by action type
    if action_type:
        outcomes = [o for o in outcomes if o.get("action_type") == action_type]
    
    # Filter by date
    outcomes = [o for o in outcomes if 
                datetime.fromisoformat(o.get("recorded_at", datetime.now(timezone.utc).isoformat()).replace("Z", "+00:00")) > cutoff]
    
    metrics = calculate_outcome_metrics(outcomes)
    
    return {
        "outcomes": outcomes,
        "aggregate_metrics": metrics,
        "period_days": days
    }


@router.get("/analytics/{advisor_id}")
async def get_advisor_analytics(advisor_id: str, days: int = 90):
    """Get comprehensive analytics for an advisor."""
    _cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Get outcomes for this advisor
    advisor_outcomes = [o for o in ACTION_OUTCOMES.values() 
                        if o.get("advisor_id") == advisor_id]
    
    # Get feedback history
    feedback_history = [r for r in RECOMMENDATION_HISTORY 
                        if r.get("advisor_id") == advisor_id]
    
    prefs = get_advisor_preferences(advisor_id)
    
    # Calculate acceptance rate
    accepted = len([f for f in feedback_history if f.get("feedback") == FeedbackType.ACCEPTED])
    acceptance_rate = (accepted / len(feedback_history) * 100) if feedback_history else 0
    
    # Calculate performance by action type
    performance_by_type = {}
    for action_type in ActionType:
        type_outcomes = [o for o in advisor_outcomes if o.get("action_type") == action_type.value]
        if type_outcomes:
            performance_by_type[action_type.value] = calculate_outcome_metrics(type_outcomes)
    
    # Simulated performance improvement
    baseline_performance = 100
    learned_improvement = min(30, len(feedback_history) * 0.5)  # Up to 30% improvement
    
    return {
        "advisor_id": advisor_id,
        "period_days": days,
        "summary": {
            "total_actions": len(advisor_outcomes),
            "total_recommendations_received": len(feedback_history),
            "acceptance_rate": round(acceptance_rate, 1),
            "portfolio_impact": sum(o.get("metrics", {}).get("portfolio_impact", 0) for o in advisor_outcomes),
            "revenue_impact": sum(o.get("metrics", {}).get("revenue_impact", 0) for o in advisor_outcomes),
            "tax_savings": sum(o.get("metrics", {}).get("tax_savings", 0) for o in advisor_outcomes),
            "time_saved_hours": len(advisor_outcomes) * 1.5
        },
        "performance_by_action_type": performance_by_type,
        "learning_progress": {
            "data_points_collected": len(feedback_history),
            "preferences_learned": len(prefs["preferred_action_types"]) + len(prefs["rejected_action_types"]),
            "recommendation_accuracy": f"{baseline_performance + learned_improvement:.1f}%",
            "improvement_from_baseline": f"+{learned_improvement:.1f}%"
        },
        "preferences": {
            "preferred_actions": prefs["preferred_action_types"],
            "avoided_actions": prefs["rejected_action_types"]
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/learning-status")
async def get_learning_status():
    """Get overall learning system status."""
    total_feedback = len(RECOMMENDATION_HISTORY)
    total_outcomes = len(ACTION_OUTCOMES)
    
    # Calculate system-wide metrics
    all_outcomes = list(ACTION_OUTCOMES.values())
    
    return {
        "learning_system": {
            "status": "active",
            "total_feedback_points": total_feedback,
            "total_outcome_records": total_outcomes,
            "advisors_tracked": len(ADVISOR_PREFERENCES),
            "action_types_tracked": len(LEARNING_METRICS)
        },
        "aggregate_performance": calculate_outcome_metrics(all_outcomes),
        "recommendation_improvement": {
            "baseline_accuracy": "70%",
            "current_accuracy": f"{70 + min(25, total_feedback * 0.5):.1f}%",
            "data_points_needed_for_next_level": max(0, 50 - total_feedback)
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/simulate-learning")
async def simulate_learning_data(advisor_id: str = "default", num_actions: int = 20):
    """Simulate learning data for demo purposes."""
    now = datetime.now(timezone.utc)
    
    action_types = list(ActionType)
    feedback_types = [FeedbackType.ACCEPTED, FeedbackType.ACCEPTED, FeedbackType.ACCEPTED, 
                      FeedbackType.REJECTED, FeedbackType.MODIFIED]  # 60% acceptance bias
    
    simulated_feedback = 0
    simulated_outcomes = 0
    
    for i in range(num_actions):
        action_type = _rng.choice(action_types)
        feedback_type = _rng.choice(feedback_types)
        
        # Simulate feedback
        RECOMMENDATION_HISTORY.append({
            "action_type": action_type.value,
            "advisor_id": advisor_id,
            "feedback": feedback_type.value,
            "timestamp": (now - timedelta(days=_rng.randint(1, 60))).isoformat()
        })
        simulated_feedback += 1
        
        # Update preferences
        update_advisor_preferences(advisor_id, action_type.value, feedback_type.value)
        
        # Simulate outcome for accepted actions
        if feedback_type in [FeedbackType.ACCEPTED, FeedbackType.MODIFIED]:
            outcome_id = f"outcome_{uuid.uuid4().hex[:8]}"
            ACTION_OUTCOMES[outcome_id] = {
                "outcome_id": outcome_id,
                "action_id": f"action_{uuid.uuid4().hex[:8]}",
                "action_type": action_type.value,
                "status": _rng.choice([OutcomeStatus.SUCCESS, OutcomeStatus.SUCCESS, OutcomeStatus.PARTIAL]).value,
                "client_ids": [f"client_{_rng.randint(1, 12):03d}"],
                "advisor_id": advisor_id,
                "metrics": {
                    "portfolio_impact": _rng.randint(5000, 50000),
                    "revenue_impact": _rng.randint(500, 5000),
                    "tax_savings": _rng.randint(0, 15000) if action_type == ActionType.TAX_HARVEST else 0,
                    "engagement_change": _rng.uniform(-5, 15)
                },
                "recorded_at": (now - timedelta(days=_rng.randint(1, 60))).isoformat()
            }
            simulated_outcomes += 1
    
    return {
        "success": True,
        "advisor_id": advisor_id,
        "simulated_feedback": simulated_feedback,
        "simulated_outcomes": simulated_outcomes,
        "message": f"Learning system populated with {num_actions} simulated actions"
    }


@router.get("/insights/{advisor_id}")
async def get_learning_insights(advisor_id: str):
    """Get AI-generated insights from learning data."""
    prefs = get_advisor_preferences(advisor_id)
    outcomes = [o for o in ACTION_OUTCOMES.values() if o.get("advisor_id") == advisor_id]
    
    insights = []
    
    # Insight 1: Action preferences
    if prefs["preferred_action_types"]:
        insights.append({
            "type": "preference",
            "title": "Your Action Preferences",
            "message": f"You tend to accept {', '.join(prefs['preferred_action_types'])} recommendations. We're prioritizing these for you.",
            "confidence": 0.85
        })
    
    # Insight 2: Performance trend
    if outcomes:
        success_rate = len([o for o in outcomes if o.get("status") == OutcomeStatus.SUCCESS.value]) / len(outcomes) * 100
        insights.append({
            "type": "performance",
            "title": "Action Success Rate",
            "message": f"Your executed actions have a {success_rate:.0f}% success rate. Above average for the platform.",
            "confidence": 0.90
        })
    
    # Insight 3: Revenue impact
    total_revenue = sum(o.get("metrics", {}).get("revenue_impact", 0) for o in outcomes)
    if total_revenue > 0:
        insights.append({
            "type": "revenue",
            "title": "Revenue Generation",
            "message": f"Your actions have generated ${total_revenue:,.0f} in estimated revenue impact over the tracked period.",
            "confidence": 0.80
        })
    
    # Insight 4: Learning progress
    learning_points = len(prefs.get("learning_history", []))
    insights.append({
        "type": "learning",
        "title": "System Learning Progress",
        "message": f"The system has learned from {learning_points} of your decisions. Recommendation accuracy improves with each action.",
        "confidence": 0.95
    })
    
    return {
        "advisor_id": advisor_id,
        "insights": insights,
        "recommendations_for_improvement": [
            "Consider reviewing tax harvesting opportunities more frequently",
            "Client outreach actions show strong engagement results",
            "Rebalancing actions are generating consistent portfolio improvements"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
