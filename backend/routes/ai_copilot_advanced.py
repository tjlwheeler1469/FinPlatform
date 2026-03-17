"""
Advanced AI Copilot - Natural Language Query Engine
Allows advisors to query across all data layers using natural language.
Examples: "Which clients need rebalancing?", "Who is at retirement risk?"
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import logging
import os
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai-copilot", tags=["AI Copilot"])

# Try to import AI service
AI_AVAILABLE = False
try:
    from emergentintegrations.llm.chat import chat, LLMProvider, LLMMessage, LLMConfig
    AI_AVAILABLE = True
except ImportError:
    logger.warning("emergentintegrations not available for AI Copilot")

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


class QueryCategory(str, Enum):
    CLIENTS = "clients"
    PORTFOLIOS = "portfolios"
    PERFORMANCE = "performance"
    COMPLIANCE = "compliance"
    REVENUE = "revenue"
    RISK = "risk"
    TASKS = "tasks"
    GENERAL = "general"


class CopilotQuery(BaseModel):
    query: str = Field(..., min_length=3, description="Natural language query")
    context: Optional[Dict] = None
    advisor_id: Optional[str] = "default"


class CopilotResponse(BaseModel):
    answer: str
    data: Optional[List[Dict]] = None
    suggestions: Optional[List[str]] = None
    category: QueryCategory
    confidence: float


# Knowledge base for query understanding
QUERY_PATTERNS = {
    "rebalancing": {
        "patterns": ["rebalance", "rebalancing", "drift", "allocation", "out of balance"],
        "category": QueryCategory.PORTFOLIOS,
        "intent": "find_rebalancing_candidates"
    },
    "retirement_risk": {
        "patterns": ["retirement risk", "retirement", "retire", "pension shortfall"],
        "category": QueryCategory.RISK,
        "intent": "find_retirement_risk"
    },
    "revenue": {
        "patterns": ["revenue", "fee", "income", "billing", "commission"],
        "category": QueryCategory.REVENUE,
        "intent": "analyze_revenue"
    },
    "compliance": {
        "patterns": ["compliance", "kyc", "aml", "audit", "review due", "overdue"],
        "category": QueryCategory.COMPLIANCE,
        "intent": "check_compliance"
    },
    "performance": {
        "patterns": ["performance", "return", "underperform", "outperform", "benchmark"],
        "category": QueryCategory.PERFORMANCE,
        "intent": "analyze_performance"
    },
    "high_value": {
        "patterns": ["high value", "top client", "biggest", "largest", "wealthy"],
        "category": QueryCategory.CLIENTS,
        "intent": "find_high_value_clients"
    },
    "at_risk": {
        "patterns": ["at risk", "unhappy", "leaving", "churn", "low engagement"],
        "category": QueryCategory.CLIENTS,
        "intent": "find_at_risk_clients"
    },
    "tax": {
        "patterns": ["tax", "cgt", "capital gains", "tax loss", "harvest"],
        "category": QueryCategory.PORTFOLIOS,
        "intent": "analyze_tax"
    },
    "tasks": {
        "patterns": ["task", "to do", "action", "pending", "overdue task"],
        "category": QueryCategory.TASKS,
        "intent": "list_tasks"
    }
}

# Demo data for responses
DEMO_DATA = {
    "rebalancing_clients": [
        {"client_id": "cl_001", "name": "Chen Investment Trust", "aum": 4200000, "tech_exposure": 42, "drift": 13.0, "priority": "high"},
        {"client_id": "cl_002", "name": "Patel Holdings", "aum": 7500000, "tech_exposure": 55, "drift": 15.0, "priority": "high"},
        {"client_id": "cl_003", "name": "Wheeler Family", "aum": 2920000, "tech_exposure": 25, "drift": 8.5, "priority": "medium"},
        {"client_id": "cl_004", "name": "Liu Family Trust", "aum": 3100000, "tech_exposure": 35, "drift": 10.2, "priority": "medium"},
    ],
    "retirement_risk_clients": [
        {"client_id": "cl_005", "name": "Thompson SMSF", "age": 62, "years_to_retire": 3, "shortfall": 180000, "risk_profile": "Growth", "issue": "Too aggressive for timeline"},
        {"client_id": "cl_006", "name": "Anderson SMSF", "age": 58, "years_to_retire": 7, "shortfall": 95000, "risk_profile": "Balanced", "issue": "Contribution rate too low"},
    ],
    "at_risk_clients": [
        {"client_id": "cl_007", "name": "Morrison Super", "engagement_score": 35, "last_contact": "2024-07-15", "revenue_at_risk": 5800, "warning_signs": ["No response to emails", "Missed last review"]},
        {"client_id": "cl_008", "name": "Garcia Family", "engagement_score": 42, "last_contact": "2024-09-20", "revenue_at_risk": 8200, "warning_signs": ["Requested fee breakdown", "Comparing other advisors"]},
    ],
    "compliance_issues": [
        {"client_id": "cl_009", "name": "Park Investment Co", "issue": "KYC Expired", "due_date": "2025-01-15", "priority": "high"},
        {"client_id": "cl_010", "name": "Williams Family", "issue": "Annual Review Overdue", "due_date": "2024-12-01", "priority": "high"},
        {"client_id": "cl_011", "name": "Johnson SMSF", "issue": "Risk Profile Review Due", "due_date": "2025-02-01", "priority": "medium"},
    ],
    "revenue_opportunities": [
        {"client_id": "cl_012", "name": "Chen Investment Trust", "current_fee": 42000, "potential_increase": 8400, "reason": "AUM growth - fee tier upgrade available"},
        {"client_id": "cl_001", "name": "Patel Holdings", "current_fee": 75000, "potential_increase": 15000, "reason": "Additional services requested"},
    ],
    "tax_opportunities": [
        {"client_id": "cl_001", "name": "Wheeler Family", "harvestable_losses": 28000, "tax_savings": 10920},
        {"client_id": "cl_002", "name": "Chen Investment Trust", "harvestable_losses": 42000, "tax_savings": 16380},
        {"client_id": "cl_003", "name": "Liu Family Trust", "harvestable_losses": 55000, "tax_savings": 21450},
    ],
    "top_performers": [
        {"client_id": "cl_001", "name": "Patel Holdings", "ytd_return": 18.5, "benchmark": 12.2, "alpha": 6.3},
        {"client_id": "cl_002", "name": "Chen Investment Trust", "ytd_return": 16.2, "benchmark": 12.2, "alpha": 4.0},
    ],
    "underperformers": [
        {"client_id": "cl_010", "name": "Thompson SMSF", "ytd_return": 5.8, "benchmark": 12.2, "alpha": -6.4},
        {"client_id": "cl_011", "name": "Morrison Super", "ytd_return": 7.2, "benchmark": 12.2, "alpha": -5.0},
    ]
}


def classify_query(query: str) -> tuple:
    """Classify the query to determine intent and category."""
    query_lower = query.lower()
    
    for intent_key, intent_data in QUERY_PATTERNS.items():
        for pattern in intent_data["patterns"]:
            if pattern in query_lower:
                return intent_data["intent"], intent_data["category"]
    
    return "general_query", QueryCategory.GENERAL


def generate_response(intent: str, query: str) -> Dict:
    """Generate response based on intent."""
    
    if intent == "find_rebalancing_candidates":
        data = DEMO_DATA["rebalancing_clients"]
        high_priority = len([d for d in data if d["priority"] == "high"])
        return {
            "answer": f"I found {len(data)} clients that need rebalancing. {high_priority} are high priority with drift exceeding 10%.",
            "data": data,
            "suggestions": [
                "Would you like me to generate rebalancing trades for all high-priority clients?",
                "Show me the specific holdings causing the drift",
                "What's the estimated CGT impact of rebalancing?"
            ],
            "summary": {
                "total_clients": len(data),
                "high_priority": high_priority,
                "total_aum_affected": sum(d["aum"] for d in data)
            }
        }
    
    elif intent == "find_retirement_risk":
        data = DEMO_DATA["retirement_risk_clients"]
        return {
            "answer": f"I identified {len(data)} clients with retirement risk concerns. These clients may not meet their retirement goals without intervention.",
            "data": data,
            "suggestions": [
                "Review risk profile adjustments for these clients",
                "Calculate required contribution increases",
                "Schedule retirement planning meetings"
            ],
            "summary": {
                "total_at_risk": len(data),
                "total_shortfall": sum(d["shortfall"] for d in data)
            }
        }
    
    elif intent == "find_at_risk_clients":
        data = DEMO_DATA["at_risk_clients"]
        return {
            "answer": f"Warning: {len(data)} clients show signs of disengagement and may be at risk of leaving. Total revenue at risk: ${sum(d['revenue_at_risk'] for d in data):,}.",
            "data": data,
            "suggestions": [
                "Schedule urgent check-in calls",
                "Prepare retention offers",
                "Review recent communications"
            ],
            "summary": {
                "clients_at_risk": len(data),
                "revenue_at_risk": sum(d["revenue_at_risk"] for d in data)
            }
        }
    
    elif intent == "check_compliance":
        data = DEMO_DATA["compliance_issues"]
        high_priority = len([d for d in data if d["priority"] == "high"])
        return {
            "answer": f"There are {len(data)} compliance items requiring attention. {high_priority} are high priority and need immediate action.",
            "data": data,
            "suggestions": [
                "Start KYC renewal process for expired clients",
                "Schedule overdue annual reviews",
                "Generate compliance status report"
            ],
            "summary": {
                "total_issues": len(data),
                "high_priority": high_priority
            }
        }
    
    elif intent == "analyze_revenue":
        data = DEMO_DATA["revenue_opportunities"]
        return {
            "answer": f"I found {len(data)} revenue optimization opportunities totaling ${sum(d['potential_increase'] for d in data):,} in potential additional annual revenue.",
            "data": data,
            "suggestions": [
                "Review fee structures for growing accounts",
                "Identify cross-sell opportunities",
                "Analyze fee leakage"
            ],
            "summary": {
                "opportunities": len(data),
                "potential_revenue": sum(d["potential_increase"] for d in data)
            }
        }
    
    elif intent == "analyze_tax":
        data = DEMO_DATA["tax_opportunities"]
        return {
            "answer": f"Tax-loss harvesting opportunity: {len(data)} clients have ${sum(d['harvestable_losses'] for d in data):,} in harvestable losses, potentially saving ${sum(d['tax_savings'] for d in data):,} in taxes.",
            "data": data,
            "suggestions": [
                "Execute tax-loss harvesting for all clients",
                "Preview replacement securities",
                "Calculate after-tax impact"
            ],
            "summary": {
                "clients_with_opportunities": len(data),
                "total_harvestable": sum(d["harvestable_losses"] for d in data),
                "total_savings": sum(d["tax_savings"] for d in data)
            }
        }
    
    elif intent == "analyze_performance":
        top = DEMO_DATA["top_performers"]
        bottom = DEMO_DATA["underperformers"]
        return {
            "answer": f"Portfolio performance analysis: {len(top)} clients outperforming benchmark, {len(bottom)} underperforming. Best alpha: {top[0]['alpha']}%, Worst: {bottom[0]['alpha']}%.",
            "data": {"top_performers": top, "underperformers": bottom},
            "suggestions": [
                "Review underperforming portfolio allocations",
                "Document outperformance for client reports",
                "Analyze common factors in top performers"
            ],
            "summary": {
                "outperformers": len(top),
                "underperformers": len(bottom),
                "average_alpha": round((sum(d["alpha"] for d in top) + sum(d["alpha"] for d in bottom)) / (len(top) + len(bottom)), 2)
            }
        }
    
    elif intent == "find_high_value_clients":
        # Sort by AUM
        data = sorted(DEMO_DATA["rebalancing_clients"], key=lambda x: x["aum"], reverse=True)[:5]
        return {
            "answer": f"Your top {len(data)} clients by AUM represent ${sum(d['aum'] for d in data):,} in total assets.",
            "data": data,
            "suggestions": [
                "Schedule VIP client reviews",
                "Review service levels for top clients",
                "Identify referral opportunities"
            ],
            "summary": {
                "top_clients": len(data),
                "total_aum": sum(d["aum"] for d in data)
            }
        }
    
    else:
        return {
            "answer": "I can help you with information about your clients, portfolios, compliance, revenue, and more. Try asking questions like:\n\n• 'Which clients need rebalancing?'\n• 'Who is at retirement risk?'\n• 'Show me compliance issues'\n• 'What are my revenue opportunities?'\n• 'Find clients at risk of leaving'",
            "data": None,
            "suggestions": [
                "Which clients need rebalancing?",
                "Who is at retirement risk?",
                "Show me tax-loss harvesting opportunities",
                "What compliance items need attention?",
                "Who are my highest value clients?"
            ],
            "summary": None
        }


async def get_ai_response(query: str, context: str = "") -> str:
    """Get AI-enhanced response if available."""
    if not AI_AVAILABLE or not EMERGENT_KEY:
        return None
    
    try:
        system_prompt = """You are an AI copilot for financial advisors. You help them understand their client book, 
identify opportunities, and manage their practice efficiently. Be concise and actionable in your responses.
Focus on specific numbers, client names, and recommended actions."""
        
        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=f"Context: {context}\n\nQuery: {query}")
        ]
        
        config = LLMConfig(temperature=0.7, max_tokens=500)
        response = await chat(
            messages=messages,
            api_key=EMERGENT_KEY,
            provider=LLMProvider.OPENAI,
            model="gpt-4o-mini",
            config=config
        )
        
        return response.content
    except Exception as e:
        logger.error(f"AI response error: {e}")
        return None


# ==================== API ENDPOINTS ====================

@router.post("/query")
async def process_query(request: CopilotQuery):
    """Process a natural language query and return insights."""
    query_id = f"query_{uuid.uuid4().hex[:8]}"
    
    # Classify the query
    intent, category = classify_query(request.query)
    
    # Generate base response
    response_data = generate_response(intent, request.query)
    
    # Try to enhance with AI if available
    ai_enhancement = None
    if AI_AVAILABLE and EMERGENT_KEY and response_data.get("data"):
        context = f"Query category: {category.value}\nIntent: {intent}\nData summary: {response_data.get('summary', {})}"
        ai_enhancement = await get_ai_response(request.query, context)
    
    return {
        "query_id": query_id,
        "query": request.query,
        "category": category.value,
        "intent": intent,
        "response": {
            "answer": ai_enhancement or response_data["answer"],
            "data": response_data.get("data"),
            "summary": response_data.get("summary"),
            "suggestions": response_data.get("suggestions", [])
        },
        "confidence": 0.85 if intent != "general_query" else 0.5,
        "ai_enhanced": ai_enhancement is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/suggestions")
async def get_query_suggestions():
    """Get suggested queries based on current data state."""
    suggestions = [
        {
            "query": "Which clients need rebalancing?",
            "category": "portfolios",
            "urgency": "high",
            "preview": "4 clients with portfolio drift >10%"
        },
        {
            "query": "Who is at retirement risk?",
            "category": "risk",
            "urgency": "high",
            "preview": "2 clients may not meet retirement goals"
        },
        {
            "query": "Show me tax-loss harvesting opportunities",
            "category": "tax",
            "urgency": "high",
            "preview": "$125K harvestable losses, $48K potential savings"
        },
        {
            "query": "What compliance items need attention?",
            "category": "compliance",
            "urgency": "medium",
            "preview": "3 items requiring action"
        },
        {
            "query": "Which clients are at risk of leaving?",
            "category": "clients",
            "urgency": "high",
            "preview": "2 clients showing disengagement signs"
        },
        {
            "query": "Where are my biggest revenue opportunities?",
            "category": "revenue",
            "urgency": "medium",
            "preview": "$23K potential additional revenue"
        },
        {
            "query": "Show underperforming portfolios",
            "category": "performance",
            "urgency": "medium",
            "preview": "2 portfolios below benchmark"
        }
    ]
    
    return {
        "suggestions": suggestions,
        "high_priority": len([s for s in suggestions if s["urgency"] == "high"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/quick-insights")
async def get_quick_insights():
    """Get quick insights summary for dashboard."""
    return {
        "insights": [
            {
                "category": "portfolios",
                "title": "Rebalancing Needed",
                "value": 4,
                "change": "+1 since last week",
                "action": "Review portfolios"
            },
            {
                "category": "compliance",
                "title": "Compliance Items",
                "value": 3,
                "change": "2 high priority",
                "action": "Address compliance"
            },
            {
                "category": "tax",
                "title": "Tax Savings Available",
                "value": "$48,750",
                "change": "Before EOFY",
                "action": "Execute harvesting"
            },
            {
                "category": "clients",
                "title": "At-Risk Clients",
                "value": 2,
                "change": "$14K revenue at risk",
                "action": "Schedule outreach"
            },
            {
                "category": "revenue",
                "title": "Revenue Opportunity",
                "value": "$23,400",
                "change": "Fee optimization available",
                "action": "Review fees"
            }
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/action/{action_type}")
async def execute_copilot_action(action_type: str, client_ids: Optional[List[str]] = None):
    """Execute an action suggested by the copilot."""
    action_id = f"action_{uuid.uuid4().hex[:8]}"
    
    action_map = {
        "rebalance_all": {
            "description": "Generate rebalancing trades for all flagged clients",
            "next_step": "Review trades in batch execution module"
        },
        "schedule_reviews": {
            "description": "Schedule compliance reviews for overdue clients",
            "next_step": "Calendar invites will be sent"
        },
        "tax_harvest": {
            "description": "Execute tax-loss harvesting for eligible clients",
            "next_step": "Review trades in batch execution module"
        },
        "outreach_campaign": {
            "description": "Send re-engagement emails to at-risk clients",
            "next_step": "Emails queued for review"
        }
    }
    
    action_info = action_map.get(action_type, {
        "description": f"Execute action: {action_type}",
        "next_step": "Action queued"
    })
    
    return {
        "success": True,
        "action_id": action_id,
        "action_type": action_type,
        "description": action_info["description"],
        "next_step": action_info["next_step"],
        "affected_clients": len(client_ids) if client_ids else "all applicable",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/conversation-starters")
async def get_conversation_starters():
    """Get natural conversation starters based on current state."""
    return {
        "starters": [
            "Good morning! 4 clients need portfolio rebalancing today.",
            "Heads up: 2 KYC reviews are overdue and need attention.",
            "Quick win: $48K in tax savings available before EOFY.",
            "2 clients showing disengagement signs - might be worth a call.",
            "Your top performer is up 18.5% YTD - consider sharing with the client."
        ],
        "daily_focus": "Today's priority: Address compliance items and review at-risk client portfolios.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
