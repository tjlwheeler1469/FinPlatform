"""
Account Aggregation Routes
Automated data collection from banks, brokerages, and super funds.
Simulates Plaid-like functionality with Australian institutions.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/aggregation", tags=["Account Aggregation"])

# In-memory storage
CONNECTED_ACCOUNTS: Dict[str, Dict] = {}
SYNC_HISTORY: List[Dict] = []
TRANSACTIONS: List[Dict] = []


class ConnectAccountRequest(BaseModel):
    institution_id: str
    account_type: str = "checking"
    client_id: str = "hh_001"


class SyncAccountRequest(BaseModel):
    account_id: str
    force_refresh: bool = False


# Australian institution catalog
INSTITUTIONS = {
    # Banks
    "cba": {
        "id": "cba",
        "name": "Commonwealth Bank",
        "type": "bank",
        "logo": "https://logo.clearbit.com/commbank.com.au",
        "primary_color": "#FFCC00",
        "supported_products": ["checking", "savings", "credit_card", "mortgage"],
        "oauth_url": "https://netbank.commbank.com.au/oauth",
        "status": "active"
    },
    "westpac": {
        "id": "westpac",
        "name": "Westpac",
        "type": "bank",
        "logo": "https://logo.clearbit.com/westpac.com.au",
        "primary_color": "#DA1710",
        "supported_products": ["checking", "savings", "credit_card", "mortgage"],
        "oauth_url": "https://banking.westpac.com.au/oauth",
        "status": "active"
    },
    "nab": {
        "id": "nab",
        "name": "NAB",
        "type": "bank",
        "logo": "https://logo.clearbit.com/nab.com.au",
        "primary_color": "#C51A1B",
        "supported_products": ["checking", "savings", "credit_card", "mortgage"],
        "oauth_url": "https://ib.nab.com.au/oauth",
        "status": "active"
    },
    "anz": {
        "id": "anz",
        "name": "ANZ",
        "type": "bank",
        "logo": "https://logo.clearbit.com/anz.com.au",
        "primary_color": "#007DBA",
        "supported_products": ["checking", "savings", "credit_card", "mortgage"],
        "oauth_url": "https://internet-banking.anz.com.au/oauth",
        "status": "active"
    },
    # Super funds
    "aussuper": {
        "id": "aussuper",
        "name": "Australian Super",
        "type": "super",
        "logo": "https://logo.clearbit.com/australiansuper.com",
        "primary_color": "#E53935",
        "supported_products": ["super"],
        "oauth_url": "https://portal.australiansuper.com/oauth",
        "status": "active"
    },
    "rest": {
        "id": "rest",
        "name": "REST Super",
        "type": "super",
        "logo": "https://logo.clearbit.com/rest.com.au",
        "primary_color": "#00A2D9",
        "supported_products": ["super"],
        "oauth_url": "https://member.rest.com.au/oauth",
        "status": "active"
    },
    "hostplus": {
        "id": "hostplus",
        "name": "Hostplus",
        "type": "super",
        "logo": "https://logo.clearbit.com/hostplus.com.au",
        "primary_color": "#E65100",
        "supported_products": ["super"],
        "oauth_url": "https://member.hostplus.com.au/oauth",
        "status": "active"
    },
    # Brokers
    "commsec": {
        "id": "commsec",
        "name": "CommSec",
        "type": "broker",
        "logo": "https://logo.clearbit.com/commsec.com.au",
        "primary_color": "#FFCC00",
        "supported_products": ["brokerage", "margin"],
        "oauth_url": "https://www.commsec.com.au/oauth",
        "status": "active"
    },
    "selfwealth": {
        "id": "selfwealth",
        "name": "SelfWealth",
        "type": "broker",
        "logo": "https://logo.clearbit.com/selfwealth.com.au",
        "primary_color": "#1A237E",
        "supported_products": ["brokerage"],
        "oauth_url": "https://secure.selfwealth.com.au/oauth",
        "status": "active"
    },
    "nabtrade": {
        "id": "nabtrade",
        "name": "nabtrade",
        "type": "broker",
        "logo": "https://logo.clearbit.com/nabtrade.com.au",
        "primary_color": "#C51A1B",
        "supported_products": ["brokerage", "margin"],
        "oauth_url": "https://www.nabtrade.com.au/oauth",
        "status": "active"
    }
}

# Simulated account data
def generate_mock_account(institution_id: str, account_type: str, client_id: str) -> Dict:
    """Generate realistic mock account data."""
    account_id = f"acc_{uuid.uuid4().hex[:8]}"
    institution = INSTITUTIONS.get(institution_id, {})
    
    # Generate mock balances based on account type
    if account_type == "checking":
        balance = 12500 + (hash(account_id) % 50000)
        available = balance - 500
    elif account_type == "savings":
        balance = 45000 + (hash(account_id) % 100000)
        available = balance
    elif account_type == "credit_card":
        balance = -(3500 + (hash(account_id) % 5000))
        available = 15000 + balance
    elif account_type == "super":
        balance = 350000 + (hash(account_id) % 300000)
        available = 0  # Can't access super until preservation age
    elif account_type == "brokerage":
        balance = 125000 + (hash(account_id) % 200000)
        available = balance * 0.1  # 10% cash
    else:
        balance = 10000
        available = balance
    
    return {
        "id": account_id,
        "institution_id": institution_id,
        "institution_name": institution.get("name", "Unknown"),
        "client_id": client_id,
        "type": account_type,
        "name": f"{institution.get('name', 'Account')} {account_type.replace('_', ' ').title()}",
        "mask": f"****{hash(account_id) % 10000:04d}",
        "balance": {
            "current": balance,
            "available": available,
            "currency": "AUD"
        },
        "status": "active",
        "last_synced": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }


def generate_mock_transactions(account_id: str, num_transactions: int = 30) -> List[Dict]:
    """Generate realistic mock transactions."""
    transactions = []
    base_date = datetime.now(timezone.utc)
    
    # Transaction categories and examples
    categories = [
        ("groceries", ["Woolworths", "Coles", "ALDI", "IGA"], -50, -250),
        ("dining", ["McDonald's", "KFC", "Uber Eats", "Menulog", "Local Cafe"], -15, -80),
        ("transport", ["Uber", "Shell Petrol", "BP", "Opal Top Up", "Linkt"], -20, -150),
        ("utilities", ["AGL Energy", "Origin Energy", "Sydney Water", "Telstra"], -100, -350),
        ("entertainment", ["Netflix", "Spotify", "Stan", "Cinema", "Event Tickets"], -15, -100),
        ("shopping", ["Amazon", "eBay", "Kmart", "Target", "Big W"], -30, -500),
        ("income", ["Employer Pty Ltd", "Direct Deposit"], 3000, 15000),
        ("transfer", ["Transfer In", "Transfer Out"], -500, 2000)
    ]
    
    for i in range(num_transactions):
        category, merchants, min_amt, max_amt = categories[i % len(categories)]
        merchant = merchants[i % len(merchants)]
        
        amount = min_amt + (hash(f"{account_id}_{i}") % (max_amt - min_amt))
        if category == "income" or (category == "transfer" and i % 2 == 0):
            amount = abs(amount)
        
        transactions.append({
            "id": f"txn_{uuid.uuid4().hex[:8]}",
            "account_id": account_id,
            "amount": amount,
            "currency": "AUD",
            "date": (base_date - timedelta(days=i)).strftime("%Y-%m-%d"),
            "merchant_name": merchant,
            "category": category,
            "pending": i < 2,
            "description": f"{merchant} - {'Credit' if amount > 0 else 'Purchase'}"
        })
    
    return transactions


@router.get("/institutions")
async def get_institutions(type: Optional[str] = None):
    """Get list of supported institutions for account linking."""
    institutions = list(INSTITUTIONS.values())
    
    if type:
        institutions = [i for i in institutions if i.get("type") == type]
    
    return {
        "institutions": institutions,
        "total": len(institutions),
        "types": ["bank", "super", "broker"]
    }


@router.post("/connect")
async def connect_account(request: ConnectAccountRequest):
    """Initiate account connection (OAuth flow simulation)."""
    institution = INSTITUTIONS.get(request.institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not supported")
    
    # Generate mock account
    account = generate_mock_account(
        request.institution_id,
        request.account_type,
        request.client_id
    )
    
    CONNECTED_ACCOUNTS[account["id"]] = account
    
    # Generate initial transactions
    transactions = generate_mock_transactions(account["id"])
    TRANSACTIONS.extend(transactions)
    
    # Log sync
    SYNC_HISTORY.append({
        "account_id": account["id"],
        "status": "success",
        "transactions_added": len(transactions),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "account": account,
        "message": f"Successfully connected to {institution['name']}",
        "transactions_imported": len(transactions)
    }


@router.get("/accounts")
async def get_connected_accounts(client_id: Optional[str] = None):
    """Get all connected accounts."""
    accounts = list(CONNECTED_ACCOUNTS.values())
    
    if client_id:
        accounts = [a for a in accounts if a.get("client_id") == client_id]
    
    # Calculate totals
    total_balance = sum(a["balance"]["current"] for a in accounts)
    total_assets = sum(a["balance"]["current"] for a in accounts if a["balance"]["current"] > 0)
    total_liabilities = abs(sum(a["balance"]["current"] for a in accounts if a["balance"]["current"] < 0))
    
    return {
        "accounts": accounts,
        "total": len(accounts),
        "summary": {
            "total_balance": total_balance,
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_worth": total_assets - total_liabilities
        }
    }


@router.get("/accounts/{account_id}")
async def get_account(account_id: str):
    """Get a specific connected account."""
    account = CONNECTED_ACCOUNTS.get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return account


@router.post("/accounts/{account_id}/sync")
async def sync_account(account_id: str, request: SyncAccountRequest = None):
    """Sync account data (refresh balances and transactions)."""
    account = CONNECTED_ACCOUNTS.get(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Simulate balance change
    change = (hash(datetime.now().isoformat()) % 2000) - 1000
    account["balance"]["current"] += change
    account["balance"]["available"] += change
    account["last_synced"] = datetime.now(timezone.utc).isoformat()
    
    # Add new transactions
    new_transactions = generate_mock_transactions(account_id, 5)
    TRANSACTIONS.extend(new_transactions)
    
    SYNC_HISTORY.append({
        "account_id": account_id,
        "status": "success",
        "balance_change": change,
        "transactions_added": len(new_transactions),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "account": account,
        "new_transactions": len(new_transactions),
        "balance_change": change
    }


@router.delete("/accounts/{account_id}")
async def disconnect_account(account_id: str):
    """Disconnect an account."""
    if account_id not in CONNECTED_ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")
    
    del CONNECTED_ACCOUNTS[account_id]
    
    return {"success": True, "message": "Account disconnected"}


@router.get("/transactions")
async def get_transactions(
    account_id: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50
):
    """Get transactions with filtering."""
    transactions = TRANSACTIONS.copy()
    
    if account_id:
        transactions = [t for t in transactions if t.get("account_id") == account_id]
    if category:
        transactions = [t for t in transactions if t.get("category") == category]
    if start_date:
        transactions = [t for t in transactions if t.get("date", "") >= start_date]
    if end_date:
        transactions = [t for t in transactions if t.get("date", "") <= end_date]
    
    # Sort by date descending
    transactions.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return {
        "transactions": transactions[:limit],
        "total": len(transactions)
    }


@router.get("/spending-analysis")
async def get_spending_analysis(client_id: Optional[str] = None):
    """Get AI-powered spending analysis."""
    # Categorize transactions
    categories = {}
    for txn in TRANSACTIONS:
        cat = txn.get("category", "other")
        if cat not in categories:
            categories[cat] = {"total": 0, "count": 0, "transactions": []}
        categories[cat]["total"] += txn.get("amount", 0)
        categories[cat]["count"] += 1
    
    # Calculate insights
    total_spending = sum(abs(c["total"]) for c in categories.values() if c["total"] < 0)
    total_income = sum(c["total"] for c in categories.values() if c["total"] > 0)
    
    return {
        "by_category": categories,
        "summary": {
            "total_income": total_income,
            "total_spending": total_spending,
            "net_flow": total_income - total_spending,
            "savings_rate": ((total_income - total_spending) / total_income * 100) if total_income > 0 else 0
        },
        "insights": [
            {
                "type": "spending_spike",
                "message": "Dining expenses 25% higher than last month",
                "recommendation": "Consider meal prepping to reduce dining costs"
            },
            {
                "type": "savings_opportunity",
                "message": "Subscription services total $85/month",
                "recommendation": "Review and cancel unused subscriptions"
            }
        ],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/sync-status")
async def get_sync_status():
    """Get overall sync status for all accounts."""
    accounts = list(CONNECTED_ACCOUNTS.values())
    
    return {
        "total_accounts": len(accounts),
        "last_sync": SYNC_HISTORY[-1]["timestamp"] if SYNC_HISTORY else None,
        "sync_history": SYNC_HISTORY[-10:],
        "accounts_status": [
            {
                "id": a["id"],
                "name": a["name"],
                "last_synced": a.get("last_synced"),
                "status": "healthy"
            }
            for a in accounts
        ]
    }
