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
    
    # MACRO MARKET DATA - Global indices, currencies, bonds, commodities, crypto
    try:
        from routes.macro_data import router as macro_router
        app.include_router(macro_router, prefix="/api")
        logger.info("MACRO DATA loaded: Indices, FX, Bonds, Commodities, Crypto, Futures")
    except ImportError as e:
        logger.error(f"Failed to load macro data routes: {e}")
    
    # ACTION LAYER - Execution Engine (1-Click Actions)
    try:
        from routes.action_layer import router as action_router
        app.include_router(action_router, prefix="/api")
        logger.info("ACTION LAYER loaded: Next Best Actions, Batch Execution, Tax Harvesting")
    except ImportError as e:
        logger.error(f"Failed to load action layer routes: {e}")
    
    # BROKER RESEARCH - Stock Research Reports
    try:
        from routes.broker_research import router as research_router
        app.include_router(research_router, prefix="/api")
        logger.info("BROKER RESEARCH loaded: Analyst Ratings, Price Targets, Upgrades/Downgrades")
    except ImportError as e:
        logger.error(f"Failed to load broker research routes: {e}")
    
    # HOUSEHOLD INTELLIGENCE - Family Trees, Entities, Professional Networks
    try:
        from routes.household import router as household_router
        app.include_router(household_router, prefix="/api")
        logger.info("HOUSEHOLD INTELLIGENCE loaded: Family Trees, Trusts, Companies, SMSFs, Professionals")
    except ImportError as e:
        logger.error(f"Failed to load household routes: {e}")
    
    # COMPLIANCE & AUDIT - KYC/AML, Documents, Approvals, Audit Logs
    try:
        from routes.compliance_audit import router as compliance_router
        app.include_router(compliance_router, prefix="/api")
        logger.info("COMPLIANCE loaded: Audit Logs, KYC/AML, Documents, Approvals")
    except ImportError as e:
        logger.error(f"Failed to load compliance routes: {e}")
    
    # WORKFLOW ENGINE - Multi-step workflow automation
    try:
        from routes.workflow_engine import router as workflow_router
        app.include_router(workflow_router, prefix="/api")
        logger.info("WORKFLOW ENGINE loaded: Onboarding, Reviews, Tax Planning, Rebalancing")
    except ImportError as e:
        logger.error(f"Failed to load workflow engine routes: {e}")
    
    # KNOWLEDGE GRAPH - Financial relationship graph for AI reasoning
    try:
        from knowledge_graph import graph_router, init_knowledge_graph
        
        app.include_router(graph_router, prefix="/api")
        logger.info("KNOWLEDGE GRAPH routes loaded: Graph Queries, AI Insights, Cross-Client Analysis")
    except ImportError as e:
        logger.error(f"Failed to load knowledge graph routes: {e}")
    
    # ALPACA TRADING - Paper trading integration
    try:
        from routes.alpaca_trading import router as alpaca_router
        app.include_router(alpaca_router, prefix="/api")
        logger.info("ALPACA TRADING loaded: Paper Trading, Orders, Positions")
    except ImportError as e:
        logger.error(f"Failed to load Alpaca trading routes: {e}")
    
    # BOOK INTELLIGENCE - Cross-client analytics
    try:
        from routes.book_intelligence import router as book_intel_router
        app.include_router(book_intel_router, prefix="/api")
        logger.info("BOOK INTELLIGENCE loaded: Sector Analysis, Tax Opportunities, Engagement Health")
    except ImportError as e:
        logger.error(f"Failed to load book intelligence routes: {e}")
    
    # MEETING AUTOMATION ENGINE - Meeting → Everything
    try:
        from routes.meeting_automation_engine import router as meeting_auto_router
        app.include_router(meeting_auto_router, prefix="/api")
        logger.info("MEETING AUTOMATION loaded: Transcript Processing, CRM Updates, Tasks, Emails, Compliance")
    except ImportError as e:
        logger.error(f"Failed to load meeting automation routes: {e}")
    
    # BATCH EXECUTION - One-Click Execution Layer
    try:
        from routes.batch_execution import router as batch_exec_router
        app.include_router(batch_exec_router, prefix="/api")
        logger.info("BATCH EXECUTION loaded: Rebalancing, Tax Harvesting, Sector Reduction")
    except ImportError as e:
        logger.error(f"Failed to load batch execution routes: {e}")
    
    # CLIENT PORTAL - Client-Facing Experience
    try:
        from routes.client_portal import router as portal_router
        app.include_router(portal_router, prefix="/api")
        logger.info("CLIENT PORTAL loaded: Net Worth, Portfolios, Goals, Insights, Notifications")
    except ImportError as e:
        logger.error(f"Failed to load client portal routes: {e}")
    
    # ADVANCED AI COPILOT - Natural Language Queries
    try:
        from routes.ai_copilot_advanced import router as ai_copilot_router
        app.include_router(ai_copilot_router, prefix="/api")
        logger.info("AI COPILOT loaded: Natural Language Queries, Quick Insights, Action Suggestions")
    except ImportError as e:
        logger.error(f"Failed to load AI copilot routes: {e}")
    
    # FEEDBACK & LEARNING SYSTEM - Close the Loop
    try:
        from routes.feedback_learning import router as feedback_router
        app.include_router(feedback_router, prefix="/api")
        logger.info("FEEDBACK LOOP loaded: Advisor Preferences, Outcome Tracking, Personalized Recommendations")
    except ImportError as e:
        logger.error(f"Failed to load feedback learning routes: {e}")
    
    # ENHANCED EXECUTION ENGINE - Complete Execution Loop
    try:
        from routes.execution_engine_enhanced import router as execution_enhanced_router
        app.include_router(execution_enhanced_router, prefix="/api")
        logger.info("EXECUTION ENGINE ENHANCED loaded: Full Loop Execution, CRM Updates, Outcome Capture")
    except ImportError as e:
        logger.error(f"Failed to load execution engine enhanced routes: {e}")
    
    # REAL-TIME DATA LAYER - Single Source of Truth
    try:
        from routes.realtime_data_layer import router as realtime_data_layer_router
        app.include_router(realtime_data_layer_router, prefix="/api")
        logger.info("REALTIME DATA LAYER loaded: Live Portfolios, Market Data, Trade Execution")
    except ImportError as e:
        logger.error(f"Failed to load realtime data layer routes: {e}")

    # TRANSACTION MODELING - What-If Scenario Builder
    try:
        from routes.transaction_modeling import router as transaction_modeling_router
        app.include_router(transaction_modeling_router, prefix="/api")
        logger.info("TRANSACTION MODELING loaded: Property, Fund, Stock modeling with impact analysis")
    except ImportError as e:
        logger.error(f"Failed to load transaction modeling routes: {e}")

    # CLIENT CONTACT - Messaging & Quick Actions
    try:
        from routes.client_contact import router as client_contact_router
        app.include_router(client_contact_router, prefix="/api")
        logger.info("CLIENT CONTACT loaded: Platform Messages, Quick Actions, Notifications")
    except ImportError as e:
        logger.error(f"Failed to load client contact routes: {e}")
    
    # FINANCIAL PLAN GENERATION - AI-Powered Plans from Scenarios
    try:
        from routes.financial_plan import router as financial_plan_router
        app.include_router(financial_plan_router, prefix="/api")
        logger.info("FINANCIAL PLAN loaded: Plan Generation, Tax Analysis, Risk Assessment, Projections")
    except ImportError as e:
        logger.error(f"Failed to load financial plan routes: {e}")
    
    # FATHOM INTEGRATION - AI Meeting Notes
    try:
        from routes.fathom_integration import router as fathom_router
        app.include_router(fathom_router, prefix="/api")
        logger.info("FATHOM INTEGRATION loaded: Meeting Transcription, AI Summaries, Action Items")
    except ImportError as e:
        logger.error(f"Failed to load fathom integration routes: {e}")

    # LIVE CRYPTO PRICES - CoinGecko Integration
    try:
        from routes.crypto_prices import router as crypto_prices_router
        app.include_router(crypto_prices_router, prefix="/api")
        logger.info("CRYPTO PRICES loaded: Live CoinGecko prices, Portfolio values, Market data")
    except ImportError as e:
        logger.error(f"Failed to load crypto prices routes: {e}")
    
    # LIVE HYBRID PRICES - ASX Hybrid Securities
    try:
        from routes.hybrid_prices import router as hybrid_prices_router
        app.include_router(hybrid_prices_router, prefix="/api")
        logger.info("HYBRID PRICES loaded: Live ASX hybrid prices, Portfolio values, Yield data")
    except ImportError as e:
        logger.error(f"Failed to load hybrid prices routes: {e}")

    # XPLAN INTEGRATION - System of Record Connection
    try:
        from routes.xplan_integration import router as xplan_router
        app.include_router(xplan_router, prefix="/api")
        logger.info("XPLAN INTEGRATION loaded: Client Sync, Portfolio Import, Push to Xplan, Two-Way Sync")
    except ImportError as e:
        logger.error(f"Failed to load Xplan integration routes: {e}")

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
        "version": "7.4.0",
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
async def shutdown_db_client():
    """Clean up database connection on shutdown."""
    client.close()
    logger.info("Database connection closed")
