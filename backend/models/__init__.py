"""Pydantic models for the Australian Investment Analyzer"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

# ==================== USER MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionRequest(BaseModel):
    session_id: str

# ==================== INVESTMENT MODELS ====================

class PropertyInput(BaseModel):
    property_id: str = Field(default_factory=lambda: f"prop_{uuid.uuid4().hex[:8]}")
    name: str
    value: float
    rental_income: float = 0
    mortgage_amount: float = 0
    mortgage_rate: float = 0
    mortgage_term_years: int = 30
    annual_expenses: float = 0
    depreciation_building: float = 0
    depreciation_fixtures: float = 0

class InvestmentInput(BaseModel):
    cash_savings: float = 0
    term_deposit_amount: float = 0
    term_deposit_rate: float = 0
    shares_value: float = 0
    shares_dividend_yield: float = 0
    franking_percentage: float = 100
    bonds_value: float = 0
    bonds_yield: float = 0
    etf_value: float = 0
    etf_yield: float = 0
    smsf_balance: float = 0
    properties: List[PropertyInput] = []

class ExpenseInput(BaseModel):
    school_fees: float = 0
    childcare: float = 0
    health_insurance: float = 0
    private_expenses: float = 0
    work_related: float = 0
    other_deductible: float = 0

class ScenarioInput(BaseModel):
    scenario_id: str = Field(default_factory=lambda: f"scen_{uuid.uuid4().hex[:12]}")
    name: str
    entity_type: str = "personal"
    taxable_income: float = 0
    investments: InvestmentInput = InvestmentInput()
    expenses: ExpenseInput = ExpenseInput()
    simulation_years: int = 10
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScenarioCreate(BaseModel):
    name: str
    entity_type: str = "personal"
    taxable_income: float = 0
    investments: InvestmentInput = InvestmentInput()
    expenses: ExpenseInput = ExpenseInput()
    simulation_years: int = 10

class ScenarioComparisonInput(BaseModel):
    scenarios: List[Dict[str, Any]]

# ==================== TAX & ANALYSIS MODELS ====================

class PackagingItem(BaseModel):
    item_type: str
    amount: float
    frequency: str = "annual"

class SalaryPackagingRequest(BaseModel):
    gross_salary: float
    items: List[PackagingItem]
    is_nfp: bool = False

class PropertyComparisonRequest(BaseModel):
    properties: List[Dict[str, Any]]
    marginal_tax_rate: float = 0.37
    investment_horizon_years: int = 10

class HoldingInput(BaseModel):
    symbol: str
    name: str
    units: float
    purchase_price: float
    current_price: float
    purchase_date: str

class TaxLossHarvestingRequest(BaseModel):
    holdings: List[HoldingInput]
    marginal_tax_rate: float = 0.37
    wash_sale_days: int = 30

class DividendReinvestmentRequest(BaseModel):
    initial_investment: float
    dividend_yield: float
    capital_growth_rate: float
    franking_percentage: float = 100
    marginal_tax_rate: float = 0.37
    years: int = 10
    reinvest: bool = True

# ==================== STOCK & PROPERTY MODELS ====================

class StockPriceRequest(BaseModel):
    symbols: List[str]

class PropertyValuationRequest(BaseModel):
    suburb: str
    property_type: str = "house"
    bedrooms: int = 3

# ==================== LIFECYCLE PLANNING MODELS ====================

class RetirementPlanRequest(BaseModel):
    current_age: int
    retirement_age: int
    current_super: float
    current_other_assets: float
    annual_income: float
    employer_contribution_rate: float = 0.115
    personal_contribution: float = 0
    desired_income: float
    life_expectancy: int = 90

class EstateplanRequest(BaseModel):
    total_assets: float
    total_super: float
    has_will: bool = False
    beneficiaries: List[Dict[str, Any]] = []
    superannuation_nominations: Dict[str, Any] = {}

class FinancialGoal(BaseModel):
    goal_id: str = Field(default_factory=lambda: f"goal_{uuid.uuid4().hex[:8]}")
    name: str
    target_amount: float
    current_savings: float = 0
    target_date: str
    priority: str = "medium"
    category: str = "general"

class GoalPlanningRequest(BaseModel):
    goals: List[FinancialGoal]
    monthly_savings_capacity: float
    expected_return: float = 0.07

# ==================== NOTIFICATION & CHAT MODELS ====================

class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = False
    tax_deadline_alerts: bool = True
    market_alerts: bool = False
    reminder_days_before: int = 7

class TaxDeadline(BaseModel):
    deadline_id: str
    name: str
    description: str
    due_date: str
    category: str
    recurring: bool = True
    frequency: str = "yearly"

class ChatMessage(BaseModel):
    message: str
    context: Dict[str, Any] = {}

# ==================== CLIENT AUTH MODELS ====================

class ClientLoginRequest(BaseModel):
    email: str
    password: str

class ClientRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    adviser_code: Optional[str] = None

class ClientProfile(BaseModel):
    client_id: str
    email: str
    name: str
    adviser_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== PRACTICE MANAGEMENT MODELS ====================

class ClientNote(BaseModel):
    note_id: str = Field(default_factory=lambda: f"note_{uuid.uuid4().hex[:8]}")
    client_id: str
    content: str
    category: str = "general"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Meeting(BaseModel):
    meeting_id: str = Field(default_factory=lambda: f"mtg_{uuid.uuid4().hex[:8]}")
    client_id: str
    title: str
    scheduled_at: datetime
    duration_minutes: int = 60
    location: str = "office"
    notes: Optional[str] = None
    status: str = "scheduled"

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:8]}")
    client_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "medium"
    status: str = "pending"
    assigned_to: Optional[str] = None

class TimeEntry(BaseModel):
    entry_id: str = Field(default_factory=lambda: f"time_{uuid.uuid4().hex[:8]}")
    client_id: str
    description: str
    duration_minutes: int
    billable: bool = True
    rate: float = 350.0
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Invoice(BaseModel):
    invoice_id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:8]}")
    client_id: str
    amount: float
    description: str
    status: str = "draft"
    due_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComplianceRecord(BaseModel):
    record_id: str = Field(default_factory=lambda: f"comp_{uuid.uuid4().hex[:8]}")
    client_id: str
    action_type: str
    description: str
    performed_by: str
    performed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    documents: List[str] = []

# ==================== FACT FIND & E-SIGNATURE MODELS ====================

class FactFindData(BaseModel):
    client_id: str
    personal_details: Dict[str, Any] = {}
    employment_income: Dict[str, Any] = {}
    assets: Dict[str, Any] = {}
    liabilities: Dict[str, Any] = {}
    insurance_estate: Dict[str, Any] = {}
    goals_objectives: Dict[str, Any] = {}
    risk_profile: Dict[str, Any] = {}
    completion_percentage: float = 0
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SignatureRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: f"sig_{uuid.uuid4().hex[:12]}")
    document_type: str
    client_id: str
    client_name: str
    client_email: str
    status: str = "pending"
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    signed_at: Optional[datetime] = None
    signature_data: Optional[str] = None

class MFASetup(BaseModel):
    user_id: str
    enabled: bool = False
    secret: Optional[str] = None
    backup_codes: List[str] = []
    setup_at: Optional[datetime] = None

# ==================== DECISION ENGINE MODELS ====================

class FinancialProfileInput(BaseModel):
    age: int = 45
    current_income: float = 185000
    annual_expenses: float = 120000
    total_assets: float = 2920000
    total_debt: float = 942000
    super_balance: float = 580000
    emergency_fund: float = 75000
    investment_portfolio: float = 545000
    property_value: float = 1720000
    savings_rate: float = 0.15
    retirement_age: int = 65
    desired_retirement_income: float = 100000

class LifeEventInput(BaseModel):
    event_type: str
    age: int
    description: str
    financial_impact: float = 0

class LifeTimelineInput(BaseModel):
    current_age: int = 45
    life_expectancy: int = 90
    events: List[LifeEventInput] = []
    current_assets: float = 2920000
    current_debt: float = 942000
    annual_income: float = 185000
    annual_savings: float = 50000
    expected_return: float = 0.07
    inflation_rate: float = 0.025

# ==================== CRM MODELS ====================

class ClientHousehold(BaseModel):
    household_id: str = Field(default_factory=lambda: f"hh_{uuid.uuid4().hex[:8]}")
    name: str
    members: List[Dict[str, Any]] = []
    contact_email: str
    contact_phone: Optional[str] = None
    adviser_id: str
    status: str = "active"
    risk_profile: Optional[str] = None
    total_fum: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_review: Optional[datetime] = None

class TaskItem(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:8]}")
    household_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "medium"
    status: str = "pending"
    category: str = "general"
    assigned_to: Optional[str] = None

class MeetingItem(BaseModel):
    meeting_id: str = Field(default_factory=lambda: f"mtg_{uuid.uuid4().hex[:8]}")
    household_id: str
    title: str
    scheduled_at: datetime
    duration_minutes: int = 60
    meeting_type: str = "review"
    location: Optional[str] = None
    agenda: Optional[str] = None
    status: str = "scheduled"
    attendees: List[str] = []

class ComplianceAuditLog(BaseModel):
    log_id: str = Field(default_factory=lambda: f"audit_{uuid.uuid4().hex[:8]}")
    household_id: str
    action_type: str
    description: str
    performed_by: str
    performed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    related_documents: List[str] = []

class RiskToleranceAssessment(BaseModel):
    assessment_id: str = Field(default_factory=lambda: f"risk_{uuid.uuid4().hex[:8]}")
    household_id: str
    responses: Dict[str, Any] = {}
    risk_score: int = 0
    risk_profile: str = "balanced"
    assessed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    assessed_by: str

class AdviceRecord(BaseModel):
    advice_id: str = Field(default_factory=lambda: f"adv_{uuid.uuid4().hex[:8]}")
    household_id: str
    advice_type: str
    summary: str
    recommendations: List[Dict[str, Any]] = []
    status: str = "draft"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    compliance_notes: Optional[str] = None

class GoalItem(BaseModel):
    goal_id: str = Field(default_factory=lambda: f"goal_{uuid.uuid4().hex[:8]}")
    household_id: str
    name: str
    category: str = "general"
    target_amount: float
    current_amount: float = 0
    target_date: Optional[str] = None
    priority: str = "medium"
    status: str = "active"
    notes: Optional[str] = None

# ==================== AI & PORTFOLIO MODELS ====================

class AIAdviceRequest(BaseModel):
    model: str = "gpt-4"
    context: Dict[str, Any] = {}
    household_id: str
    question: Optional[str] = None

class PortfolioAggregationAccount(BaseModel):
    account_id: str
    institution: str
    account_type: str
    account_name: str
    balance: float
    currency: str = "AUD"
    holdings: List[Dict[str, Any]] = []
    last_synced: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
