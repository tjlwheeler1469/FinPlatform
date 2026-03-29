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

    # NEWS HEADLINES - Financial News from Multiple Sources
    try:
        from routes.news_headlines import router as news_router
        app.include_router(news_router, prefix="/api")
        logger.info("NEWS HEADLINES loaded: CNBC, WSJ, FT, AFR, Economist, Reuters, Bloomberg")
    except ImportError as e:
        logger.error(f"Failed to load news headlines routes: {e}")

    # ADVICEOS - Compliance-First Scenario Generator & Compliance Engine
    try:
        from routes.scenario_generator import router as scenario_gen_router
        from routes.compliance_engine import router as compliance_eng_router
        from routes.reports_dashboard import router as reports_dashboard_router
        app.include_router(scenario_gen_router, prefix="/api")
        app.include_router(compliance_eng_router, prefix="/api")
        app.include_router(reports_dashboard_router, prefix="/api")
        logger.info("ADVICEOS loaded: Scenario Generator, Compliance Engine, Reports Dashboard, Audit Trails")
    except ImportError as e:
        logger.error(f"Failed to load AdviceOS routes: {e}")

    # PDF REPORTS - Generate compliance reports in PDF format
    try:
        from routes.pdf_reports import router as pdf_reports_router
        app.include_router(pdf_reports_router, prefix="/api")
        logger.info("PDF REPORTS loaded: Compliance Summary, Audit Trail, Breach Reports, Client Files")
    except ImportError as e:
        logger.error(f"Failed to load PDF reports routes: {e}")

    # NOTIFICATION SERVICE - Email & SMS alerts for compliance breaches
    try:
        from routes.notification_service import router as notification_router
        app.include_router(notification_router, prefix="/api")
        logger.info("NOTIFICATION SERVICE loaded: Email (SendGrid), SMS (Twilio), Breach Alerts")
    except ImportError as e:
        logger.error(f"Failed to load notification service routes: {e}")

    # VOICE INTERFACE - Whisper speech-to-text for voice commands
    try:
        from routes.voice_interface import router as voice_router
        app.include_router(voice_router, prefix="/api")
        logger.info("VOICE INTERFACE loaded: Whisper STT, Voice Commands, Natural Language")
    except ImportError as e:
        logger.error(f"Failed to load voice interface routes: {e}")

    # LICENSEE MULTI-TENANT DASHBOARD - AFSL holder management
    try:
        from routes.licensee_dashboard import router as licensee_router
        app.include_router(licensee_router, prefix="/api")
        logger.info("LICENSEE DASHBOARD loaded: Multi-tenant, APL, Compliance Rules, Adviser Management")
    except ImportError as e:
        logger.error(f"Failed to load licensee dashboard routes: {e}")

    # GRC-LITE LAYER - Risk Register, Incidents, Controls (CPS 230 compliant)
    try:
        from routes.grc_lite import router as grc_router
        app.include_router(grc_router, prefix="/api")
        logger.info("GRC-LITE loaded: Risk Register, Incident Tracking, Control Mapping, Dashboards")
    except ImportError as e:
        logger.error(f"Failed to load GRC-Lite routes: {e}")

    # AUTO FILE NOTE GENERATOR - Adviser Efficiency
    try:
        from routes.file_note_generator import router as file_note_router
        app.include_router(file_note_router, prefix="/api")
        logger.info("FILE NOTE GENERATOR loaded: Auto advice notes, Meeting notes, Xplan export")
    except ImportError as e:
        logger.error(f"Failed to load file note generator routes: {e}")

    # IMMUTABLE AUDIT SERVICE - ASIC/APRA/ISO Compliant
    try:
        from routes.audit_service import router as audit_service_router
        app.include_router(audit_service_router, prefix="/api")
        logger.info("AUDIT SERVICE loaded: Immutable Audit Logs, Hash Chaining, Tamper Detection, Regulatory Export")
    except ImportError as e:
        logger.error(f"Failed to load audit service routes: {e}")

    # SECURITY CONTROLS - CPS 234 Aligned
    try:
        from routes.security_controls import router as security_controls_router
        app.include_router(security_controls_router, prefix="/api")
        logger.info("SECURITY CONTROLS loaded: RBAC, Rate Limiting, Security Events, API Key Management")
    except ImportError as e:
        logger.error(f"Failed to load security controls routes: {e}")

    # OBJECT STORAGE - Document & Audit Export Storage
    try:
        from routes.object_storage import router as object_storage_router
        app.include_router(object_storage_router, prefix="/api")
        logger.info("OBJECT STORAGE loaded: File Uploads, Audit Exports, Document Backups")
    except ImportError as e:
        logger.error(f"Failed to load object storage routes: {e}")

    # INCIDENT MANAGEMENT - CPS 230 Compliant
    try:
        from routes.incident_management import router as incident_router
        app.include_router(incident_router, prefix="/api")
        logger.info("INCIDENT MANAGEMENT loaded: Severity Classification, Escalation, Regulatory Reporting")
    except ImportError as e:
        logger.error(f"Failed to load incident management routes: {e}")

    # EVENT STREAMING - Real-time Event Bus
    try:
        from routes.event_streaming import router as event_streaming_router
        app.include_router(event_streaming_router, prefix="/api")
        logger.info("EVENT STREAMING loaded: Real-time Events, WebSocket, Compliance Triggers")
    except ImportError as e:
        logger.error(f"Failed to load event streaming routes: {e}")

    # ENTERPRISE DOCUMENTATION - Due Diligence Pack
    try:
        from routes.enterprise_docs import router as enterprise_docs_router
        app.include_router(enterprise_docs_router, prefix="/api")
        logger.info("ENTERPRISE DOCS loaded: Architecture, Security Policy, BCP/DR, Compliance Framework")
    except ImportError as e:
        logger.error(f"Failed to load enterprise docs routes: {e}")

    # XPLAN MOCK API - Simulated Xplan Responses
    try:
        from routes.xplan_mock import router as xplan_mock_router
        app.include_router(xplan_mock_router, prefix="/api")
        logger.info("XPLAN MOCK loaded: Simulated Xplan API for development")
    except ImportError as e:
        logger.error(f"Failed to load xplan mock routes: {e}")

    # XPLAN INTEGRATION - Real Xplan Integration Service
    try:
        from routes.xplan_integration import router as xplan_integration_router
        app.include_router(xplan_integration_router, prefix="/api")
        logger.info("XPLAN INTEGRATION loaded: OAuth, Sync, File Notes, Audit Logging")
    except ImportError as e:
        logger.error(f"Failed to load xplan integration routes: {e}")

    # ENTERPRISE SYSTEM OF RECORD - Replay Advice, Cost Reduction, Risk/Control, Breach Register
    try:
        from routes.replay_advice import router as replay_advice_router
        from routes.cost_reduction import router as cost_reduction_router
        from routes.risk_control_mapping import router as risk_control_router
        from routes.breach_register import router as breach_register_router
        
        app.include_router(replay_advice_router, prefix="/api")
        app.include_router(cost_reduction_router, prefix="/api")
        app.include_router(risk_control_router, prefix="/api")
        app.include_router(breach_register_router, prefix="/api")
        
        logger.info("ENTERPRISE SYSTEM OF RECORD loaded: Replay Advice, Cost Reduction, Risk/Control Mapping, Breach Register")
    except ImportError as e:
        logger.error(f"Failed to load enterprise system of record routes: {e}")

    # RETIREMENT CALCULATOR - SMSF Planning Module
    try:
        from routes.retirement_calculator import router as retirement_router
        app.include_router(retirement_router, prefix="/api")
        logger.info("RETIREMENT CALCULATOR loaded: SMSF Planning, Super Contributions, Investment Profiles, Projections")
    except ImportError as e:
        logger.error(f"Failed to load retirement calculator routes: {e}")

    # DECUMULATION CALCULATOR - Pension Phase Planning
    try:
        from routes.decumulation_calculator import router as decumulation_router
        app.include_router(decumulation_router, prefix="/api")
        logger.info("DECUMULATION CALCULATOR loaded: Pension Phase, Drawdown, Age Pension, Assets/Liabilities")
    except ImportError as e:
        logger.error(f"Failed to load decumulation calculator routes: {e}")

    # PLATFORM INTEGRATIONS - AMP North, Netwealth, Hub24, Class, IRESS
    try:
        from routes.platform_integrations import router as platforms_router
        app.include_router(platforms_router, prefix="/api")
        logger.info("PLATFORM INTEGRATIONS loaded: AMP North, Netwealth, Hub24, Class, IRESS - Bi-directional Sync")
    except ImportError as e:
        logger.error(f"Failed to load platform integrations routes: {e}")

    # CLIENT PROFILE RETIREMENT - Save & Sync Retirement Data to Client Profiles
    try:
        from routes.client_profile_retirement import router as client_profile_router
        app.include_router(client_profile_router, prefix="/api")
        logger.info("CLIENT PROFILE RETIREMENT loaded: Multi-Structure Calculations, Profile Sync, Platform Push")
    except ImportError as e:
        logger.error(f"Failed to load client profile retirement routes: {e}")

    # WEBSOCKET SERVICE - Real-time Push Notifications
    try:
        from routes.websocket_service import router as websocket_router
        app.include_router(websocket_router, prefix="/api")
        logger.info("WEBSOCKET SERVICE loaded: Real-time notifications for Enterprise, Platform Sync, Compliance")
    except ImportError as e:
        logger.error(f"Failed to load websocket service routes: {e}")

    # RETIREMENT MILESTONES - Track client retirement milestones
    try:
        from routes.retirement_milestones import router as milestones_router
        app.include_router(milestones_router, prefix="/api")
        logger.info("RETIREMENT MILESTONES loaded: Track accumulation, debt, insurance, pension milestones")
    except ImportError as e:
        logger.error(f"Failed to load retirement milestones routes: {e}")

    # SOA/ROA COMPLIANCE - Track compliance documents
    try:
        from routes.soa_roa_compliance import router as soa_roa_router
        app.include_router(soa_roa_router, prefix="/api")
        logger.info("SOA/ROA COMPLIANCE loaded: Statement/Record of Advice tracking, reviews, audit trail")
    except ImportError as e:
        logger.error(f"Failed to load SOA/ROA compliance routes: {e}")

    # BUDGET & EXPENSES - Comprehensive budgeting with goals and alerts
    try:
        from routes.budget_expenses import router as budget_router
        app.include_router(budget_router, prefix="/api")
        logger.info("BUDGET & EXPENSES loaded: Income/expense tracking, goals, alerts, spending analysis")
    except ImportError as e:
        logger.error(f"Failed to load budget expenses routes: {e}")

    # PUSH NOTIFICATIONS - In-app, desktop, mobile push notifications
    try:
        from routes.push_notifications import router as push_router
        app.include_router(push_router, prefix="/api")
        logger.info("PUSH NOTIFICATIONS loaded: In-app, desktop push, mobile push (FCM), notification center")
    except ImportError as e:
        logger.error(f"Failed to load push notifications routes: {e}")

    # STRESS TESTING - Load testing for 20,000+ concurrent users
    try:
        from routes.stress_testing import router as stress_router
        app.include_router(stress_router, prefix="/api")
        logger.info("STRESS TESTING loaded: Load testing, capacity estimation, notification flood tests")
    except ImportError as e:
        logger.error(f"Failed to load stress testing routes: {e}")

    # CLIENT WEALTH DATA - Unified wealth data for Retirement Planner
    try:
        from routes.client_wealth_data import router as client_wealth_router
        app.include_router(client_wealth_router, prefix="/api")
        logger.info("CLIENT WEALTH DATA loaded: Unified wealth snapshot, entity management, asset types")
    except ImportError as e:
        logger.error(f"Failed to load client wealth data routes: {e}")

    # AGE PENSION MODELING - Australian Age Pension calculations
    try:
        from routes.age_pension import router as age_pension_router
        app.include_router(age_pension_router, prefix="/api")
        logger.info("AGE PENSION loaded: Eligibility calculations, payment projections, deeming rates")
    except ImportError as e:
        logger.error(f"Failed to load age pension routes: {e}")

    # USER PROFILE - Manage user profile data and preferences
    try:
        from routes.user_profile import router as user_profile_router
        app.include_router(user_profile_router)
        logger.info("USER PROFILE loaded: Profile management, preferences, language settings")
    except ImportError as e:
        logger.error(f"Failed to load user profile routes: {e}")

    # MULTI-TENANT MANAGEMENT - AFSL/Licensee data isolation
    try:
        from routes.multi_tenant import router as multi_tenant_router
        app.include_router(multi_tenant_router, prefix="/api")
        logger.info("MULTI-TENANT loaded: Licensee management, adviser management, data isolation, audit logs")
    except ImportError as e:
        logger.error(f"Failed to load multi-tenant routes: {e}")

    # RETIREMENT CONFIDENCE ENGINE - Monte Carlo simulation-based confidence scoring
    try:
        from routes.confidence_engine import router as confidence_router
        app.include_router(confidence_router, prefix="/api")
        logger.info("CONFIDENCE ENGINE loaded: Monte Carlo simulations, multi-scenario comparison, risk analysis")
    except ImportError as e:
        logger.error(f"Failed to load confidence engine routes: {e}")

    # AI EXPLANATION ENGINE - Natural language explanations for confidence scores
    try:
        from routes.ai_explanation_engine import router as ai_explain_router
        app.include_router(ai_explain_router, prefix="/api")
        logger.info("AI EXPLANATION ENGINE loaded: Score explanations, risk analysis, recommendations")
    except ImportError as e:
        logger.error(f"Failed to load AI explanation engine routes: {e}")

    # ADVISER INTELLIGENCE - Daily insights and client alerts
    try:
        from routes.adviser_intelligence import router as adviser_intel_router
        app.include_router(adviser_intel_router, prefix="/api")
        logger.info("ADVISER INTELLIGENCE loaded: Client alerts, opportunities, bulk actions")
    except ImportError as e:
        logger.error(f"Failed to load adviser intelligence routes: {e}")

    # SCALING INFRASTRUCTURE - Caching, rate limiting, background jobs
    try:
        from routes.scaling_infrastructure import router as scaling_router
        app.include_router(scaling_router, prefix="/api")
        logger.info("SCALING INFRASTRUCTURE loaded: Cache, rate limiter, job queue, metrics")
    except ImportError as e:
        logger.error(f"Failed to load scaling infrastructure routes: {e}")

    # CONFIDENCE HISTORY - Historical score tracking and trends
    try:
        from routes.confidence_history import router as history_router
        app.include_router(history_router, prefix="/api")
        logger.info("CONFIDENCE HISTORY loaded: Historical tracking, trends, milestones")
    except ImportError as e:
        logger.error(f"Failed to load confidence history routes: {e}")

    # SERVICES AUSTRALIA - Age Pension API integration
    try:
        from routes.services_australia import router as services_aus_router
        app.include_router(services_aus_router, prefix="/api")
        logger.info("SERVICES AUSTRALIA loaded: Age Pension assessment, rates, projections")
    except ImportError as e:
        logger.error(f"Failed to load Services Australia routes: {e}")

    # CGT OPTIMIZER - Capital gains tax optimization
    try:
        from routes.cgt_optimizer import router as cgt_router
        app.include_router(cgt_router, prefix="/api")
        logger.info("CGT OPTIMIZER loaded: Tax-loss harvesting, disposal planning, scenarios")
    except ImportError as e:
        logger.error(f"Failed to load CGT optimizer routes: {e}")

    # PARTNER COMPARISON - Compare individual vs couple retirement
    try:
        from routes.partner_comparison import router as partner_router
        app.include_router(partner_router, prefix="/api")
        logger.info("PARTNER COMPARISON loaded: Individual vs couple confidence analysis")
    except ImportError as e:
        logger.error(f"Failed to load partner comparison routes: {e}")

    # REAL-TIME COLLABORATION - WebSocket-based advisor-client sessions
    try:
        from routes.realtime_collaboration import router as collab_router
        app.include_router(collab_router, prefix="/api")
        logger.info("REAL-TIME COLLABORATION loaded: WebSocket sessions, chat, shared inputs")
    except ImportError as e:
        logger.error(f"Failed to load collaboration routes: {e}")

    # SCENARIO TEMPLATES - Pre-built retirement scenarios
    try:
        from routes.scenario_templates import router as templates_router
        app.include_router(templates_router, prefix="/api")
        logger.info("SCENARIO TEMPLATES loaded: Early retirement, sabbatical, inheritance, etc.")
    except ImportError as e:
        logger.error(f"Failed to load scenario templates routes: {e}")

    # HYBRID ENGINE - World-class retirement calculation engine
    try:
        from routes.hybrid_engine_api import router as hybrid_router
        app.include_router(hybrid_router, prefix="/api")
        logger.info("HYBRID ENGINE loaded: Monte Carlo, multi-factor confidence, stress testing")
    except ImportError as e:
        logger.error(f"Failed to load hybrid engine routes: {e}")

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
async def shutdown_db_client():
    """Clean up database connection on shutdown."""
    client.close()
    logger.info("Database connection closed")
