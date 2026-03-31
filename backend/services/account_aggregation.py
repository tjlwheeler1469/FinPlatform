"""
Account Aggregation Service
Simulates Plaid-like bank and brokerage account aggregation.
In production, this would integrate with Plaid, Yodlee, or Basiq (Australian).
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import uuid
import secrets
_rng = secrets.SystemRandom()


# Simulated connected accounts
CONNECTED_ACCOUNTS = {
    "wheeler-family": [
        {
            "account_id": "acc_cba_001",
            "institution": "Commonwealth Bank",
            "institution_logo": "cba",
            "account_type": "checking",
            "account_name": "Everyday Account",
            "account_number": "****4523",
            "current_balance": 15420.50,
            "available_balance": 15420.50,
            "currency": "AUD",
            "last_synced": datetime.now().isoformat(),
            "connection_status": "active"
        },
        {
            "account_id": "acc_cba_002",
            "institution": "Commonwealth Bank",
            "institution_logo": "cba",
            "account_type": "savings",
            "account_name": "GoalSaver",
            "account_number": "****7891",
            "current_balance": 58750.00,
            "available_balance": 58750.00,
            "currency": "AUD",
            "interest_rate": 4.75,
            "last_synced": datetime.now().isoformat(),
            "connection_status": "active"
        },
        {
            "account_id": "acc_cba_003",
            "institution": "Commonwealth Bank",
            "institution_logo": "cba",
            "account_type": "mortgage",
            "account_name": "Home Loan",
            "account_number": "****1234",
            "current_balance": -512000.00,
            "loan_limit": 650000.00,
            "interest_rate": 6.19,
            "minimum_payment": 3850.00,
            "next_payment_date": (datetime.now() + timedelta(days=12)).isoformat(),
            "currency": "AUD",
            "last_synced": datetime.now().isoformat(),
            "connection_status": "active"
        },
        {
            "account_id": "acc_vanguard_001",
            "institution": "Vanguard",
            "institution_logo": "vanguard",
            "account_type": "brokerage",
            "account_name": "Investment Account",
            "account_number": "****8521",
            "current_balance": 485200.00,
            "currency": "AUD",
            "holdings": [
                {"symbol": "VAS", "name": "Vanguard Australian Shares ETF", "units": 2500, "price": 98.50, "value": 246250, "change_pct": 1.2},
                {"symbol": "VGS", "name": "Vanguard MSCI Index International", "units": 1800, "price": 100.25, "value": 180450, "change_pct": 0.8},
                {"symbol": "VAF", "name": "Vanguard Australian Fixed Interest", "units": 800, "price": 72.80, "value": 58240, "change_pct": -0.1}
            ],
            "last_synced": datetime.now().isoformat(),
            "connection_status": "active"
        },
        {
            "account_id": "acc_aussuper_001",
            "institution": "Australian Super",
            "institution_logo": "aussuper",
            "account_type": "superannuation",
            "account_name": "Superannuation",
            "member_number": "****5678",
            "current_balance": 582400.00,
            "investment_option": "High Growth",
            "ytd_return": 8.5,
            "insurance_cover": {
                "life": 1500000,
                "tpd": 1000000,
                "income_protection": True
            },
            "currency": "AUD",
            "last_synced": datetime.now().isoformat(),
            "connection_status": "active"
        },
        {
            "account_id": "acc_macq_001",
            "institution": "Macquarie Bank",
            "institution_logo": "macquarie",
            "account_type": "investment_loan",
            "account_name": "Investment Loan",
            "account_number": "****9632",
            "current_balance": -432000.00,
            "loan_limit": 500000.00,
            "interest_rate": 6.49,
            "minimum_payment": 2890.00,
            "interest_only": True,
            "currency": "AUD",
            "last_synced": datetime.now().isoformat(),
            "connection_status": "active"
        }
    ]
}

# Simulated transactions
def generate_mock_transactions(account_id: str, days: int = 30) -> List[Dict]:
    """Generate mock transactions for an account"""
    
    transaction_templates = {
        "checking": [
            ("Salary Deposit", "credit", 8500, "income"),
            ("Rental Income", "credit", 2800, "income"),
            ("Mortgage Payment", "debit", 3850, "housing"),
            ("Utilities", "debit", 450, "utilities"),
            ("Groceries", "debit", 320, "groceries"),
            ("Fuel", "debit", 120, "transport"),
            ("Restaurant", "debit", 85, "dining"),
            ("Shopping", "debit", 150, "shopping"),
            ("Insurance", "debit", 280, "insurance"),
        ],
        "brokerage": [
            ("Dividend Payment - VAS", "credit", 1250, "dividends"),
            ("Dividend Payment - VGS", "credit", 450, "dividends"),
            ("ETF Purchase - VAS", "debit", 5000, "investment"),
        ],
        "superannuation": [
            ("Employer Contribution", "credit", 1850, "super_contribution"),
            ("Salary Sacrifice", "credit", 800, "super_contribution"),
            ("Insurance Premium", "debit", 95, "insurance"),
            ("Admin Fee", "debit", 12, "fees"),
        ]
    }
    
    account_type = "checking"
    for client_accounts in CONNECTED_ACCOUNTS.values():
        for acc in client_accounts:
            if acc["account_id"] == account_id:
                account_type = acc.get("account_type", "checking")
                break
    
    templates = transaction_templates.get(account_type, transaction_templates["checking"])
    transactions = []
    
    for i in range(days):
        date = datetime.now() - timedelta(days=i)
        # Add 2-4 random transactions per day
        num_txns = _rng.randint(1, 3) if account_type == "checking" else _rng.randint(0, 1)
        
        for _ in range(num_txns):
            template = _rng.choice(templates)
            amount = template[2] * (0.8 + _rng.random() * 0.4)  # Vary amount ±20%
            
            transactions.append({
                "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
                "date": date.isoformat(),
                "description": template[0],
                "type": template[1],
                "amount": round(amount, 2),
                "category": template[3],
                "pending": i == 0 and _rng.random() < 0.2
            })
    
    return sorted(transactions, key=lambda x: x["date"], reverse=True)


def get_aggregated_accounts(client_id: str = "wheeler-family") -> Dict[str, Any]:
    """Get all connected accounts for a client with aggregated totals"""
    
    accounts = CONNECTED_ACCOUNTS.get(client_id, [])
    
    # Calculate totals
    total_assets = 0
    total_liabilities = 0
    accounts_by_type = {}
    
    for account in accounts:
        balance = account.get("current_balance", 0)
        account_type = account.get("account_type", "other")
        
        if balance > 0:
            total_assets += balance
        else:
            total_liabilities += abs(balance)
        
        if account_type not in accounts_by_type:
            accounts_by_type[account_type] = {
                "count": 0,
                "total_balance": 0,
                "accounts": []
            }
        
        accounts_by_type[account_type]["count"] += 1
        accounts_by_type[account_type]["total_balance"] += balance
        accounts_by_type[account_type]["accounts"].append(account)
    
    net_worth = total_assets + total_liabilities  # liabilities are negative
    
    return {
        "client_id": client_id,
        "last_synced": datetime.now().isoformat(),
        "summary": {
            "total_accounts": len(accounts),
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_worth": total_assets - abs(total_liabilities),
            "accounts_by_type": {
                k: {"count": v["count"], "total": v["total_balance"]}
                for k, v in accounts_by_type.items()
            }
        },
        "accounts": accounts,
        "institutions": list(set(a["institution"] for a in accounts)),
        "sync_status": "healthy"
    }


def get_account_transactions(
    account_id: str,
    days: int = 30,
    category: str = None
) -> Dict[str, Any]:
    """Get transactions for a specific account"""
    
    transactions = generate_mock_transactions(account_id, days)
    
    if category:
        transactions = [t for t in transactions if t.get("category") == category]
    
    # Calculate summary
    total_credits = sum(t["amount"] for t in transactions if t["type"] == "credit")
    total_debits = sum(t["amount"] for t in transactions if t["type"] == "debit")
    
    # Group by category
    by_category = {}
    for txn in transactions:
        cat = txn.get("category", "other")
        if cat not in by_category:
            by_category[cat] = {"count": 0, "total": 0}
        by_category[cat]["count"] += 1
        by_category[cat]["total"] += txn["amount"] if txn["type"] == "debit" else 0
    
    return {
        "account_id": account_id,
        "period_days": days,
        "summary": {
            "total_transactions": len(transactions),
            "total_credits": total_credits,
            "total_debits": total_debits,
            "net_flow": total_credits - total_debits
        },
        "by_category": by_category,
        "transactions": transactions[:50]  # Limit to 50 most recent
    }


def connect_account(
    client_id: str,
    institution: str,
    credentials: Dict = None
) -> Dict[str, Any]:
    """
    Simulate connecting a new account.
    In production, this would initiate OAuth flow with Plaid/Basiq.
    """
    
    # Simulate account connection
    new_account = {
        "account_id": f"acc_{institution.lower()[:3]}_{uuid.uuid4().hex[:3]}",
        "institution": institution,
        "institution_logo": institution.lower().replace(" ", ""),
        "account_type": "checking",
        "account_name": "New Account",
        "account_number": f"****{_rng.randint(1000, 9999)}",
        "current_balance": _rng.uniform(1000, 50000),
        "available_balance": _rng.uniform(1000, 50000),
        "currency": "AUD",
        "last_synced": datetime.now().isoformat(),
        "connection_status": "active"
    }
    
    # Add to client's accounts
    if client_id not in CONNECTED_ACCOUNTS:
        CONNECTED_ACCOUNTS[client_id] = []
    
    CONNECTED_ACCOUNTS[client_id].append(new_account)
    
    return {
        "success": True,
        "account": new_account,
        "message": f"Successfully connected {institution} account"
    }


def disconnect_account(client_id: str, account_id: str) -> Dict[str, Any]:
    """Disconnect an account"""
    
    if client_id in CONNECTED_ACCOUNTS:
        CONNECTED_ACCOUNTS[client_id] = [
            a for a in CONNECTED_ACCOUNTS[client_id] 
            if a["account_id"] != account_id
        ]
    
    return {
        "success": True,
        "message": f"Account {account_id} disconnected"
    }


def sync_accounts(client_id: str) -> Dict[str, Any]:
    """Refresh account data from institutions"""
    
    accounts = CONNECTED_ACCOUNTS.get(client_id, [])
    
    # Simulate balance changes
    for account in accounts:
        if account.get("account_type") in ["checking", "savings"]:
            change = _rng.uniform(-500, 500)
            account["current_balance"] += change
            account["available_balance"] = account["current_balance"]
        
        account["last_synced"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "accounts_synced": len(accounts),
        "last_sync": datetime.now().isoformat(),
        "message": f"Synced {len(accounts)} accounts"
    }


def get_cashflow_analysis(client_id: str, months: int = 3) -> Dict[str, Any]:
    """Analyze cashflow across all accounts"""
    
    accounts = CONNECTED_ACCOUNTS.get(client_id, [])
    
    # Simulate monthly cashflow data
    monthly_data = []
    for i in range(months):
        month_date = datetime.now() - timedelta(days=30 * i)
        monthly_data.append({
            "month": month_date.strftime("%Y-%m"),
            "income": _rng.uniform(12000, 15000),
            "expenses": _rng.uniform(8000, 11000),
            "savings": 0  # Will calculate
        })
        monthly_data[-1]["savings"] = monthly_data[-1]["income"] - monthly_data[-1]["expenses"]
    
    # Category breakdown
    categories = {
        "Housing": _rng.uniform(3000, 4500),
        "Groceries": _rng.uniform(800, 1200),
        "Transport": _rng.uniform(400, 700),
        "Utilities": _rng.uniform(300, 500),
        "Entertainment": _rng.uniform(200, 500),
        "Insurance": _rng.uniform(400, 800),
        "Other": _rng.uniform(500, 1000)
    }
    
    total_expenses = sum(categories.values())
    avg_income = sum(m["income"] for m in monthly_data) / len(monthly_data)
    savings_rate = ((avg_income - total_expenses) / avg_income) * 100
    
    return {
        "client_id": client_id,
        "analysis_period_months": months,
        "summary": {
            "average_monthly_income": round(avg_income, 2),
            "average_monthly_expenses": round(total_expenses, 2),
            "average_monthly_savings": round(avg_income - total_expenses, 2),
            "savings_rate": round(savings_rate, 1)
        },
        "expense_breakdown": categories,
        "monthly_trend": monthly_data,
        "insights": [
            {
                "type": "positive" if savings_rate > 20 else "warning",
                "message": f"Savings rate of {savings_rate:.1f}% is {'healthy' if savings_rate > 20 else 'below target of 20%'}"
            },
            {
                "type": "info",
                "message": f"Housing costs represent {(categories['Housing']/total_expenses*100):.0f}% of expenses"
            }
        ]
    }


# Available Australian institutions for connection
AVAILABLE_INSTITUTIONS = [
    {"id": "cba", "name": "Commonwealth Bank", "type": "bank", "popular": True},
    {"id": "nab", "name": "National Australia Bank", "type": "bank", "popular": True},
    {"id": "anz", "name": "ANZ Bank", "type": "bank", "popular": True},
    {"id": "westpac", "name": "Westpac", "type": "bank", "popular": True},
    {"id": "macquarie", "name": "Macquarie Bank", "type": "bank", "popular": True},
    {"id": "ing", "name": "ING Australia", "type": "bank", "popular": False},
    {"id": "aussuper", "name": "Australian Super", "type": "super", "popular": True},
    {"id": "hostplus", "name": "Hostplus", "type": "super", "popular": True},
    {"id": "vanguard", "name": "Vanguard", "type": "brokerage", "popular": True},
    {"id": "selfwealth", "name": "SelfWealth", "type": "brokerage", "popular": False},
    {"id": "commsec", "name": "CommSec", "type": "brokerage", "popular": True},
]


def get_available_institutions() -> Dict[str, Any]:
    """Get list of institutions available for connection"""
    
    return {
        "institutions": AVAILABLE_INSTITUTIONS,
        "categories": ["bank", "super", "brokerage"],
        "popular": [i for i in AVAILABLE_INSTITUTIONS if i.get("popular")]
    }
