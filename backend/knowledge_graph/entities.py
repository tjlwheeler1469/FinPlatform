"""
Financial Knowledge Graph - Core Entities and Relationships
============================================================

This module defines the graph schema for the Financial Knowledge Graph.
All financial data is connected through relationships, not isolated tables.

ENTITIES:
- Client, Household, Advisor, Account, Portfolio, Asset, Sector
- FinancialPlan, Goal, Transaction, Insight, Action

RELATIONSHIPS:
- (Client)-[:MEMBER_OF]->(Household)
- (Client)-[:OWNS]->(Account)
- (Account)-[:PART_OF]->(Portfolio)
- (Portfolio)-[:HOLDS]->(Asset)
- (Asset)-[:IN_SECTOR]->(Sector)
- (Client)-[:HAS_PLAN]->(FinancialPlan)
- (FinancialPlan)-[:HAS_GOAL]->(Goal)
- (Transaction)-[:AFFECTS]->(Account)
- (Transaction)-[:INVOLVES]->(Asset)
- (Insight)-[:RELATES_TO]->(Client)
- (Insight)-[:RECOMMENDS]->(Action)
- (Action)-[:EXECUTED_AS]->(Transaction)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    GROWTH = "growth"
    AGGRESSIVE = "aggressive"

class AccountType(str, Enum):
    BROKERAGE = "brokerage"
    SUPER = "superannuation"
    SMSF = "smsf"
    BANK = "bank"
    TERM_DEPOSIT = "term_deposit"
    OFFSET = "offset"
    PROPERTY = "property"

class AssetClass(str, Enum):
    STOCKS = "stocks"
    ETFS = "etfs"
    BONDS = "bonds"
    CASH = "cash"
    FUNDS = "funds"
    CRYPTO = "crypto"
    PROPERTY = "property"

class GoalStatus(str, Enum):
    ACTIVE = "active"
    ACHIEVED = "achieved"
    AT_RISK = "at_risk"
    PAUSED = "paused"

class InsightType(str, Enum):
    RISK_ALERT = "risk_alert"
    OPPORTUNITY = "opportunity"
    REBALANCE = "rebalance"
    TAX_OPTIMIZATION = "tax_optimization"
    GOAL_PROGRESS = "goal_progress"

class ActionType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    REBALANCE = "rebalance"
    TRANSFER = "transfer"
    REVIEW = "review"

class ActionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    EXECUTED = "executed"
    CANCELLED = "cancelled"


# ==================== CORE ENTITIES ====================

class Sector(BaseModel):
    """Market sector for asset classification"""
    id: str
    name: str
    code: str  # e.g., "XEJ" for Energy
    weight_benchmark: float = 0.0  # Benchmark weight in index
    current_pe: Optional[float] = None
    ytd_return: Optional[float] = None

class Asset(BaseModel):
    """Individual asset/security"""
    id: str
    symbol: str
    name: str
    asset_class: AssetClass
    sector_id: Optional[str] = None
    current_price: float = 0.0
    currency: str = "AUD"
    exchange: Optional[str] = None
    # Additional metadata
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    market_cap: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class Holding(BaseModel):
    """Asset holding within a portfolio"""
    asset_id: str
    units: float
    cost_base: float
    current_value: float
    weight: float = 0.0  # Portfolio weight
    unrealized_gain: float = 0.0
    purchase_date: Optional[datetime] = None

class Portfolio(BaseModel):
    """Investment portfolio"""
    id: str
    name: str
    holdings: List[Holding] = []
    total_value: float = 0.0
    cash_balance: float = 0.0
    target_allocation: Dict[str, float] = {}  # asset_class -> weight

class Account(BaseModel):
    """Financial account (brokerage, bank, super, etc.)"""
    id: str
    name: str
    account_type: AccountType
    institution: str
    account_number: Optional[str] = None
    portfolio_id: Optional[str] = None
    balance: float = 0.0
    available_balance: float = 0.0
    interest_rate: Optional[float] = None
    opened_date: Optional[datetime] = None

class Goal(BaseModel):
    """Financial goal"""
    id: str
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[datetime] = None
    status: GoalStatus = GoalStatus.ACTIVE
    priority: int = 1  # 1 = highest
    monthly_contribution: float = 0.0
    linked_account_ids: List[str] = []

class FinancialPlan(BaseModel):
    """Client's financial plan"""
    id: str
    name: str
    created_date: datetime = Field(default_factory=datetime.utcnow)
    last_review: Optional[datetime] = None
    next_review: Optional[datetime] = None
    risk_profile: RiskProfile = RiskProfile.MODERATE
    goals: List[Goal] = []
    notes: Optional[str] = None

class Advisor(BaseModel):
    """Financial advisor"""
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    specializations: List[str] = []
    client_ids: List[str] = []
    total_aum: float = 0.0

class Household(BaseModel):
    """Family/household grouping"""
    id: str
    name: str
    member_ids: List[str] = []
    combined_net_worth: float = 0.0
    primary_contact_id: Optional[str] = None

class Client(BaseModel):
    """Individual client"""
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    risk_profile: RiskProfile = RiskProfile.MODERATE
    household_id: Optional[str] = None
    advisor_id: Optional[str] = None
    account_ids: List[str] = []
    financial_plan_id: Optional[str] = None
    net_worth: float = 0.0
    annual_income: float = 0.0
    retirement_age: int = 65
    created_date: datetime = Field(default_factory=datetime.utcnow)

class Transaction(BaseModel):
    """Financial transaction"""
    id: str
    transaction_type: ActionType
    asset_id: Optional[str] = None
    account_id: str
    units: float = 0.0
    price: float = 0.0
    total_amount: float = 0.0
    fees: float = 0.0
    executed_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class Insight(BaseModel):
    """AI-generated insight"""
    id: str
    insight_type: InsightType
    title: str
    description: str
    severity: int = 1  # 1-5, 5 = critical
    client_ids: List[str] = []  # Affected clients
    portfolio_ids: List[str] = []  # Affected portfolios
    recommended_action_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

class Action(BaseModel):
    """Recommended action from insight"""
    id: str
    action_type: ActionType
    title: str
    description: str
    insight_id: Optional[str] = None
    client_id: Optional[str] = None
    portfolio_id: Optional[str] = None
    asset_id: Optional[str] = None
    amount: float = 0.0
    status: ActionStatus = ActionStatus.PENDING
    priority: int = 1  # 1-5
    impact_score: float = 0.0  # Estimated impact
    created_at: datetime = Field(default_factory=datetime.utcnow)
    executed_at: Optional[datetime] = None
    transaction_id: Optional[str] = None  # Links to executed transaction


# ==================== GRAPH RELATIONSHIP TYPES ====================

class RelationshipType(str, Enum):
    """All relationship types in the knowledge graph"""
    MEMBER_OF = "MEMBER_OF"          # Client -> Household
    OWNS = "OWNS"                     # Client -> Account
    MANAGED_BY = "MANAGED_BY"        # Client -> Advisor
    PART_OF = "PART_OF"              # Account -> Portfolio
    HOLDS = "HOLDS"                   # Portfolio -> Asset
    IN_SECTOR = "IN_SECTOR"          # Asset -> Sector
    HAS_PLAN = "HAS_PLAN"            # Client -> FinancialPlan
    HAS_GOAL = "HAS_GOAL"            # FinancialPlan -> Goal
    FUNDS_GOAL = "FUNDS_GOAL"        # Account -> Goal
    AFFECTS = "AFFECTS"               # Transaction -> Account
    INVOLVES = "INVOLVES"             # Transaction -> Asset
    RELATES_TO = "RELATES_TO"        # Insight -> Client/Portfolio
    RECOMMENDS = "RECOMMENDS"        # Insight -> Action
    EXECUTED_AS = "EXECUTED_AS"      # Action -> Transaction
    SIMILAR_TO = "SIMILAR_TO"        # Client -> Client (for pattern matching)
    CORRELATED_WITH = "CORRELATED_WITH"  # Asset -> Asset


# ==================== GRAPH QUERY RESPONSE MODELS ====================

class GraphNode(BaseModel):
    """Generic graph node for API responses"""
    id: str
    label: str
    properties: Dict[str, Any] = {}

class GraphRelationship(BaseModel):
    """Generic graph relationship for API responses"""
    source_id: str
    target_id: str
    relationship_type: str
    properties: Dict[str, Any] = {}

class GraphQueryResult(BaseModel):
    """Result of a graph query"""
    nodes: List[GraphNode] = []
    relationships: List[GraphRelationship] = []
    summary: Optional[str] = None
    count: int = 0

class ClientRiskAnalysis(BaseModel):
    """Risk analysis result for a client"""
    client_id: str
    client_name: str
    risk_score: float  # 0-100
    overweight_sectors: List[Dict[str, Any]] = []
    concentration_risks: List[Dict[str, Any]] = []
    retirement_risk: Optional[Dict[str, Any]] = None
    recommendations: List[str] = []

class RebalanceRecommendation(BaseModel):
    """Portfolio rebalance recommendation"""
    portfolio_id: str
    portfolio_name: str
    current_allocation: Dict[str, float]
    target_allocation: Dict[str, float]
    trades_needed: List[Dict[str, Any]]
    estimated_tax_impact: float = 0.0

class RevenueOpportunity(BaseModel):
    """Revenue opportunity identified from graph"""
    client_id: str
    client_name: str
    opportunity_type: str
    potential_revenue: float
    probability: float  # 0-1
    description: str
    recommended_actions: List[str]
