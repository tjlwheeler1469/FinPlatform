"""
Financial Knowledge Graph - Neo4j Graph Database Manager
=========================================================

Manages the Neo4j graph database for relationship queries.
Syncs with MongoDB for transactional data storage.
"""

import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# Neo4j connection - will be initialized on startup
_neo4j_driver = None
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")

# Flag to use embedded graph if Neo4j not available
USE_EMBEDDED_GRAPH = True  # Fallback to in-memory graph


class EmbeddedGraph:
    """
    In-memory graph implementation for when Neo4j is not available.
    Uses dictionaries to simulate graph structure.
    """
    
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.relationships: List[Dict[str, Any]] = []
        self._initialize_demo_data()
    
    def _initialize_demo_data(self):
        """Initialize with demo financial data"""
        # Sectors
        sectors = [
            {"id": "sector_fin", "label": "Sector", "name": "Financials", "code": "XFJ", "weight_benchmark": 0.28},
            {"id": "sector_mat", "label": "Sector", "name": "Materials", "code": "XMJ", "weight_benchmark": 0.22},
            {"id": "sector_hc", "label": "Sector", "name": "Healthcare", "code": "XHJ", "weight_benchmark": 0.10},
            {"id": "sector_tech", "label": "Sector", "name": "Technology", "code": "XIJ", "weight_benchmark": 0.05},
            {"id": "sector_energy", "label": "Sector", "name": "Energy", "code": "XEJ", "weight_benchmark": 0.05},
            {"id": "sector_re", "label": "Sector", "name": "Real Estate", "code": "XRE", "weight_benchmark": 0.07},
        ]
        
        # Assets
        assets = [
            {"id": "asset_cba", "label": "Asset", "symbol": "CBA", "name": "Commonwealth Bank", "sector_id": "sector_fin", "price": 118.50, "asset_class": "stocks"},
            {"id": "asset_bhp", "label": "Asset", "symbol": "BHP", "name": "BHP Group", "sector_id": "sector_mat", "price": 45.50, "asset_class": "stocks"},
            {"id": "asset_csl", "label": "Asset", "symbol": "CSL", "name": "CSL Limited", "sector_id": "sector_hc", "price": 295.00, "asset_class": "stocks"},
            {"id": "asset_wbc", "label": "Asset", "symbol": "WBC", "name": "Westpac Banking", "sector_id": "sector_fin", "price": 28.50, "asset_class": "stocks"},
            {"id": "asset_nab", "label": "Asset", "symbol": "NAB", "name": "National Australia Bank", "sector_id": "sector_fin", "price": 35.20, "asset_class": "stocks"},
            {"id": "asset_vas", "label": "Asset", "symbol": "VAS", "name": "Vanguard Aus Shares ETF", "sector_id": None, "price": 95.50, "asset_class": "etfs"},
            {"id": "asset_btc", "label": "Asset", "symbol": "BTC", "name": "Bitcoin", "sector_id": None, "price": 73500, "asset_class": "crypto"},
            {"id": "asset_eth", "label": "Asset", "symbol": "ETH", "name": "Ethereum", "sector_id": None, "price": 3720, "asset_class": "crypto"},
            {"id": "asset_bond1", "label": "Asset", "symbol": "ACGB-34", "name": "Aus Gov 10Y Bond", "sector_id": None, "price": 102.0, "asset_class": "bonds"},
        ]
        
        # Advisors
        advisors = [
            {"id": "advisor_1", "label": "Advisor", "name": "Mark Thompson", "email": "mark.thompson@wealthcommand.io", "total_aum": 22500000},
            {"id": "advisor_2", "label": "Advisor", "name": "Sarah Chen", "email": "sarah.chen@wealthcommand.io", "total_aum": 18200000},
        ]
        
        # Households
        households = [
            {"id": "household_1", "label": "Household", "name": "Wheeler Family", "combined_net_worth": 4250000},
            {"id": "household_2", "label": "Household", "name": "Smith Family", "combined_net_worth": 3100000},
            {"id": "household_3", "label": "Household", "name": "Johnson Family", "combined_net_worth": 2850000},
        ]
        
        # Clients
        clients = [
            {"id": "client_1", "label": "Client", "name": "James Wheeler", "email": "james@email.com", "risk_profile": "growth", "net_worth": 2850000, "retirement_age": 65, "age": 52, "household_id": "household_1", "advisor_id": "advisor_1"},
            {"id": "client_2", "label": "Client", "name": "Sarah Wheeler", "email": "sarah.w@email.com", "risk_profile": "moderate", "net_worth": 1400000, "retirement_age": 65, "age": 50, "household_id": "household_1", "advisor_id": "advisor_1"},
            {"id": "client_3", "label": "Client", "name": "Michael Smith", "email": "michael.s@email.com", "risk_profile": "aggressive", "net_worth": 1850000, "retirement_age": 60, "age": 45, "household_id": "household_2", "advisor_id": "advisor_1"},
            {"id": "client_4", "label": "Client", "name": "Emma Smith", "email": "emma.s@email.com", "risk_profile": "conservative", "net_worth": 1250000, "retirement_age": 67, "age": 43, "household_id": "household_2", "advisor_id": "advisor_1"},
            {"id": "client_5", "label": "Client", "name": "Robert Johnson", "email": "robert.j@email.com", "risk_profile": "growth", "net_worth": 2850000, "retirement_age": 62, "age": 58, "household_id": "household_3", "advisor_id": "advisor_2"},
            {"id": "client_6", "label": "Client", "name": "Lisa Johnson", "email": "lisa.j@email.com", "risk_profile": "moderate", "net_worth": 0, "retirement_age": 65, "age": 55, "household_id": "household_3", "advisor_id": "advisor_2"},
        ]
        
        # Portfolios with holdings
        portfolios = [
            {
                "id": "portfolio_1", "label": "Portfolio", "name": "Wheeler Growth", "client_id": "client_1", "total_value": 1850000,
                "holdings": [
                    {"asset_id": "asset_cba", "units": 2000, "value": 237000, "weight": 0.128},
                    {"asset_id": "asset_bhp", "units": 5000, "value": 227500, "weight": 0.123},
                    {"asset_id": "asset_wbc", "units": 8000, "value": 228000, "weight": 0.123},
                    {"asset_id": "asset_nab", "units": 6000, "value": 211200, "weight": 0.114},
                    {"asset_id": "asset_vas", "units": 5000, "value": 477500, "weight": 0.258},
                    {"asset_id": "asset_btc", "units": 2.5, "value": 183750, "weight": 0.099},
                    {"asset_id": "asset_csl", "units": 300, "value": 88500, "weight": 0.048},
                ]
            },
            {
                "id": "portfolio_2", "label": "Portfolio", "name": "Smith Aggressive", "client_id": "client_3", "total_value": 1250000,
                "holdings": [
                    {"asset_id": "asset_cba", "units": 1500, "value": 177750, "weight": 0.142},
                    {"asset_id": "asset_bhp", "units": 4000, "value": 182000, "weight": 0.146},
                    {"asset_id": "asset_btc", "units": 5.0, "value": 367500, "weight": 0.294},
                    {"asset_id": "asset_eth", "units": 50, "value": 186000, "weight": 0.149},
                    {"asset_id": "asset_csl", "units": 400, "value": 118000, "weight": 0.094},
                ]
            },
            {
                "id": "portfolio_3", "label": "Portfolio", "name": "Johnson Balanced", "client_id": "client_5", "total_value": 2100000,
                "holdings": [
                    {"asset_id": "asset_cba", "units": 3000, "value": 355500, "weight": 0.169},
                    {"asset_id": "asset_wbc", "units": 5000, "value": 142500, "weight": 0.068},
                    {"asset_id": "asset_nab", "units": 4000, "value": 140800, "weight": 0.067},
                    {"asset_id": "asset_vas", "units": 8000, "value": 764000, "weight": 0.364},
                    {"asset_id": "asset_bond1", "units": 3000, "value": 306000, "weight": 0.146},
                    {"asset_id": "asset_bhp", "units": 3000, "value": 136500, "weight": 0.065},
                ]
            },
        ]
        
        # Financial Plans with Goals
        plans = [
            {
                "id": "plan_1", "label": "FinancialPlan", "name": "Wheeler Retirement Plan", "client_id": "client_1", "risk_profile": "growth",
                "goals": [
                    {"id": "goal_1", "name": "Retirement Fund", "target": 3000000, "current": 1850000, "deadline": "2038-01-01", "status": "active"},
                    {"id": "goal_2", "name": "Investment Property", "target": 500000, "current": 180000, "deadline": "2027-01-01", "status": "active"},
                ]
            },
            {
                "id": "plan_2", "label": "FinancialPlan", "name": "Smith Wealth Building", "client_id": "client_3", "risk_profile": "aggressive",
                "goals": [
                    {"id": "goal_3", "name": "Early Retirement", "target": 2500000, "current": 1250000, "deadline": "2035-01-01", "status": "at_risk"},
                    {"id": "goal_4", "name": "Children Education", "target": 200000, "current": 45000, "deadline": "2030-01-01", "status": "active"},
                ]
            },
            {
                "id": "plan_3", "label": "FinancialPlan", "name": "Johnson Preservation", "client_id": "client_5", "risk_profile": "moderate",
                "goals": [
                    {"id": "goal_5", "name": "Retirement Income", "target": 2500000, "current": 2100000, "deadline": "2030-01-01", "status": "active"},
                ]
            },
        ]
        
        # Insights
        insights = [
            {
                "id": "insight_1", "label": "Insight", "type": "risk_alert", "severity": 4,
                "title": "Financials Sector Overweight", 
                "description": "3 clients have >30% allocation to Financials sector, exceeding benchmark by 10%+",
                "client_ids": ["client_1", "client_3", "client_5"],
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "insight_2", "label": "Insight", "type": "risk_alert", "severity": 5,
                "title": "Crypto Concentration Risk",
                "description": "Smith portfolio has 44% in cryptocurrency, significantly above risk tolerance",
                "client_ids": ["client_3"],
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "insight_3", "label": "Insight", "type": "opportunity", "severity": 2,
                "title": "Tax Loss Harvesting Opportunity",
                "description": "CSL position showing unrealized loss - potential tax harvesting opportunity",
                "client_ids": ["client_1"],
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "insight_4", "label": "Insight", "type": "goal_progress", "severity": 4,
                "title": "Retirement Goal at Risk",
                "description": "Smith early retirement goal only 50% funded with 10 years remaining",
                "client_ids": ["client_3"],
                "created_at": datetime.utcnow().isoformat()
            },
        ]
        
        # Actions (recommendations)
        actions = [
            {
                "id": "action_1", "label": "Action", "type": "rebalance", "status": "pending",
                "title": "Reduce Financials Exposure",
                "description": "Sell 30% of bank holdings, reallocate to Healthcare and Tech",
                "insight_id": "insight_1", "client_id": "client_1",
                "impact_score": 8.5, "priority": 2
            },
            {
                "id": "action_2", "label": "Action", "type": "sell", "status": "pending",
                "title": "Reduce Crypto Position",
                "description": "Sell 50% of BTC and ETH holdings to reduce concentration risk",
                "insight_id": "insight_2", "client_id": "client_3",
                "impact_score": 9.2, "priority": 1
            },
            {
                "id": "action_3", "label": "Action", "type": "sell", "status": "pending",
                "title": "Harvest Tax Loss on CSL",
                "description": "Sell CSL position to realize loss, repurchase after wash sale period",
                "insight_id": "insight_3", "client_id": "client_1",
                "impact_score": 6.0, "priority": 3
            },
            {
                "id": "action_4", "label": "Action", "type": "review", "status": "pending",
                "title": "Increase Retirement Contributions",
                "description": "Review and increase monthly contributions to retirement goal",
                "insight_id": "insight_4", "client_id": "client_3",
                "impact_score": 7.8, "priority": 2
            },
        ]
        
        # Add all nodes
        for sector in sectors:
            self.nodes[sector["id"]] = sector
        for asset in assets:
            self.nodes[asset["id"]] = asset
        for advisor in advisors:
            self.nodes[advisor["id"]] = advisor
        for household in households:
            self.nodes[household["id"]] = household
        for client in clients:
            self.nodes[client["id"]] = client
        for portfolio in portfolios:
            self.nodes[portfolio["id"]] = portfolio
        for plan in plans:
            self.nodes[plan["id"]] = plan
        for insight in insights:
            self.nodes[insight["id"]] = insight
        for action in actions:
            self.nodes[action["id"]] = action
        
        # Create relationships
        # Client -> Household
        for client in clients:
            if client.get("household_id"):
                self.relationships.append({
                    "source": client["id"], "target": client["household_id"], 
                    "type": "MEMBER_OF"
                })
        
        # Client -> Advisor
        for client in clients:
            if client.get("advisor_id"):
                self.relationships.append({
                    "source": client["id"], "target": client["advisor_id"],
                    "type": "MANAGED_BY"
                })
        
        # Portfolio -> Client (owns)
        for portfolio in portfolios:
            self.relationships.append({
                "source": portfolio["client_id"], "target": portfolio["id"],
                "type": "OWNS"
            })
        
        # Portfolio -> Asset (holds)
        for portfolio in portfolios:
            for holding in portfolio.get("holdings", []):
                self.relationships.append({
                    "source": portfolio["id"], "target": holding["asset_id"],
                    "type": "HOLDS", 
                    "properties": {"units": holding["units"], "value": holding["value"], "weight": holding["weight"]}
                })
        
        # Asset -> Sector
        for asset in assets:
            if asset.get("sector_id"):
                self.relationships.append({
                    "source": asset["id"], "target": asset["sector_id"],
                    "type": "IN_SECTOR"
                })
        
        # Client -> FinancialPlan
        for plan in plans:
            self.relationships.append({
                "source": plan["client_id"], "target": plan["id"],
                "type": "HAS_PLAN"
            })
        
        # Insight -> Client
        for insight in insights:
            for client_id in insight.get("client_ids", []):
                self.relationships.append({
                    "source": insight["id"], "target": client_id,
                    "type": "RELATES_TO"
                })
        
        # Insight -> Action
        for action in actions:
            if action.get("insight_id"):
                self.relationships.append({
                    "source": action["insight_id"], "target": action["id"],
                    "type": "RECOMMENDS"
                })
        
        logger.info(f"Embedded graph initialized with {len(self.nodes)} nodes and {len(self.relationships)} relationships")
    
    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        return self.nodes.get(node_id)
    
    def get_nodes_by_label(self, label: str) -> List[Dict[str, Any]]:
        return [n for n in self.nodes.values() if n.get("label") == label]
    
    def get_relationships(self, source_id: str = None, target_id: str = None, rel_type: str = None) -> List[Dict[str, Any]]:
        results = self.relationships
        if source_id:
            results = [r for r in results if r["source"] == source_id]
        if target_id:
            results = [r for r in results if r["target"] == target_id]
        if rel_type:
            results = [r for r in results if r["type"] == rel_type]
        return results
    
    def get_connected_nodes(self, node_id: str, rel_type: str = None, direction: str = "outgoing") -> List[Dict[str, Any]]:
        """Get nodes connected to the given node"""
        connected = []
        for rel in self.relationships:
            if direction in ["outgoing", "both"] and rel["source"] == node_id:
                if rel_type is None or rel["type"] == rel_type:
                    node = self.nodes.get(rel["target"])
                    if node:
                        connected.append({**node, "_relationship": rel})
            if direction in ["incoming", "both"] and rel["target"] == node_id:
                if rel_type is None or rel["type"] == rel_type:
                    node = self.nodes.get(rel["source"])
                    if node:
                        connected.append({**node, "_relationship": rel})
        return connected
    
    def traverse(self, start_id: str, path_pattern: List[str], max_depth: int = 5) -> List[List[Dict[str, Any]]]:
        """
        Traverse the graph following a pattern of relationship types.
        Example: traverse("client_1", ["OWNS", "HOLDS", "IN_SECTOR"])
        Returns all paths matching the pattern.
        """
        def _traverse_recursive(current_id: str, remaining_pattern: List[str], current_path: List[Dict], depth: int):
            if depth > max_depth:
                return []
            
            if not remaining_pattern:
                return [current_path]
            
            rel_type = remaining_pattern[0]
            results = []
            
            for rel in self.relationships:
                if rel["source"] == current_id and rel["type"] == rel_type:
                    target_node = self.nodes.get(rel["target"])
                    if target_node:
                        new_path = current_path + [{"relationship": rel, "node": target_node}]
                        results.extend(_traverse_recursive(rel["target"], remaining_pattern[1:], new_path, depth + 1))
            
            return results
        
        start_node = self.nodes.get(start_id)
        if not start_node:
            return []
        
        return _traverse_recursive(start_id, path_pattern, [{"node": start_node}], 0)
    
    def add_node(self, node_id: str, node_data: Dict[str, Any]):
        self.nodes[node_id] = node_data
    
    def add_relationship(self, source_id: str, target_id: str, rel_type: str, properties: Dict[str, Any] = None):
        self.relationships.append({
            "source": source_id,
            "target": target_id,
            "type": rel_type,
            "properties": properties or {}
        })
    
    def update_node(self, node_id: str, updates: Dict[str, Any]):
        if node_id in self.nodes:
            self.nodes[node_id].update(updates)


# Global embedded graph instance
_embedded_graph: Optional[EmbeddedGraph] = None


def get_embedded_graph() -> EmbeddedGraph:
    """Get or create the embedded graph instance"""
    global _embedded_graph
    if _embedded_graph is None:
        _embedded_graph = EmbeddedGraph()
    return _embedded_graph


class Neo4jManager:
    """
    Manages Neo4j database connections and operations.
    Falls back to embedded graph if Neo4j is not available.
    """
    
    def __init__(self):
        self.driver = None
        self.use_embedded = USE_EMBEDDED_GRAPH
        self.embedded_graph = None
    
    async def connect(self):
        """Initialize Neo4j connection or embedded graph"""
        if self.use_embedded:
            self.embedded_graph = get_embedded_graph()
            logger.info("Using embedded in-memory graph")
            return True
        
        try:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            self.driver.verify_connectivity()
            logger.info(f"Connected to Neo4j at {NEO4J_URI}")
            return True
        except Exception as e:
            logger.warning(f"Neo4j connection failed: {e}. Using embedded graph.")
            self.use_embedded = True
            self.embedded_graph = get_embedded_graph()
            return True
    
    async def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    def get_graph(self) -> EmbeddedGraph:
        """Get the graph instance (embedded or Neo4j wrapper)"""
        if self.use_embedded:
            return self.embedded_graph
        # For Neo4j, we'd return a wrapper - for now, use embedded
        return self.embedded_graph
    
    async def execute_query(self, query: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Execute a Cypher-like query (or simulate with embedded graph)"""
        if self.use_embedded:
            return self._execute_embedded_query(query, parameters)
        
        # Real Neo4j query execution would go here
        return []
    
    def _execute_embedded_query(self, query: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Parse and execute query against embedded graph"""
        # Simple query parser for common patterns
        query_lower = query.lower()
        graph = self.embedded_graph
        
        # Match pattern: MATCH (n:Label) RETURN n
        if "match" in query_lower and "return" in query_lower:
            # Extract label if present
            for label in ["Client", "Portfolio", "Asset", "Sector", "Insight", "Action", "Advisor", "Household"]:
                if label.lower() in query_lower:
                    return graph.get_nodes_by_label(label)
        
        return []


# Global Neo4j manager instance
_neo4j_manager: Optional[Neo4jManager] = None


async def get_neo4j_manager() -> Neo4jManager:
    """Get or create the Neo4j manager instance"""
    global _neo4j_manager
    if _neo4j_manager is None:
        _neo4j_manager = Neo4jManager()
        await _neo4j_manager.connect()
    return _neo4j_manager


async def init_knowledge_graph():
    """Initialize the knowledge graph on application startup"""
    manager = await get_neo4j_manager()
    logger.info("Knowledge graph initialized")
    return manager


async def close_knowledge_graph():
    """Close knowledge graph connections on shutdown"""
    global _neo4j_manager
    if _neo4j_manager:
        await _neo4j_manager.close()
        _neo4j_manager = None
