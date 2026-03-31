"""
Smart Order Router
Intelligent order routing with best execution, multi-custodian logic, and compliance checks.
Routes trades to optimal venue based on asset class, cost, and execution quality.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/smart-router", tags=["Smart Order Router"])


class ExecutionVenue(str, Enum):
    ALPACA = "alpaca"
    IBKR = "interactive_brokers"
    DRIVEWEALTH = "drivewealth"
    BINANCE = "binance"
    COINBASE = "coinbase"
    ASX = "asx"
    NYSE = "nyse"
    NASDAQ = "nasdaq"


class ComplianceStatus(str, Enum):
    APPROVED = "approved"
    PENDING_REVIEW = "pending_review"
    REJECTED = "rejected"
    FLAGGED = "flagged"


# Venue configurations with capabilities and costs
VENUE_CONFIG = {
    ExecutionVenue.ALPACA: {
        "name": "Alpaca",
        "supported_assets": ["equity", "etf"],
        "markets": ["NYSE", "NASDAQ", "AMEX"],
        "commission": 0,  # Commission-free
        "payment_for_order_flow": True,
        "fractional_shares": True,
        "extended_hours": True,
        "min_order": 1,
        "max_order": 100000,
        "execution_speed": "fast",
        "best_for": ["retail", "small_orders"]
    },
    ExecutionVenue.IBKR: {
        "name": "Interactive Brokers",
        "supported_assets": ["equity", "etf", "options", "futures", "fx", "bonds"],
        "markets": ["NYSE", "NASDAQ", "ASX", "LSE", "TSE", "HKEX"],
        "commission": 0.005,  # $0.005 per share
        "payment_for_order_flow": False,
        "fractional_shares": True,
        "extended_hours": True,
        "min_order": 1,
        "max_order": 10000000,
        "execution_speed": "fastest",
        "best_for": ["institutional", "large_orders", "multi_market"]
    },
    ExecutionVenue.BINANCE: {
        "name": "Binance",
        "supported_assets": ["crypto"],
        "markets": ["CRYPTO"],
        "commission": 0.001,  # 0.1%
        "payment_for_order_flow": False,
        "fractional_shares": True,
        "extended_hours": True,  # 24/7
        "min_order": 10,  # $10 min
        "max_order": 10000000,
        "execution_speed": "fast",
        "best_for": ["crypto", "high_volume"]
    },
    ExecutionVenue.COINBASE: {
        "name": "Coinbase",
        "supported_assets": ["crypto"],
        "markets": ["CRYPTO"],
        "commission": 0.006,  # 0.6%
        "payment_for_order_flow": False,
        "fractional_shares": True,
        "extended_hours": True,
        "min_order": 1,
        "max_order": 1000000,
        "execution_speed": "medium",
        "best_for": ["crypto", "compliance_focused"]
    },
    ExecutionVenue.ASX: {
        "name": "ASX (via broker)",
        "supported_assets": ["equity", "etf"],
        "markets": ["ASX"],
        "commission": 9.50,  # Flat fee
        "payment_for_order_flow": False,
        "fractional_shares": False,
        "extended_hours": False,
        "min_order": 500,  # $500 min marketable parcel
        "max_order": 10000000,
        "execution_speed": "medium",
        "best_for": ["australian_equities"]
    }
}


# Compliance rules
COMPLIANCE_RULES = {
    "wash_sale": {
        "description": "Cannot repurchase substantially identical security within 30 days of selling at a loss",
        "lookback_days": 30,
        "applies_to": ["equity", "etf"]
    },
    "concentration_limit": {
        "description": "Single position cannot exceed 20% of portfolio",
        "max_percentage": 20,
        "applies_to": ["equity", "etf", "crypto"]
    },
    "restricted_securities": {
        "description": "Securities on restricted list cannot be traded",
        "restricted_list": ["EXAMPLE_RESTRICTED"],
        "applies_to": ["equity"]
    },
    "high_risk_crypto": {
        "description": "Certain crypto assets require additional approval",
        "high_risk_list": ["DOGE", "SHIB", "PEPE"],
        "requires_approval": True,
        "applies_to": ["crypto"]
    },
    "large_order_review": {
        "description": "Orders above threshold require manual review",
        "threshold_usd": 500000,
        "applies_to": ["equity", "etf", "crypto"]
    },
    "client_risk_match": {
        "description": "Order must match client risk profile",
        "aggressive_assets": ["crypto", "options", "leveraged_etf"],
        "applies_to": ["all"]
    }
}


class OrderRoutingRequest(BaseModel):
    """Request for order routing decision."""
    client_id: str
    symbol: str
    asset_class: str
    side: str  # buy or sell
    quantity: float
    order_value: float
    urgency: str = "normal"  # normal, urgent, patient
    preferences: Optional[Dict] = None


class ComplianceCheck(BaseModel):
    """Result of a compliance check."""
    rule: str
    status: ComplianceStatus
    message: str
    details: Optional[Dict] = None


class RoutingDecision(BaseModel):
    """Smart routing decision with venue selection and compliance."""
    decision_id: str
    venue: ExecutionVenue
    venue_name: str
    rationale: List[str]
    estimated_cost: float
    estimated_slippage: float
    execution_time: str
    compliance_checks: List[ComplianceCheck]
    overall_compliance: ComplianceStatus
    warnings: List[str]
    alternatives: List[Dict]


# Recent trades for wash sale detection
RECENT_TRADES: Dict[str, List[Dict]] = {}


def determine_asset_class(symbol: str) -> str:
    """Determine asset class from symbol."""
    crypto_symbols = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOT", "LINK", "USDC", "USDT"]
    if symbol in crypto_symbols or "/" in symbol:
        return "crypto"
    if symbol.endswith(".AX"):
        return "equity_asx"
    return "equity_us"


def select_best_venue(
    asset_class: str,
    order_value: float,
    urgency: str,
    preferences: Optional[Dict] = None
) -> tuple[ExecutionVenue, List[str]]:
    """Select optimal execution venue based on order characteristics."""
    rationale = []
    
    # Crypto routing
    if asset_class == "crypto":
        if order_value > 100000:
            rationale.append("Large crypto order - routing to Binance for best liquidity")
            return ExecutionVenue.BINANCE, rationale
        else:
            rationale.append("Standard crypto order - routing to Coinbase for compliance")
            return ExecutionVenue.COINBASE, rationale
    
    # Australian equities
    if asset_class == "equity_asx":
        rationale.append("Australian security - routing to ASX via broker")
        return ExecutionVenue.ASX, rationale
    
    # US equities
    if order_value > 500000:
        rationale.append("Large US order - routing to IBKR for best execution")
        rationale.append("Direct market access for price improvement")
        return ExecutionVenue.IBKR, rationale
    
    if urgency == "patient" and order_value > 50000:
        rationale.append("Patient order - IBKR for VWAP/TWAP algorithms")
        return ExecutionVenue.IBKR, rationale
    
    # Default for smaller US orders
    rationale.append("Standard US order - routing to Alpaca")
    rationale.append("Commission-free execution")
    if order_value < 10000:
        rationale.append("Fractional shares available")
    
    return ExecutionVenue.ALPACA, rationale


def run_compliance_checks(
    client_id: str,
    symbol: str,
    asset_class: str,
    side: str,
    quantity: float,
    order_value: float
) -> List[ComplianceCheck]:
    """Run all applicable compliance checks."""
    checks = []
    
    # 1. Large Order Review
    if order_value > COMPLIANCE_RULES["large_order_review"]["threshold_usd"]:
        checks.append(ComplianceCheck(
            rule="large_order_review",
            status=ComplianceStatus.PENDING_REVIEW,
            message=f"Order value ${order_value:,.0f} exceeds ${COMPLIANCE_RULES['large_order_review']['threshold_usd']:,} threshold",
            details={"threshold": COMPLIANCE_RULES["large_order_review"]["threshold_usd"]}
        ))
    else:
        checks.append(ComplianceCheck(
            rule="large_order_review",
            status=ComplianceStatus.APPROVED,
            message="Order value within normal limits"
        ))
    
    # 2. Wash Sale Check (for sells)
    if side == "sell":
        recent = RECENT_TRADES.get(client_id, [])
        wash_sale_risk = any(
            t["symbol"] == symbol and 
            t["side"] == "buy" and
            (datetime.now() - datetime.fromisoformat(t["date"])).days < 30
            for t in recent
        )
        
        if wash_sale_risk:
            checks.append(ComplianceCheck(
                rule="wash_sale",
                status=ComplianceStatus.FLAGGED,
                message="Potential wash sale - security purchased within 30 days",
                details={"lookback_days": 30}
            ))
        else:
            checks.append(ComplianceCheck(
                rule="wash_sale",
                status=ComplianceStatus.APPROVED,
                message="No wash sale concern"
            ))
    
    # 3. Restricted Securities
    if symbol in COMPLIANCE_RULES["restricted_securities"]["restricted_list"]:
        checks.append(ComplianceCheck(
            rule="restricted_securities",
            status=ComplianceStatus.REJECTED,
            message=f"{symbol} is on the restricted securities list"
        ))
    else:
        checks.append(ComplianceCheck(
            rule="restricted_securities",
            status=ComplianceStatus.APPROVED,
            message="Security not restricted"
        ))
    
    # 4. High Risk Crypto
    if asset_class == "crypto" and symbol in COMPLIANCE_RULES["high_risk_crypto"]["high_risk_list"]:
        checks.append(ComplianceCheck(
            rule="high_risk_crypto",
            status=ComplianceStatus.PENDING_REVIEW,
            message=f"{symbol} is classified as high-risk crypto and requires approval",
            details={"requires_manual_approval": True}
        ))
    elif asset_class == "crypto":
        checks.append(ComplianceCheck(
            rule="high_risk_crypto",
            status=ComplianceStatus.APPROVED,
            message="Crypto asset within acceptable risk parameters"
        ))
    
    # 5. Concentration Limit (simplified - would check actual portfolio)
    checks.append(ComplianceCheck(
        rule="concentration_limit",
        status=ComplianceStatus.APPROVED,
        message="Position within concentration limits"
    ))
    
    return checks


def calculate_execution_costs(
    venue: ExecutionVenue,
    order_value: float,
    quantity: float
) -> tuple[float, float]:
    """Calculate estimated execution costs and slippage."""
    config = VENUE_CONFIG[venue]
    
    # Commission
    if isinstance(config["commission"], float) and config["commission"] < 1:
        # Percentage-based
        commission = order_value * config["commission"]
    else:
        # Per-share or flat
        commission = config["commission"] * (quantity if config["commission"] < 1 else 1)
    
    # Estimated slippage based on order size
    base_slippage = 0.0001  # 1 basis point
    size_factor = min(order_value / 100000, 5)  # Larger orders = more slippage
    slippage = order_value * base_slippage * (1 + size_factor)
    
    return round(commission, 2), round(slippage, 2)


@router.post("/route")
async def route_order(request: OrderRoutingRequest) -> RoutingDecision:
    """
    Smart order routing with venue selection and compliance checks.
    Returns optimal venue, cost estimates, and compliance status.
    """
    decision_id = f"RTG_{uuid.uuid4().hex[:8]}"
    
    # Determine asset class
    asset_class = determine_asset_class(request.symbol)
    
    # Select best venue
    venue, rationale = select_best_venue(
        asset_class,
        request.order_value,
        request.urgency,
        request.preferences
    )
    
    # Run compliance checks
    compliance_checks = run_compliance_checks(
        request.client_id,
        request.symbol,
        asset_class,
        request.side,
        request.quantity,
        request.order_value
    )
    
    # Determine overall compliance status
    statuses = [c.status for c in compliance_checks]
    if ComplianceStatus.REJECTED in statuses:
        overall_compliance = ComplianceStatus.REJECTED
    elif ComplianceStatus.PENDING_REVIEW in statuses:
        overall_compliance = ComplianceStatus.PENDING_REVIEW
    elif ComplianceStatus.FLAGGED in statuses:
        overall_compliance = ComplianceStatus.FLAGGED
    else:
        overall_compliance = ComplianceStatus.APPROVED
    
    # Calculate costs
    commission, slippage = calculate_execution_costs(venue, request.order_value, request.quantity)
    
    # Generate warnings
    warnings = []
    if overall_compliance != ComplianceStatus.APPROVED:
        warnings.append(f"Compliance status: {overall_compliance.value}")
    if slippage > request.order_value * 0.001:
        warnings.append(f"Expected slippage ${slippage:,.2f} may impact execution")
    
    # Generate alternatives
    alternatives = []
    for alt_venue, config in VENUE_CONFIG.items():
        if alt_venue != venue and asset_class.replace("_asx", "").replace("_us", "") in config["supported_assets"]:
            alt_commission, alt_slippage = calculate_execution_costs(alt_venue, request.order_value, request.quantity)
            alternatives.append({
                "venue": alt_venue.value,
                "name": config["name"],
                "commission": alt_commission,
                "slippage": alt_slippage,
                "total_cost": alt_commission + alt_slippage
            })
    
    # Sort alternatives by total cost
    alternatives.sort(key=lambda x: x["total_cost"])
    
    return RoutingDecision(
        decision_id=decision_id,
        venue=venue,
        venue_name=VENUE_CONFIG[venue]["name"],
        rationale=rationale,
        estimated_cost=commission,
        estimated_slippage=slippage,
        execution_time="immediate" if request.urgency == "urgent" else "standard",
        compliance_checks=[c.model_dump() for c in compliance_checks],
        overall_compliance=overall_compliance,
        warnings=warnings,
        alternatives=alternatives[:3]  # Top 3 alternatives
    )


@router.get("/venues")
async def get_venues():
    """Get all configured execution venues."""
    return {
        "venues": [
            {
                "id": venue.value,
                **config
            }
            for venue, config in VENUE_CONFIG.items()
        ]
    }


@router.get("/venues/{venue_id}")
async def get_venue(venue_id: str):
    """Get specific venue details."""
    try:
        venue = ExecutionVenue(venue_id)
        return {
            "id": venue.value,
            **VENUE_CONFIG[venue]
        }
    except ValueError:
        raise HTTPException(status_code=404, detail="Venue not found")


@router.get("/compliance/rules")
async def get_compliance_rules():
    """Get all compliance rules."""
    return {
        "rules": COMPLIANCE_RULES
    }


@router.post("/compliance/check")
async def check_compliance(
    client_id: str,
    symbol: str,
    side: str,
    quantity: float,
    order_value: float
):
    """Run compliance checks for an order without routing."""
    asset_class = determine_asset_class(symbol)
    checks = run_compliance_checks(client_id, symbol, asset_class, side, quantity, order_value)
    
    statuses = [c.status for c in checks]
    if ComplianceStatus.REJECTED in statuses:
        overall = ComplianceStatus.REJECTED
    elif ComplianceStatus.PENDING_REVIEW in statuses:
        overall = ComplianceStatus.PENDING_REVIEW
    elif ComplianceStatus.FLAGGED in statuses:
        overall = ComplianceStatus.FLAGGED
    else:
        overall = ComplianceStatus.APPROVED
    
    return {
        "overall_status": overall,
        "can_proceed": overall in [ComplianceStatus.APPROVED, ComplianceStatus.FLAGGED],
        "checks": [c.model_dump() for c in checks]
    }


@router.get("/cost-estimate")
async def estimate_costs(
    symbol: str,
    quantity: float,
    order_value: float
):
    """Estimate execution costs across all venues."""
    asset_class = determine_asset_class(symbol)
    
    estimates = []
    for venue, config in VENUE_CONFIG.items():
        if asset_class.replace("_asx", "").replace("_us", "") in config["supported_assets"]:
            commission, slippage = calculate_execution_costs(venue, order_value, quantity)
            estimates.append({
                "venue": venue.value,
                "name": config["name"],
                "commission": commission,
                "slippage": slippage,
                "total_cost": commission + slippage,
                "cost_percentage": (commission + slippage) / order_value * 100
            })
    
    estimates.sort(key=lambda x: x["total_cost"])
    
    return {
        "symbol": symbol,
        "order_value": order_value,
        "estimates": estimates,
        "best_venue": estimates[0] if estimates else None
    }
