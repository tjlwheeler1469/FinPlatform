"""
Financial Knowledge Graph - Query Engine
=========================================

Supports complex graph queries for financial analysis:
- Which clients are overweight a sector?
- Which clients are at retirement risk?
- Which portfolios need rebalancing?
- Where is the largest revenue opportunity?
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .graph_db import get_neo4j_manager, get_embedded_graph

logger = logging.getLogger(__name__)


class GraphQueryEngine:
    """
    Query engine for the Financial Knowledge Graph.
    Translates business questions into graph traversals.
    """
    
    def __init__(self):
        self.graph = get_embedded_graph()
    
    # ==================== SECTOR ANALYSIS ====================
    
    async def get_clients_overweight_sector(self, sector_code: str = None, threshold: float = 0.10) -> List[Dict[str, Any]]:
        """
        Find clients who are overweight in a specific sector (or any sector).
        
        Query pattern:
        (Client)-[:OWNS]->(Portfolio)-[:HOLDS]->(Asset)-[:IN_SECTOR]->(Sector)
        
        Args:
            sector_code: Specific sector to check (e.g., "XFJ" for Financials)
            threshold: Overweight threshold above benchmark (default 10%)
        
        Returns:
            List of clients with their sector exposure details
        """
        results = []
        
        # Get all sectors with their benchmarks
        sectors = {s["id"]: s for s in self.graph.get_nodes_by_label("Sector")}
        
        # Get all clients
        clients = self.graph.get_nodes_by_label("Client")
        
        for client in clients:
            # Get client's portfolios
            portfolios = self.graph.get_connected_nodes(client["id"], "OWNS", "outgoing")
            
            # Calculate sector exposure across all portfolios
            sector_exposure = {}
            total_portfolio_value = 0
            
            for portfolio in portfolios:
                portfolio_data = self.graph.get_node(portfolio["id"])
                if not portfolio_data:
                    continue
                
                total_portfolio_value += portfolio_data.get("total_value", 0)
                
                # Get holdings
                holdings = self.graph.get_connected_nodes(portfolio["id"], "HOLDS", "outgoing")
                
                for holding in holdings:
                    rel = holding.get("_relationship", {})
                    holding_value = rel.get("properties", {}).get("value", 0)
                    
                    # Get asset's sector
                    asset_data = self.graph.get_node(holding["id"])
                    if asset_data and asset_data.get("sector_id"):
                        sector_id = asset_data["sector_id"]
                        if sector_id not in sector_exposure:
                            sector_exposure[sector_id] = 0
                        sector_exposure[sector_id] += holding_value
            
            # Check for overweight sectors
            if total_portfolio_value > 0:
                overweight_sectors = []
                
                for sector_id, exposure_value in sector_exposure.items():
                    sector = sectors.get(sector_id, {})
                    sector_weight = exposure_value / total_portfolio_value
                    benchmark_weight = sector.get("weight_benchmark", 0)
                    
                    # Check if overweight
                    if sector_weight > benchmark_weight + threshold:
                        if sector_code is None or sector.get("code") == sector_code:
                            overweight_sectors.append({
                                "sector_id": sector_id,
                                "sector_name": sector.get("name", "Unknown"),
                                "sector_code": sector.get("code", ""),
                                "client_weight": round(sector_weight * 100, 1),
                                "benchmark_weight": round(benchmark_weight * 100, 1),
                                "overweight_by": round((sector_weight - benchmark_weight) * 100, 1),
                                "exposure_value": exposure_value
                            })
                
                if overweight_sectors:
                    results.append({
                        "client_id": client["id"],
                        "client_name": client.get("name", "Unknown"),
                        "total_portfolio_value": total_portfolio_value,
                        "overweight_sectors": overweight_sectors
                    })
        
        return sorted(results, key=lambda x: max([s["overweight_by"] for s in x["overweight_sectors"]]), reverse=True)
    
    # ==================== RETIREMENT RISK ====================
    
    async def get_clients_at_retirement_risk(self, 
                                             years_to_retirement_threshold: int = 15,
                                             funding_ratio_threshold: float = 0.70) -> List[Dict[str, Any]]:
        """
        Find clients who are at risk of not meeting retirement goals.
        
        Risk factors:
        - Less than X years to retirement
        - Retirement goal less than Y% funded
        - Insufficient growth rate to reach goal
        
        Query pattern:
        (Client)-[:HAS_PLAN]->(FinancialPlan)-[:HAS_GOAL]->(Goal {type: "retirement"})
        """
        results = []
        
        clients = self.graph.get_nodes_by_label("Client")
        plans = {p["id"]: p for p in self.graph.get_nodes_by_label("FinancialPlan")}
        
        for client in clients:
            client_age = client.get("age", 40)
            retirement_age = client.get("retirement_age", 65)
            years_to_retirement = retirement_age - client_age
            
            # Get client's financial plan
            plan_rels = self.graph.get_connected_nodes(client["id"], "HAS_PLAN", "outgoing")
            
            retirement_risk = None
            
            for plan_rel in plan_rels:
                plan = plans.get(plan_rel["id"], {})
                goals = plan.get("goals", [])
                
                for goal in goals:
                    # Check if it's a retirement-related goal
                    goal_name = goal.get("name", "").lower()
                    if "retirement" in goal_name or "retire" in goal_name:
                        target = goal.get("target", 0)
                        current = goal.get("current", 0)
                        funding_ratio = current / target if target > 0 else 0
                        
                        # Calculate required annual growth
                        if years_to_retirement > 0 and current > 0:
                            required_growth = ((target / current) ** (1 / years_to_retirement)) - 1
                        else:
                            required_growth = 0
                        
                        # Assess risk
                        risk_score = 0
                        risk_factors = []
                        
                        if years_to_retirement < years_to_retirement_threshold:
                            risk_score += 30
                            risk_factors.append(f"Only {years_to_retirement} years to retirement")
                        
                        if funding_ratio < funding_ratio_threshold:
                            risk_score += 40
                            risk_factors.append(f"Only {funding_ratio*100:.0f}% funded")
                        
                        if required_growth > 0.12:  # >12% annual growth needed
                            risk_score += 30
                            risk_factors.append(f"Requires {required_growth*100:.1f}% annual growth")
                        
                        if risk_score > 0:
                            retirement_risk = {
                                "goal_name": goal.get("name"),
                                "target_amount": target,
                                "current_amount": current,
                                "funding_ratio": round(funding_ratio * 100, 1),
                                "years_to_retirement": years_to_retirement,
                                "required_annual_growth": round(required_growth * 100, 1),
                                "risk_score": risk_score,
                                "risk_factors": risk_factors,
                                "status": goal.get("status", "unknown")
                            }
            
            if retirement_risk:
                results.append({
                    "client_id": client["id"],
                    "client_name": client.get("name", "Unknown"),
                    "age": client_age,
                    "retirement_age": retirement_age,
                    "retirement_risk": retirement_risk
                })
        
        return sorted(results, key=lambda x: x["retirement_risk"]["risk_score"], reverse=True)
    
    # ==================== REBALANCING ====================
    
    async def get_portfolios_needing_rebalance(self, drift_threshold: float = 0.05) -> List[Dict[str, Any]]:
        """
        Find portfolios that have drifted from their target allocation.
        
        Query pattern:
        (Portfolio)-[:HOLDS]->(Asset)-[:IN_SECTOR]->(Sector)
        Compare actual vs target allocation
        """
        results = []
        
        portfolios = self.graph.get_nodes_by_label("Portfolio")
        
        # Default target allocations by risk profile
        target_allocations = {
            "conservative": {"stocks": 0.30, "bonds": 0.50, "cash": 0.15, "crypto": 0.00, "property": 0.05},
            "moderate": {"stocks": 0.50, "bonds": 0.30, "cash": 0.10, "crypto": 0.05, "property": 0.05},
            "growth": {"stocks": 0.70, "bonds": 0.15, "cash": 0.05, "crypto": 0.05, "property": 0.05},
            "aggressive": {"stocks": 0.60, "bonds": 0.10, "cash": 0.05, "crypto": 0.20, "property": 0.05},
        }
        
        for portfolio in portfolios:
            total_value = portfolio.get("total_value", 0)
            if total_value == 0:
                continue
            
            # Get client's risk profile
            client_id = portfolio.get("client_id")
            client = self.graph.get_node(client_id) if client_id else None
            risk_profile = client.get("risk_profile", "moderate") if client else "moderate"
            target = target_allocations.get(risk_profile, target_allocations["moderate"])
            
            # Calculate current allocation by asset class
            holdings = self.graph.get_connected_nodes(portfolio["id"], "HOLDS", "outgoing")
            current_allocation = {"stocks": 0, "etfs": 0, "bonds": 0, "cash": 0, "crypto": 0, "funds": 0, "property": 0}
            
            for holding in holdings:
                rel = holding.get("_relationship", {})
                holding_value = rel.get("properties", {}).get("value", 0)
                asset_class = holding.get("asset_class", "stocks")
                
                if asset_class in current_allocation:
                    current_allocation[asset_class] += holding_value / total_value
            
            # Combine stocks and etfs
            current_allocation["stocks"] += current_allocation.get("etfs", 0)
            current_allocation["stocks"] += current_allocation.get("funds", 0)
            
            # Calculate drift
            drifts = []
            trades_needed = []
            
            for asset_class, target_weight in target.items():
                current_weight = current_allocation.get(asset_class, 0)
                drift = current_weight - target_weight
                
                if abs(drift) > drift_threshold:
                    drift_amount = drift * total_value
                    drifts.append({
                        "asset_class": asset_class,
                        "current_weight": round(current_weight * 100, 1),
                        "target_weight": round(target_weight * 100, 1),
                        "drift": round(drift * 100, 1),
                        "drift_amount": round(drift_amount, 0)
                    })
                    
                    if drift > 0:
                        trades_needed.append({
                            "action": "SELL",
                            "asset_class": asset_class,
                            "amount": round(abs(drift_amount), 0)
                        })
                    else:
                        trades_needed.append({
                            "action": "BUY",
                            "asset_class": asset_class,
                            "amount": round(abs(drift_amount), 0)
                        })
            
            if drifts:
                results.append({
                    "portfolio_id": portfolio["id"],
                    "portfolio_name": portfolio.get("name", "Unknown"),
                    "client_id": client_id,
                    "client_name": client.get("name", "Unknown") if client else "Unknown",
                    "total_value": total_value,
                    "risk_profile": risk_profile,
                    "drifts": drifts,
                    "trades_needed": trades_needed,
                    "max_drift": max([abs(d["drift"]) for d in drifts])
                })
        
        return sorted(results, key=lambda x: x["max_drift"], reverse=True)
    
    # ==================== REVENUE OPPORTUNITIES ====================
    
    async def get_revenue_opportunities(self) -> List[Dict[str, Any]]:
        """
        Identify revenue opportunities across the advisor book.
        
        Opportunities:
        - Under-invested cash (large cash holdings)
        - Missing product penetration
        - Consolidation opportunities
        - Fee optimization
        """
        results = []
        
        clients = self.graph.get_nodes_by_label("Client")
        portfolios = {p["id"]: p for p in self.graph.get_nodes_by_label("Portfolio")}
        
        for client in clients:
            opportunities = []
            
            # Get client's portfolios
            client_portfolios = self.graph.get_connected_nodes(client["id"], "OWNS", "outgoing")
            
            total_value = 0
            cash_value = 0
            
            for port_rel in client_portfolios:
                portfolio = portfolios.get(port_rel["id"], {})
                total_value += portfolio.get("total_value", 0)
                
                # Check holdings for cash
                holdings = self.graph.get_connected_nodes(port_rel["id"], "HOLDS", "outgoing")
                for holding in holdings:
                    if holding.get("asset_class") == "cash":
                        rel = holding.get("_relationship", {})
                        cash_value += rel.get("properties", {}).get("value", 0)
            
            # Opportunity 1: Large cash holdings
            if total_value > 0:
                cash_ratio = cash_value / total_value
                if cash_ratio > 0.15:  # >15% in cash
                    potential_revenue = (cash_ratio - 0.10) * total_value * 0.01  # Assume 1% fee on invested
                    opportunities.append({
                        "type": "under_invested_cash",
                        "description": f"Client has {cash_ratio*100:.0f}% in cash - potential to invest",
                        "potential_revenue": round(potential_revenue, 0),
                        "probability": 0.7,
                        "action": f"Recommend investing ${(cash_ratio-0.10)*total_value:,.0f} into diversified portfolio"
                    })
            
            # Opportunity 2: Missing insurance products
            # (Simplified - in reality would check product holdings)
            if client.get("age", 40) < 55 and total_value > 500000:
                opportunities.append({
                    "type": "insurance_gap",
                    "description": "High net worth client without insurance review",
                    "potential_revenue": 2500,  # Annual premium commission
                    "probability": 0.4,
                    "action": "Schedule insurance needs analysis"
                })
            
            # Opportunity 3: Super consolidation
            # (Would check for multiple super accounts)
            if client.get("age", 40) > 35:
                opportunities.append({
                    "type": "super_consolidation",
                    "description": "Potential to consolidate super accounts",
                    "potential_revenue": total_value * 0.002,  # 0.2% ongoing fee
                    "probability": 0.5,
                    "action": "Review super holdings for consolidation"
                })
            
            if opportunities:
                total_potential = sum([o["potential_revenue"] * o["probability"] for o in opportunities])
                results.append({
                    "client_id": client["id"],
                    "client_name": client.get("name", "Unknown"),
                    "total_value": total_value,
                    "opportunities": opportunities,
                    "total_potential_revenue": round(total_potential, 0)
                })
        
        return sorted(results, key=lambda x: x["total_potential_revenue"], reverse=True)
    
    # ==================== CROSS-CLIENT PATTERNS ====================
    
    async def detect_cross_client_risks(self) -> List[Dict[str, Any]]:
        """
        Detect patterns and risks across multiple clients.
        
        Patterns:
        - Concentration in same assets across book
        - Correlated portfolios
        - Systemic sector exposure
        """
        results = []
        
        # Get all holdings across all portfolios
        portfolios = self.graph.get_nodes_by_label("Portfolio")
        clients = {c["id"]: c for c in self.graph.get_nodes_by_label("Client")}
        
        # Track asset exposure across all clients
        asset_exposure = {}  # asset_id -> list of {client_id, value, weight}
        sector_exposure = {}  # sector_id -> total_value
        
        total_aum = 0
        
        for portfolio in portfolios:
            client_id = portfolio.get("client_id")
            client = clients.get(client_id, {})
            portfolio_value = portfolio.get("total_value", 0)
            total_aum += portfolio_value
            
            holdings = self.graph.get_connected_nodes(portfolio["id"], "HOLDS", "outgoing")
            
            for holding in holdings:
                rel = holding.get("_relationship", {})
                holding_value = rel.get("properties", {}).get("value", 0)
                
                # Track asset exposure
                asset_id = holding["id"]
                if asset_id not in asset_exposure:
                    asset_exposure[asset_id] = {
                        "asset_name": holding.get("name", "Unknown"),
                        "symbol": holding.get("symbol", ""),
                        "total_value": 0,
                        "client_count": 0,
                        "clients": []
                    }
                
                asset_exposure[asset_id]["total_value"] += holding_value
                asset_exposure[asset_id]["client_count"] += 1
                asset_exposure[asset_id]["clients"].append({
                    "client_id": client_id,
                    "client_name": client.get("name", "Unknown"),
                    "value": holding_value
                })
                
                # Track sector exposure
                sector_id = holding.get("sector_id")
                if sector_id:
                    if sector_id not in sector_exposure:
                        sector = self.graph.get_node(sector_id)
                        sector_exposure[sector_id] = {
                            "sector_name": sector.get("name", "Unknown") if sector else "Unknown",
                            "total_value": 0
                        }
                    sector_exposure[sector_id]["total_value"] += holding_value
        
        # Identify concentrated assets (>10% of AUM in single asset)
        for asset_id, exposure in asset_exposure.items():
            if total_aum > 0:
                concentration = exposure["total_value"] / total_aum
                if concentration > 0.10 and exposure["client_count"] > 1:
                    results.append({
                        "risk_type": "asset_concentration",
                        "severity": 4 if concentration > 0.20 else 3,
                        "title": f"High concentration in {exposure['symbol']}",
                        "description": f"{exposure['symbol']} represents {concentration*100:.1f}% of total AUM across {exposure['client_count']} clients",
                        "affected_clients": exposure["clients"],
                        "total_exposure": exposure["total_value"],
                        "recommendation": f"Consider reducing {exposure['symbol']} exposure across portfolios"
                    })
        
        # Identify concentrated sectors (>40% of AUM)
        for sector_id, exposure in sector_exposure.items():
            if total_aum > 0:
                concentration = exposure["total_value"] / total_aum
                if concentration > 0.40:
                    results.append({
                        "risk_type": "sector_concentration",
                        "severity": 4,
                        "title": f"Book-wide {exposure['sector_name']} sector concentration",
                        "description": f"{exposure['sector_name']} sector represents {concentration*100:.1f}% of total AUM",
                        "total_exposure": exposure["total_value"],
                        "recommendation": f"Diversify away from {exposure['sector_name']} sector across client portfolios"
                    })
        
        return sorted(results, key=lambda x: x["severity"], reverse=True)
    
    # ==================== INSIGHT GENERATION ====================
    
    async def get_active_insights(self) -> List[Dict[str, Any]]:
        """Get all active insights from the graph"""
        insights = self.graph.get_nodes_by_label("Insight")
        
        results = []
        for insight in insights:
            # Get related clients
            client_rels = self.graph.get_connected_nodes(insight["id"], "RELATES_TO", "outgoing")
            clients = [{"id": c["id"], "name": c.get("name")} for c in client_rels]
            
            # Get recommended actions
            action_rels = self.graph.get_connected_nodes(insight["id"], "RECOMMENDS", "outgoing")
            actions = []
            for action in action_rels:
                actions.append({
                    "id": action["id"],
                    "title": action.get("title"),
                    "type": action.get("type"),
                    "status": action.get("status"),
                    "priority": action.get("priority"),
                    "impact_score": action.get("impact_score")
                })
            
            results.append({
                "id": insight["id"],
                "type": insight.get("type"),
                "severity": insight.get("severity"),
                "title": insight.get("title"),
                "description": insight.get("description"),
                "affected_clients": clients,
                "recommended_actions": actions,
                "created_at": insight.get("created_at")
            })
        
        return sorted(results, key=lambda x: x["severity"], reverse=True)
    
    async def get_pending_actions(self) -> List[Dict[str, Any]]:
        """Get all pending actions sorted by priority and impact"""
        actions = self.graph.get_nodes_by_label("Action")
        
        results = []
        for action in actions:
            if action.get("status") == "pending":
                # Get related insight
                insight_id = action.get("insight_id")
                insight = self.graph.get_node(insight_id) if insight_id else None
                
                # Get related client
                client_id = action.get("client_id")
                client = self.graph.get_node(client_id) if client_id else None
                
                results.append({
                    "id": action["id"],
                    "title": action.get("title"),
                    "description": action.get("description"),
                    "type": action.get("type"),
                    "status": action.get("status"),
                    "priority": action.get("priority"),
                    "impact_score": action.get("impact_score"),
                    "client": {"id": client_id, "name": client.get("name") if client else "Unknown"},
                    "insight": {"id": insight_id, "title": insight.get("title") if insight else "Unknown"}
                })
        
        # Sort by priority (ascending) then impact_score (descending)
        return sorted(results, key=lambda x: (x["priority"], -x["impact_score"]))


# Create global query engine instance
_query_engine: Optional[GraphQueryEngine] = None


def get_query_engine() -> GraphQueryEngine:
    """Get or create the query engine instance"""
    global _query_engine
    if _query_engine is None:
        _query_engine = GraphQueryEngine()
    return _query_engine
