"""
Xplan Mock API Service
======================
Simulates Xplan API responses for development and testing.
Can be swapped for real Xplan API integration later.

Endpoints simulate:
- Client data
- Portfolio data
- Transactions
- Risk profiles
- File notes (write)
"""

import os
import uuid
import random
import secrets
_rng = secrets.SystemRandom()
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/xplan-mock", tags=["Xplan Mock API"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
mock_clients_col = db["xplan_mock_clients"]
mock_file_notes_col = db["xplan_mock_file_notes"]

# ==================== MOCK DATA GENERATORS ====================

SAMPLE_CLIENTS = [
    {
        "client_id": "XP-001",
        "first_name": "James",
        "last_name": "Mitchell",
        "date_of_birth": "1965-03-15",
        "email": "james.mitchell@email.com",
        "phone": "+61 412 345 678",
        "address": {
            "street": "42 Collins Street",
            "city": "Melbourne",
            "state": "VIC",
            "postcode": "3000",
            "country": "Australia"
        },
        "marital_status": "Married",
        "dependents": 2
    },
    {
        "client_id": "XP-002",
        "first_name": "Sarah",
        "last_name": "Thompson",
        "date_of_birth": "1978-07-22",
        "email": "sarah.thompson@email.com",
        "phone": "+61 423 456 789",
        "address": {
            "street": "15 George Street",
            "city": "Sydney",
            "state": "NSW",
            "postcode": "2000",
            "country": "Australia"
        },
        "marital_status": "Single",
        "dependents": 0
    },
    {
        "client_id": "XP-003",
        "first_name": "Michael",
        "last_name": "Chen",
        "date_of_birth": "1982-11-08",
        "email": "michael.chen@email.com",
        "phone": "+61 434 567 890",
        "address": {
            "street": "88 Queen Street",
            "city": "Brisbane",
            "state": "QLD",
            "postcode": "4000",
            "country": "Australia"
        },
        "marital_status": "Married",
        "dependents": 3
    },
    {
        "client_id": "XP-004",
        "first_name": "Emma",
        "last_name": "Williams",
        "date_of_birth": "1990-04-30",
        "email": "emma.williams@email.com",
        "phone": "+61 445 678 901",
        "address": {
            "street": "23 King William Street",
            "city": "Adelaide",
            "state": "SA",
            "postcode": "5000",
            "country": "Australia"
        },
        "marital_status": "Married",
        "dependents": 1
    },
    {
        "client_id": "XP-005",
        "first_name": "David",
        "last_name": "Brown",
        "date_of_birth": "1958-09-12",
        "email": "david.brown@email.com",
        "phone": "+61 456 789 012",
        "address": {
            "street": "100 St Georges Terrace",
            "city": "Perth",
            "state": "WA",
            "postcode": "6000",
            "country": "Australia"
        },
        "marital_status": "Widowed",
        "dependents": 0
    }
]

RISK_PROFILES = {
    "XP-001": {"risk_score": 65, "risk_band": "Balanced", "last_review_date": "2025-11-15"},
    "XP-002": {"risk_score": 80, "risk_band": "Growth", "last_review_date": "2025-10-20"},
    "XP-003": {"risk_score": 45, "risk_band": "Conservative", "last_review_date": "2025-12-01"},
    "XP-004": {"risk_score": 90, "risk_band": "High Growth", "last_review_date": "2025-09-10"},
    "XP-005": {"risk_score": 30, "risk_band": "Defensive", "last_review_date": "2025-08-25"}
}

CLIENT_PROFILES = {
    "XP-001": {
        "risk_profile": "Balanced",
        "investment_objective": "Wealth accumulation for retirement",
        "time_horizon": "10-15 years",
        "income_needs": "Low - reinvesting dividends",
        "assets": 1250000,
        "liabilities": 350000
    },
    "XP-002": {
        "risk_profile": "Growth",
        "investment_objective": "Capital growth",
        "time_horizon": "15-20 years",
        "income_needs": "None - full accumulation",
        "assets": 650000,
        "liabilities": 180000
    },
    "XP-003": {
        "risk_profile": "Conservative",
        "investment_objective": "Capital preservation with income",
        "time_horizon": "5-10 years",
        "income_needs": "Moderate - supplement salary",
        "assets": 2100000,
        "liabilities": 450000
    },
    "XP-004": {
        "risk_profile": "High Growth",
        "investment_objective": "Aggressive wealth building",
        "time_horizon": "20+ years",
        "income_needs": "None",
        "assets": 380000,
        "liabilities": 95000
    },
    "XP-005": {
        "risk_profile": "Defensive",
        "investment_objective": "Income generation for retirement",
        "time_horizon": "5 years",
        "income_needs": "High - primary income source",
        "assets": 3500000,
        "liabilities": 0
    }
}

SAMPLE_HOLDINGS = [
    {"security_code": "CBA.AX", "product_name": "Commonwealth Bank of Australia", "asset_class": "Australian Equities"},
    {"security_code": "BHP.AX", "product_name": "BHP Group Limited", "asset_class": "Australian Equities"},
    {"security_code": "CSL.AX", "product_name": "CSL Limited", "asset_class": "Australian Equities"},
    {"security_code": "WBC.AX", "product_name": "Westpac Banking Corporation", "asset_class": "Australian Equities"},
    {"security_code": "NAB.AX", "product_name": "National Australia Bank", "asset_class": "Australian Equities"},
    {"security_code": "VAS.AX", "product_name": "Vanguard Australian Shares ETF", "asset_class": "Australian Equities"},
    {"security_code": "VGS.AX", "product_name": "Vanguard MSCI International ETF", "asset_class": "International Equities"},
    {"security_code": "VAF.AX", "product_name": "Vanguard Australian Fixed Interest ETF", "asset_class": "Fixed Income"},
    {"security_code": "VDHG.AX", "product_name": "Vanguard Diversified High Growth ETF", "asset_class": "Diversified"},
    {"security_code": "A200.AX", "product_name": "BetaShares Australia 200 ETF", "asset_class": "Australian Equities"}
]


def generate_portfolio(client_id: str) -> Dict[str, Any]:
    """Generate mock portfolio for a client."""
    random.seed(hash(client_id))
    
    profile = CLIENT_PROFILES.get(client_id, CLIENT_PROFILES["XP-001"])
    total_value = profile["assets"] * 0.7  # 70% in investments
    
    # Generate holdings
    num_holdings = _rng.randint(4, 8)
    selected_holdings = _rng.sample(SAMPLE_HOLDINGS, num_holdings)
    
    holdings = []
    remaining_value = total_value
    
    for i, holding in enumerate(selected_holdings):
        if i == len(selected_holdings) - 1:
            value = remaining_value
        else:
            value = remaining_value * _rng.uniform(0.1, 0.3)
            remaining_value -= value
        
        price = _rng.uniform(20, 300)
        quantity = int(value / price)
        actual_value = quantity * price
        
        holdings.append({
            "security_code": holding["security_code"],
            "product_name": holding["product_name"],
            "quantity": quantity,
            "price": round(price, 2),
            "value": round(actual_value, 2),
            "asset_class": holding["asset_class"]
        })
    
    # Calculate allocation
    total = sum(h["value"] for h in holdings)
    allocation = {}
    for h in holdings:
        ac = h["asset_class"]
        allocation[ac] = allocation.get(ac, 0) + h["value"]
    
    allocation = {k: round(v / total * 100, 1) for k, v in allocation.items()}
    
    return {
        "portfolio_id": f"PF-{client_id}",
        "total_value": round(total, 2),
        "asset_class_split": allocation,
        "holdings": holdings,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


def generate_transactions(client_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Generate mock transactions for a client."""
    random.seed(hash(client_id) + 42)
    
    transactions = []
    transaction_types = ["BUY", "SELL", "DIVIDEND", "CONTRIBUTION", "WITHDRAWAL", "FEE"]
    
    for i in range(limit):
        days_ago = _rng.randint(1, 365)
        tx_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        tx_type = _rng.choice(transaction_types)
        
        if tx_type in ["BUY", "SELL"]:
            holding = _rng.choice(SAMPLE_HOLDINGS)
            product = holding["security_code"]
            amount = _rng.uniform(1000, 50000)
        elif tx_type == "DIVIDEND":
            holding = _rng.choice(SAMPLE_HOLDINGS)
            product = holding["security_code"]
            amount = _rng.uniform(100, 2000)
        elif tx_type == "CONTRIBUTION":
            product = "CASH"
            amount = _rng.uniform(5000, 25000)
        elif tx_type == "WITHDRAWAL":
            product = "CASH"
            amount = _rng.uniform(2000, 15000)
        else:  # FEE
            product = "ADMIN"
            amount = _rng.uniform(50, 500)
        
        transactions.append({
            "transaction_id": f"TX-{client_id}-{i:04d}",
            "date": tx_date,
            "type": tx_type,
            "amount": round(amount, 2),
            "product": product
        })
    
    transactions.sort(key=lambda x: x["date"], reverse=True)
    return transactions


# ==================== MOCK OAUTH ====================

# Simulated tokens (in production, these would be real OAuth tokens)
MOCK_TOKENS = {}

@router.post("/oauth/token")
async def mock_oauth_token(
    client_id: str = "mock_client",
    client_secret: str = "mock_secret",
    grant_type: str = "client_credentials"
):
    """Mock OAuth token endpoint."""
    if grant_type not in ["client_credentials", "refresh_token"]:
        raise HTTPException(status_code=400, detail="Invalid grant type")
    
    # Generate mock tokens
    access_token = f"xplan_access_{uuid.uuid4().hex}"
    refresh_token = f"xplan_refresh_{uuid.uuid4().hex}"
    
    MOCK_TOKENS[access_token] = {
        "client_id": client_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_in": 3600
    }
    
    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 3600,
        "refresh_token": refresh_token,
        "scope": "read write"
    }


def validate_token(authorization: str) -> bool:
    """Validate mock token."""
    if not authorization or not authorization.startswith("Bearer "):
        return False
    token = authorization.replace("Bearer ", "")
    # For mock, accept any token starting with xplan_access_ or just accept all for testing
    return token.startswith("xplan_access_") or True


# ==================== CLIENT ENDPOINTS ====================

@router.get("/clients")
async def list_mock_clients(
    authorization: Optional[str] = Header(None),
    limit: int = 50
):
    """List all mock clients."""
    return {
        "clients": SAMPLE_CLIENTS[:limit],
        "total": len(SAMPLE_CLIENTS)
    }


@router.get("/clients/{client_id}")
async def get_mock_client(
    client_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get mock client by ID."""
    client = next((c for c in SAMPLE_CLIENTS if c["client_id"] == client_id), None)
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return client


@router.get("/clients/{client_id}/profile")
async def get_mock_client_profile(
    client_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get mock client profile."""
    profile = CLIENT_PROFILES.get(client_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Client profile not found")
    
    return {
        "client_id": client_id,
        **profile
    }


@router.get("/clients/{client_id}/portfolio")
async def get_mock_portfolio(
    client_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get mock portfolio for client."""
    if client_id not in [c["client_id"] for c in SAMPLE_CLIENTS]:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return generate_portfolio(client_id)


@router.get("/clients/{client_id}/transactions")
async def get_mock_transactions(
    client_id: str,
    limit: int = 20,
    authorization: Optional[str] = Header(None)
):
    """Get mock transactions for client."""
    if client_id not in [c["client_id"] for c in SAMPLE_CLIENTS]:
        raise HTTPException(status_code=404, detail="Client not found")
    
    transactions = generate_transactions(client_id, limit)
    
    return {
        "client_id": client_id,
        "transactions": transactions,
        "total": len(transactions)
    }


@router.get("/clients/{client_id}/risk")
async def get_mock_risk_profile(
    client_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get mock risk profile for client."""
    risk = RISK_PROFILES.get(client_id)
    
    if not risk:
        raise HTTPException(status_code=404, detail="Risk profile not found")
    
    return {
        "client_id": client_id,
        **risk
    }


# ==================== FILE NOTES (WRITE) ====================

class FileNoteCreate(BaseModel):
    title: str
    content: str  # Plain text as per user request
    created_by: str
    timestamp: Optional[str] = None


@router.post("/clients/{client_id}/file_notes")
async def create_mock_file_note(
    client_id: str,
    note: FileNoteCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a file note in mock Xplan."""
    if client_id not in [c["client_id"] for c in SAMPLE_CLIENTS]:
        raise HTTPException(status_code=404, detail="Client not found")
    
    note_id = f"FN-{client_id}-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    file_note = {
        "note_id": note_id,
        "client_id": client_id,
        "note_title": note.title,
        "note_body": note.content,
        "created_by": note.created_by,
        "created_date": note.timestamp or now,
        "source": "AdviceOS",
        "synced_at": now
    }
    
    await mock_file_notes_col.insert_one(file_note)
    
    return {
        "success": True,
        "note_id": note_id,
        "client_id": client_id,
        "created_date": file_note["created_date"],
        "message": "File note created successfully in Xplan"
    }


@router.get("/clients/{client_id}/file_notes")
async def list_mock_file_notes(
    client_id: str,
    authorization: Optional[str] = Header(None)
):
    """List file notes for a client."""
    notes = await mock_file_notes_col.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("created_date", -1).to_list(100)
    
    return {
        "client_id": client_id,
        "file_notes": notes,
        "total": len(notes)
    }


# ==================== DOCUMENTS (WRITE) ====================

@router.post("/clients/{client_id}/documents")
async def upload_mock_document(
    client_id: str,
    document_type: str = "scenario_summary",
    content: str = "",
    authorization: Optional[str] = Header(None)
):
    """Upload a document to mock Xplan."""
    if client_id not in [c["client_id"] for c in SAMPLE_CLIENTS]:
        raise HTTPException(status_code=404, detail="Client not found")
    
    doc_id = f"DOC-{client_id}-{uuid.uuid4().hex[:8].upper()}"
    
    return {
        "success": True,
        "document_id": doc_id,
        "client_id": client_id,
        "document_type": document_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "message": "Document uploaded successfully to Xplan"
    }


# ==================== PHASE 2: SCENARIOS & DEEP PORTFOLIO ====================

@router.post("/clients/{client_id}/scenarios")
async def create_mock_scenario(
    client_id: str,
    payload: Dict[str, Any] = None,
    authorization: Optional[str] = Header(None)
):
    """Create a scenario in mock Xplan (Phase 2)."""
    xplan_scenario_id = f"XSCN-{client_id}-{uuid.uuid4().hex[:8].upper()}"
    
    return {
        "success": True,
        "xplan_scenario_id": xplan_scenario_id,
        "client_id": client_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "message": "Scenario created successfully in Xplan"
    }


@router.get("/clients/{client_id}/portfolios/holdings")
async def get_mock_portfolio_holdings(
    client_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get detailed portfolio holdings (Phase 2 deep sync)."""
    portfolio = generate_portfolio(client_id)
    
    return {
        "client_id": client_id,
        "holdings": portfolio.get("holdings", []),
        "total_value": portfolio.get("total_value", 0),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.get("/clients/{client_id}/portfolios/transactions")
async def get_mock_portfolio_transactions(
    client_id: str,
    days: int = 365,
    authorization: Optional[str] = Header(None)
):
    """Get portfolio transactions (Phase 2 deep sync)."""
    transactions = generate_transactions(client_id, min(days // 10, 50))
    
    return {
        "client_id": client_id,
        "transactions": transactions,
        "period_days": days,
        "total": len(transactions)
    }


@router.get("/clients/{client_id}/portfolios/performance")
async def get_mock_portfolio_performance(
    client_id: str,
    days: int = 365,
    authorization: Optional[str] = Header(None)
):
    """Get portfolio performance metrics (Phase 2 deep sync)."""
    random.seed(hash(client_id) + 100)
    
    return {
        "client_id": client_id,
        "metrics": {
            "total_return": round(_rng.uniform(5, 15), 2),
            "annualized_return": round(_rng.uniform(6, 12), 2),
            "volatility": round(_rng.uniform(8, 18), 2),
            "sharpe_ratio": round(_rng.uniform(0.5, 1.5), 2),
            "max_drawdown": round(_rng.uniform(-15, -5), 2),
            "benchmark_return": round(_rng.uniform(7, 10), 2)
        },
        "period_days": days,
        "calculated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/clients/{client_id}/portfolios/tax-lots")
async def get_mock_tax_lots(
    client_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get tax lot information (Phase 2 deep sync)."""
    random.seed(hash(client_id) + 200)
    portfolio = generate_portfolio(client_id)
    
    lots = []
    for holding in portfolio.get("holdings", [])[:5]:
        lots.append({
            "lot_id": f"LOT-{uuid.uuid4().hex[:6].upper()}",
            "security_code": holding["security_code"],
            "quantity": holding["quantity"],
            "cost_basis": round(holding["value"] * _rng.uniform(0.7, 1.1), 2),
            "acquisition_date": (datetime.now(timezone.utc) - timedelta(days=_rng.randint(100, 1000))).strftime("%Y-%m-%d"),
            "unrealized_gain": round(holding["value"] * _rng.uniform(-0.1, 0.3), 2)
        })
    
    return {
        "client_id": client_id,
        "lots": lots,
        "total_lots": len(lots)
    }


# ==================== HEALTH CHECK ====================

@router.get("/health")
async def mock_xplan_health():
    """Mock Xplan API health check."""
    return {
        "status": "healthy",
        "api_version": "2.0",
        "environment": "mock",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
