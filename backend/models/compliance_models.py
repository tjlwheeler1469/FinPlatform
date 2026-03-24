"""
AdviceOS Compliance Database Models
====================================
Compliance-first, audit-driven database schema for financial advisory platform.

Core Principle: Every action is explainable, traceable, and controlled by adviser/licensee.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum
import hashlib
import json

# ==================== ENUMS ====================

class ComplianceResult(str, Enum):
    PASS = "pass"
    WARNING = "warning"
    BLOCK = "block"

class BreachSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class BreachStatus(str, Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class AdviserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"
    UNDER_REVIEW = "under_review"

class ActionType(str, Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    OVERRIDE = "override"
    EXPORT = "export"
    LOGIN = "login"
    LOGOUT = "logout"

class EntityType(str, Enum):
    LICENSEE = "licensee"
    ADVISER = "adviser"
    CLIENT = "client"
    SCENARIO = "scenario"
    COMPLIANCE_CHECK = "compliance_check"
    DECISION = "decision"
    REPORT = "report"

class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATELY_CONSERVATIVE = "moderately_conservative"
    BALANCED = "balanced"
    MODERATELY_AGGRESSIVE = "moderately_aggressive"
    AGGRESSIVE = "aggressive"

class ScenarioType(str, Enum):
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    GROWTH = "growth"
    INCOME = "income"
    CUSTOM = "custom"

# ==================== LICENSEE MODELS ====================

class ComplianceRulesConfig(BaseModel):
    """Licensee-specific compliance rules configuration"""
    min_scenarios_required: int = Field(default=3, description="Minimum scenarios to generate")
    require_adviser_confirmation: bool = Field(default=True)
    require_override_justification: bool = Field(default=True)
    max_equity_allocation: float = Field(default=0.80, description="Maximum equity allocation")
    min_defensive_allocation: float = Field(default=0.20, description="Minimum defensive allocation")
    max_single_stock_weight: float = Field(default=0.10, description="Max single stock weight")
    fee_threshold_warning: float = Field(default=0.015, description="Fee threshold for warning (1.5%)")
    fee_threshold_block: float = Field(default=0.025, description="Fee threshold for block (2.5%)")
    risk_alignment_strict: bool = Field(default=True, description="Strict risk profile alignment")
    require_apl_compliance: bool = Field(default=True, description="Require APL compliance")

class APLProduct(BaseModel):
    """Approved Product List item"""
    product_id: str
    product_name: str
    product_type: str  # managed_fund, etf, stock, bond, hybrid, cash
    provider: str
    risk_rating: int = Field(ge=1, le=7)
    approved_date: str
    status: str = "approved"
    max_allocation: Optional[float] = None
    notes: Optional[str] = None

class LicenseeCreate(BaseModel):
    """Create a new licensee"""
    name: str
    afsl_number: str
    contact_email: str
    rules_config: Optional[ComplianceRulesConfig] = None
    apl: Optional[List[APLProduct]] = None

class Licensee(BaseModel):
    """Licensee (AFSL Holder) model"""
    id: str
    name: str
    afsl_number: str
    contact_email: str
    rules_config: ComplianceRulesConfig
    apl: List[APLProduct] = []
    created_at: str
    updated_at: str
    status: str = "active"

# ==================== ADVISER MODELS ====================

class AdviserCreate(BaseModel):
    """Create a new adviser"""
    licensee_id: str
    name: str
    email: str
    ar_number: Optional[str] = None  # Authorised Representative number

class Adviser(BaseModel):
    """Adviser model"""
    id: str
    licensee_id: str
    name: str
    email: str
    ar_number: Optional[str] = None
    status: AdviserStatus = AdviserStatus.ACTIVE
    created_at: str
    updated_at: str
    last_login: Optional[str] = None
    total_clients: int = 0
    total_scenarios: int = 0
    compliance_score: float = 100.0
    overrides_count: int = 0
    breaches_count: int = 0

# ==================== CLIENT MODELS ====================

class ClientProfileData(BaseModel):
    """Client profile data structure"""
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    employer: Optional[str] = None
    marital_status: Optional[str] = None
    dependants: Optional[int] = None
    annual_income: Optional[float] = None
    annual_expenses: Optional[float] = None
    tax_residency: Optional[str] = "Australia"
    investment_experience: Optional[str] = None
    investment_timeframe: Optional[str] = None

class ClientFinancialSituation(BaseModel):
    """Client financial situation"""
    total_assets: float = 0
    total_liabilities: float = 0
    net_worth: float = 0
    super_balance: float = 0
    investment_portfolio: float = 0
    cash_savings: float = 0
    property_value: float = 0
    emergency_fund: float = 0

class ClientGoal(BaseModel):
    """Client financial goal"""
    goal_id: str
    name: str
    target_amount: float
    current_amount: float
    target_date: str
    priority: str = "medium"
    goal_type: str  # retirement, education, property, travel, other

class ComplianceClient(BaseModel):
    """Client model for compliance system"""
    id: str
    external_id: Optional[str] = None  # Xplan ID
    licensee_id: str
    adviser_id: str
    name: str
    email: Optional[str] = None
    profile_data: ClientProfileData
    risk_profile: RiskProfile
    financial_situation: ClientFinancialSituation
    goals: List[ClientGoal] = []
    created_at: str
    updated_at: str
    last_review_date: Optional[str] = None
    next_review_date: Optional[str] = None

# ==================== SCENARIO MODELS ====================

class ScenarioInputs(BaseModel):
    """Inputs used to generate scenario"""
    client_id: str
    risk_profile: RiskProfile
    investment_timeframe_years: int
    initial_investment: float
    monthly_contribution: float = 0
    goals: List[Dict[str, Any]] = []
    current_portfolio: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None

class ScenarioAllocation(BaseModel):
    """Asset allocation for a scenario"""
    australian_equities: float = 0
    international_equities: float = 0
    fixed_income: float = 0
    cash: float = 0
    property: float = 0
    alternatives: float = 0
    
    def total(self) -> float:
        return (self.australian_equities + self.international_equities + 
                self.fixed_income + self.cash + self.property + self.alternatives)

class ScenarioMetrics(BaseModel):
    """Metrics for a scenario"""
    expected_return_low: float
    expected_return_mid: float
    expected_return_high: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    income_yield: float
    total_fees: float
    projected_value_10yr: float
    projected_value_20yr: float
    probability_meeting_goal: float

class ScenarioOutput(BaseModel):
    """Single scenario output"""
    scenario_id: str
    scenario_type: ScenarioType
    scenario_name: str
    allocation: ScenarioAllocation
    metrics: ScenarioMetrics
    products: List[Dict[str, Any]] = []
    rationale: str
    risks: List[str] = []
    considerations: List[str] = []

class ScenarioSet(BaseModel):
    """Set of scenarios (minimum 3)"""
    id: str
    client_id: str
    adviser_id: str
    inputs: ScenarioInputs
    scenarios: List[ScenarioOutput]
    comparison_summary: Dict[str, Any]
    compliance_status: ComplianceResult
    created_at: str
    expires_at: str  # Scenarios expire after X days
    status: str = "pending_review"  # pending_review, approved, rejected, expired

# ==================== COMPLIANCE CHECK MODELS ====================

class ComplianceRule(BaseModel):
    """Individual compliance rule result"""
    rule_id: str
    rule_name: str
    description: str
    result: ComplianceResult
    details: str
    threshold: Optional[str] = None
    actual_value: Optional[str] = None

class ComplianceCheck(BaseModel):
    """Compliance check for a scenario"""
    id: str
    scenario_set_id: str
    scenario_id: str
    overall_result: ComplianceResult
    rules_triggered: List[ComplianceRule]
    apl_compliance: bool
    risk_alignment: bool
    fee_compliance: bool
    allocation_compliance: bool
    created_at: str
    checked_by: str  # system or adviser_id

# ==================== ADVISER DECISION MODELS ====================

class AdviserConfirmation(BaseModel):
    """Adviser confirmation checkboxes"""
    reviewed_scenarios: bool = False
    client_best_interest: bool = False
    understood_risks: bool = False
    discussed_with_client: bool = False

class AdviserDecision(BaseModel):
    """Adviser decision on a scenario set"""
    id: str
    scenario_set_id: str
    adviser_id: str
    selected_scenario_id: Optional[str] = None  # Can be None if rejected all
    decision: str  # approved, rejected, modified, deferred
    confirmation: AdviserConfirmation
    justification_text: str
    override_occurred: bool = False
    override_reason: Optional[str] = None
    original_system_recommendation: Optional[str] = None
    created_at: str
    client_acknowledged: bool = False
    client_acknowledgement_date: Optional[str] = None

# ==================== AUDIT LOG MODELS ====================

class AuditLog(BaseModel):
    """Immutable audit log entry"""
    id: str
    user_id: str
    user_role: str  # adviser, licensee_admin, system
    action_type: ActionType
    entity_type: EntityType
    entity_id: str
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    hash: str  # SHA-256 hash for integrity verification
    
    @staticmethod
    def generate_hash(data: Dict[str, Any]) -> str:
        """Generate SHA-256 hash for audit integrity"""
        content = json.dumps(data, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

# ==================== BREACH MODELS ====================

class BreachFlag(BaseModel):
    """Compliance breach flag"""
    id: str
    licensee_id: str
    adviser_id: str
    scenario_id: Optional[str] = None
    client_id: Optional[str] = None
    breach_type: str
    description: str
    severity: BreachSeverity
    status: BreachStatus = BreachStatus.OPEN
    detected_at: str
    resolved_at: Optional[str] = None
    resolution_notes: Optional[str] = None
    escalated_to: Optional[str] = None
    reviewed_by: Optional[str] = None

# ==================== REPORT MODELS ====================

class ReportType(str, Enum):
    ADVISER_ACTIVITY = "adviser_activity"
    COMPLIANCE_SUMMARY = "compliance_summary"
    BREACH_REPORT = "breach_report"
    CLIENT_FILE_EXPORT = "client_file_export"
    AUDIT_EXPORT = "audit_export"
    SCENARIO_HISTORY = "scenario_history"

class Report(BaseModel):
    """Generated report"""
    id: str
    licensee_id: str
    report_type: ReportType
    generated_by: str
    generated_at: str
    parameters: Dict[str, Any]
    data_snapshot: Dict[str, Any]
    format: str = "json"  # json, csv, pdf
    file_path: Optional[str] = None

# ==================== EXPLAINABILITY MODELS ====================

class ExplainabilityRecord(BaseModel):
    """Explainability record for any output"""
    id: str
    entity_type: str
    entity_id: str
    inputs_used: Dict[str, Any]
    rules_triggered: List[Dict[str, Any]]
    assumptions_applied: List[str]
    calculations_performed: List[Dict[str, Any]]
    alternative_scenarios: List[str]
    created_at: str
    version: str = "1.0"

# ==================== TRADE-OFF MODELS ====================

class TradeOff(BaseModel):
    """Trade-off analysis"""
    dimension: str  # risk_return, income_growth, liquidity_performance, fees_outcomes
    description: str
    scenario_a: str
    scenario_b: str
    impact_description: str
    quantitative_impact: Optional[Dict[str, Any]] = None
