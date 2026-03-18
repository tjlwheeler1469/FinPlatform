"""
Financial Knowledge Graph Module
================================

A graph-based architecture for connecting all financial data through relationships.

Core Principle:
All financial data must be connected through relationships, not isolated tables.

Components:
- entities.py: Core entity definitions (Client, Portfolio, Asset, etc.)
- graph_db.py: Graph database management (Neo4j + embedded fallback)
- query_engine.py: Complex graph queries for financial analysis
- ai_engine.py: AI-powered reasoning and insights
- routes.py: REST API endpoints
"""

from .entities import (
    Client, Household, Advisor, Account, Portfolio, Asset, Sector,
    FinancialPlan, Goal, Transaction, Insight, Action,
    RiskProfile, AccountType, AssetClass, GoalStatus, InsightType, ActionType, ActionStatus,
    RelationshipType
)

from .graph_db import (
    get_embedded_graph, get_neo4j_manager,
    init_knowledge_graph, close_knowledge_graph,
    EmbeddedGraph, Neo4jManager
)

from .query_engine import (
    get_query_engine, GraphQueryEngine
)

from .ai_engine import (
    get_ai_engine, AIReasoningEngine
)

from .routes import router as graph_router

__all__ = [
    # Entities
    "Client", "Household", "Advisor", "Account", "Portfolio", "Asset", "Sector",
    "FinancialPlan", "Goal", "Transaction", "Insight", "Action",
    # Enums
    "RiskProfile", "AccountType", "AssetClass", "GoalStatus", "InsightType", "ActionType", "ActionStatus",
    "RelationshipType",
    # Graph DB
    "get_embedded_graph", "get_neo4j_manager", "init_knowledge_graph", "close_knowledge_graph",
    "EmbeddedGraph", "Neo4jManager",
    # Query Engine
    "get_query_engine", "GraphQueryEngine",
    # AI Engine
    "get_ai_engine", "AIReasoningEngine",
    # Routes
    "graph_router"
]
