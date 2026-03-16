"""
Financial Intelligence Engine
Advanced Monte Carlo simulations and probabilistic financial modeling.
"""
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


class MonteCarloEngine:
    """
    Advanced Monte Carlo simulation engine for financial planning.
    Runs 10,000+ simulations to calculate probability-based outcomes.
    """
    
    def __init__(self, num_simulations: int = 10000, seed: int = None):
        self.num_simulations = num_simulations
        if seed:
            np.random.seed(seed)
    
    def run_retirement_simulation(
        self,
        current_age: int,
        retirement_age: int,
        current_wealth: float,
        annual_savings: float,
        annual_expenses: float,
        expected_return: float = 0.07,
        volatility: float = 0.15,
        inflation: float = 0.025,
        life_expectancy: int = 95,
        super_balance: float = 0,
        employer_super_rate: float = 0.115,
        annual_income: float = 0
    ) -> Dict[str, Any]:
        """
        Run comprehensive retirement Monte Carlo simulation.
        
        Returns probability of success, wealth projections, and risk metrics.
        """
        years_to_retirement = max(0, retirement_age - current_age)
        years_in_retirement = max(0, life_expectancy - retirement_age)
        total_years = years_to_retirement + years_in_retirement
        
        # Initialize simulation arrays
        wealth_paths = np.zeros((self.num_simulations, total_years + 1))
        wealth_paths[:, 0] = current_wealth + super_balance
        
        # Accumulation phase
        for year in range(1, years_to_retirement + 1):
            # Generate random returns with volatility
            returns = np.random.normal(expected_return, volatility, self.num_simulations)
            
            # Calculate super contribution
            super_contrib = annual_income * employer_super_rate if year <= years_to_retirement else 0
            total_savings = annual_savings + super_contrib
            
            # Update wealth
            wealth_paths[:, year] = wealth_paths[:, year - 1] * (1 + returns) + total_savings
        
        # Retirement phase - withdrawal simulations
        wealth_at_retirement = wealth_paths[:, years_to_retirement].copy()
        
        for year in range(years_to_retirement + 1, total_years + 1):
            retirement_year = year - years_to_retirement
            
            # More conservative returns in retirement
            returns = np.random.normal(expected_return * 0.75, volatility * 0.6, self.num_simulations)
            
            # Inflation-adjusted withdrawal
            withdrawal = annual_expenses * ((1 + inflation) ** retirement_year)
            
            # Update wealth (ensure non-negative)
            wealth_paths[:, year] = np.maximum(0, wealth_paths[:, year - 1] * (1 + returns) - withdrawal)
        
        # Calculate success probability (wealth > 0 at end of life expectancy)
        final_wealth = wealth_paths[:, -1]
        success_count = np.sum(final_wealth > 0)
        success_probability = success_count / self.num_simulations * 100
        
        # Calculate percentiles at key milestones
        retirement_wealth_percentiles = self._calculate_percentiles(wealth_paths[:, years_to_retirement])
        final_wealth_percentiles = self._calculate_percentiles(final_wealth)
        
        # Calculate safe withdrawal rate
        safe_withdrawal_rate = self._calculate_safe_withdrawal_rate(wealth_at_retirement, years_in_retirement, inflation)
        
        # Calculate risk metrics
        risk_of_ruin_year = self._calculate_risk_of_ruin_year(wealth_paths, years_to_retirement)
        
        # Generate projection paths for visualization
        projection_years = list(range(current_age, current_age + total_years + 1))
        
        return {
            "simulation_params": {
                "num_simulations": self.num_simulations,
                "current_age": current_age,
                "retirement_age": retirement_age,
                "life_expectancy": life_expectancy,
                "expected_return": expected_return * 100,
                "volatility": volatility * 100,
                "inflation": inflation * 100
            },
            "success_metrics": {
                "success_probability": round(success_probability, 1),
                "failure_probability": round(100 - success_probability, 1),
                "simulations_successful": int(success_count),
                "simulations_failed": int(self.num_simulations - success_count)
            },
            "wealth_at_retirement": {
                "median": retirement_wealth_percentiles["p50"],
                "p10": retirement_wealth_percentiles["p10"],
                "p25": retirement_wealth_percentiles["p25"],
                "p75": retirement_wealth_percentiles["p75"],
                "p90": retirement_wealth_percentiles["p90"],
                "mean": float(np.mean(wealth_paths[:, years_to_retirement])),
                "std": float(np.std(wealth_paths[:, years_to_retirement]))
            },
            "final_wealth": {
                "median": final_wealth_percentiles["p50"],
                "p10": final_wealth_percentiles["p10"],
                "p25": final_wealth_percentiles["p25"],
                "p75": final_wealth_percentiles["p75"],
                "p90": final_wealth_percentiles["p90"],
                "mean": float(np.mean(final_wealth)),
                "best_case": float(np.max(final_wealth)),
                "worst_case": float(np.min(final_wealth))
            },
            "safe_withdrawal": {
                "rate_4_percent": safe_withdrawal_rate["rate_4"],
                "rate_3_percent": safe_withdrawal_rate["rate_3"],
                "recommended_annual": safe_withdrawal_rate["recommended_annual"],
                "recommended_monthly": safe_withdrawal_rate["recommended_monthly"]
            },
            "risk_metrics": {
                "risk_of_ruin_year": risk_of_ruin_year,
                "probability_of_doubling": float(np.mean(wealth_paths[:, years_to_retirement] > current_wealth * 2) * 100),
                "probability_below_starting": float(np.mean(final_wealth < current_wealth) * 100),
                "sequence_of_returns_risk": self._calculate_sequence_risk(wealth_paths, years_to_retirement)
            },
            "projections": {
                "years": projection_years,
                "ages": projection_years,
                "p10": [float(np.percentile(wealth_paths[:, i], 10)) for i in range(total_years + 1)],
                "p25": [float(np.percentile(wealth_paths[:, i], 25)) for i in range(total_years + 1)],
                "p50": [float(np.percentile(wealth_paths[:, i], 50)) for i in range(total_years + 1)],
                "p75": [float(np.percentile(wealth_paths[:, i], 75)) for i in range(total_years + 1)],
                "p90": [float(np.percentile(wealth_paths[:, i], 90)) for i in range(total_years + 1)]
            },
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    def _calculate_percentiles(self, values: np.ndarray) -> Dict[str, float]:
        """Calculate standard percentiles."""
        return {
            "p10": float(np.percentile(values, 10)),
            "p25": float(np.percentile(values, 25)),
            "p50": float(np.percentile(values, 50)),
            "p75": float(np.percentile(values, 75)),
            "p90": float(np.percentile(values, 90))
        }
    
    def _calculate_safe_withdrawal_rate(
        self, 
        retirement_wealth: np.ndarray, 
        years: int,
        inflation: float
    ) -> Dict[str, float]:
        """Calculate safe withdrawal rates."""
        median_wealth = float(np.percentile(retirement_wealth, 50))
        conservative_wealth = float(np.percentile(retirement_wealth, 25))
        
        # Standard 4% rule
        rate_4 = median_wealth * 0.04
        rate_3 = conservative_wealth * 0.03
        
        # Recommended based on conservative scenario
        recommended = conservative_wealth * 0.035
        
        return {
            "rate_4": rate_4,
            "rate_3": rate_3,
            "recommended_annual": recommended,
            "recommended_monthly": recommended / 12
        }
    
    def _calculate_risk_of_ruin_year(self, wealth_paths: np.ndarray, retirement_start: int) -> Optional[int]:
        """Calculate the year where 10% of simulations run out of money."""
        for year in range(retirement_start, wealth_paths.shape[1]):
            depleted_ratio = np.mean(wealth_paths[:, year] <= 0)
            if depleted_ratio >= 0.10:
                return year - retirement_start  # Years into retirement
        return None  # Never reaches 10% ruin
    
    def _calculate_sequence_risk(self, wealth_paths: np.ndarray, retirement_start: int) -> str:
        """Evaluate sequence of returns risk."""
        first_5_years = wealth_paths[:, retirement_start:retirement_start + 5] if retirement_start + 5 < wealth_paths.shape[1] else wealth_paths[:, retirement_start:]
        
        # Calculate average drawdown in first 5 years
        if first_5_years.shape[1] > 1:
            drawdowns = (first_5_years[:, 0] - np.min(first_5_years, axis=1)) / first_5_years[:, 0]
            avg_drawdown = np.mean(drawdowns) * 100
            
            if avg_drawdown > 30:
                return "High - Consider bucket strategy"
            elif avg_drawdown > 15:
                return "Moderate - Maintain cash buffer"
            else:
                return "Low"
        return "Low"
    
    def run_scenario_comparison(
        self,
        base_params: Dict[str, Any],
        scenarios: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Compare multiple scenarios against a base case.
        
        Args:
            base_params: Base scenario parameters
            scenarios: List of scenario modifications
        
        Returns:
            Comparison results with impact analysis
        """
        # Run base scenario
        base_result = self.run_retirement_simulation(**base_params)
        
        comparisons = [{
            "name": "Current Plan",
            "success_probability": base_result["success_metrics"]["success_probability"],
            "retirement_wealth": base_result["wealth_at_retirement"]["median"],
            "changes": {}
        }]
        
        # Run each scenario
        for scenario in scenarios:
            scenario_params = {**base_params, **scenario.get("changes", {})}
            scenario_result = self.run_retirement_simulation(**scenario_params)
            
            prob_change = scenario_result["success_metrics"]["success_probability"] - base_result["success_metrics"]["success_probability"]
            wealth_change = scenario_result["wealth_at_retirement"]["median"] - base_result["wealth_at_retirement"]["median"]
            
            comparisons.append({
                "name": scenario.get("name", "Scenario"),
                "success_probability": scenario_result["success_metrics"]["success_probability"],
                "retirement_wealth": scenario_result["wealth_at_retirement"]["median"],
                "changes": scenario.get("changes", {}),
                "impact": {
                    "probability_change": round(prob_change, 1),
                    "wealth_change": round(wealth_change, 0),
                    "recommendation": "Recommended" if prob_change > 5 else "Consider" if prob_change > 0 else "Not recommended"
                }
            })
        
        # Find best scenario
        best = max(comparisons[1:], key=lambda x: x["success_probability"]) if len(comparisons) > 1 else None
        
        return {
            "base_scenario": comparisons[0],
            "scenarios": comparisons[1:],
            "best_scenario": best["name"] if best else None,
            "max_improvement": best["impact"]["probability_change"] if best and "impact" in best else 0,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }


class DecisionCenter:
    """
    Real-time scenario modeling for advisor meetings.
    Provides instant updates when parameters change.
    """
    
    def __init__(self):
        self.engine = MonteCarloEngine(num_simulations=5000)  # Fewer for speed
        self.cache = {}
    
    def quick_analysis(
        self,
        current_age: int,
        retirement_age: int,
        current_wealth: float,
        annual_savings: float,
        annual_expenses: float,
        risk_profile: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Quick analysis for real-time slider updates.
        Uses simplified model for speed.
        """
        # Risk profile to volatility mapping
        volatility_map = {
            "conservative": 0.08,
            "balanced": 0.12,
            "growth": 0.16,
            "aggressive": 0.20
        }
        volatility = volatility_map.get(risk_profile, 0.12)
        
        return_map = {
            "conservative": 0.05,
            "balanced": 0.07,
            "growth": 0.08,
            "aggressive": 0.09
        }
        expected_return = return_map.get(risk_profile, 0.07)
        
        result = self.engine.run_retirement_simulation(
            current_age=current_age,
            retirement_age=retirement_age,
            current_wealth=current_wealth,
            annual_savings=annual_savings,
            annual_expenses=annual_expenses,
            expected_return=expected_return,
            volatility=volatility
        )
        
        return {
            "success_probability": result["success_metrics"]["success_probability"],
            "failure_probability": result["success_metrics"]["failure_probability"],
            "retirement_wealth_median": result["wealth_at_retirement"]["median"],
            "retirement_wealth_range": {
                "low": result["wealth_at_retirement"]["p10"],
                "high": result["wealth_at_retirement"]["p90"]
            },
            "safe_annual_spending": result["safe_withdrawal"]["recommended_annual"],
            "safe_monthly_spending": result["safe_withdrawal"]["recommended_monthly"],
            "risk_status": self._get_risk_status(result["success_metrics"]["success_probability"]),
            "recommendations": self._generate_quick_recommendations(result, current_age, retirement_age, annual_savings)
        }
    
    def _get_risk_status(self, probability: float) -> Dict[str, str]:
        """Get risk status based on success probability."""
        if probability >= 90:
            return {"status": "excellent", "label": "Excellent", "color": "green"}
        elif probability >= 75:
            return {"status": "on_track", "label": "On Track", "color": "blue"}
        elif probability >= 60:
            return {"status": "moderate", "label": "Moderate Risk", "color": "yellow"}
        elif probability >= 40:
            return {"status": "at_risk", "label": "At Risk", "color": "orange"}
        else:
            return {"status": "critical", "label": "Critical", "color": "red"}
    
    def _generate_quick_recommendations(
        self, 
        result: Dict, 
        current_age: int,
        retirement_age: int,
        annual_savings: float
    ) -> List[Dict]:
        """Generate quick recommendations."""
        recommendations = []
        prob = result["success_metrics"]["success_probability"]
        
        if prob < 80:
            # Delay retirement recommendation
            years_delay = min(5, int((80 - prob) / 5) + 1)
            recommendations.append({
                "type": "delay_retirement",
                "title": f"Delay retirement by {years_delay} years",
                "description": f"Retiring at {retirement_age + years_delay} could significantly improve outcomes",
                "impact": f"+{years_delay * 3}% success probability"
            })
            
            # Increase savings recommendation
            savings_increase = annual_savings * 0.2
            recommendations.append({
                "type": "increase_savings",
                "title": f"Increase savings by ${savings_increase:,.0f}/year",
                "description": "20% increase in annual savings",
                "impact": "+5-10% success probability"
            })
        
        if prob >= 90:
            # Early retirement opportunity
            recommendations.append({
                "type": "early_retirement",
                "title": "Early retirement possible",
                "description": f"Could potentially retire up to 3 years earlier",
                "impact": "Maintain >75% success probability"
            })
        
        return recommendations
