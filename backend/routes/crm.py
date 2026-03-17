"""
CRM Routes
Client Relationship Management for advisers.
Comprehensive client data with accounts, transactions, modelling capabilities.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid
import logging
import random

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crm", tags=["Client CRM"])

# In-memory data stores (replace with MongoDB in production)
HOUSEHOLDS: Dict[str, Dict] = {}
CLIENTS: Dict[str, Dict] = {}
NOTES: Dict[str, Dict] = {}
TASKS: Dict[str, Dict] = {}
MEETINGS: Dict[str, Dict] = {}
ACCOUNTS: Dict[str, Dict] = {}
TRANSACTIONS: Dict[str, List] = {}


class HouseholdCreate(BaseModel):
    name: str
    members: List[Dict[str, Any]] = []
    primary_email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    risk_profile: str = "balanced"
    adviser_id: Optional[str] = None


class NoteCreate(BaseModel):
    household_id: str
    title: str
    content: str
    category: str = "general"


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    household_id: Optional[str] = None
    client_id: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None


class MeetingCreate(BaseModel):
    title: str
    household_id: str
    date: str
    time: str
    duration_minutes: int = 60
    meeting_type: str = "review"
    location: Optional[str] = None
    notes: Optional[str] = None


# Comprehensive sample data initialization
def init_comprehensive_data():
    """Initialize comprehensive CRM data with clients, accounts, transactions."""
    global CLIENTS, TASKS, HOUSEHOLDS
    
    if CLIENTS:
        return  # Already initialized
    
    # Comprehensive client data matching CRM Command Center
    sample_clients = [
        {
            "client_id": "client_1",
            "name": "James & Sarah Wheeler",
            "email": "james.wheeler@email.com",
            "phone": "0412 345 678",
            "mobile": "0412 345 678",
            "address": "42 Harbour View Drive, Mosman NSW 2088",
            "status": "active",
            "type": "household",
            "client_since": "2019-03-15",
            "date_of_birth": "1968-07-22",
            "age": 56,
            "occupation": "Business Owner - Wheeler Consulting",
            "employer": "Self-employed",
            "risk_profile": "Growth",
            "investment_experience": "Experienced",
            "adviser": "Mark Thompson",
            "review_frequency": "Annual",
            "last_review": "2025-06-15",
            "next_review": "2026-01-15",
            "last_contact": "2025-12-15",
            "satisfaction": 95,
            "nps": 9,
            "total_wealth": 2850000,
            "wealth_change": 125000,
            "wealth_change_percent": 4.6,
            "annual_income": 320000,
            "stage": "review",
            "accounts_count": 8,
            "pending_tasks": 2,
            "pending_docs": 1,
            "recent_activity": "Portfolio rebalance completed",
            "family_members": [
                {"name": "James Wheeler", "relationship": "Primary", "dob": "1968-07-22", "age": 56},
                {"name": "Sarah Wheeler", "relationship": "Spouse", "dob": "1970-03-15", "age": 54},
                {"name": "Emily Wheeler", "relationship": "Daughter", "dob": "2000-05-10", "age": 24},
                {"name": "Tom Wheeler", "relationship": "Son", "dob": "2003-11-22", "age": 21},
            ],
            "accounts": [
                {"id": 1, "name": "James Wheeler Super", "type": "Superannuation", "institution": "AustralianSuper", "balance": 520000, "change": 28000, "change_percent": 5.7},
                {"id": 2, "name": "Sarah Wheeler Super", "type": "Superannuation", "institution": "REST Super", "balance": 370000, "change": 18500, "change_percent": 5.3},
                {"id": 3, "name": "Joint Investment Portfolio", "type": "Investment", "institution": "Macquarie", "balance": 650000, "change": 42000, "change_percent": 6.9},
                {"id": 4, "name": "Investment Property - Parramatta", "type": "Property", "institution": "Direct", "balance": 850000, "change": 25000, "change_percent": 3.0},
                {"id": 5, "name": "Family Home - Mosman", "type": "Property", "institution": "Direct", "balance": 2200000, "change": 110000, "change_percent": 5.3},
                {"id": 6, "name": "Mortgage - Family Home", "type": "Liability", "institution": "CBA", "balance": -850000, "change": 12000, "change_percent": 1.4},
                {"id": 7, "name": "Emergency Fund", "type": "Cash", "institution": "ING", "balance": 85000, "change": 2500, "change_percent": 3.0},
                {"id": 8, "name": "Offset Account", "type": "Cash", "institution": "CBA", "balance": 25000, "change": 5000, "change_percent": 25.0},
            ],
            "goals": [
                {"id": 1, "name": "Retirement at 62", "target": 3500000, "current": 2850000, "progress": 81, "target_date": "2030-07-22"},
                {"id": 2, "name": "Pay off mortgage", "target": 850000, "current": 110000, "progress": 13, "target_date": "2035-01-01"},
                {"id": 3, "name": "Kids' education fund", "target": 200000, "current": 85000, "progress": 43, "target_date": "2028-01-01"},
                {"id": 4, "name": "European holiday", "target": 25000, "current": 15000, "progress": 60, "target_date": "2026-06-01"},
            ],
            "insurance": [
                {"type": "Life", "provider": "TAL", "sum_insured": 1500000, "premium": 1800, "status": "active"},
                {"type": "TPD", "provider": "TAL", "sum_insured": 1000000, "premium": 1200, "status": "active"},
                {"type": "Income Protection", "provider": "OnePath", "sum_insured": 15000, "premium": 2400, "status": "active"},
                {"type": "Trauma", "provider": "TAL", "sum_insured": 500000, "premium": 950, "status": "review needed"},
            ]
        },
        {
            "client_id": "client_2",
            "name": "Chen Family Trust",
            "email": "michael.chen@email.com",
            "phone": "0423 456 789",
            "mobile": "0423 456 789",
            "address": "88 Pacific Highway, North Sydney NSW 2060",
            "status": "active",
            "type": "trust",
            "client_since": "2020-08-10",
            "date_of_birth": "1975-03-22",
            "age": 49,
            "occupation": "IT Director",
            "employer": "Tech Corp Australia",
            "risk_profile": "Balanced",
            "investment_experience": "Experienced",
            "adviser": "Mark Thompson",
            "review_frequency": "Semi-Annual",
            "last_review": "2025-09-20",
            "next_review": "2026-02-20",
            "last_contact": "2025-12-10",
            "satisfaction": 88,
            "nps": 8,
            "total_wealth": 5200000,
            "wealth_change": -85000,
            "wealth_change_percent": -1.6,
            "annual_income": 450000,
            "stage": "implementation",
            "accounts_count": 6,
            "pending_tasks": 4,
            "pending_docs": 2,
            "recent_activity": "Tax planning meeting scheduled",
            "family_members": [
                {"name": "Michael Chen", "relationship": "Primary", "dob": "1975-03-22", "age": 49},
                {"name": "Lisa Chen", "relationship": "Spouse", "dob": "1978-09-15", "age": 46},
                {"name": "Sophie Chen", "relationship": "Daughter", "dob": "2008-04-12", "age": 16},
            ],
            "accounts": [
                {"id": 1, "name": "Chen Family Trust", "type": "Trust", "institution": "Macquarie", "balance": 2800000, "change": -120000, "change_percent": -4.1},
                {"id": 2, "name": "Michael Chen Super", "type": "Superannuation", "institution": "Sunsuper", "balance": 780000, "change": 35000, "change_percent": 4.7},
                {"id": 3, "name": "Lisa Chen Super", "type": "Superannuation", "institution": "AustralianSuper", "balance": 420000, "change": 22000, "change_percent": 5.5},
                {"id": 4, "name": "Investment Property - Chatswood", "type": "Property", "institution": "Direct", "balance": 1100000, "change": -22000, "change_percent": -2.0},
                {"id": 5, "name": "Cash Management", "type": "Cash", "institution": "Macquarie", "balance": 100000, "change": 0, "change_percent": 0},
            ],
            "goals": [
                {"id": 1, "name": "Retirement at 60", "target": 6000000, "current": 5200000, "progress": 87, "target_date": "2035-03-22"},
                {"id": 2, "name": "Sophie's university", "target": 150000, "current": 85000, "progress": 57, "target_date": "2026-02-01"},
            ],
            "insurance": [
                {"type": "Life", "provider": "MLC", "sum_insured": 2000000, "premium": 2400, "status": "active"},
                {"type": "TPD", "provider": "MLC", "sum_insured": 1500000, "premium": 1800, "status": "active"},
            ]
        },
        {
            "client_id": "client_3",
            "name": "Robert Mitchell",
            "email": "r.mitchell@company.com",
            "phone": "0434 567 890",
            "mobile": "0434 567 890",
            "address": "15 Elizabeth Street, Sydney NSW 2000",
            "status": "review",
            "type": "individual",
            "client_since": "2018-11-05",
            "date_of_birth": "1962-08-14",
            "age": 62,
            "occupation": "CFO",
            "employer": "Mitchell & Associates",
            "risk_profile": "Conservative",
            "investment_experience": "Very Experienced",
            "adviser": "Mark Thompson",
            "review_frequency": "Annual",
            "last_review": "2024-11-28",
            "next_review": "2025-12-20",
            "last_contact": "2025-11-28",
            "satisfaction": 72,
            "nps": 6,
            "total_wealth": 1450000,
            "wealth_change": 32000,
            "wealth_change_percent": 2.3,
            "annual_income": 280000,
            "stage": "review",
            "accounts_count": 4,
            "pending_tasks": 5,
            "pending_docs": 3,
            "recent_activity": "Annual review overdue",
            "family_members": [
                {"name": "Robert Mitchell", "relationship": "Primary", "dob": "1962-08-14", "age": 62},
            ],
            "accounts": [
                {"id": 1, "name": "Robert Mitchell Super", "type": "Superannuation", "institution": "Colonial First State", "balance": 680000, "change": 15000, "change_percent": 2.3},
                {"id": 2, "name": "Investment Portfolio", "type": "Investment", "institution": "Netwealth", "balance": 420000, "change": 12000, "change_percent": 2.9},
                {"id": 3, "name": "Investment Unit", "type": "Property", "institution": "Direct", "balance": 280000, "change": 5000, "change_percent": 1.8},
                {"id": 4, "name": "Term Deposit", "type": "Cash", "institution": "Westpac", "balance": 70000, "change": 0, "change_percent": 0},
            ],
            "goals": [
                {"id": 1, "name": "Retire at 65", "target": 1800000, "current": 1450000, "progress": 81, "target_date": "2027-08-14"},
            ],
            "insurance": [
                {"type": "Life", "provider": "AIA", "sum_insured": 500000, "premium": 1200, "status": "review needed"},
            ]
        },
        {
            "client_id": "client_4",
            "name": "Emma & David Williams",
            "email": "emma.williams@gmail.com",
            "phone": "0445 678 901",
            "mobile": "0445 678 901",
            "address": "22 Beach Road, Bondi NSW 2026",
            "status": "prospect",
            "type": "household",
            "client_since": "2025-12-01",
            "date_of_birth": "1985-06-18",
            "age": 39,
            "occupation": "Marketing Director",
            "employer": "Global Media Co",
            "risk_profile": "TBD",
            "investment_experience": "Moderate",
            "adviser": "Mark Thompson",
            "review_frequency": "TBD",
            "last_review": None,
            "next_review": None,
            "last_contact": "2025-12-12",
            "satisfaction": None,
            "nps": None,
            "total_wealth": 980000,
            "wealth_change": 0,
            "wealth_change_percent": 0,
            "annual_income": 220000,
            "stage": "discovery",
            "accounts_count": 2,
            "pending_tasks": 3,
            "pending_docs": 5,
            "recent_activity": "Discovery meeting completed",
            "family_members": [
                {"name": "Emma Williams", "relationship": "Primary", "dob": "1985-06-18", "age": 39},
                {"name": "David Williams", "relationship": "Spouse", "dob": "1983-11-25", "age": 41},
                {"name": "Lily Williams", "relationship": "Daughter", "dob": "2018-03-10", "age": 6},
            ],
            "accounts": [
                {"id": 1, "name": "Combined Super (Est)", "type": "Superannuation", "institution": "Various", "balance": 450000, "change": 0, "change_percent": 0},
                {"id": 2, "name": "Bondi Apartment (Est)", "type": "Property", "institution": "Direct", "balance": 1100000, "change": 0, "change_percent": 0},
                {"id": 3, "name": "Mortgage (Est)", "type": "Liability", "institution": "ANZ", "balance": -570000, "change": 0, "change_percent": 0},
            ],
            "goals": [],
            "insurance": []
        },
        {
            "client_id": "client_5",
            "name": "Patel SMSF",
            "email": "raj.patel@business.com.au",
            "phone": "0456 789 012",
            "mobile": "0456 789 012",
            "address": "100 Collins Street, Melbourne VIC 3000",
            "status": "active",
            "type": "smsf",
            "client_since": "2017-04-20",
            "date_of_birth": "1970-01-15",
            "age": 54,
            "occupation": "Business Owner",
            "employer": "Patel Industries",
            "risk_profile": "Aggressive",
            "investment_experience": "Very Experienced",
            "adviser": "Mark Thompson",
            "review_frequency": "Quarterly",
            "last_review": "2025-10-15",
            "next_review": "2026-01-15",
            "last_contact": "2025-12-08",
            "satisfaction": 92,
            "nps": 9,
            "total_wealth": 3100000,
            "wealth_change": 180000,
            "wealth_change_percent": 6.2,
            "annual_income": 520000,
            "stage": "implementation",
            "accounts_count": 4,
            "pending_tasks": 1,
            "pending_docs": 0,
            "recent_activity": "SMSF audit completed",
            "family_members": [
                {"name": "Raj Patel", "relationship": "Primary", "dob": "1970-01-15", "age": 54},
                {"name": "Priya Patel", "relationship": "Spouse", "dob": "1972-07-22", "age": 52},
            ],
            "accounts": [
                {"id": 1, "name": "Patel Family SMSF", "type": "SMSF", "institution": "Self-Managed", "balance": 2400000, "change": 150000, "change_percent": 6.7},
                {"id": 2, "name": "Business Account", "type": "Business", "institution": "NAB", "balance": 500000, "change": 30000, "change_percent": 6.4},
                {"id": 3, "name": "Cash Reserve", "type": "Cash", "institution": "NAB", "balance": 200000, "change": 0, "change_percent": 0},
            ],
            "goals": [
                {"id": 1, "name": "Retire at 60", "target": 4000000, "current": 3100000, "progress": 78, "target_date": "2030-01-15"},
                {"id": 2, "name": "Kids inheritance", "target": 1000000, "current": 500000, "progress": 50, "target_date": "2040-01-01"},
            ],
            "insurance": [
                {"type": "Life (SMSF)", "provider": "BT", "sum_insured": 2500000, "premium": 3200, "status": "active"},
                {"type": "TPD (SMSF)", "provider": "BT", "sum_insured": 2000000, "premium": 2800, "status": "active"},
            ]
        },
        {
            "client_id": "client_6",
            "name": "Anderson Partnership",
            "email": "john.anderson@lawfirm.com.au",
            "phone": "0467 890 123",
            "mobile": "0467 890 123",
            "address": "200 George Street, Sydney NSW 2000",
            "status": "active",
            "type": "partnership",
            "client_since": "2021-02-15",
            "date_of_birth": "1965-09-30",
            "age": 59,
            "occupation": "Senior Partner",
            "employer": "Anderson Law Partners",
            "risk_profile": "Balanced",
            "investment_experience": "Experienced",
            "adviser": "Mark Thompson",
            "review_frequency": "Annual",
            "last_review": "2025-08-10",
            "next_review": "2026-08-10",
            "last_contact": "2025-12-05",
            "satisfaction": 85,
            "nps": 8,
            "total_wealth": 4200000,
            "wealth_change": 210000,
            "wealth_change_percent": 5.3,
            "annual_income": 680000,
            "stage": "review",
            "accounts_count": 5,
            "pending_tasks": 2,
            "pending_docs": 1,
            "recent_activity": "Estate planning update",
            "family_members": [
                {"name": "John Anderson", "relationship": "Primary", "dob": "1965-09-30", "age": 59},
                {"name": "Margaret Anderson", "relationship": "Spouse", "dob": "1967-04-12", "age": 57},
            ],
            "accounts": [
                {"id": 1, "name": "John Anderson Super", "type": "Superannuation", "institution": "AMP", "balance": 1200000, "change": 65000, "change_percent": 5.7},
                {"id": 2, "name": "Margaret Anderson Super", "type": "Superannuation", "institution": "AMP", "balance": 850000, "change": 45000, "change_percent": 5.6},
                {"id": 3, "name": "Partnership Distribution Account", "type": "Investment", "institution": "UBS", "balance": 1500000, "change": 80000, "change_percent": 5.6},
                {"id": 4, "name": "Beach House - Byron Bay", "type": "Property", "institution": "Direct", "balance": 1800000, "change": 90000, "change_percent": 5.3},
                {"id": 5, "name": "Mortgage - Beach House", "type": "Liability", "institution": "Westpac", "balance": -650000, "change": 20000, "change_percent": 3.2},
                {"id": 6, "name": "Cash Management", "type": "Cash", "institution": "Macquarie", "balance": 150000, "change": 10000, "change_percent": 7.1},
            ],
            "goals": [
                {"id": 1, "name": "Retire at 63", "target": 5000000, "current": 4200000, "progress": 84, "target_date": "2028-09-30"},
            ],
            "insurance": [
                {"type": "Life", "provider": "Zurich", "sum_insured": 3000000, "premium": 4200, "status": "active"},
            ]
        },
        {
            "client_id": "client_7",
            "name": "Sarah Kim",
            "email": "sarah.kim@startup.io",
            "phone": "0478 901 234",
            "mobile": "0478 901 234",
            "address": "45 Flinders Lane, Melbourne VIC 3000",
            "status": "active",
            "type": "individual",
            "client_since": "2023-06-01",
            "date_of_birth": "1990-12-05",
            "age": 34,
            "occupation": "Tech Founder",
            "employer": "Self-employed",
            "risk_profile": "Aggressive",
            "investment_experience": "Experienced",
            "adviser": "Mark Thompson",
            "review_frequency": "Semi-Annual",
            "last_review": "2025-09-01",
            "next_review": "2026-03-01",
            "last_contact": "2025-12-01",
            "satisfaction": 90,
            "nps": 9,
            "total_wealth": 1850000,
            "wealth_change": 320000,
            "wealth_change_percent": 20.9,
            "annual_income": 380000,
            "stage": "implementation",
            "accounts_count": 4,
            "pending_tasks": 1,
            "pending_docs": 0,
            "recent_activity": "Stock options exercise strategy",
            "family_members": [
                {"name": "Sarah Kim", "relationship": "Primary", "dob": "1990-12-05", "age": 34},
            ],
            "accounts": [
                {"id": 1, "name": "Sarah Kim Super", "type": "Superannuation", "institution": "Hostplus", "balance": 180000, "change": 25000, "change_percent": 16.1},
                {"id": 2, "name": "Tech Stock Portfolio", "type": "Investment", "institution": "Interactive Brokers", "balance": 850000, "change": 280000, "change_percent": 49.1},
                {"id": 3, "name": "Startup Equity (Est)", "type": "Business", "institution": "Private", "balance": 750000, "change": 0, "change_percent": 0},
                {"id": 4, "name": "Emergency Fund", "type": "Cash", "institution": "Up Bank", "balance": 70000, "change": 15000, "change_percent": 27.3},
            ],
            "goals": [
                {"id": 1, "name": "Financial independence by 45", "target": 5000000, "current": 1850000, "progress": 37, "target_date": "2035-12-05"},
                {"id": 2, "name": "Buy apartment", "target": 1200000, "current": 200000, "progress": 17, "target_date": "2027-01-01"},
            ],
            "insurance": [
                {"type": "Income Protection", "provider": "NobleOak", "sum_insured": 20000, "premium": 1800, "status": "active"},
            ]
        },
        {
            "client_id": "client_8",
            "name": "Thompson Retirees",
            "email": "g.thompson@retired.com",
            "phone": "0489 012 345",
            "mobile": "0489 012 345",
            "address": "8 Golf Course Drive, Noosa QLD 4567",
            "status": "active",
            "type": "household",
            "client_since": "2015-03-10",
            "date_of_birth": "1955-05-20",
            "age": 69,
            "occupation": "Retired",
            "employer": None,
            "risk_profile": "Conservative",
            "investment_experience": "Very Experienced",
            "adviser": "Mark Thompson",
            "review_frequency": "Semi-Annual",
            "last_review": "2025-10-01",
            "next_review": "2026-04-01",
            "last_contact": "2025-12-03",
            "satisfaction": 98,
            "nps": 10,
            "total_wealth": 2650000,
            "wealth_change": 45000,
            "wealth_change_percent": 1.7,
            "annual_income": 120000,
            "stage": "complete",
            "accounts_count": 5,
            "pending_tasks": 0,
            "pending_docs": 0,
            "recent_activity": "Pension payment adjusted",
            "family_members": [
                {"name": "George Thompson", "relationship": "Primary", "dob": "1955-05-20", "age": 69},
                {"name": "Helen Thompson", "relationship": "Spouse", "dob": "1957-08-15", "age": 67},
            ],
            "accounts": [
                {"id": 1, "name": "George Account-Based Pension", "type": "Pension", "institution": "AustralianSuper", "balance": 850000, "change": 20000, "change_percent": 2.4},
                {"id": 2, "name": "Helen Account-Based Pension", "type": "Pension", "institution": "AustralianSuper", "balance": 620000, "change": 15000, "change_percent": 2.5},
                {"id": 3, "name": "Noosa Home", "type": "Property", "institution": "Direct", "balance": 1400000, "change": 30000, "change_percent": 2.2},
                {"id": 4, "name": "Term Deposits", "type": "Cash", "institution": "Judo Bank", "balance": 280000, "change": 0, "change_percent": 0},
                {"id": 5, "name": "Savings", "type": "Cash", "institution": "ING", "balance": 150000, "change": 0, "change_percent": 0},
            ],
            "goals": [
                {"id": 1, "name": "Estate for children", "target": 2000000, "current": 2650000, "progress": 100, "target_date": "2045-01-01"},
            ],
            "insurance": []
        }
    ]
    
    for client in sample_clients:
        CLIENTS[client["client_id"]] = client
    
    # Sample tasks
    sample_tasks = [
        {"id": "task_1", "title": "Annual Review - Robert Mitchell", "client_id": "client_3", "client_name": "Robert Mitchell", "priority": "urgent", "due_date": "2025-12-20", "status": "pending", "type": "review"},
        {"id": "task_2", "title": "SOA Preparation - Chen Family", "client_id": "client_2", "client_name": "Chen Family Trust", "priority": "high", "due_date": "2025-12-22", "status": "pending", "type": "document"},
        {"id": "task_3", "title": "Insurance Review - Wheeler", "client_id": "client_1", "client_name": "James & Sarah Wheeler", "priority": "medium", "due_date": "2025-12-28", "status": "pending", "type": "review"},
        {"id": "task_4", "title": "Discovery Meeting Follow-up", "client_id": "client_4", "client_name": "Emma & David Williams", "priority": "high", "due_date": "2025-12-19", "status": "pending", "type": "meeting"},
        {"id": "task_5", "title": "SMSF Contribution Strategy", "client_id": "client_5", "client_name": "Patel SMSF", "priority": "medium", "due_date": "2026-01-05", "status": "pending", "type": "planning"},
        {"id": "task_6", "title": "Tax Planning - Chen Trust", "client_id": "client_2", "client_name": "Chen Family Trust", "priority": "medium", "due_date": "2026-01-10", "status": "pending", "type": "planning"},
        {"id": "task_7", "title": "Estate Plan Review - Anderson", "client_id": "client_6", "client_name": "Anderson Partnership", "priority": "low", "due_date": "2026-02-15", "status": "pending", "type": "planning"},
        {"id": "task_8", "title": "Stock Options Strategy - Kim", "client_id": "client_7", "client_name": "Sarah Kim", "priority": "medium", "due_date": "2026-01-20", "status": "pending", "type": "planning"},
        {"id": "task_9", "title": "Quarterly Review - Patel", "client_id": "client_5", "client_name": "Patel SMSF", "priority": "high", "due_date": "2026-01-15", "status": "pending", "type": "review"},
        {"id": "task_10", "title": "Pension Drawdown Review - Thompson", "client_id": "client_8", "client_name": "Thompson Retirees", "priority": "low", "due_date": "2026-04-01", "status": "pending", "type": "review"},
    ]
    
    for task in sample_tasks:
        TASKS[task["id"]] = task


# Initialize on module load
init_comprehensive_data()


# ============= CLIENTS ENDPOINTS (for ClientCRM.jsx) =============

@router.get("/clients")
async def get_clients(
    status: Optional[str] = None,
    search: Optional[str] = None,
    type: Optional[str] = None
):
    """Get all clients with summary statistics for CRM dashboard."""
    clients_list = list(CLIENTS.values())
    
    # Apply filters
    if status:
        clients_list = [c for c in clients_list if c.get("status") == status]
    if search:
        search_lower = search.lower()
        clients_list = [c for c in clients_list if search_lower in c["name"].lower() or search_lower in c.get("email", "").lower()]
    if type:
        clients_list = [c for c in clients_list if c.get("type") == type]
    
    # Calculate summary statistics
    total_aum = sum(c.get("total_wealth", 0) for c in CLIENTS.values())
    active_count = len([c for c in CLIENTS.values() if c.get("status") == "active"])
    prospect_count = len([c for c in CLIENTS.values() if c.get("status") == "prospect"])
    review_count = len([c for c in CLIENTS.values() if c.get("status") == "review"])
    inactive_count = len([c for c in CLIENTS.values() if c.get("status") == "inactive"])
    
    # Count pending tasks
    pending_tasks = len([t for t in TASKS.values() if t.get("status") == "pending"])
    urgent_tasks = len([t for t in TASKS.values() if t.get("status") == "pending" and t.get("priority") in ["urgent", "high"]])
    
    summary = {
        "total": len(CLIENTS),
        "active": active_count,
        "prospect": prospect_count,
        "review": review_count,
        "inactive": inactive_count,
        "total_aum": total_aum,
        "pending_tasks": pending_tasks,
        "urgent_tasks": urgent_tasks,
        "avg_satisfaction": sum(c.get("satisfaction", 0) or 0 for c in CLIENTS.values() if c.get("satisfaction")) / max(1, len([c for c in CLIENTS.values() if c.get("satisfaction")]))
    }
    
    return {
        "clients": clients_list,
        "summary": summary,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/clients/{client_id}")
async def get_client(client_id: str):
    """Get a specific client by ID with full details."""
    client = CLIENTS.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get client's tasks
    client_tasks = [t for t in TASKS.values() if t.get("client_id") == client_id]
    
    return {
        **client,
        "tasks": client_tasks,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/analytics")
async def get_crm_analytics():
    """Get comprehensive CRM analytics for adviser dashboard."""
    clients_list = list(CLIENTS.values())
    tasks_list = list(TASKS.values())
    
    # AUM by client type
    aum_by_type = {}
    for client in clients_list:
        client_type = client.get("type", "other")
        aum_by_type[client_type] = aum_by_type.get(client_type, 0) + client.get("total_wealth", 0)
    
    # AUM by risk profile
    aum_by_risk = {}
    for client in clients_list:
        risk = client.get("risk_profile", "Unknown")
        aum_by_risk[risk] = aum_by_risk.get(risk, 0) + client.get("total_wealth", 0)
    
    # Client acquisition trend (mock)
    acquisition_trend = [
        {"month": "Jul 2025", "new_clients": 1, "lost_clients": 0},
        {"month": "Aug 2025", "new_clients": 0, "lost_clients": 0},
        {"month": "Sep 2025", "new_clients": 1, "lost_clients": 0},
        {"month": "Oct 2025", "new_clients": 0, "lost_clients": 0},
        {"month": "Nov 2025", "new_clients": 0, "lost_clients": 0},
        {"month": "Dec 2025", "new_clients": 1, "lost_clients": 0},
    ]
    
    # Revenue metrics (mock based on AUM)
    total_aum = sum(c.get("total_wealth", 0) for c in clients_list)
    estimated_revenue = total_aum * 0.01  # 1% management fee
    
    # Task metrics
    pending_tasks = len([t for t in tasks_list if t.get("status") == "pending"])
    overdue_tasks = len([t for t in tasks_list if t.get("status") == "pending" and t.get("due_date") and t.get("due_date") < datetime.now(timezone.utc).strftime("%Y-%m-%d")])
    
    return {
        "summary": {
            "total_clients": len(clients_list),
            "total_aum": total_aum,
            "average_aum": total_aum / max(1, len(clients_list)),
            "estimated_annual_revenue": estimated_revenue,
            "avg_client_satisfaction": sum(c.get("satisfaction", 0) or 0 for c in clients_list if c.get("satisfaction")) / max(1, len([c for c in clients_list if c.get("satisfaction")])),
        },
        "by_status": {
            "active": len([c for c in clients_list if c.get("status") == "active"]),
            "prospect": len([c for c in clients_list if c.get("status") == "prospect"]),
            "review": len([c for c in clients_list if c.get("status") == "review"]),
            "inactive": len([c for c in clients_list if c.get("status") == "inactive"]),
        },
        "by_type": {k: {"count": len([c for c in clients_list if c.get("type") == k]), "aum": v} for k, v in aum_by_type.items()},
        "by_risk_profile": aum_by_risk,
        "acquisition_trend": acquisition_trend,
        "tasks": {
            "total_pending": pending_tasks,
            "overdue": overdue_tasks,
            "by_priority": {
                "urgent": len([t for t in tasks_list if t.get("priority") == "urgent" and t.get("status") == "pending"]),
                "high": len([t for t in tasks_list if t.get("priority") == "high" and t.get("status") == "pending"]),
                "medium": len([t for t in tasks_list if t.get("priority") == "medium" and t.get("status") == "pending"]),
                "low": len([t for t in tasks_list if t.get("priority") == "low" and t.get("status") == "pending"]),
            }
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/households")
async def get_households(
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all households with optional filtering."""
    households = list(HOUSEHOLDS.values())
    
    if status:
        households = [h for h in households if h.get("status") == status]
    
    if search:
        search_lower = search.lower()
        households = [h for h in households if search_lower in h["name"].lower()]
    
    return {
        "households": households,
        "total": len(households)
    }


@router.get("/households/{household_id}")
async def get_household(household_id: str):
    """Get a specific household by ID."""
    household = HOUSEHOLDS.get(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    return household


@router.post("/households")
async def create_household(request: HouseholdCreate):
    """Create a new household."""
    household_id = f"hh_{uuid.uuid4().hex[:8]}"
    
    household = {
        "id": household_id,
        "name": request.name,
        "members": request.members,
        "primary_email": request.primary_email,
        "phone": request.phone,
        "address": request.address,
        "risk_profile": request.risk_profile,
        "adviser_id": request.adviser_id,
        "status": "active",
        "net_worth": 0,
        "annual_income": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    HOUSEHOLDS[household_id] = household
    return household


@router.put("/households/{household_id}")
async def update_household(household_id: str, updates: Dict[str, Any]):
    """Update a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    HOUSEHOLDS[household_id].update(updates)
    HOUSEHOLDS[household_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return HOUSEHOLDS[household_id]


@router.delete("/households/{household_id}")
async def delete_household(household_id: str):
    """Delete a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    del HOUSEHOLDS[household_id]
    return {"success": True, "message": "Household deleted"}


# Notes endpoints
@router.post("/notes")
async def create_note(request: NoteCreate):
    """Create a new note for a household."""
    note_id = f"note_{uuid.uuid4().hex[:8]}"
    
    note = {
        "id": note_id,
        "household_id": request.household_id,
        "title": request.title,
        "content": request.content,
        "category": request.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    NOTES[note_id] = note
    return note


@router.get("/notes/{household_id}")
async def get_notes(household_id: str):
    """Get all notes for a household."""
    household_notes = [n for n in NOTES.values() if n["household_id"] == household_id]
    return {"notes": household_notes}


@router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note."""
    if note_id not in NOTES:
        raise HTTPException(status_code=404, detail="Note not found")
    
    del NOTES[note_id]
    return {"success": True}


# Tasks endpoints
@router.get("/tasks")
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    household_id: Optional[str] = None
):
    """Get tasks with optional filtering."""
    tasks = list(TASKS.values())
    
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    if priority:
        tasks = [t for t in tasks if t.get("priority") == priority]
    if household_id:
        tasks = [t for t in tasks if t.get("household_id") == household_id]
    
    return {"tasks": tasks}


@router.post("/tasks")
async def create_task(request: TaskCreate):
    """Create a new task."""
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    task = {
        "id": task_id,
        "title": request.title,
        "description": request.description,
        "household_id": request.household_id,
        "due_date": request.due_date,
        "priority": request.priority,
        "assigned_to": request.assigned_to,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    TASKS[task_id] = task
    return task


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, updates: Dict[str, Any]):
    """Update a task."""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    TASKS[task_id].update(updates)
    TASKS[task_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return TASKS[task_id]


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task."""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    del TASKS[task_id]
    return {"success": True}


# Meetings endpoints
@router.get("/meetings")
async def get_meetings(
    household_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get meetings with optional filtering."""
    meetings = list(MEETINGS.values())
    
    if household_id:
        meetings = [m for m in meetings if m.get("household_id") == household_id]
    
    # Sort by date
    meetings.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return {"meetings": meetings}


@router.post("/meetings")
async def create_meeting(request: MeetingCreate):
    """Schedule a new meeting."""
    meeting_id = f"meet_{uuid.uuid4().hex[:8]}"
    
    meeting = {
        "id": meeting_id,
        "title": request.title,
        "household_id": request.household_id,
        "date": request.date,
        "time": request.time,
        "duration_minutes": request.duration_minutes,
        "meeting_type": request.meeting_type,
        "location": request.location,
        "notes": request.notes,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    MEETINGS[meeting_id] = meeting
    return meeting


@router.put("/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, updates: Dict[str, Any]):
    """Update a meeting."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    MEETINGS[meeting_id].update(updates)
    MEETINGS[meeting_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return MEETINGS[meeting_id]


@router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str):
    """Delete a meeting."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    del MEETINGS[meeting_id]
    return {"success": True}


# Dashboard stats
@router.get("/stats")
async def get_crm_stats():
    """Get CRM dashboard statistics."""
    households = list(HOUSEHOLDS.values())
    tasks = list(TASKS.values())
    meetings = list(MEETINGS.values())
    
    active_clients = len([h for h in households if h.get("status") == "active"])
    pending_tasks = len([t for t in tasks if t.get("status") == "pending"])
    upcoming_meetings = len([m for m in meetings if m.get("status") == "scheduled"])
    total_aum = sum(h.get("net_worth", 0) for h in households)
    
    return {
        "total_households": len(households),
        "active_clients": active_clients,
        "pending_tasks": pending_tasks,
        "upcoming_meetings": upcoming_meetings,
        "total_aum": total_aum,
        "average_net_worth": total_aum / len(households) if households else 0
    }
