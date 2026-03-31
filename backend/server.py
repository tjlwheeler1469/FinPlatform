"""
Wealth Command - AI-Native Financial Advisor Operating System
Main server entry point - Refactored modular architecture
"""
from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(
    title="Wealth Command - AI Financial Advisor OS",
    description="Bloomberg Terminal + Salesforce + AI Copilot + Unified Execution Layer for Wealth Advisors",
    version="6.0.0"
)

# Import database connection
from db import client

# ==================== ROUTE REGISTRATION ====================

from route_registry import register_all_routes
route_summary = register_all_routes(app)

# ==================== MIDDLEWARE ====================

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "wealth-command",
        "version": "8.0.0",
        "architecture": "modular",
        "execution_layer": {
            "trading": True,
            "portfolio_engine": True,
            "smart_router": True,
            "realtime_data": True,
            "realtime_data_layer": True,
            "crypto": True,
            "reconciliation": True,
            "fx_trading": True,
            "action_layer": True,
            "alpaca_paper_trading": True,
            "batch_execution": True,
            "execution_engine_enhanced": True
        },
        "adviceos": {
            "scenario_generator": True,
            "compliance_engine": True,
            "reports_dashboard": True,
            "pdf_reports": True,
            "notification_service": True,
            "voice_interface": True,
            "licensee_dashboard": True,
            "grc_lite": True,
            "file_note_generator": True,
            "audit_service": True,
            "security_controls": True,
            "object_storage": True,
            "incident_management": True,
            "event_streaming": True,
            "enterprise_docs": True,
            "xplan_integration": True,
            "replay_advice": True,
            "cost_reduction": True,
            "risk_control_mapping": True,
            "breach_register": True,
            "retirement_calculator": True,
            "decumulation_calculator": True,
            "platform_integrations": True,
            "client_profile_retirement": True,
            "websocket_service": True,
            "xplan_phase2": True,
            "retirement_milestones": True,
            "soa_roa_compliance": True,
            "budget_expenses": True
        },
        "revenue_layer": {
            "aum_fees": True,
            "trading_fees": True,
            "subscriptions": True
        },
        "intelligence": {
            "macro_data": True,
            "broker_research": True,
            "decision_engine": True,
            "next_best_action": True,
            "book_intelligence": True,
            "ai_copilot_advanced": True,
            "feedback_learning": True
        },
        "workflow_engine": {
            "client_onboarding": True,
            "annual_review": True,
            "tax_planning": True,
            "portfolio_rebalance": True,
            "meeting_automation": True
        },
        "crm": {
            "household_intelligence": True,
            "compliance_audit": True,
            "meeting_automation": True
        },
        "client_portal": {
            "net_worth": True,
            "portfolios": True,
            "goals": True,
            "insights": True,
            "notifications": True,
            "documents": True
        },
        "feedback_loop": {
            "advisor_preferences": True,
            "outcome_tracking": True,
            "personalized_recommendations": True,
            "learning_system": True
        },
        "capabilities": [
            "next_best_action",
            "practice_health", 
            "meeting_workflow",
            "block_trading",
            "model_portfolios",
            "auto_rebalancing",
            "multi_asset_execution",
            "cross_platform_reconciliation",
            "revenue_management",
            "tiered_fees",
            "invoice_generation",
            "fx_trading",
            "currency_hedging",
            "one_click_execution",
            "batch_rebalancing",
            "tax_loss_harvesting",
            "macro_market_data",
            "broker_research",
            "workflow_automation",
            "book_intelligence",
            "alpaca_paper_trading",
            "household_management",
            "compliance_audit",
            "meeting_to_everything",
            "batch_execution",
            "client_portal",
            "ai_copilot_advanced",
            "natural_language_queries",
            "feedback_learning",
            "execution_loop_closure",
            "realtime_data_layer",
            "single_source_of_truth"
        ]
    }

# ==================== LIFECYCLE ====================

@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    """Clean up database connection on shutdown."""
    client.close()
    logger.info("Database connection closed")
