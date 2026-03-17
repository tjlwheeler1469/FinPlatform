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

# ==================== MODULAR ROUTES ====================

def include_all_routes():
    """Import and include all modular routes."""
    
    # Core routes
    try:
        from routes.auth import router as auth_router
        from routes.dashboard import router as dashboard_router
        from routes.tax import router as tax_router
        from routes.analysis import router as analysis_router
        from routes.crm import router as crm_router
        from routes.practice import router as practice_router
        from routes.documents import router as documents_router
        from routes.portfolio import router as portfolio_router
        from routes.market import router as market_router
        from routes.scenarios import router as scenarios_router
        from routes.security import router as security_router
        from routes.goals import router as goals_router
        from routes.ai import router as ai_router
        from routes.timeline import router as timeline_router
        from routes.copilot import router as copilot_router
        from routes.marketplace import router as marketplace_router
        from routes.aggregation import router as aggregation_router
        from routes.meeting_prep import router as meeting_prep_router
        from routes.research import router as research_router
        from routes.compliance import router as compliance_router
        from routes.wealth_dashboard import router as wealth_dashboard_router
        from routes.command_center import router as command_center_router
        from routes.live_data import router as live_data_router
        from routes.holdings import router as holdings_router
        
        app.include_router(auth_router, prefix="/api")
        app.include_router(dashboard_router, prefix="/api")
        app.include_router(tax_router, prefix="/api")
        app.include_router(analysis_router, prefix="/api")
        app.include_router(crm_router, prefix="/api")
        app.include_router(practice_router, prefix="/api")
        app.include_router(documents_router, prefix="/api")
        app.include_router(portfolio_router, prefix="/api")
        app.include_router(market_router, prefix="/api")
        app.include_router(scenarios_router, prefix="/api")
        app.include_router(security_router, prefix="/api")
        app.include_router(goals_router, prefix="/api")
        app.include_router(ai_router, prefix="/api")
        app.include_router(timeline_router, prefix="/api")
        app.include_router(copilot_router, prefix="/api")
        app.include_router(marketplace_router, prefix="/api")
        app.include_router(aggregation_router, prefix="/api")
        app.include_router(meeting_prep_router, prefix="/api")
        app.include_router(research_router, prefix="/api")
        app.include_router(compliance_router, prefix="/api")
        app.include_router(wealth_dashboard_router, prefix="/api")
        app.include_router(command_center_router, prefix="/api")
        app.include_router(live_data_router, prefix="/api")
        app.include_router(holdings_router, prefix="/api")
        
        logger.info("Core routes loaded successfully")
    except ImportError as e:
        logger.error(f"Failed to load core routes: {e}")
    
    # Advanced routes
    try:
        from routes.intelligence import router as intelligence_router
        from routes.meeting_automation import router as meeting_automation_router
        from routes.client_portal import router as client_portal_router
        from routes.portfolio_monitoring import router as portfolio_monitoring_router
        from routes.financial_graph import router as financial_graph_router
        from routes.tax_optimization import router as tax_optimization_router
        from routes.rebalancing import router as rebalancing_router
        from routes.notifications import router as notifications_router
        from routes.document_generation import router as document_generation_router
        from routes.data_aggregators import router as data_aggregators_router
        from routes.trading import router as trading_router
        from routes.market_data import router as market_data_router
        from routes.email_routes import router as email_router
        from routes.bank_feeds import router as bank_feeds_router
        
        app.include_router(intelligence_router, prefix="/api")
        app.include_router(meeting_automation_router, prefix="/api")
        app.include_router(client_portal_router, prefix="/api")
        app.include_router(portfolio_monitoring_router, prefix="/api")
        app.include_router(financial_graph_router, prefix="/api")
        app.include_router(tax_optimization_router, prefix="/api")
        app.include_router(rebalancing_router, prefix="/api")
        app.include_router(notifications_router, prefix="/api")
        app.include_router(document_generation_router, prefix="/api")
        app.include_router(data_aggregators_router, prefix="/api")
        app.include_router(trading_router, prefix="/api")
        app.include_router(market_data_router, prefix="/api")
        app.include_router(email_router, prefix="/api")
        app.include_router(bank_feeds_router, prefix="/api")
        
        logger.info("Advanced routes loaded successfully")
    except ImportError as e:
        logger.error(f"Failed to load advanced routes: {e}")
    
    # New killer feature routes - Next Best Action Engine & Practice Health
    try:
        from routes.next_best_action import router as next_action_router
        from routes.practice_health import router as practice_health_router
        from routes.meeting_workflow import router as meeting_workflow_router
        from routes.white_label import router as white_label_router
        
        app.include_router(next_action_router, prefix="/api")
        app.include_router(practice_health_router, prefix="/api")
        app.include_router(meeting_workflow_router, prefix="/api")
        app.include_router(white_label_router, prefix="/api")
        
        logger.info("Killer feature routes loaded: Next Best Action, Practice Health, Meeting Workflow, White-Label")
    except ImportError as e:
        logger.error(f"Failed to load killer feature routes: {e}")
    
    # UNIFIED EXECUTION LAYER - Phase 1 & 2
    try:
        from routes.execution_layer import router as execution_router
        from routes.portfolio_engine import router as portfolio_engine_router
        from routes.smart_router import router as smart_router_router
        from routes.realtime_data import router as realtime_router
        from routes.crypto_integration import router as crypto_router
        from routes.reconciliation import router as reconciliation_router
        
        app.include_router(execution_router, prefix="/api")
        app.include_router(portfolio_engine_router, prefix="/api")
        app.include_router(smart_router_router, prefix="/api")
        app.include_router(realtime_router, prefix="/api")
        app.include_router(crypto_router, prefix="/api")
        app.include_router(reconciliation_router, prefix="/api")
        
        logger.info("EXECUTION LAYER loaded: Trading, Portfolio Engine, Smart Router, Real-Time, Crypto, Reconciliation")
    except ImportError as e:
        logger.error(f"Failed to load execution layer routes: {e}")
    
    # REVENUE LAYER - Phase 3
    try:
        from routes.revenue_layer import router as revenue_router
        app.include_router(revenue_router, prefix="/api")
        logger.info("REVENUE LAYER loaded: AUM Fees, Trading Fees, Subscriptions")
    except ImportError as e:
        logger.error(f"Failed to load revenue layer routes: {e}")
    
    # FX TRADING LAYER
    try:
        from routes.fx_trading import router as fx_router
        app.include_router(fx_router, prefix="/api")
        logger.info("FX TRADING loaded: MetaTrader 5, cTrader, Currency Hedging")
    except ImportError as e:
        logger.error(f"Failed to load FX trading routes: {e}")
    
    # DECISION ENGINE - Financial health and projections
    try:
        from routes.decision_engine import router as decision_router
        app.include_router(decision_router, prefix="/api")
        logger.info("DECISION ENGINE loaded: Health Score, Recommendations, Monte Carlo, Scenarios")
    except ImportError as e:
        logger.error(f"Failed to load decision engine routes: {e}")

# Include all routes
include_all_routes()

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
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "wealth-command",
        "version": "6.1.0",
        "architecture": "modular",
        "execution_layer": {
            "trading": True,
            "portfolio_engine": True,
            "smart_router": True,
            "realtime_data": True,
            "crypto": True,
            "reconciliation": True,
            "fx_trading": True
        },
        "revenue_layer": {
            "aum_fees": True,
            "trading_fees": True,
            "subscriptions": True
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
            "currency_hedging"
        ]
    }

# ==================== LIFECYCLE ====================

@app.on_event("shutdown")
async def shutdown_db_client():
    """Clean up database connection on shutdown."""
    client.close()
    logger.info("Database connection closed")
