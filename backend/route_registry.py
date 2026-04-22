"""
Route Registry - Centralizes all route imports and registration.
Replaces 120+ individual try/except blocks in server.py.
"""
import logging

logger = logging.getLogger(__name__)

# Each entry: (module_path, router_var, prefix, description)
ROUTE_REGISTRY = [
    # Core routes
    ("routes.auth", "router", "/api", "Auth"),
    ("routes.dashboard", "router", "/api", "Dashboard"),
    ("routes.advice_copilot", "router", "/api", "Advice Copilot"),
    ("routes.execution_tickets", "router", "/api", "Execution Tickets"),
    ("routes.notify_client", "router", "/api", "Client Notifications"),
    ("routes.market_snapshot", "router", "/api", "Market Snapshot"),
    ("routes.tax", "router", "/api", "Tax"),
    ("routes.analysis", "router", "/api", "Analysis"),
    ("routes.crm", "router", "/api", "CRM"),
    ("routes.practice", "router", "/api", "Practice"),
    ("routes.documents", "router", "/api", "Documents"),
    ("routes.portfolio", "router", "/api", "Portfolio"),
    ("routes.market", "router", "/api", "Market"),
    ("routes.scenarios", "router", "/api", "Scenarios"),
    ("routes.security", "router", "/api", "Security"),
    ("routes.goals", "router", "/api", "Goals"),
    ("routes.ai", "router", "/api", "AI"),
    ("routes.timeline", "router", "/api", "Timeline"),
    ("routes.copilot", "router", "/api", "Copilot"),
    ("routes.marketplace", "router", "/api", "Marketplace"),
    ("routes.aggregation", "router", "/api", "Aggregation"),
    ("routes.meeting_prep", "router", "/api", "Meeting Prep"),
    ("routes.research", "router", "/api", "Research"),
    ("routes.compliance", "router", "/api", "Compliance"),
    ("routes.wealth_dashboard", "router", "/api", "Wealth Dashboard"),
    ("routes.command_center", "router", "/api", "Command Center"),
    ("routes.live_data", "router", "/api", "Live Data"),
    ("routes.holdings", "router", "/api", "Holdings"),

    # Advanced routes
    ("routes.intelligence", "router", "/api", "Intelligence"),
    ("routes.meeting_automation", "router", "/api", "Meeting Automation"),
    ("routes.client_portal", "router", "/api", "Client Portal"),
    ("routes.portfolio_monitoring", "router", "/api", "Portfolio Monitoring"),
    ("routes.financial_graph", "router", "/api", "Financial Graph"),
    ("routes.tax_optimization", "router", "/api", "Tax Optimization"),
    ("routes.rebalancing", "router", "/api", "Rebalancing"),
    ("routes.notifications", "router", "/api", "Notifications"),
    ("routes.invoices", "router", "", "Invoices"),
    ("routes.client_onboarding", "router", "", "Client Onboarding"),
    ("routes.document_generation", "router", "/api", "Document Generation"),
    ("routes.data_aggregators", "router", "/api", "Data Aggregators"),
    ("routes.trading", "router", "/api", "Trading"),
    ("routes.market_data", "router", "/api", "Market Data"),
    ("routes.email_routes", "router", "/api", "Email"),
    ("routes.bank_feeds", "router", "/api", "Bank Feeds"),

    # Killer features
    ("routes.next_best_action", "router", "/api", "Next Best Action"),
    ("routes.practice_health", "router", "/api", "Practice Health"),
    ("routes.meeting_workflow", "router", "/api", "Meeting Workflow"),
    ("routes.white_label", "router", "/api", "White Label"),

    # Execution Layer
    ("routes.execution_layer", "router", "/api", "Execution Layer"),
    ("routes.portfolio_engine", "router", "/api", "Portfolio Engine"),
    ("routes.smart_router", "router", "/api", "Smart Router"),
    ("routes.realtime_data", "router", "/api", "Real-time Data"),
    ("routes.crypto_integration", "router", "/api", "Crypto Integration"),
    ("routes.reconciliation", "router", "/api", "Reconciliation"),

    # Revenue & Trading
    ("routes.revenue_layer", "router", "/api", "Revenue Layer"),
    ("routes.fx_trading", "router", "/api", "FX Trading"),
    ("routes.decision_engine", "router", "/api", "Decision Engine"),
    ("routes.macro_data", "router", "/api", "Macro Data"),
    ("routes.action_layer", "router", "/api", "Action Layer"),
    ("routes.broker_research", "router", "/api", "Broker Research"),

    # Business Logic
    ("routes.household", "router", "/api", "Household Intelligence"),
    ("routes.compliance_audit", "router", "/api", "Compliance Audit"),
    ("routes.workflow_engine", "router", "/api", "Workflow Engine"),
    ("routes.alpaca_trading", "router", "/api", "Alpaca Trading"),
    ("routes.book_intelligence", "router", "/api", "Book Intelligence"),
    ("routes.meeting_automation_engine", "router", "/api", "Meeting Automation Engine"),
    ("routes.batch_execution", "router", "/api", "Batch Execution"),
    ("routes.ai_copilot_advanced", "router", "/api", "AI Copilot"),
    ("routes.feedback_learning", "router", "/api", "Feedback Learning"),
    ("routes.execution_engine_enhanced", "router", "/api", "Execution Engine Enhanced"),
    ("routes.realtime_data_layer", "router", "/api", "Real-time Data Layer"),
    ("routes.transaction_modeling", "router", "/api", "Transaction Modeling"),
    ("routes.client_contact", "router", "/api", "Client Contact"),
    ("routes.financial_plan", "router", "/api", "Financial Plan"),
    ("routes.fathom_integration", "router", "/api", "Fathom Integration"),

    # Market Data
    ("routes.crypto_prices", "router", "/api", "Crypto Prices"),
    ("routes.hybrid_prices", "router", "/api", "Hybrid Prices"),
    ("routes.xplan_integration", "router", "/api", "Xplan Integration"),
    ("routes.news_headlines", "router", "/api", "News Headlines"),

    # AdviceOS
    ("routes.scenario_generator", "router", "/api", "Scenario Generator"),
    ("routes.compliance_engine", "router", "/api", "Compliance Engine"),
    ("routes.reports_dashboard", "router", "/api", "Reports Dashboard"),
    ("routes.pdf_reports", "router", "/api", "PDF Reports"),
    ("routes.notification_service", "router", "/api", "Notification Service"),
    ("routes.voice_interface", "router", "/api", "Voice Interface"),

    # Enterprise
    ("routes.licensee_dashboard", "router", "/api", "Licensee Dashboard"),
    ("routes.grc_lite", "router", "/api", "GRC Lite"),
    ("routes.file_note_generator", "router", "/api", "File Note Generator"),
    ("routes.audit_service", "router", "/api", "Audit Service"),
    ("routes.security_controls", "router", "/api", "Security Controls"),
    ("routes.object_storage", "router", "/api", "Object Storage"),
    ("routes.incident_management", "router", "/api", "Incident Management"),
    ("routes.event_streaming", "router", "/api", "Event Streaming"),
    ("routes.enterprise_docs", "router", "/api", "Enterprise Docs"),
    ("routes.xplan_mock", "router", "/api", "Xplan Mock"),
    ("routes.replay_advice", "router", "/api", "Replay Advice"),
    ("routes.cost_reduction", "router", "/api", "Cost Reduction"),
    ("routes.risk_control_mapping", "router", "/api", "Risk Control Mapping"),
    ("routes.breach_register", "router", "/api", "Breach Register"),

    # Retirement & Planning
    ("routes.retirement_calculator", "router", "/api", "Retirement Calculator"),
    ("routes.decumulation_calculator", "router", "/api", "Decumulation Calculator"),
    ("routes.platform_integrations", "router", "/api", "Platform Integrations"),
    ("routes.client_profile_retirement", "router", "/api", "Client Profile Retirement"),
    ("routes.websocket_service", "router", "/api", "WebSocket Service"),
    ("routes.retirement_milestones", "router", "/api", "Retirement Milestones"),
    ("routes.soa_roa_compliance", "router", "/api", "SOA/ROA Compliance"),
    ("routes.budget_expenses", "router", "/api", "Budget & Expenses"),
    ("routes.push_notifications", "router", "/api", "Push Notifications"),
    ("routes.stress_testing", "router", "/api", "Stress Testing"),
    ("routes.client_wealth_data", "router", "/api", "Client Wealth Data"),
    ("routes.age_pension", "router", "/api", "Age Pension"),
    ("routes.user_profile", "router", "", "User Profile"),
    ("routes.multi_tenant", "router", "/api", "Multi-Tenant"),

    # Engines
    ("routes.confidence_engine", "router", "/api", "Confidence Engine"),
    ("routes.ai_explanation_engine", "router", "/api", "AI Explanation Engine"),
    ("routes.adviser_intelligence", "router", "/api", "Adviser Intelligence"),
    ("routes.scaling_infrastructure", "router", "/api", "Scaling Infrastructure"),
    ("routes.confidence_history", "router", "/api", "Confidence History"),
    ("routes.services_australia", "router", "/api", "Services Australia"),
    ("routes.cgt_optimizer", "router", "/api", "CGT Optimizer"),
    ("routes.partner_comparison", "router", "/api", "Partner Comparison"),
    ("routes.realtime_collaboration", "router", "/api", "Real-time Collaboration"),
    ("routes.scenario_templates", "router", "/api", "Scenario Templates"),
    ("routes.hybrid_engine_api", "router", "/api", "Hybrid Engine"),
    ("routes.voice_assistant", "router", "/api", "Voice Assistant"),
    ("routes.voice_retirement", "router", "/api", "Voice Retirement Analysis"),
    ("routes.voice_command", "router", "/api", "Voice Command Router"),
    ("routes.pdf_report", "router", "/api", "PDF Report Generator"),
    ("routes.client_pack_scheduler", "router", "", "Client Pack Scheduler"),
    ("routes.buffett_engine", "router", "/api", "Buffett Engine"),
    ("routes.client_personal_info", "router", "/api", "Client Personal Info"),
    ("routes.retirement_projection", "router", "/api", "Retirement Projection"),
    ("routes.email_service", "router", "/api", "Email (Resend)"),
    ("routes.compliance_audit", "router", "/api", "Compliance Audit"),
]


def register_all_routes(app) -> dict:
    """
    Import and register all routes from the registry.
    Returns a summary dict with loaded/failed counts.
    """
    from importlib import import_module

    loaded = 0
    failed = 0
    failed_routes = []

    for module_path, router_var, prefix, description in ROUTE_REGISTRY:
        try:
            mod = import_module(module_path)
            router = getattr(mod, router_var)
            if prefix:
                app.include_router(router, prefix=prefix)
            else:
                app.include_router(router)
            loaded += 1
        except (ImportError, AttributeError) as e:
            failed += 1
            failed_routes.append(description)
            logger.warning(f"Skipped route [{description}]: {e}")

    # Knowledge Graph (special case — different import pattern)
    try:
        from knowledge_graph import graph_router
        app.include_router(graph_router, prefix="/api")
        loaded += 1
    except ImportError as e:
        failed += 1
        failed_routes.append("Knowledge Graph")
        logger.warning(f"Skipped route [Knowledge Graph]: {e}")

    logger.info(f"Route registration complete: {loaded} loaded, {failed} skipped")
    if failed_routes:
        logger.info(f"Skipped routes: {', '.join(failed_routes)}")

    return {"loaded": loaded, "failed": failed, "failed_routes": failed_routes}
