"""
Life Timeline Planner Service
Visual timeline planning with financial impact calculations.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass
import numpy as np


# Life Event Types
LIFE_EVENT_TYPES = {
    'career_start': {'icon': 'briefcase', 'color': 'blue', 'financial_impact': 'income'},
    'career_change': {'icon': 'trending-up', 'color': 'blue', 'financial_impact': 'income'},
    'promotion': {'icon': 'award', 'color': 'green', 'financial_impact': 'income'},
    'marriage': {'icon': 'heart', 'color': 'pink', 'financial_impact': 'expense'},
    'child': {'icon': 'baby', 'color': 'purple', 'financial_impact': 'expense'},
    'education': {'icon': 'graduation-cap', 'color': 'indigo', 'financial_impact': 'expense'},
    'house_purchase': {'icon': 'home', 'color': 'amber', 'financial_impact': 'asset'},
    'house_upgrade': {'icon': 'home', 'color': 'amber', 'financial_impact': 'asset'},
    'mortgage_payoff': {'icon': 'check-circle', 'color': 'green', 'financial_impact': 'debt_reduction'},
    'car_purchase': {'icon': 'car', 'color': 'slate', 'financial_impact': 'expense'},
    'travel': {'icon': 'plane', 'color': 'cyan', 'financial_impact': 'expense'},
    'health_event': {'icon': 'heart-pulse', 'color': 'red', 'financial_impact': 'expense'},
    'inheritance': {'icon': 'gift', 'color': 'gold', 'financial_impact': 'windfall'},
    'retirement': {'icon': 'sunset', 'color': 'orange', 'financial_impact': 'income_change'},
    'estate_transfer': {'icon': 'scroll', 'color': 'purple', 'financial_impact': 'legacy'},
    'investment_milestone': {'icon': 'trending-up', 'color': 'emerald', 'financial_impact': 'asset'},
    'business_start': {'icon': 'building', 'color': 'blue', 'financial_impact': 'income'},
    'sabbatical': {'icon': 'palm-tree', 'color': 'teal', 'financial_impact': 'expense'},
}


@dataclass
class LifeEvent:
    """A life event on the timeline"""
    id: str
    name: str
    event_type: str
    age: int
    year: int
    description: Optional[str] = None
    financial_impact: float = 0
    is_recurring: bool = False
    recurring_years: int = 0
    is_adjustable: bool = True


def generate_default_timeline(current_age: int, current_year: int) -> List[Dict[str, Any]]:
    """Generate a default life timeline based on age"""
    events = []
    
    # Past events (if applicable)
    if current_age >= 25:
        events.append({
            'id': 'career_start',
            'name': 'Career Start',
            'event_type': 'career_start',
            'age': 22,
            'year': current_year - (current_age - 22),
            'description': 'Started professional career',
            'financial_impact': 50000,
            'is_past': True,
            'is_adjustable': False
        })
    
    # Current position marker
    events.append({
        'id': 'current',
        'name': 'Current Position',
        'event_type': 'investment_milestone',
        'age': current_age,
        'year': current_year,
        'description': 'Where you are today',
        'financial_impact': 0,
        'is_current': True,
        'is_adjustable': False
    })
    
    # Future events
    future_events = [
        {'id': 'house_upgrade', 'name': 'House Upgrade', 'event_type': 'house_upgrade', 'age_offset': 5, 'impact': -200000},
        {'id': 'child_education', 'name': 'Child Education', 'event_type': 'education', 'age_offset': 8, 'impact': -100000},
        {'id': 'mortgage_payoff', 'name': 'Mortgage Paid Off', 'event_type': 'mortgage_payoff', 'age_offset': 10, 'impact': 500000},
        {'id': 'retirement', 'name': 'Retirement', 'event_type': 'retirement', 'age_offset': 15, 'impact': 0},
        {'id': 'travel_goals', 'name': 'Major Travel', 'event_type': 'travel', 'age_offset': 17, 'impact': -50000},
        {'id': 'estate_transfer', 'name': 'Estate Planning', 'event_type': 'estate_transfer', 'age_offset': 40, 'impact': 0},
    ]
    
    for event in future_events:
        target_age = current_age + event['age_offset']
        if target_age <= 100:  # Reasonable lifespan
            events.append({
                'id': event['id'],
                'name': event['name'],
                'event_type': event['event_type'],
                'age': target_age,
                'year': current_year + event['age_offset'],
                'description': f"Planned for age {target_age}",
                'financial_impact': event['impact'],
                'is_past': False,
                'is_adjustable': True
            })
    
    return sorted(events, key=lambda x: x['age'])


def calculate_timeline_impact(
    events: List[Dict],
    current_net_worth: float,
    annual_income: float,
    savings_rate: float,
    growth_rate: float = 0.07
) -> Dict[str, Any]:
    """Calculate the financial impact of a life timeline"""
    
    sorted_events = sorted(events, key=lambda x: x['age'])
    current_event = next((e for e in sorted_events if e.get('is_current')), None)
    current_age = current_event['age'] if current_event else 45
    current_year = current_event['year'] if current_event else datetime.now().year
    
    # Find retirement event
    retirement_event = next((e for e in sorted_events if e['event_type'] == 'retirement'), None)
    retirement_age = retirement_event['age'] if retirement_event else 65
    
    # Calculate year-by-year projection
    projections = []
    net_worth = current_net_worth
    annual_savings = annual_income * savings_rate
    
    for year_offset in range(0, 50):
        age = current_age + year_offset
        year = current_year + year_offset
        
        if age > 100:
            break
        
        # Check for events this year
        year_events = [e for e in sorted_events if e['age'] == age and not e.get('is_past')]
        
        event_impact = sum(e.get('financial_impact', 0) for e in year_events)
        event_names = [e['name'] for e in year_events]
        
        # Adjust for retirement
        if age >= retirement_age:
            # Draw down phase
            annual_savings = -annual_income * 0.04  # 4% withdrawal
            growth_rate_adj = 0.05  # More conservative
        else:
            growth_rate_adj = growth_rate
        
        # Calculate new net worth
        net_worth = net_worth * (1 + growth_rate_adj) + annual_savings + event_impact
        
        projections.append({
            'age': age,
            'year': year,
            'net_worth': max(0, round(net_worth)),
            'events': event_names,
            'event_impact': event_impact,
            'phase': 'retirement' if age >= retirement_age else 'accumulation'
        })
    
    # Calculate key metrics
    retirement_projection = next((p for p in projections if p['age'] == retirement_age), None)
    peak_wealth = max(p['net_worth'] for p in projections)
    peak_age = next(p['age'] for p in projections if p['net_worth'] == peak_wealth)
    
    return {
        'timeline_events': sorted_events,
        'projections': projections,
        'summary': {
            'current_age': current_age,
            'retirement_age': retirement_age,
            'years_to_retirement': retirement_age - current_age,
            'retirement_net_worth': retirement_projection['net_worth'] if retirement_projection else 0,
            'peak_net_worth': peak_wealth,
            'peak_age': peak_age,
            'total_events': len([e for e in sorted_events if not e.get('is_past') and not e.get('is_current')])
        }
    }


def simulate_retirement_age_change(
    current_timeline: Dict,
    new_retirement_age: int,
    current_age: int,
    current_net_worth: float,
    annual_income: float,
    savings_rate: float
) -> Dict[str, Any]:
    """Simulate the impact of changing retirement age"""
    
    events = current_timeline.get('timeline_events', [])
    
    # Update retirement event
    for event in events:
        if event['event_type'] == 'retirement':
            event['age'] = new_retirement_age
            event['year'] = datetime.now().year + (new_retirement_age - current_age)
    
    # Recalculate impact
    new_impact = calculate_timeline_impact(
        events, current_net_worth, annual_income, savings_rate
    )
    
    # Compare with original
    original_retirement = current_timeline.get('summary', {}).get('retirement_net_worth', 0)
    new_retirement = new_impact['summary']['retirement_net_worth']
    
    return {
        **new_impact,
        'comparison': {
            'retirement_age_change': new_retirement_age - current_timeline.get('summary', {}).get('retirement_age', 65),
            'net_worth_difference': new_retirement - original_retirement,
            'percentage_change': ((new_retirement - original_retirement) / original_retirement * 100) if original_retirement > 0 else 0
        }
    }


def get_milestone_events(net_worth_projection: List[Dict]) -> List[Dict[str, Any]]:
    """Identify milestone events in the projection"""
    milestones = []
    
    thresholds = [
        (100000, "Six Figures", "🎯"),
        (250000, "Quarter Millionaire", "💰"),
        (500000, "Half Millionaire", "💎"),
        (1000000, "Millionaire", "🏆"),
        (2000000, "Double Millionaire", "👑"),
        (5000000, "High Net Worth", "🌟"),
    ]
    
    reached = set()
    for proj in net_worth_projection:
        for threshold, label, emoji in thresholds:
            if proj['net_worth'] >= threshold and threshold not in reached:
                reached.add(threshold)
                milestones.append({
                    'threshold': threshold,
                    'label': label,
                    'emoji': emoji,
                    'age': proj['age'],
                    'year': proj['year'],
                    'net_worth': proj['net_worth']
                })
    
    return milestones
