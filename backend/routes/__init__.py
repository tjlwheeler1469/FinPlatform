"""
Routes Module
Exports all API routers for the application.
"""
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .tax import router as tax_router
from .analysis import router as analysis_router
from .crm import router as crm_router
from .practice import router as practice_router
from .documents import router as documents_router
from .portfolio import router as portfolio_router
from .market import router as market_router
from .scenarios import router as scenarios_router
from .security import router as security_router
from .goals import router as goals_router
from .ai import router as ai_router
from .timeline import router as timeline_router

__all__ = [
    "auth_router",
    "dashboard_router",
    "tax_router",
    "analysis_router",
    "crm_router",
    "practice_router",
    "documents_router",
    "portfolio_router",
    "market_router",
    "scenarios_router",
    "security_router",
    "goals_router",
    "ai_router",
    "timeline_router"
]
