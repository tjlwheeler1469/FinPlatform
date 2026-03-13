"""
Financial Decision Engine Service
Provides intelligent, actionable financial recommendations with specific $ impact calculations.
"""
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass


@dataclass
class FinancialProfile:
    """User's complete financial profile for analysis"""
    age: int
    retirement_age: int
    current_income: float
    annual_expenses: float
    total_assets: float
    total_debt: float
    super_balance: float
    emergency_fund: float
    investment_portfolio: float
    property_value: float
    savings_rate: float
    mortgage_rate: float = 6.5
    mortgage_balance: float = 0
    risk_tolerance: str = "moderate"  # conservative, moderate, aggressive


def calculate_financial_health_score(profile: FinancialProfile) -> Dict[str, Any]:
    """
    Calculate comprehensive Financial Health Score (0-100)
    Based on: savings rate, debt level, liquidity, retirement readiness, diversification
    """
    scores = {}
    
    # 1. Savings Rate Score (20 points max)
    # 20%+ is excellent, 10% is good, <5% is poor
    if profile.savings_rate >= 0.20:
        scores['savings_rate'] = {'score': 20, 'status': 'excellent', 'value': profile.savings_rate * 100}
    elif profile.savings_rate >= 0.15:
        scores['savings_rate'] = {'score': 17, 'status': 'good', 'value': profile.savings_rate * 100}
    elif profile.savings_rate >= 0.10:
        scores['savings_rate'] = {'score': 14, 'status': 'fair', 'value': profile.savings_rate * 100}
    elif profile.savings_rate >= 0.05:
        scores['savings_rate'] = {'score': 10, 'status': 'needs_work', 'value': profile.savings_rate * 100}
    else:
        scores['savings_rate'] = {'score': 5, 'status': 'critical', 'value': profile.savings_rate * 100}
    
    # 2. Debt Level Score (20 points max)
    # Debt-to-asset ratio: <30% excellent, 30-50% good, >70% poor
    debt_ratio = profile.total_debt / profile.total_assets if profile.total_assets > 0 else 1
    if debt_ratio <= 0.30:
        scores['debt_level'] = {'score': 20, 'status': 'excellent', 'value': debt_ratio * 100}
    elif debt_ratio <= 0.40:
        scores['debt_level'] = {'score': 17, 'status': 'good', 'value': debt_ratio * 100}
    elif debt_ratio <= 0.50:
        scores['debt_level'] = {'score': 14, 'status': 'fair', 'value': debt_ratio * 100}
    elif debt_ratio <= 0.70:
        scores['debt_level'] = {'score': 10, 'status': 'needs_work', 'value': debt_ratio * 100}
    else:
        scores['debt_level'] = {'score': 5, 'status': 'critical', 'value': debt_ratio * 100}
    
    # 3. Liquidity/Emergency Fund Score (20 points max)
    # 6+ months excellent, 3-6 good, <1 month poor
    monthly_expenses = profile.annual_expenses / 12
    emergency_months = profile.emergency_fund / monthly_expenses if monthly_expenses > 0 else 0
    if emergency_months >= 6:
        scores['liquidity'] = {'score': 20, 'status': 'excellent', 'value': emergency_months}
    elif emergency_months >= 4:
        scores['liquidity'] = {'score': 16, 'status': 'good', 'value': emergency_months}
    elif emergency_months >= 3:
        scores['liquidity'] = {'score': 12, 'status': 'fair', 'value': emergency_months}
    elif emergency_months >= 1:
        scores['liquidity'] = {'score': 8, 'status': 'needs_work', 'value': emergency_months}
    else:
        scores['liquidity'] = {'score': 4, 'status': 'critical', 'value': emergency_months}
    
    # 4. Retirement Readiness Score (20 points max)
    # Based on super balance relative to target
    years_to_retirement = max(profile.retirement_age - profile.age, 1)
    target_at_retirement = profile.annual_expenses * 25  # 4% rule
    
    # Project super balance forward
    projected_super = profile.super_balance * (1.07 ** years_to_retirement)
    retirement_readiness = projected_super / target_at_retirement if target_at_retirement > 0 else 0
    
    if retirement_readiness >= 1.0:
        scores['retirement_readiness'] = {'score': 20, 'status': 'excellent', 'value': retirement_readiness * 100}
    elif retirement_readiness >= 0.80:
        scores['retirement_readiness'] = {'score': 16, 'status': 'good', 'value': retirement_readiness * 100}
    elif retirement_readiness >= 0.60:
        scores['retirement_readiness'] = {'score': 12, 'status': 'fair', 'value': retirement_readiness * 100}
    elif retirement_readiness >= 0.40:
        scores['retirement_readiness'] = {'score': 8, 'status': 'needs_work', 'value': retirement_readiness * 100}
    else:
        scores['retirement_readiness'] = {'score': 4, 'status': 'critical', 'value': retirement_readiness * 100}
    
    # 5. Diversification Score (20 points max)
    total_invested = profile.investment_portfolio + profile.property_value + profile.super_balance
    if total_invested > 0:
        property_pct = profile.property_value / total_invested
        super_pct = profile.super_balance / total_invested
        investment_pct = profile.investment_portfolio / total_invested
        
        # Ideal is balanced allocation
        concentration = max(property_pct, super_pct, investment_pct)
        if concentration <= 0.50:
            scores['diversification'] = {'score': 20, 'status': 'excellent', 'value': (1 - concentration) * 100}
        elif concentration <= 0.60:
            scores['diversification'] = {'score': 16, 'status': 'good', 'value': (1 - concentration) * 100}
        elif concentration <= 0.70:
            scores['diversification'] = {'score': 12, 'status': 'fair', 'value': (1 - concentration) * 100}
        else:
            scores['diversification'] = {'score': 8, 'status': 'needs_work', 'value': (1 - concentration) * 100}
    else:
        scores['diversification'] = {'score': 5, 'status': 'critical', 'value': 0}
    
    # Calculate total score
    total_score = sum(s['score'] for s in scores.values())
    
    # Determine grade
    if total_score >= 90:
        grade = 'A+'
    elif total_score >= 85:
        grade = 'A'
    elif total_score >= 80:
        grade = 'A-'
    elif total_score >= 75:
        grade = 'B+'
    elif total_score >= 70:
        grade = 'B'
    elif total_score >= 65:
        grade = 'B-'
    elif total_score >= 60:
        grade = 'C+'
    elif total_score >= 55:
        grade = 'C'
    elif total_score >= 50:
        grade = 'C-'
    else:
        grade = 'D'
    
    return {
        'score': total_score,
        'grade': grade,
        'components': scores,
        'retirement_probability': min(100, int(retirement_readiness * 85 + 15))
    }


def generate_smart_recommendations(profile: FinancialProfile) -> List[Dict[str, Any]]:
    """
    Generate intelligent, actionable recommendations with specific $ impact.
    This is the core of the Decision Engine.
    """
    recommendations = []
    years_to_retirement = max(profile.retirement_age - profile.age, 1)
    
    # 1. Super Contribution Optimization
    current_concessional = profile.current_income * 0.115  # Default SG
    concessional_cap = 30000  # 2024-25 cap
    additional_contribution = concessional_cap - current_concessional
    
    if additional_contribution > 0:
        # Calculate tax savings
        marginal_rate = 0.45 if profile.current_income > 190000 else (
            0.37 if profile.current_income > 135000 else (
                0.325 if profile.current_income > 45000 else 0.19
            )
        )
        annual_tax_savings = additional_contribution * (marginal_rate - 0.15)
        
        # Calculate retirement impact (compound growth)
        monthly_contribution = additional_contribution / 12
        future_value = monthly_contribution * 12 * ((1.07 ** years_to_retirement - 1) / 0.07) * 1.07
        
        recommendations.append({
            'id': 'super_contribution',
            'title': 'Maximize Super Contributions',
            'description': f'Salary sacrifice ${additional_contribution:,.0f}/year to reach cap',
            'action': f'Increase super contributions by ${additional_contribution/12:,.0f}/month',
            'impact_primary': future_value,
            'impact_label': 'Additional retirement balance',
            'impact_secondary': annual_tax_savings,
            'impact_secondary_label': 'Annual tax savings',
            'priority': 'high',
            'category': 'super',
            'difficulty': 'easy',
            'timeframe': 'immediate'
        })
    
    # 2. Mortgage Refinancing Opportunity
    if profile.mortgage_balance > 0 and profile.mortgage_rate > 5.5:
        potential_new_rate = 5.89
        rate_reduction = profile.mortgage_rate - potential_new_rate
        
        if rate_reduction > 0.3:
            annual_savings = profile.mortgage_balance * (rate_reduction / 100)
            lifetime_savings = annual_savings * min(25, years_to_retirement)
            
            recommendations.append({
                'id': 'refinance_mortgage',
                'title': 'Refinance Mortgage',
                'description': f'Switch from {profile.mortgage_rate:.2f}% to {potential_new_rate}% rate',
                'action': 'Shop for better mortgage rates and refinance',
                'impact_primary': lifetime_savings,
                'impact_label': 'Total interest saved',
                'impact_secondary': annual_savings,
                'impact_secondary_label': 'Annual savings',
                'priority': 'high',
                'category': 'debt',
                'difficulty': 'medium',
                'timeframe': '1-3 months'
            })
    
    # 3. Emergency Fund Building
    monthly_expenses = profile.annual_expenses / 12
    target_emergency = monthly_expenses * 6
    emergency_gap = target_emergency - profile.emergency_fund
    
    if emergency_gap > monthly_expenses:
        recommendations.append({
            'id': 'emergency_fund',
            'title': 'Build Emergency Fund',
            'description': f'Increase from {profile.emergency_fund/monthly_expenses:.1f} to 6 months expenses',
            'action': f'Save ${emergency_gap/12:,.0f}/month for 12 months',
            'impact_primary': target_emergency,
            'impact_label': 'Security buffer',
            'impact_secondary': emergency_gap,
            'impact_secondary_label': 'Additional savings needed',
            'priority': 'high' if profile.emergency_fund < monthly_expenses * 3 else 'medium',
            'category': 'savings',
            'difficulty': 'easy',
            'timeframe': '6-12 months'
        })
    
    # 4. Tax Optimization - Franking Credits
    if profile.investment_portfolio > 50000:
        # Assume 50% in Australian shares with franking
        potential_franked_dividends = profile.investment_portfolio * 0.5 * 0.04
        franking_credit_value = potential_franked_dividends * 0.30 / 0.70
        
        recommendations.append({
            'id': 'franking_credits',
            'title': 'Maximize Franking Credits',
            'description': 'Rebalance portfolio to capture more franking credits',
            'action': 'Increase allocation to dividend-paying Australian stocks',
            'impact_primary': franking_credit_value,
            'impact_label': 'Annual tax refund',
            'impact_secondary': franking_credit_value * 10,
            'impact_secondary_label': '10-year benefit',
            'priority': 'medium',
            'category': 'tax',
            'difficulty': 'easy',
            'timeframe': 'immediate'
        })
    
    # 5. Debt Recycling Strategy
    if profile.mortgage_balance > 100000 and profile.investment_portfolio > 0:
        deductible_interest = profile.mortgage_balance * 0.06 * 0.37
        
        recommendations.append({
            'id': 'debt_recycling',
            'title': 'Implement Debt Recycling',
            'description': 'Convert non-deductible home debt to deductible investment debt',
            'action': 'Set up investment loan and redraw strategy',
            'impact_primary': deductible_interest,
            'impact_label': 'Annual tax deduction',
            'impact_secondary': deductible_interest * years_to_retirement,
            'impact_secondary_label': 'Lifetime tax benefit',
            'priority': 'medium',
            'category': 'tax',
            'difficulty': 'complex',
            'timeframe': '3-6 months'
        })
    
    # 6. Savings Rate Increase
    if profile.savings_rate < 0.20:
        target_savings_rate = min(0.25, profile.savings_rate + 0.05)
        additional_monthly_savings = profile.current_income / 12 * (target_savings_rate - profile.savings_rate)
        
        future_value = additional_monthly_savings * 12 * ((1.07 ** years_to_retirement - 1) / 0.07) * 1.07
        
        recommendations.append({
            'id': 'increase_savings',
            'title': 'Increase Savings Rate',
            'description': f'Boost from {profile.savings_rate*100:.0f}% to {target_savings_rate*100:.0f}%',
            'action': f'Save an additional ${additional_monthly_savings:,.0f}/month',
            'impact_primary': future_value,
            'impact_label': 'Additional wealth at retirement',
            'impact_secondary': additional_monthly_savings * 12,
            'impact_secondary_label': 'Annual extra savings',
            'priority': 'high',
            'category': 'savings',
            'difficulty': 'medium',
            'timeframe': 'immediate'
        })
    
    # 7. Property Investment Optimization
    if profile.property_value > 500000:
        depreciation_estimate = profile.property_value * 0.025 * 0.37
        
        recommendations.append({
            'id': 'depreciation_review',
            'title': 'Property Depreciation Review',
            'description': 'Get quantity surveyor report for investment properties',
            'action': 'Commission depreciation schedule for tax deductions',
            'impact_primary': depreciation_estimate,
            'impact_label': 'Potential annual tax savings',
            'impact_secondary': depreciation_estimate * 10,
            'impact_secondary_label': '10-year benefit',
            'priority': 'medium',
            'category': 'property',
            'difficulty': 'easy',
            'timeframe': '1 month'
        })
    
    # Sort by priority and impact
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    recommendations.sort(key=lambda x: (priority_order[x['priority']], -x['impact_primary']))
    
    return recommendations[:6]  # Return top 6 recommendations


def run_advanced_monte_carlo(
    initial_value: float,
    annual_contribution: float,
    expected_return: float,
    volatility: float,
    years: int,
    target_value: float,
    simulations: int = 10000,
    inflation_rate: float = 0.03
) -> Dict[str, Any]:
    """
    Advanced Monte Carlo simulation with 10,000 scenarios.
    Returns probability of reaching retirement target.
    """
    np.random.seed(None)  # True randomness
    
    # Initialize results array
    results = np.zeros((simulations, years + 1))
    results[:, 0] = initial_value
    
    # Run simulations
    for year in range(1, years + 1):
        # Generate random annual returns using log-normal distribution
        random_returns = np.random.normal(expected_return, volatility, simulations)
        
        # Apply returns and add contributions
        results[:, year] = results[:, year - 1] * (1 + random_returns) + annual_contribution
    
    final_values = results[:, -1]
    
    # Calculate inflation-adjusted target
    real_target = target_value * ((1 + inflation_rate) ** years)
    
    # Calculate success probability
    success_probability = float(np.mean(final_values >= real_target) * 100)
    
    # Calculate percentiles for each year
    percentile_years = list(range(0, years + 1, max(1, years // 10)))
    percentiles = {
        'years': percentile_years,
        'p5': [float(np.percentile(results[:, i], 5)) for i in percentile_years],
        'p10': [float(np.percentile(results[:, i], 10)) for i in percentile_years],
        'p25': [float(np.percentile(results[:, i], 25)) for i in percentile_years],
        'p50': [float(np.percentile(results[:, i], 50)) for i in percentile_years],
        'p75': [float(np.percentile(results[:, i], 75)) for i in percentile_years],
        'p90': [float(np.percentile(results[:, i], 90)) for i in percentile_years],
        'p95': [float(np.percentile(results[:, i], 95)) for i in percentile_years]
    }
    
    # Calculate additional statistics
    median_final = float(np.median(final_values))
    shortfall_risk = float(np.mean(final_values < initial_value) * 100)
    
    # Calculate required adjustment if below target
    adjustment_needed = None
    if success_probability < 80:
        # Binary search for required additional contribution
        low, high = 0, annual_contribution * 2
        for _ in range(20):
            mid = (low + high) / 2
            test_results = np.zeros((1000, years + 1))
            test_results[:, 0] = initial_value
            for year in range(1, years + 1):
                random_returns = np.random.normal(expected_return, volatility, 1000)
                test_results[:, year] = test_results[:, year - 1] * (1 + random_returns) + mid
            test_success = np.mean(test_results[:, -1] >= real_target) * 100
            if test_success >= 80:
                high = mid
            else:
                low = mid
        adjustment_needed = max(0, high - annual_contribution)
    
    return {
        'success_probability': round(success_probability, 1),
        'target_value': target_value,
        'real_target': real_target,
        'median_outcome': median_final,
        'mean_outcome': float(np.mean(final_values)),
        'best_case': float(np.percentile(final_values, 95)),
        'worst_case': float(np.percentile(final_values, 5)),
        'shortfall_risk': round(shortfall_risk, 1),
        'percentile_projections': percentiles,
        'simulations_run': simulations,
        'adjustment_needed': adjustment_needed,
        'years': years,
        'assumptions': {
            'expected_return': expected_return * 100,
            'volatility': volatility * 100,
            'inflation_rate': inflation_rate * 100,
            'annual_contribution': annual_contribution
        }
    }


def calculate_goal_progress(goals: List[Dict], current_values: Dict) -> List[Dict[str, Any]]:
    """Calculate progress towards financial goals with projections"""
    results = []
    
    for goal in goals:
        current = current_values.get(goal['id'], goal.get('current', 0))
        target = goal['target']
        target_date = goal.get('target_date')
        
        progress = (current / target * 100) if target > 0 else 0
        remaining = target - current
        
        # Calculate if on track
        if target_date:
            years_remaining = max(1, (datetime.fromisoformat(target_date) - datetime.now(timezone.utc)).days / 365)
            required_monthly = remaining / (years_remaining * 12)
            
            # Assume current savings rate
            projected_monthly = remaining / (years_remaining * 12 * 1.5)  # Assuming growth
            on_track = progress >= (100 - years_remaining * 5)
        else:
            required_monthly = None
            on_track = progress >= 50
        
        results.append({
            'id': goal['id'],
            'name': goal['name'],
            'icon': goal.get('icon', 'target'),
            'target': target,
            'current': current,
            'progress': min(100, round(progress, 1)),
            'remaining': remaining,
            'on_track': on_track,
            'required_monthly': required_monthly,
            'category': goal.get('category', 'general')
        })
    
    return results


def generate_net_worth_projection(
    current_net_worth: float,
    annual_savings: float,
    years: int = 20,
    growth_rate: float = 0.07
) -> List[Dict[str, Any]]:
    """Generate net worth projection over time"""
    projections = []
    current_year = datetime.now().year
    
    value = current_net_worth
    for year in range(years + 1):
        projections.append({
            'year': current_year + year,
            'net_worth': round(value, 0),
            'milestone': get_wealth_milestone(value)
        })
        value = value * (1 + growth_rate) + annual_savings
    
    return projections


def get_wealth_milestone(value: float) -> Optional[str]:
    """Get wealth milestone label"""
    milestones = [
        (10000000, "Eight Figures"),
        (5000000, "High Net Worth"),
        (2000000, "Millionaire x2"),
        (1000000, "Millionaire"),
        (500000, "Half Million"),
        (250000, "Quarter Million"),
        (100000, "Six Figures")
    ]
    for threshold, label in milestones:
        if value >= threshold:
            return label
    return None
