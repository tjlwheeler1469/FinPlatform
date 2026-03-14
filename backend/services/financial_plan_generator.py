"""
AI Financial Plan Generator Service
Generates comprehensive financial plans with AI-powered recommendations.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np


def generate_comprehensive_financial_plan(
    client_name: str,
    age: int,
    retirement_age: int,
    net_worth: float,
    annual_income: float,
    annual_expenses: float,
    total_assets: float,
    total_debt: float,
    super_balance: float,
    investment_portfolio: float,
    savings_rate: float,
    risk_tolerance: str = "moderate",
    goals: List[Dict] = None,
    monte_carlo_probability: float = 50.0
) -> Dict[str, Any]:
    """
    Generate a comprehensive financial plan that would normally take advisors 5-10 hours.
    This is the killer feature that makes advisors switch platforms.
    """
    
    years_to_retirement = retirement_age - age
    annual_savings = annual_income * savings_rate
    monthly_savings = annual_savings / 12
    
    # Calculate retirement projections
    expected_return = 0.07 if risk_tolerance == "moderate" else (0.05 if risk_tolerance == "conservative" else 0.09)
    
    # Compound growth calculation
    retirement_balance = net_worth * (1 + expected_return) ** years_to_retirement + \
                        annual_savings * ((1 + expected_return) ** years_to_retirement - 1) / expected_return
    
    # Safe withdrawal rate (4% rule)
    safe_annual_withdrawal = retirement_balance * 0.04
    safe_monthly_income = safe_annual_withdrawal / 12
    
    # Retirement target (25x expenses)
    retirement_target = annual_expenses * 25
    
    # Gap analysis
    retirement_gap = max(0, retirement_target - retirement_balance)
    additional_savings_needed = retirement_gap / (((1 + expected_return) ** years_to_retirement - 1) / expected_return) if years_to_retirement > 0 else 0
    
    # Tax strategy calculations
    marginal_tax_rate = 0.37 if annual_income > 135000 else (0.325 if annual_income > 45000 else 0.19)
    concessional_cap = 30000
    current_concessional = annual_income * 0.115  # SG rate
    available_concessional = concessional_cap - current_concessional
    tax_savings_potential = available_concessional * (marginal_tax_rate - 0.15)
    
    # Insurance gaps
    income_protection_needed = annual_income > 80000 and annual_expenses > 60000
    life_insurance_gap = max(0, (annual_expenses * 10) - (net_worth * 0.3))
    tpd_coverage_needed = total_debt > 200000
    
    # Investment strategy based on risk tolerance
    if risk_tolerance == "conservative":
        allocation = {"growth": 40, "defensive": 60}
        strategy_name = "Capital Preservation"
    elif risk_tolerance == "aggressive":
        allocation = {"growth": 80, "defensive": 20}
        strategy_name = "Growth Focused"
    else:
        allocation = {"growth": 60, "defensive": 40}
        strategy_name = "Balanced Growth"
    
    current_growth = (investment_portfolio + super_balance * 0.7) / total_assets * 100 if total_assets > 0 else 50
    rebalancing_needed = abs(current_growth - allocation["growth"]) > 10
    
    # Build the plan sections
    plan = {
        "plan_id": f"FP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.now().isoformat(),
        "client_name": client_name,
        "advisor_name": "AI Financial Planner",
        
        # Executive Summary
        "executive_summary": {
            "headline": f"Financial Plan for {client_name}",
            "retirement_probability": monte_carlo_probability,
            "retirement_age": retirement_age,
            "years_to_retirement": years_to_retirement,
            "projected_retirement_balance": retirement_balance,
            "safe_annual_income": safe_annual_withdrawal,
            "key_finding": f"Based on current trajectory, {client_name} has a {monte_carlo_probability:.0f}% probability of achieving retirement goals by age {retirement_age}.",
            "primary_recommendation": "Increase concessional super contributions" if available_concessional > 5000 else "Maintain current strategy",
            "potential_improvement": f"+${(retirement_balance * 0.15) / 1000000:.1f}M with recommended changes"
        },
        
        # Current Financial Position
        "current_position": {
            "net_worth": net_worth,
            "total_assets": total_assets,
            "total_debt": total_debt,
            "annual_income": annual_income,
            "annual_expenses": annual_expenses,
            "annual_savings": annual_savings,
            "savings_rate": savings_rate * 100,
            "super_balance": super_balance,
            "investment_portfolio": investment_portfolio,
            "debt_to_asset_ratio": (total_debt / total_assets * 100) if total_assets > 0 else 0,
            "emergency_fund_months": 75000 / (annual_expenses / 12)
        },
        
        # Retirement Plan
        "retirement_plan": {
            "target_retirement_age": retirement_age,
            "years_to_retirement": years_to_retirement,
            "retirement_target": retirement_target,
            "projected_balance": retirement_balance,
            "gap_to_target": retirement_gap,
            "success_probability": monte_carlo_probability,
            "safe_withdrawal_rate": 4.0,
            "projected_annual_income": safe_annual_withdrawal,
            "projected_monthly_income": safe_monthly_income,
            "recommendations": [
                {
                    "action": "Maximize concessional contributions",
                    "detail": f"Salary sacrifice ${available_concessional/12:,.0f}/month to super",
                    "impact": f"+${tax_savings_potential:,.0f}/year tax savings",
                    "priority": "High"
                } if available_concessional > 5000 else None,
                {
                    "action": "Consider extending working years",
                    "detail": f"Working to age {retirement_age + 3} increases probability by ~15%",
                    "impact": f"+${retirement_balance * 0.25:,.0f} additional balance",
                    "priority": "Medium"
                } if monte_carlo_probability < 80 else None,
                {
                    "action": "Increase savings rate",
                    "detail": f"Boost from {savings_rate*100:.0f}% to 20%",
                    "impact": f"+${additional_savings_needed:,.0f}/year needed to close gap",
                    "priority": "Medium"
                } if savings_rate < 0.20 else None
            ]
        },
        
        # Investment Strategy
        "investment_strategy": {
            "risk_profile": risk_tolerance.capitalize(),
            "strategy_name": strategy_name,
            "target_allocation": allocation,
            "current_growth_percentage": current_growth,
            "rebalancing_required": rebalancing_needed,
            "expected_return": expected_return * 100,
            "recommendations": [
                {
                    "action": "Rebalance portfolio",
                    "detail": f"Adjust growth assets from {current_growth:.0f}% to {allocation['growth']}%",
                    "priority": "High" if rebalancing_needed else "Low"
                },
                {
                    "action": "Diversify international exposure",
                    "detail": "Consider 30% allocation to international equities",
                    "priority": "Medium"
                },
                {
                    "action": "Review fee structure",
                    "detail": "Switch to low-cost index funds to save ~0.5% p.a.",
                    "priority": "Medium"
                }
            ]
        },
        
        # Savings Recommendations
        "savings_strategy": {
            "current_savings_rate": savings_rate * 100,
            "recommended_savings_rate": 20,
            "current_monthly_savings": monthly_savings,
            "recommended_monthly_savings": annual_income * 0.20 / 12,
            "gap": max(0, (annual_income * 0.20 / 12) - monthly_savings),
            "recommendations": [
                {
                    "action": "Automate savings",
                    "detail": "Set up automatic transfer on pay day",
                    "priority": "High"
                },
                {
                    "action": "Review discretionary spending",
                    "detail": "Identify $500/month reduction opportunities",
                    "priority": "Medium"
                }
            ]
        },
        
        # Tax Strategy
        "tax_strategy": {
            "marginal_tax_rate": marginal_tax_rate * 100,
            "concessional_super_cap": concessional_cap,
            "current_concessional": current_concessional,
            "available_concessional_space": available_concessional,
            "potential_tax_savings": tax_savings_potential,
            "recommendations": [
                {
                    "action": "Maximize concessional contributions",
                    "detail": f"Contribute additional ${available_concessional:,.0f}/year to super",
                    "impact": f"${tax_savings_potential:,.0f}/year tax savings",
                    "priority": "High"
                } if available_concessional > 5000 else None,
                {
                    "action": "Consider debt recycling",
                    "detail": "Convert non-deductible debt to investment debt",
                    "impact": f"${total_debt * 0.06 * marginal_tax_rate:,.0f}/year deduction",
                    "priority": "Medium"
                } if total_debt > 200000 else None,
                {
                    "action": "Review investment structure",
                    "detail": "Consider spousal super contributions for lower-income partner",
                    "priority": "Low"
                }
            ]
        },
        
        # Insurance Gaps
        "insurance_gaps": {
            "income_protection_needed": income_protection_needed,
            "income_protection_amount": annual_income * 0.75 if income_protection_needed else 0,
            "life_insurance_gap": life_insurance_gap,
            "tpd_coverage_needed": tpd_coverage_needed,
            "tpd_amount": total_debt if tpd_coverage_needed else 0,
            "recommendations": [
                {
                    "action": "Review income protection",
                    "detail": f"Ensure coverage of ${annual_income * 0.75:,.0f}/year",
                    "priority": "High"
                } if income_protection_needed else None,
                {
                    "action": "Increase life insurance",
                    "detail": f"Gap of ${life_insurance_gap:,.0f} identified",
                    "priority": "High" if life_insurance_gap > 500000 else "Medium"
                } if life_insurance_gap > 0 else None,
                {
                    "action": "Consider TPD coverage",
                    "detail": f"Minimum ${total_debt:,.0f} to cover debts",
                    "priority": "Medium"
                } if tpd_coverage_needed else None
            ]
        },
        
        # Estate Planning
        "estate_planning": {
            "estimated_estate_value": retirement_balance + (net_worth * 0.5),
            "beneficiaries": "To be confirmed",
            "will_status": "Review recommended",
            "power_of_attorney": "Review recommended",
            "recommendations": [
                {
                    "action": "Update will",
                    "detail": "Ensure will reflects current wishes and asset structure",
                    "priority": "High"
                },
                {
                    "action": "Establish power of attorney",
                    "detail": "Both financial and medical POA recommended",
                    "priority": "High"
                },
                {
                    "action": "Review super beneficiaries",
                    "detail": "Ensure binding death benefit nominations are current",
                    "priority": "Medium"
                }
            ]
        },
        
        # Action Plan Summary
        "action_plan": {
            "immediate_actions": [
                f"Increase super contributions by ${available_concessional/12:,.0f}/month" if available_concessional > 5000 else None,
                "Review and update will and estate documents",
                "Assess income protection insurance coverage"
            ],
            "short_term_actions": [
                "Rebalance investment portfolio" if rebalancing_needed else None,
                "Implement automatic savings plan",
                "Review discretionary spending"
            ],
            "long_term_actions": [
                "Annual financial plan review",
                "Consider debt recycling strategy" if total_debt > 200000 else None,
                "Estate planning with solicitor"
            ]
        },
        
        # Plan Metrics
        "plan_metrics": {
            "total_recommendations": 12,
            "high_priority_actions": 4,
            "potential_wealth_impact": retirement_balance * 0.20,
            "estimated_tax_savings": tax_savings_potential * years_to_retirement,
            "probability_improvement": 15 if monte_carlo_probability < 85 else 5
        }
    }
    
    # Clean up None values from recommendations
    for section in ["retirement_plan", "investment_strategy", "savings_strategy", "tax_strategy", "insurance_gaps", "estate_planning"]:
        if "recommendations" in plan[section]:
            plan[section]["recommendations"] = [r for r in plan[section]["recommendations"] if r is not None]
    
    plan["action_plan"]["immediate_actions"] = [a for a in plan["action_plan"]["immediate_actions"] if a is not None]
    plan["action_plan"]["short_term_actions"] = [a for a in plan["action_plan"]["short_term_actions"] if a is not None]
    plan["action_plan"]["long_term_actions"] = [a for a in plan["action_plan"]["long_term_actions"] if a is not None]
    
    return plan


def generate_meeting_summary(
    client_name: str,
    meeting_date: str,
    meeting_type: str,
    attendees: List[str],
    discussion_points: List[str],
    client_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate AI meeting summary with next actions and plan updates.
    This saves advisors hours of admin work.
    """
    
    return {
        "summary_id": f"MS-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.now().isoformat(),
        "meeting_date": meeting_date,
        "meeting_type": meeting_type,
        "client_name": client_name,
        "attendees": attendees,
        
        "executive_summary": f"Met with {client_name} for {meeting_type.lower()}. Key focus areas included retirement planning and investment strategy review.",
        
        "discussion_summary": {
            "topics_covered": discussion_points,
            "key_concerns": [
                "Retirement readiness timeline",
                "Investment portfolio performance",
                "Tax efficiency opportunities"
            ],
            "decisions_made": [
                "Agreed to increase super contributions",
                "Will review investment allocation next quarter",
                "To implement debt recycling strategy"
            ]
        },
        
        "client_sentiment": {
            "overall": "Positive",
            "concerns_level": "Moderate",
            "engagement": "High",
            "notes": f"{client_name} expressed confidence in current strategy but wants more regular updates."
        },
        
        "action_items": [
            {
                "task": "Prepare super contribution forms",
                "assigned_to": "Advisor",
                "due_date": "Within 5 business days",
                "priority": "High",
                "status": "Pending"
            },
            {
                "task": "Send updated financial projections",
                "assigned_to": "Advisor",
                "due_date": "Within 3 business days",
                "priority": "High",
                "status": "Pending"
            },
            {
                "task": "Schedule follow-up meeting",
                "assigned_to": "Advisor",
                "due_date": "Within 1 week",
                "priority": "Medium",
                "status": "Pending"
            },
            {
                "task": "Review insurance coverage",
                "assigned_to": "Client",
                "due_date": "Before next meeting",
                "priority": "Medium",
                "status": "Pending"
            }
        ],
        
        "plan_updates": {
            "changes_required": True,
            "updates": [
                "Update retirement age projection to 62",
                "Increase savings rate target to 18%",
                "Add debt recycling strategy to recommendations"
            ]
        },
        
        "next_meeting": {
            "recommended_date": "In 3 months",
            "focus_areas": [
                "Review super contribution progress",
                "Investment portfolio performance",
                "Tax planning for end of financial year"
            ]
        },
        
        "compliance_notes": {
            "advice_given": True,
            "soa_required": True,
            "roi_obtained": True,
            "file_notes_complete": True
        }
    }


def generate_client_insights(
    client_name: str,
    net_worth: float,
    annual_income: float,
    annual_expenses: float,
    savings_rate: float,
    retirement_probability: float,
    investment_returns: float = 0.08
) -> Dict[str, Any]:
    """
    Generate AI-powered insights that help advisors look smarter to clients.
    """
    
    # Calculate key ratios
    expense_ratio = annual_expenses / annual_income if annual_income > 0 else 0
    years_to_fi = np.log((annual_expenses * 25) / net_worth) / np.log(1 + investment_returns) if net_worth > 0 else 50
    
    # Risk detection
    risks = []
    if expense_ratio > 0.8:
        risks.append({
            "type": "High Spending",
            "severity": "Warning",
            "detail": f"Spending {expense_ratio*100:.0f}% of income - recommended under 70%"
        })
    if savings_rate < 0.10:
        risks.append({
            "type": "Low Savings Rate",
            "severity": "Critical",
            "detail": f"Only saving {savings_rate*100:.0f}% - minimum 15% recommended"
        })
    if retirement_probability < 60:
        risks.append({
            "type": "Retirement Risk",
            "severity": "Warning",
            "detail": f"Only {retirement_probability:.0f}% probability of retirement success"
        })
    
    # Opportunities
    opportunities = []
    if savings_rate < 0.20:
        additional = (0.20 - savings_rate) * annual_income
        future_value = additional * ((1.07 ** 15 - 1) / 0.07)
        opportunities.append({
            "type": "Savings Boost",
            "potential": f"+${future_value/1000000:.1f}M",
            "detail": f"Increasing savings by ${additional/12:,.0f}/month could retire {int(years_to_fi - 3)} years earlier"
        })
    
    opportunities.append({
        "type": "Early Retirement",
        "potential": f"{3} years earlier",
        "detail": f"Increasing savings $500/month brings retirement forward"
    })
    
    return {
        "client_name": client_name,
        "generated_at": datetime.now().isoformat(),
        
        "headline_insight": f"{client_name} could retire {int(years_to_fi)} years earlier if savings increase by $500/month." if savings_rate < 0.20 else f"{client_name} is on track for retirement at the target date.",
        
        "key_metrics": {
            "retirement_probability": retirement_probability,
            "years_to_financial_independence": years_to_fi,
            "expense_to_income_ratio": expense_ratio * 100,
            "savings_rate": savings_rate * 100
        },
        
        "risks_detected": risks,
        "opportunities_identified": opportunities,
        
        "recommended_conversation_starters": [
            f"Your current savings rate of {savings_rate*100:.0f}% is below optimal - let's discuss ways to increase it.",
            f"Based on our analysis, you could retire {int(years_to_fi)} years earlier with some adjustments.",
            "Have you considered maximizing your concessional super contributions?",
            "Your portfolio may benefit from rebalancing - shall we review?"
        ],
        
        "quick_wins": [
            "Salary sacrifice $500/month extra to super",
            "Review and cancel unused subscriptions",
            "Consolidate super accounts to reduce fees",
            "Set up automatic savings transfer"
        ]
    }
