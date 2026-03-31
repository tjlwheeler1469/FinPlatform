"""
Transaction Modeling Routes
"What-If" Scenario Builder for Financial Advisers
Model transactions (property, funds, stocks) and see impact on client portfolios.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/transaction-modeling", tags=["Transaction Modeling"])


# ============= DATA MODELS =============

class PropertyTransaction(BaseModel):
    """Model a property purchase/sale"""
    transaction_type: str  # "buy" or "sell"
    property_value: float
    deposit_percent: float = 20.0
    loan_interest_rate: float = 6.5
    loan_term_years: int = 30
    expected_rental_yield: float = 4.0
    expected_capital_growth: float = 5.0
    stamp_duty_rate: float = 4.5
    annual_expenses_rate: float = 1.5  # As % of property value


class FundTransaction(BaseModel):
    """Model a managed fund investment"""
    transaction_type: str  # "buy" or "sell"
    fund_name: str
    amount: float
    expected_return: float = 7.0
    management_fee: float = 0.85
    distribution_yield: float = 3.5


class StockTransaction(BaseModel):
    """Model a stock trade"""
    transaction_type: str  # "buy" or "sell"
    symbol: str
    shares: int
    price_per_share: float
    purchase_date: Optional[str] = None  # For CGT calculation on sells
    purchase_price: Optional[float] = None  # Original purchase price for sells


class TransactionModelRequest(BaseModel):
    """Full transaction modeling request"""
    client_id: str
    transactions: List[Dict[str, Any]]
    projection_years: int = 10


# ============= HELPER FUNCTIONS =============

def calculate_stamp_duty(property_value: float, state: str = "NSW") -> float:
    """Calculate stamp duty based on property value and state."""
    # NSW rates (simplified)
    if property_value <= 14000:
        return property_value * 0.0125
    elif property_value <= 32000:
        return 175 + (property_value - 14000) * 0.015
    elif property_value <= 85000:
        return 445 + (property_value - 32000) * 0.0175
    elif property_value <= 310000:
        return 1372.50 + (property_value - 85000) * 0.035
    elif property_value <= 1033000:
        return 9247.50 + (property_value - 310000) * 0.045
    else:
        return 41797.50 + (property_value - 1033000) * 0.055


def calculate_cgt(gain: float, holding_period_days: int, marginal_tax_rate: float = 0.39) -> Dict:
    """Calculate Capital Gains Tax with 50% discount if held > 12 months."""
    cgt_discount_eligible = holding_period_days >= 365
    
    if cgt_discount_eligible:
        taxable_gain = gain * 0.5  # 50% CGT discount
    else:
        taxable_gain = gain
    
    tax_payable = taxable_gain * marginal_tax_rate
    
    return {
        "gross_gain": round(gain, 2),
        "cgt_discount_eligible": cgt_discount_eligible,
        "cgt_discount_applied": round(gain * 0.5, 2) if cgt_discount_eligible else 0,
        "taxable_gain": round(taxable_gain, 2),
        "tax_payable": round(tax_payable, 2),
        "effective_tax_rate": round((tax_payable / gain) * 100, 1) if gain > 0 else 0
    }


def project_value(initial: float, annual_rate: float, years: int) -> List[Dict]:
    """Project value over time with given growth rate."""
    projections = []
    value = initial
    
    for year in range(years + 1):
        projections.append({
            "year": year,
            "value": round(value, 2),
            "growth": round(value - initial, 2)
        })
        value *= (1 + annual_rate / 100)
    
    return projections


def calculate_loan_repayment(principal: float, annual_rate: float, years: int) -> Dict:
    """Calculate monthly loan repayment and total interest."""
    monthly_rate = annual_rate / 100 / 12
    num_payments = years * 12
    
    if monthly_rate > 0:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    else:
        monthly_payment = principal / num_payments
    
    total_paid = monthly_payment * num_payments
    total_interest = total_paid - principal
    
    return {
        "monthly_payment": round(monthly_payment, 2),
        "annual_payment": round(monthly_payment * 12, 2),
        "total_interest": round(total_interest, 2),
        "total_paid": round(total_paid, 2)
    }


# ============= ENDPOINTS =============

@router.post("/property")
async def model_property_transaction(
    client_id: str,
    transaction: PropertyTransaction
) -> Dict:
    """
    Model a property purchase or sale.
    Returns comprehensive impact analysis including:
    - Cash flow impact
    - Loan calculations
    - Rental income projections
    - Capital growth projections
    - Tax implications
    """
    result = {
        "client_id": client_id,
        "transaction_type": transaction.transaction_type,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if transaction.transaction_type == "buy":
        # Calculate purchase costs
        deposit = transaction.property_value * (transaction.deposit_percent / 100)
        loan_amount = transaction.property_value - deposit
        stamp_duty = calculate_stamp_duty(transaction.property_value)
        legal_fees = 2500  # Estimated
        other_costs = transaction.property_value * 0.005  # Building/pest, etc.
        
        total_upfront = deposit + stamp_duty + legal_fees + other_costs
        
        # Calculate loan repayments
        loan_details = calculate_loan_repayment(
            loan_amount, 
            transaction.loan_interest_rate, 
            transaction.loan_term_years
        )
        
        # Calculate rental income
        annual_rental = transaction.property_value * (transaction.expected_rental_yield / 100)
        annual_expenses = transaction.property_value * (transaction.annual_expenses_rate / 100)
        net_rental = annual_rental - annual_expenses
        
        # Cash flow analysis
        annual_loan_payment = loan_details["annual_payment"]
        annual_cashflow = net_rental - annual_loan_payment
        
        # 10-year projection
        projections = []
        property_value = transaction.property_value
        
        for year in range(11):
            projections.append({
                "year": year,
                "property_value": round(property_value, 0),
                "loan_balance": round(loan_amount * (1 - year / transaction.loan_term_years), 0) if year <= transaction.loan_term_years else 0,
                "equity": round(property_value - loan_amount * (1 - year / transaction.loan_term_years), 0),
                "cumulative_rental": round(net_rental * year, 0),
                "total_return": round(property_value - transaction.property_value + net_rental * year, 0)
            })
            property_value *= (1 + transaction.expected_capital_growth / 100)
        
        result["analysis"] = {
            "purchase_costs": {
                "property_value": transaction.property_value,
                "deposit": round(deposit, 2),
                "deposit_percent": transaction.deposit_percent,
                "loan_amount": round(loan_amount, 2),
                "stamp_duty": round(stamp_duty, 2),
                "legal_fees": legal_fees,
                "other_costs": round(other_costs, 2),
                "total_upfront_cost": round(total_upfront, 2)
            },
            "loan_details": loan_details,
            "rental_analysis": {
                "gross_rental": round(annual_rental, 2),
                "annual_expenses": round(annual_expenses, 2),
                "net_rental": round(net_rental, 2),
                "rental_yield_net": round((net_rental / transaction.property_value) * 100, 2)
            },
            "cash_flow": {
                "annual_rental_income": round(net_rental, 2),
                "annual_loan_payment": round(annual_loan_payment, 2),
                "net_annual_cashflow": round(annual_cashflow, 2),
                "monthly_cashflow": round(annual_cashflow / 12, 2),
                "is_positively_geared": annual_cashflow > 0
            },
            "tax_benefits": {
                "negative_gearing_deduction": round(abs(annual_cashflow), 2) if annual_cashflow < 0 else 0,
                "estimated_tax_benefit": round(abs(annual_cashflow) * 0.39, 2) if annual_cashflow < 0 else 0,
                "depreciation_estimate": round(transaction.property_value * 0.025, 2)  # 2.5% building depreciation
            },
            "projections": projections,
            "summary": {
                "10_year_capital_growth": round(projections[10]["property_value"] - transaction.property_value, 0),
                "10_year_rental_income": round(net_rental * 10, 0),
                "10_year_total_return": round(projections[10]["total_return"], 0),
                "roi_10_year": round((projections[10]["total_return"] / total_upfront) * 100, 1)
            }
        }
        
    else:  # sell
        # For selling, we'd need existing property data
        result["analysis"] = {
            "message": "Property sale modeling requires existing property data",
            "cgt_estimate": "CGT will apply based on holding period and gain"
        }
    
    return result


@router.post("/fund")
async def model_fund_transaction(
    client_id: str,
    transaction: FundTransaction
) -> Dict:
    """
    Model a managed fund investment or redemption.
    Returns impact analysis including:
    - Fee impact
    - Distribution projections
    - Growth projections
    - Tax implications
    """
    result = {
        "client_id": client_id,
        "transaction_type": transaction.transaction_type,
        "fund_name": transaction.fund_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if transaction.transaction_type == "buy":
        # Calculate fees
        annual_fee = transaction.amount * (transaction.management_fee / 100)
        
        # Calculate distributions
        annual_distribution = transaction.amount * (transaction.distribution_yield / 100)
        
        # Net return after fees
        gross_return = transaction.expected_return
        net_return = gross_return - transaction.management_fee
        
        # 10-year projection
        projections = []
        value = transaction.amount
        total_distributions = 0
        
        for year in range(11):
            distribution = value * (transaction.distribution_yield / 100)
            total_distributions += distribution
            
            projections.append({
                "year": year,
                "fund_value": round(value, 0),
                "annual_distribution": round(distribution, 0),
                "cumulative_distributions": round(total_distributions, 0),
                "total_value": round(value + total_distributions, 0)
            })
            
            # Growth net of fees
            value *= (1 + net_return / 100)
        
        result["analysis"] = {
            "investment_details": {
                "initial_investment": transaction.amount,
                "fund_name": transaction.fund_name,
                "expected_return": transaction.expected_return,
                "management_fee": transaction.management_fee,
                "distribution_yield": transaction.distribution_yield
            },
            "annual_analysis": {
                "gross_return_rate": gross_return,
                "net_return_rate": round(net_return, 2),
                "annual_fee_dollar": round(annual_fee, 2),
                "annual_distribution": round(annual_distribution, 2)
            },
            "projections": projections,
            "summary": {
                "10_year_fund_value": round(projections[10]["fund_value"], 0),
                "10_year_distributions": round(total_distributions, 0),
                "10_year_total_value": round(projections[10]["total_value"], 0),
                "10_year_total_return": round(projections[10]["total_value"] - transaction.amount, 0),
                "10_year_roi": round(((projections[10]["total_value"] - transaction.amount) / transaction.amount) * 100, 1)
            }
        }
        
    else:  # sell/redeem
        result["analysis"] = {
            "message": "Fund redemption modeling requires existing holding data",
            "note": "CGT may apply based on holding period and cost base"
        }
    
    return result


@router.post("/stock")
async def model_stock_transaction(
    client_id: str,
    transaction: StockTransaction
) -> Dict:
    """
    Model a stock trade.
    For sells, calculates CGT implications.
    For buys, shows projected returns.
    """
    result = {
        "client_id": client_id,
        "transaction_type": transaction.transaction_type,
        "symbol": transaction.symbol,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    trade_value = transaction.shares * transaction.price_per_share
    brokerage = max(10, trade_value * 0.001)  # $10 minimum or 0.1%
    
    if transaction.transaction_type == "buy":
        total_cost = trade_value + brokerage
        
        # Project with different growth scenarios
        scenarios = {
            "conservative": 5.0,
            "moderate": 8.0,
            "aggressive": 12.0
        }
        
        projections = {}
        for scenario, growth_rate in scenarios.items():
            scenario_projections = []
            value = trade_value
            
            for year in range(6):  # 5 year projection
                scenario_projections.append({
                    "year": year,
                    "value": round(value, 0),
                    "gain": round(value - trade_value, 0),
                    "gain_percent": round(((value - trade_value) / trade_value) * 100, 1)
                })
                value *= (1 + growth_rate / 100)
            
            projections[scenario] = scenario_projections
        
        result["analysis"] = {
            "trade_details": {
                "symbol": transaction.symbol,
                "shares": transaction.shares,
                "price_per_share": transaction.price_per_share,
                "trade_value": round(trade_value, 2),
                "brokerage": round(brokerage, 2),
                "total_cost": round(total_cost, 2)
            },
            "projections": projections,
            "summary": {
                "5_year_conservative": projections["conservative"][5],
                "5_year_moderate": projections["moderate"][5],
                "5_year_aggressive": projections["aggressive"][5]
            }
        }
        
    else:  # sell
        if not transaction.purchase_price or not transaction.purchase_date:
            raise HTTPException(
                status_code=400, 
                detail="Purchase price and date required for CGT calculation"
            )
        
        # Calculate gain
        cost_base = transaction.shares * transaction.purchase_price
        sale_proceeds = trade_value - brokerage
        gain = sale_proceeds - cost_base
        
        # Calculate holding period
        purchase_date = datetime.strptime(transaction.purchase_date, "%Y-%m-%d")
        holding_days = (datetime.now() - purchase_date).days
        
        # Calculate CGT
        cgt_result = calculate_cgt(gain, holding_days) if gain > 0 else None
        
        result["analysis"] = {
            "trade_details": {
                "symbol": transaction.symbol,
                "shares": transaction.shares,
                "sale_price": transaction.price_per_share,
                "sale_value": round(trade_value, 2),
                "brokerage": round(brokerage, 2),
                "net_proceeds": round(sale_proceeds, 2)
            },
            "cost_base": {
                "purchase_price": transaction.purchase_price,
                "purchase_date": transaction.purchase_date,
                "cost_base": round(cost_base, 2),
                "holding_period_days": holding_days,
                "holding_period_years": round(holding_days / 365, 1)
            },
            "profit_loss": {
                "gross_gain_loss": round(gain, 2),
                "is_profit": gain > 0
            },
            "cgt_analysis": cgt_result if gain > 0 else {
                "message": "No CGT payable - capital loss",
                "loss_amount": round(abs(gain), 2),
                "can_offset_gains": True
            }
        }
    
    return result


@router.post("/comprehensive")
async def model_comprehensive_scenario(
    request: TransactionModelRequest
) -> Dict:
    """
    Model multiple transactions and show combined impact on client's portfolio.
    """
    results = {
        "client_id": request.client_id,
        "projection_years": request.projection_years,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "transactions": [],
        "combined_impact": {
            "total_cash_required": 0,
            "total_new_assets": 0,
            "annual_income_change": 0,
            "annual_expense_change": 0,
            "estimated_tax_impact": 0
        }
    }
    
    for txn in request.transactions:
        txn_type = txn.get("type", "").lower()
        
        if txn_type == "property":
            # Process property transaction
            prop_txn = PropertyTransaction(**txn.get("details", {}))
            if prop_txn.transaction_type == "buy":
                deposit = prop_txn.property_value * (prop_txn.deposit_percent / 100)
                stamp_duty = calculate_stamp_duty(prop_txn.property_value)
                upfront = deposit + stamp_duty + 3000  # Simplified
                
                results["combined_impact"]["total_cash_required"] += upfront
                results["combined_impact"]["total_new_assets"] += prop_txn.property_value
                
                annual_rental = prop_txn.property_value * (prop_txn.expected_rental_yield / 100)
                results["combined_impact"]["annual_income_change"] += annual_rental
                
        elif txn_type == "fund":
            fund_txn = FundTransaction(**txn.get("details", {}))
            if fund_txn.transaction_type == "buy":
                results["combined_impact"]["total_cash_required"] += fund_txn.amount
                results["combined_impact"]["total_new_assets"] += fund_txn.amount
                
                distribution = fund_txn.amount * (fund_txn.distribution_yield / 100)
                results["combined_impact"]["annual_income_change"] += distribution
                
        elif txn_type == "stock":
            stock_txn = StockTransaction(**txn.get("details", {}))
            trade_value = stock_txn.shares * stock_txn.price_per_share
            
            if stock_txn.transaction_type == "buy":
                results["combined_impact"]["total_cash_required"] += trade_value
                results["combined_impact"]["total_new_assets"] += trade_value
                
        results["transactions"].append({
            "type": txn_type,
            "details": txn.get("details", {}),
            "status": "modeled"
        })
    
    # Round all values
    for key in results["combined_impact"]:
        results["combined_impact"][key] = round(results["combined_impact"][key], 2)
    
    # Generate summary
    results["summary"] = {
        "total_transactions": len(request.transactions),
        "cash_required": results["combined_impact"]["total_cash_required"],
        "new_assets_value": results["combined_impact"]["total_new_assets"],
        "net_annual_income_change": results["combined_impact"]["annual_income_change"],
        "recommendation": "Review cash position and ensure adequate liquidity before proceeding"
    }
    
    return results


@router.get("/scenarios/{client_id}")
async def get_saved_scenarios(client_id: str) -> Dict:
    """Get saved transaction scenarios for a client."""
    # In production, this would fetch from database
    # For now, return sample scenarios
    return {
        "client_id": client_id,
        "scenarios": [
            {
                "id": "scenario_1",
                "name": "Investment Property Purchase",
                "created": "2025-12-15",
                "transactions": [
                    {"type": "property", "value": 850000}
                ],
                "cash_required": 220000,
                "projected_return_10yr": 485000
            },
            {
                "id": "scenario_2", 
                "name": "Portfolio Diversification",
                "created": "2025-12-10",
                "transactions": [
                    {"type": "fund", "value": 100000},
                    {"type": "stock", "value": 50000}
                ],
                "cash_required": 150000,
                "projected_return_10yr": 195000
            }
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/retirement-impact")
async def model_retirement_impact(
    client_id: str,
    transaction_value: float,
    transaction_type: str,
    current_age: int = 55,
    retirement_age: int = 65,
    current_super: float = 500000,
    current_investments: float = 300000,
    annual_contribution: float = 27500
) -> Dict:
    """
    Model how a transaction impacts retirement projections.
    """
    years_to_retirement = retirement_age - current_age
    
    # Baseline projection (no transaction)
    baseline_super = current_super
    baseline_investments = current_investments
    
    for _ in range(years_to_retirement):
        baseline_super = baseline_super * 1.07 + annual_contribution  # 7% return
        baseline_investments *= 1.06  # 6% return
    
    baseline_total = baseline_super + baseline_investments
    
    # With transaction projection
    if transaction_type in ["property", "fund", "stock"]:
        # Assume transaction uses investment funds
        new_investments = current_investments - transaction_value
        if new_investments < 0:
            new_investments = 0
            # Rest would need to be funded differently
        
        # New asset projection (e.g., property at 5% growth)
        new_asset_value = transaction_value
        scenario_investments = new_investments
        scenario_super = current_super
        
        for _ in range(years_to_retirement):
            scenario_super = scenario_super * 1.07 + annual_contribution
            scenario_investments *= 1.06
            new_asset_value *= 1.05  # Property/fund growth
        
        scenario_total = scenario_super + scenario_investments + new_asset_value
    else:
        scenario_total = baseline_total
    
    return {
        "client_id": client_id,
        "retirement_analysis": {
            "current_age": current_age,
            "retirement_age": retirement_age,
            "years_to_retirement": years_to_retirement,
            "current_wealth": {
                "super": current_super,
                "investments": current_investments,
                "total": current_super + current_investments
            },
            "baseline_projection": {
                "super_at_retirement": round(baseline_super, 0),
                "investments_at_retirement": round(baseline_investments, 0),
                "total_at_retirement": round(baseline_total, 0)
            },
            "with_transaction": {
                "transaction_type": transaction_type,
                "transaction_value": transaction_value,
                "total_at_retirement": round(scenario_total, 0),
                "difference_from_baseline": round(scenario_total - baseline_total, 0)
            },
            "recommendation": "Positive impact" if scenario_total > baseline_total else "Consider alternatives"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
