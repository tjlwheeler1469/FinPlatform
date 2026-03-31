"""
Revenue Layer - AUM Fees, Trading Fees, Subscription Billing
Complete monetization engine for the platform.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/revenue", tags=["Revenue Layer"])


class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class FeeType(str, Enum):
    AUM = "aum"
    TRADING = "trading"
    SUBSCRIPTION = "subscription"
    PLATFORM = "platform"
    PERFORMANCE = "performance"
    ADVISORY = "advisory"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    FAILED = "failed"
    WAIVED = "waived"


# Fee schedules
FEE_SCHEDULES = {
    "standard_aum": {
        "id": "standard_aum",
        "name": "Standard AUM Fee",
        "type": FeeType.AUM,
        "tiers": [
            {"min": 0, "max": 500000, "rate": 1.25},           # 1.25% for first $500k
            {"min": 500000, "max": 1000000, "rate": 1.00},     # 1.00% for $500k-$1M
            {"min": 1000000, "max": 2500000, "rate": 0.85},    # 0.85% for $1M-$2.5M
            {"min": 2500000, "max": 5000000, "rate": 0.70},    # 0.70% for $2.5M-$5M
            {"min": 5000000, "max": 999999999, "rate": 0.50}   # 0.50% for $5M+
        ],
        "billing_cycle": BillingCycle.QUARTERLY,
        "minimum_fee": 500
    },
    "premium_aum": {
        "id": "premium_aum",
        "name": "Premium Advisory Fee",
        "type": FeeType.AUM,
        "tiers": [
            {"min": 0, "max": 1000000, "rate": 0.95},
            {"min": 1000000, "max": 5000000, "rate": 0.75},
            {"min": 5000000, "max": 999999999, "rate": 0.50}
        ],
        "billing_cycle": BillingCycle.QUARTERLY,
        "minimum_fee": 1000,
        "includes": ["tax_optimization", "estate_planning", "priority_support"]
    },
    "trading_commission": {
        "id": "trading_commission",
        "name": "Trading Commission",
        "type": FeeType.TRADING,
        "rates": {
            "equity_au": {"flat": 9.50, "percent": 0},
            "equity_us": {"flat": 0, "percent": 0},  # Commission-free via Alpaca
            "etf": {"flat": 0, "percent": 0},
            "crypto": {"flat": 0, "percent": 0.10},
            "fx": {"flat": 0, "percent": 0.005}
        }
    },
    "performance_fee": {
        "id": "performance_fee",
        "name": "Performance Fee",
        "type": FeeType.PERFORMANCE,
        "rate": 10,  # 10% of outperformance
        "hurdle_rate": 5,  # 5% benchmark
        "high_water_mark": True,
        "billing_cycle": BillingCycle.ANNUAL
    }
}


# Subscription plans
SUBSCRIPTION_PLANS = {
    "starter": {
        "id": "starter",
        "name": "Starter",
        "price_monthly": 99,
        "price_annual": 990,
        "features": {
            "max_clients": 50,
            "max_users": 2,
            "max_aum": 25000000,
            "ai_copilot": True,
            "next_best_action": True,
            "practice_health": True,
            "trading": False,
            "crypto": False,
            "api_access": False,
            "white_label": False,
            "support": "email"
        },
        "trial_days": 14
    },
    "professional": {
        "id": "professional",
        "name": "Professional",
        "price_monthly": 299,
        "price_annual": 2990,
        "features": {
            "max_clients": 200,
            "max_users": 5,
            "max_aum": 100000000,
            "ai_copilot": True,
            "next_best_action": True,
            "practice_health": True,
            "trading": True,
            "crypto": True,
            "api_access": False,
            "white_label": False,
            "support": "priority"
        },
        "trial_days": 14
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise",
        "price_monthly": 999,
        "price_annual": 9990,
        "features": {
            "max_clients": -1,  # Unlimited
            "max_users": -1,
            "max_aum": -1,
            "ai_copilot": True,
            "next_best_action": True,
            "practice_health": True,
            "trading": True,
            "crypto": True,
            "api_access": True,
            "white_label": True,
            "support": "dedicated"
        },
        "trial_days": 30
    }
}


# Client fee assignments
CLIENT_FEE_ASSIGNMENTS: Dict[str, Dict] = {
    "client_1": {
        "client_id": "client_1",
        "client_name": "Wheeler Family",
        "fee_schedule": "standard_aum",
        "aum": 920000,
        "discount_percent": 0,
        "billing_start": "2024-01-01",
        "last_billed": "2025-01-01",
        "ytd_fees": 8625,
        "outstanding": 0
    },
    "client_2": {
        "client_id": "client_2",
        "client_name": "Chen Investment Trust",
        "fee_schedule": "premium_aum",
        "aum": 4200000,
        "discount_percent": 10,
        "billing_start": "2023-06-15",
        "last_billed": "2025-01-01",
        "ytd_fees": 28350,
        "outstanding": 0
    },
    "client_4": {
        "client_id": "client_4",
        "client_name": "Patel Holdings",
        "fee_schedule": "premium_aum",
        "aum": 7500000,
        "discount_percent": 15,
        "billing_start": "2022-03-01",
        "last_billed": "2025-01-01",
        "ytd_fees": 42500,
        "outstanding": 0
    }
}


# Invoice storage
INVOICES: Dict[str, Dict] = {}


def calculate_tiered_fee(aum: float, tiers: List[Dict]) -> float:
    """Calculate fee using tiered structure."""
    total_fee = 0
    remaining = aum
    
    for tier in sorted(tiers, key=lambda x: x["min"]):
        tier_min = tier["min"]
        tier_max = tier["max"]
        rate = tier["rate"] / 100  # Convert percentage to decimal
        
        if remaining <= 0:
            break
        
        tier_amount = min(remaining, tier_max - tier_min)
        if tier_amount > 0:
            total_fee += tier_amount * rate
            remaining -= tier_amount
    
    return round(total_fee, 2)


def calculate_trading_fee(asset_class: str, trade_value: float) -> float:
    """Calculate trading commission."""
    rates = FEE_SCHEDULES["trading_commission"]["rates"]
    
    if asset_class not in rates:
        asset_class = "equity_us"
    
    rate = rates[asset_class]
    fee = rate["flat"] + (trade_value * rate["percent"] / 100)
    return round(fee, 2)


def generate_invoice(client_id: str, period_start: str, period_end: str) -> Dict:
    """Generate an invoice for a client."""
    if client_id not in CLIENT_FEE_ASSIGNMENTS:
        return None
    
    client = CLIENT_FEE_ASSIGNMENTS[client_id]
    schedule = FEE_SCHEDULES.get(client["fee_schedule"])
    
    if not schedule:
        return None
    
    # Calculate base fee
    if schedule["type"] == FeeType.AUM:
        base_fee = calculate_tiered_fee(client["aum"], schedule["tiers"])
        # Quarterly billing = annual fee / 4
        period_fee = base_fee / 4
    else:
        period_fee = 0
    
    # Apply discount
    discount = period_fee * client.get("discount_percent", 0) / 100
    net_fee = period_fee - discount
    
    # Apply minimum
    minimum = schedule.get("minimum_fee", 0) / 4  # Quarterly minimum
    if net_fee < minimum:
        net_fee = minimum
    
    # GST (Australian)
    gst = net_fee * 0.10
    total = net_fee + gst
    
    invoice = {
        "invoice_id": f"INV_{uuid.uuid4().hex[:8]}",
        "client_id": client_id,
        "client_name": client["client_name"],
        "period_start": period_start,
        "period_end": period_end,
        "aum_at_period_end": client["aum"],
        "fee_schedule": client["fee_schedule"],
        "line_items": [
            {
                "description": f"{schedule['name']} - Q1 2025",
                "amount": round(period_fee, 2)
            }
        ],
        "subtotal": round(period_fee, 2),
        "discount": round(discount, 2),
        "discount_percent": client.get("discount_percent", 0),
        "net_amount": round(net_fee, 2),
        "gst": round(gst, 2),
        "total": round(total, 2),
        "currency": "AUD",
        "status": PaymentStatus.PENDING,
        "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    INVOICES[invoice["invoice_id"]] = invoice
    return invoice


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_revenue_status() -> dict:
    """Get revenue system status."""
    total_arr = sum(
        calculate_tiered_fee(c["aum"], FEE_SCHEDULES[c["fee_schedule"]]["tiers"])
        for c in CLIENT_FEE_ASSIGNMENTS.values()
        if c["fee_schedule"] in FEE_SCHEDULES
    )
    
    return {
        "status": "operational",
        "total_clients_billed": len(CLIENT_FEE_ASSIGNMENTS),
        "total_arr": round(total_arr, 2),
        "total_mrr": round(total_arr / 12, 2),
        "fee_schedules": len(FEE_SCHEDULES),
        "subscription_plans": len(SUBSCRIPTION_PLANS),
        "outstanding_invoices": len([i for i in INVOICES.values() if i["status"] == PaymentStatus.PENDING])
    }


@router.get("/fee-schedules")
async def get_fee_schedules() -> dict:
    """Get all fee schedules."""
    return {
        "schedules": list(FEE_SCHEDULES.values())
    }


@router.get("/fee-schedules/{schedule_id}")
async def get_fee_schedule(schedule_id: str) -> dict:
    """Get specific fee schedule."""
    if schedule_id not in FEE_SCHEDULES:
        raise HTTPException(status_code=404, detail="Fee schedule not found")
    return FEE_SCHEDULES[schedule_id]


@router.get("/subscription-plans")
async def get_subscription_plans() -> dict:
    """Get all subscription plans."""
    return {
        "plans": list(SUBSCRIPTION_PLANS.values()),
        "currency": "AUD"
    }


@router.get("/client/{client_id}/fees")
async def get_client_fees(client_id: str) -> dict:
    """Get client fee assignment and history."""
    if client_id not in CLIENT_FEE_ASSIGNMENTS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_FEE_ASSIGNMENTS[client_id]
    schedule = FEE_SCHEDULES.get(client["fee_schedule"])
    
    # Calculate current annual fee
    annual_fee = 0
    if schedule and schedule["type"] == FeeType.AUM:
        annual_fee = calculate_tiered_fee(client["aum"], schedule["tiers"])
    
    # Apply discount
    discount = annual_fee * client.get("discount_percent", 0) / 100
    net_annual = annual_fee - discount
    
    return {
        "client_id": client_id,
        "client_name": client["client_name"],
        "fee_schedule": client["fee_schedule"],
        "schedule_name": schedule["name"] if schedule else "Unknown",
        "current_aum": client["aum"],
        "annual_fee_gross": round(annual_fee, 2),
        "discount_percent": client.get("discount_percent", 0),
        "discount_amount": round(discount, 2),
        "annual_fee_net": round(net_annual, 2),
        "quarterly_fee": round(net_annual / 4, 2),
        "monthly_fee": round(net_annual / 12, 2),
        "effective_rate": round(net_annual / client["aum"] * 100, 3) if client["aum"] > 0 else 0,
        "ytd_fees_collected": client["ytd_fees"],
        "outstanding": client["outstanding"],
        "billing_start": client["billing_start"],
        "last_billed": client["last_billed"]
    }


@router.post("/client/{client_id}/assign-schedule")
async def assign_fee_schedule(client_id: str, schedule_id: str, discount_percent: float = 0) -> dict:
    """Assign a fee schedule to a client."""
    if schedule_id not in FEE_SCHEDULES:
        raise HTTPException(status_code=404, detail="Fee schedule not found")
    
    if client_id not in CLIENT_FEE_ASSIGNMENTS:
        CLIENT_FEE_ASSIGNMENTS[client_id] = {
            "client_id": client_id,
            "client_name": f"Client {client_id}",
            "aum": 0,
            "ytd_fees": 0,
            "outstanding": 0,
            "billing_start": datetime.now().strftime("%Y-%m-%d"),
            "last_billed": None
        }
    
    CLIENT_FEE_ASSIGNMENTS[client_id]["fee_schedule"] = schedule_id
    CLIENT_FEE_ASSIGNMENTS[client_id]["discount_percent"] = min(discount_percent, 50)  # Max 50% discount
    
    return {
        "success": True,
        "client_id": client_id,
        "schedule_id": schedule_id,
        "discount_percent": discount_percent
    }


@router.post("/calculate-fee")
async def calculate_fee(
    aum: float,
    schedule_id: str = "standard_aum",
    discount_percent: float = 0
) -> dict:
    """Calculate fee for given AUM and schedule."""
    if schedule_id not in FEE_SCHEDULES:
        raise HTTPException(status_code=404, detail="Fee schedule not found")
    
    schedule = FEE_SCHEDULES[schedule_id]
    
    if schedule["type"] != FeeType.AUM:
        raise HTTPException(status_code=400, detail="Schedule is not AUM-based")
    
    annual_fee = calculate_tiered_fee(aum, schedule["tiers"])
    discount = annual_fee * discount_percent / 100
    net_fee = annual_fee - discount
    
    return {
        "aum": aum,
        "schedule": schedule_id,
        "annual_fee_gross": round(annual_fee, 2),
        "discount_percent": discount_percent,
        "discount_amount": round(discount, 2),
        "annual_fee_net": round(net_fee, 2),
        "quarterly_fee": round(net_fee / 4, 2),
        "monthly_fee": round(net_fee / 12, 2),
        "effective_rate": round(net_fee / aum * 100, 3) if aum > 0 else 0,
        "breakdown": [
            {
                "tier": f"${tier['min']:,} - ${tier['max']:,}" if tier['max'] < 999999999 else f"${tier['min']:,}+",
                "rate": f"{tier['rate']}%",
                "amount_in_tier": min(max(0, aum - tier['min']), tier['max'] - tier['min']),
                "fee": round(min(max(0, aum - tier['min']), tier['max'] - tier['min']) * tier['rate'] / 100, 2)
            }
            for tier in schedule["tiers"]
        ]
    }


@router.post("/calculate-trading-fee")
async def calculate_trading_fee_endpoint(asset_class: str, trade_value: float) -> dict:
    """Calculate trading commission."""
    fee = calculate_trading_fee(asset_class, trade_value)
    
    return {
        "asset_class": asset_class,
        "trade_value": trade_value,
        "commission": fee,
        "net_value": trade_value - fee
    }


@router.post("/invoice/generate/{client_id}")
async def generate_client_invoice(client_id: str, period_start: str, period_end: str) -> dict:
    """Generate an invoice for a client."""
    invoice = generate_invoice(client_id, period_start, period_end)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Client or fee schedule not found")
    
    return invoice


@router.get("/invoices")
async def get_invoices(
    client_id: Optional[str] = None,
    status: Optional[PaymentStatus] = None
) -> dict:
    """Get all invoices."""
    invoices = list(INVOICES.values())
    
    if client_id:
        invoices = [i for i in invoices if i["client_id"] == client_id]
    if status:
        invoices = [i for i in invoices if i["status"] == status]
    
    return {
        "invoices": invoices,
        "total": len(invoices),
        "total_outstanding": sum(i["total"] for i in invoices if i["status"] == PaymentStatus.PENDING)
    }


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str) -> dict:
    """Get specific invoice."""
    if invoice_id not in INVOICES:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return INVOICES[invoice_id]


@router.post("/invoices/{invoice_id}/pay")
async def mark_invoice_paid(invoice_id: str, payment_method: str = "bank_transfer") -> dict:
    """Mark an invoice as paid."""
    if invoice_id not in INVOICES:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    INVOICES[invoice_id]["status"] = PaymentStatus.PAID
    INVOICES[invoice_id]["paid_at"] = datetime.now(timezone.utc).isoformat()
    INVOICES[invoice_id]["payment_method"] = payment_method
    
    # Update client YTD
    client_id = INVOICES[invoice_id]["client_id"]
    if client_id in CLIENT_FEE_ASSIGNMENTS:
        CLIENT_FEE_ASSIGNMENTS[client_id]["ytd_fees"] += INVOICES[invoice_id]["total"]
        CLIENT_FEE_ASSIGNMENTS[client_id]["last_billed"] = datetime.now().strftime("%Y-%m-%d")
    
    return {
        "success": True,
        "invoice_id": invoice_id,
        "status": PaymentStatus.PAID
    }


@router.get("/revenue-report")
async def get_revenue_report(year: int = 2025) -> dict:
    """Get comprehensive revenue report."""
    # Calculate totals
    total_aum = sum(c["aum"] for c in CLIENT_FEE_ASSIGNMENTS.values())
    total_arr = sum(
        calculate_tiered_fee(c["aum"], FEE_SCHEDULES[c["fee_schedule"]]["tiers"])
        for c in CLIENT_FEE_ASSIGNMENTS.values()
        if c["fee_schedule"] in FEE_SCHEDULES
    )
    ytd_collected = sum(c["ytd_fees"] for c in CLIENT_FEE_ASSIGNMENTS.values())
    
    # Revenue by client segment
    by_segment = {
        "high_value": {"clients": 0, "aum": 0, "arr": 0},
        "core": {"clients": 0, "aum": 0, "arr": 0},
        "emerging": {"clients": 0, "aum": 0, "arr": 0}
    }
    
    for client in CLIENT_FEE_ASSIGNMENTS.values():
        aum = client["aum"]
        schedule = FEE_SCHEDULES.get(client["fee_schedule"])
        arr = calculate_tiered_fee(aum, schedule["tiers"]) if schedule else 0
        
        if aum >= 2000000:
            by_segment["high_value"]["clients"] += 1
            by_segment["high_value"]["aum"] += aum
            by_segment["high_value"]["arr"] += arr
        elif aum >= 500000:
            by_segment["core"]["clients"] += 1
            by_segment["core"]["aum"] += aum
            by_segment["core"]["arr"] += arr
        else:
            by_segment["emerging"]["clients"] += 1
            by_segment["emerging"]["aum"] += aum
            by_segment["emerging"]["arr"] += arr
    
    return {
        "year": year,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_aum": round(total_aum, 2),
            "total_arr": round(total_arr, 2),
            "total_mrr": round(total_arr / 12, 2),
            "ytd_collected": round(ytd_collected, 2),
            "ytd_outstanding": round(total_arr / 4 - ytd_collected, 2),  # Assumes Q1
            "average_fee_rate": round(total_arr / total_aum * 100, 3) if total_aum > 0 else 0,
            "revenue_per_client": round(total_arr / len(CLIENT_FEE_ASSIGNMENTS), 2) if CLIENT_FEE_ASSIGNMENTS else 0
        },
        "by_segment": by_segment,
        "growth": {
            "arr_growth_yoy": 15.2,  # Would calculate from historical
            "aum_growth_yoy": 12.8,
            "client_growth_yoy": 8.5
        },
        "projections": {
            "q2_revenue": round(total_arr / 4, 2),
            "q3_revenue": round(total_arr / 4, 2),
            "q4_revenue": round(total_arr / 4, 2),
            "full_year": round(total_arr, 2)
        }
    }
