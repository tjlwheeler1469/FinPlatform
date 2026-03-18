"""
Financial Knowledge Graph - API Routes
=======================================

Exposes graph queries and AI insights via REST API.
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import logging

from .query_engine import get_query_engine
from .ai_engine import get_ai_engine
from .graph_db import get_embedded_graph

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])


# ==================== GRAPH OVERVIEW ====================

@router.get("/overview")
async def get_graph_overview():
    """
    Get overview statistics of the knowledge graph.
    """
    graph = get_embedded_graph()
    
    # Count nodes by label
    node_counts = {}
    for node in graph.nodes.values():
        label = node.get("label", "Unknown")
        node_counts[label] = node_counts.get(label, 0) + 1
    
    # Count relationships by type
    rel_counts = {}
    for rel in graph.relationships:
        rel_type = rel.get("type", "Unknown")
        rel_counts[rel_type] = rel_counts.get(rel_type, 0) + 1
    
    # Calculate AUM
    portfolios = graph.get_nodes_by_label("Portfolio")
    total_aum = sum([p.get("total_value", 0) for p in portfolios])
    
    # Count active insights
    insights = graph.get_nodes_by_label("Insight")
    active_insights = len([i for i in insights if i.get("severity", 0) >= 3])
    
    # Count pending actions
    actions = graph.get_nodes_by_label("Action")
    pending_actions = len([a for a in actions if a.get("status") == "pending"])
    
    return {
        "summary": {
            "total_nodes": len(graph.nodes),
            "total_relationships": len(graph.relationships),
            "total_aum": total_aum,
            "active_insights": active_insights,
            "pending_actions": pending_actions
        },
        "node_counts": node_counts,
        "relationship_counts": rel_counts,
        "last_updated": datetime.utcnow().isoformat()
    }


@router.get("/nodes/{label}")
async def get_nodes_by_label(label: str):
    """
    Get all nodes of a specific type/label.
    Valid labels: Client, Household, Advisor, Account, Portfolio, Asset, Sector, 
                  FinancialPlan, Goal, Transaction, Insight, Action
    """
    graph = get_embedded_graph()
    nodes = graph.get_nodes_by_label(label)
    
    return {
        "label": label,
        "count": len(nodes),
        "nodes": nodes
    }


@router.get("/node/{node_id}")
async def get_node(node_id: str, include_relationships: bool = True):
    """
    Get a specific node by ID with its relationships.
    """
    graph = get_embedded_graph()
    node = graph.get_node(node_id)
    
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
    
    result = {"node": node}
    
    if include_relationships:
        # Get outgoing relationships
        outgoing = graph.get_connected_nodes(node_id, direction="outgoing")
        result["outgoing_relationships"] = [
            {
                "type": n.get("_relationship", {}).get("type"),
                "target": {k: v for k, v in n.items() if k != "_relationship"}
            }
            for n in outgoing
        ]
        
        # Get incoming relationships
        incoming = graph.get_connected_nodes(node_id, direction="incoming")
        result["incoming_relationships"] = [
            {
                "type": n.get("_relationship", {}).get("type"),
                "source": {k: v for k, v in n.items() if k != "_relationship"}
            }
            for n in incoming
        ]
    
    return result


# ==================== FINANCIAL QUERIES ====================

@router.get("/queries/sector-overweight")
async def query_clients_overweight_sector(
    sector_code: Optional[str] = None,
    threshold: float = Query(0.10, description="Overweight threshold (default 10%)")
):
    """
    Which clients are overweight a sector?
    
    Query pattern: (Client)-[:OWNS]->(Portfolio)-[:HOLDS]->(Asset)-[:IN_SECTOR]->(Sector)
    """
    engine = get_query_engine()
    results = await engine.get_clients_overweight_sector(sector_code, threshold)
    
    return {
        "query": "clients_overweight_sector",
        "parameters": {"sector_code": sector_code, "threshold": threshold},
        "count": len(results),
        "results": results
    }


@router.get("/queries/retirement-risk")
async def query_clients_at_retirement_risk(
    years_threshold: int = Query(15, description="Years to retirement threshold"),
    funding_threshold: float = Query(0.70, description="Minimum funding ratio")
):
    """
    Which clients are at retirement risk?
    
    Factors: Years to retirement, goal funding ratio, required growth rate
    """
    engine = get_query_engine()
    results = await engine.get_clients_at_retirement_risk(years_threshold, funding_threshold)
    
    return {
        "query": "clients_at_retirement_risk",
        "parameters": {"years_threshold": years_threshold, "funding_threshold": funding_threshold},
        "count": len(results),
        "results": results
    }


@router.get("/queries/rebalance-needed")
async def query_portfolios_needing_rebalance(
    drift_threshold: float = Query(0.05, description="Drift threshold (default 5%)")
):
    """
    Which portfolios need rebalancing?
    
    Compares current allocation vs target allocation by risk profile.
    """
    engine = get_query_engine()
    results = await engine.get_portfolios_needing_rebalance(drift_threshold)
    
    return {
        "query": "portfolios_needing_rebalance",
        "parameters": {"drift_threshold": drift_threshold},
        "count": len(results),
        "results": results
    }


@router.get("/queries/revenue-opportunities")
async def query_revenue_opportunities():
    """
    Where is the largest revenue opportunity?
    
    Identifies: Under-invested cash, missing products, consolidation opportunities
    """
    engine = get_query_engine()
    results = await engine.get_revenue_opportunities()
    
    total_potential = sum([r["total_potential_revenue"] for r in results])
    
    return {
        "query": "revenue_opportunities",
        "total_potential_revenue": total_potential,
        "count": len(results),
        "results": results
    }


@router.get("/queries/cross-client-risks")
async def query_cross_client_risks():
    """
    Detect patterns and risks across multiple clients.
    
    Identifies: Asset concentration, sector concentration, correlated portfolios
    """
    engine = get_query_engine()
    results = await engine.detect_cross_client_risks()
    
    return {
        "query": "cross_client_risks",
        "count": len(results),
        "results": results
    }


# ==================== INSIGHTS & ACTIONS ====================

@router.get("/insights")
async def get_active_insights():
    """
    Get all active insights from the knowledge graph.
    """
    engine = get_query_engine()
    results = await engine.get_active_insights()
    
    return {
        "count": len(results),
        "insights": results
    }


@router.get("/actions/pending")
async def get_pending_actions():
    """
    Get all pending actions sorted by priority.
    """
    engine = get_query_engine()
    results = await engine.get_pending_actions()
    
    return {
        "count": len(results),
        "actions": results
    }


@router.post("/actions/{action_id}/execute")
async def execute_action(action_id: str):
    """
    Execute a pending action and update the graph.
    
    Flow: Insight → Action → Transaction → Portfolio → Client
    """
    graph = get_embedded_graph()
    
    action = graph.get_node(action_id)
    if not action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found")
    
    if action.get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Action is not pending (status: {action.get('status')})")
    
    # Update action status
    graph.update_node(action_id, {
        "status": "executed",
        "executed_at": datetime.utcnow().isoformat()
    })
    
    # Create transaction record
    transaction_id = f"txn_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    transaction = {
        "id": transaction_id,
        "label": "Transaction",
        "type": action.get("type"),
        "action_id": action_id,
        "client_id": action.get("client_id"),
        "executed_at": datetime.utcnow().isoformat(),
        "notes": f"Executed from action: {action.get('title')}"
    }
    graph.add_node(transaction_id, transaction)
    
    # Create relationship: Action -[:EXECUTED_AS]-> Transaction
    graph.add_relationship(action_id, transaction_id, "EXECUTED_AS")
    
    return {
        "message": "Action executed successfully",
        "action": action,
        "transaction": transaction
    }


# ==================== AI REASONING ====================

@router.post("/ai/next-best-actions/{client_id}")
async def generate_next_best_actions(client_id: str):
    """
    Generate AI-powered Next Best Actions for a client.
    
    Uses graph data + LLM reasoning to prioritize recommendations.
    """
    graph = get_embedded_graph()
    ai_engine = get_ai_engine()
    
    # Get client data
    client = graph.get_node(client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
    
    # Get portfolio data
    portfolios = graph.get_connected_nodes(client_id, "OWNS", "outgoing")
    portfolio_data = {
        "total_value": sum([p.get("total_value", 0) for p in portfolios]),
        "allocation": {},
        "top_holdings": []
    }
    
    # Calculate allocation
    for portfolio in portfolios:
        holdings = graph.get_connected_nodes(portfolio["id"], "HOLDS", "outgoing")
        for holding in holdings:
            rel = holding.get("_relationship", {})
            asset_class = holding.get("asset_class", "other")
            value = rel.get("properties", {}).get("value", 0)
            portfolio_data["allocation"][asset_class] = portfolio_data["allocation"].get(asset_class, 0) + value
            portfolio_data["top_holdings"].append({
                "name": holding.get("name"),
                "symbol": holding.get("symbol"),
                "value": value
            })
    
    # Normalize allocation to percentages
    total = portfolio_data["total_value"]
    if total > 0:
        portfolio_data["allocation"] = {k: v/total for k, v in portfolio_data["allocation"].items()}
    
    # Sort top holdings
    portfolio_data["top_holdings"] = sorted(
        portfolio_data["top_holdings"], 
        key=lambda x: x["value"], 
        reverse=True
    )[:5]
    
    # Generate actions using AI
    actions = await ai_engine.generate_next_best_actions(client, portfolio_data)
    
    return {
        "client_id": client_id,
        "client_name": client.get("name"),
        "generated_at": datetime.utcnow().isoformat(),
        "actions": actions
    }


@router.post("/ai/analyze-book")
async def analyze_advisor_book():
    """
    AI-powered analysis of the entire advisor book.
    
    Identifies patterns, risks, and opportunities across all clients.
    """
    graph = get_embedded_graph()
    ai_engine = get_ai_engine()
    
    clients = graph.get_nodes_by_label("Client")
    portfolios = graph.get_nodes_by_label("Portfolio")
    
    analysis = await ai_engine.analyze_cross_client_patterns(clients, portfolios)
    
    return {
        "analyzed_at": datetime.utcnow().isoformat(),
        "book_summary": {
            "total_clients": len(clients),
            "total_portfolios": len(portfolios),
            "total_aum": sum([p.get("total_value", 0) for p in portfolios])
        },
        "analysis": analysis
    }


@router.post("/ai/ask")
async def ask_graph_question(question: str):
    """
    Ask a natural language question about the knowledge graph.
    
    Examples:
    - "Which clients are most at risk for retirement?"
    - "What is the total exposure to BHP?"
    - "Who should I prioritize calling this week?"
    """
    graph = get_embedded_graph()
    ai_engine = get_ai_engine()
    
    # Gather relevant data based on keywords in question
    question_lower = question.lower()
    
    graph_data = {
        "clients": graph.get_nodes_by_label("Client"),
        "portfolios": graph.get_nodes_by_label("Portfolio")
    }
    
    if "risk" in question_lower or "retirement" in question_lower:
        engine = get_query_engine()
        graph_data["retirement_risks"] = await engine.get_clients_at_retirement_risk()
    
    if "sector" in question_lower or "overweight" in question_lower:
        engine = get_query_engine()
        graph_data["sector_exposure"] = await engine.get_clients_overweight_sector()
    
    if "rebalance" in question_lower:
        engine = get_query_engine()
        graph_data["rebalance_needed"] = await engine.get_portfolios_needing_rebalance()
    
    if "revenue" in question_lower or "opportunity" in question_lower:
        engine = get_query_engine()
        graph_data["opportunities"] = await engine.get_revenue_opportunities()
    
    if "insight" in question_lower or "action" in question_lower:
        engine = get_query_engine()
        graph_data["insights"] = await engine.get_active_insights()
        graph_data["pending_actions"] = await engine.get_pending_actions()
    
    # Get AI response
    answer = await ai_engine.answer_graph_question(question, graph_data)
    
    return {
        "question": question,
        "answer": answer,
        "data_sources_used": list(graph_data.keys()),
        "answered_at": datetime.utcnow().isoformat()
    }


# ==================== GRAPH VISUALIZATION ====================

@router.get("/visualization/data")
async def get_graph_visualization_data():
    """
    Get complete graph data for frontend visualization.
    Returns all nodes and relationships in a format suitable for force-graph.
    """
    graph = get_embedded_graph()
    
    # Get all nodes grouped by type
    nodes = []
    for node_id, node in graph.nodes.items():
        label = node.get("label", "Unknown")
        
        # Determine node size based on type
        size_map = {
            "Client": 12,
            "Portfolio": 10,
            "Asset": 8,
            "Sector": 14,
            "Insight": 8,
            "Action": 6,
            "Advisor": 14,
            "Household": 12,
            "FinancialPlan": 8,
        }
        
        # Determine node color based on type
        color_map = {
            "Client": "#3B82F6",      # Blue
            "Portfolio": "#10B981",   # Emerald
            "Asset": "#8B5CF6",       # Purple
            "Sector": "#F59E0B",      # Amber
            "Insight": "#EF4444",     # Red
            "Action": "#EC4899",      # Pink
            "Advisor": "#14B8A6",     # Teal
            "Household": "#6366F1",   # Indigo
            "FinancialPlan": "#06B6D4", # Cyan
        }
        
        nodes.append({
            "id": node_id,
            "label": label,
            "name": node.get("name") or node.get("title") or node.get("symbol") or node_id,
            "val": size_map.get(label, 6),
            "color": color_map.get(label, "#6B7280"),
            "data": {k: v for k, v in node.items() if k not in ["_id"]}
        })
    
    # Get all relationships
    links = []
    for rel in graph.relationships:
        links.append({
            "source": rel["source"],
            "target": rel["target"],
            "type": rel["type"],
            "properties": rel.get("properties", {})
        })
    
    # Count by type
    node_types = {}
    for node in nodes:
        label = node["label"]
        node_types[label] = node_types.get(label, 0) + 1
    
    relationship_types = {}
    for link in links:
        rel_type = link["type"]
        relationship_types[rel_type] = relationship_types.get(rel_type, 0) + 1
    
    return {
        "nodes": nodes,
        "links": links,
        "summary": {
            "total_nodes": len(nodes),
            "total_links": len(links),
            "node_types": node_types,
            "relationship_types": relationship_types
        }
    }


@router.get("/visualization/subgraph/{center_node_id}")
async def get_subgraph(center_node_id: str, depth: int = Query(2, ge=1, le=4)):
    """
    Get a subgraph centered on a specific node up to a certain depth.
    Useful for focused exploration of a client or portfolio.
    """
    graph = get_embedded_graph()
    
    center_node = graph.get_node(center_node_id)
    if not center_node:
        raise HTTPException(status_code=404, detail=f"Node {center_node_id} not found")
    
    # BFS to collect nodes within depth
    visited_nodes = {center_node_id}
    visited_rels = set()
    frontier = [center_node_id]
    
    for _ in range(depth):
        next_frontier = []
        for node_id in frontier:
            # Get outgoing relationships
            for rel in graph.relationships:
                if rel["source"] == node_id and rel["target"] not in visited_nodes:
                    visited_nodes.add(rel["target"])
                    next_frontier.append(rel["target"])
                    visited_rels.add((rel["source"], rel["target"], rel["type"]))
                elif rel["target"] == node_id and rel["source"] not in visited_nodes:
                    visited_nodes.add(rel["source"])
                    next_frontier.append(rel["source"])
                    visited_rels.add((rel["source"], rel["target"], rel["type"]))
        frontier = next_frontier
    
    # Build response
    size_map = {"Client": 12, "Portfolio": 10, "Asset": 8, "Sector": 14, "Insight": 8, "Action": 6, "Advisor": 14, "Household": 12, "FinancialPlan": 8}
    color_map = {"Client": "#3B82F6", "Portfolio": "#10B981", "Asset": "#8B5CF6", "Sector": "#F59E0B", "Insight": "#EF4444", "Action": "#EC4899", "Advisor": "#14B8A6", "Household": "#6366F1", "FinancialPlan": "#06B6D4"}
    
    nodes = []
    for node_id in visited_nodes:
        node = graph.get_node(node_id)
        if node:
            label = node.get("label", "Unknown")
            nodes.append({
                "id": node_id,
                "label": label,
                "name": node.get("name") or node.get("title") or node.get("symbol") or node_id,
                "val": size_map.get(label, 6),
                "color": color_map.get(label, "#6B7280"),
                "isCenter": node_id == center_node_id,
                "data": {k: v for k, v in node.items() if k not in ["_id"]}
            })
    
    links = []
    for source, target, rel_type in visited_rels:
        links.append({
            "source": source,
            "target": target,
            "type": rel_type
        })
    
    return {
        "center_node": center_node_id,
        "depth": depth,
        "nodes": nodes,
        "links": links
    }


# ==================== ADJUSTABLE ACTIONS ====================

@router.get("/actions/{action_id}/details")
async def get_action_details(action_id: str):
    """
    Get full details for an action including adjustable parameters.
    Used for the sliding scale adjustment UI.
    """
    graph = get_embedded_graph()
    
    action = graph.get_node(action_id)
    if not action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found")
    
    # Get related insight
    insight_id = action.get("insight_id")
    insight = graph.get_node(insight_id) if insight_id else None
    
    # Get related client
    client_id = action.get("client_id")
    client = graph.get_node(client_id) if client_id else None
    
    # Get client's portfolio
    portfolio = None
    if client_id:
        portfolios = graph.get_connected_nodes(client_id, "OWNS", "outgoing")
        if portfolios:
            portfolio = portfolios[0]
    
    # Build adjustable parameters based on action type
    action_type = action.get("type", "review")
    adjustable_params = []
    
    if action_type in ["buy", "sell", "rebalance"]:
        # Amount to trade
        adjustable_params.append({
            "name": "amount",
            "label": "Trade Amount ($)",
            "type": "slider",
            "min": 1000,
            "max": portfolio.get("total_value", 500000) * 0.5 if portfolio else 100000,
            "step": 1000,
            "default": 25000,
            "unit": "$"
        })
        
        # Timeframe
        adjustable_params.append({
            "name": "timeframe",
            "label": "Execution Timeframe",
            "type": "slider",
            "min": 1,
            "max": 90,
            "step": 1,
            "default": 7,
            "unit": "days"
        })
        
        # Price sensitivity
        adjustable_params.append({
            "name": "price_limit",
            "label": "Price Limit (+/- %)",
            "type": "slider",
            "min": 0,
            "max": 20,
            "step": 0.5,
            "default": 5,
            "unit": "%"
        })
    
    if action_type in ["buy", "rebalance"]:
        # Target yield
        adjustable_params.append({
            "name": "min_yield",
            "label": "Minimum Yield Target",
            "type": "slider",
            "min": 0,
            "max": 10,
            "step": 0.25,
            "default": 3,
            "unit": "%"
        })
        
        # Risk tolerance adjustment
        adjustable_params.append({
            "name": "risk_adjustment",
            "label": "Risk Level Adjustment",
            "type": "slider",
            "min": -3,
            "max": 3,
            "step": 1,
            "default": 0,
            "unit": "levels"
        })
    
    if action_type == "rebalance":
        # Drift tolerance
        adjustable_params.append({
            "name": "drift_tolerance",
            "label": "Drift Tolerance",
            "type": "slider",
            "min": 1,
            "max": 15,
            "step": 0.5,
            "default": 5,
            "unit": "%"
        })
        
        # Tax impact limit
        adjustable_params.append({
            "name": "max_tax_impact",
            "label": "Max Tax Impact",
            "type": "slider",
            "min": 0,
            "max": 50000,
            "step": 1000,
            "default": 10000,
            "unit": "$"
        })
    
    return {
        "action": {
            "id": action["id"],
            "type": action_type,
            "title": action.get("title"),
            "description": action.get("description"),
            "status": action.get("status"),
            "priority": action.get("priority"),
            "impact_score": action.get("impact_score"),
        },
        "insight": {
            "id": insight_id,
            "title": insight.get("title") if insight else None,
            "severity": insight.get("severity") if insight else None,
        } if insight else None,
        "client": {
            "id": client_id,
            "name": client.get("name") if client else None,
            "risk_profile": client.get("risk_profile") if client else None,
            "net_worth": client.get("net_worth") if client else None,
        } if client else None,
        "portfolio": {
            "id": portfolio.get("id") if portfolio else None,
            "name": portfolio.get("name") if portfolio else None,
            "total_value": portfolio.get("total_value") if portfolio else None,
        } if portfolio else None,
        "adjustable_parameters": adjustable_params
    }


class AdjustmentParams(BaseModel):
    amount: Optional[float] = None
    timeframe: Optional[int] = None
    price_limit: Optional[float] = None
    min_yield: Optional[float] = None
    risk_adjustment: Optional[int] = None
    drift_tolerance: Optional[float] = None
    max_tax_impact: Optional[float] = None


@router.post("/actions/{action_id}/adjust")
async def adjust_and_execute_action(action_id: str, adjustments: AdjustmentParams = None):
    """
    Adjust action parameters and execute.
    Adjustments can include: amount, timeframe, price_limit, min_yield, risk_adjustment, etc.
    """
    graph = get_embedded_graph()
    
    action = graph.get_node(action_id)
    if not action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found")
    
    if action.get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Action is not pending (status: {action.get('status')})")
    
    adj_dict = adjustments.model_dump(exclude_none=True) if adjustments else {}
    
    # Update action with adjusted parameters
    graph.update_node(action_id, {
        "status": "executed",
        "executed_at": datetime.utcnow().isoformat(),
        "adjusted_parameters": adj_dict
    })
    
    # Create transaction record
    transaction_id = f"txn_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    transaction = {
        "id": transaction_id,
        "label": "Transaction",
        "type": action.get("type"),
        "action_id": action_id,
        "client_id": action.get("client_id"),
        "amount": adj_dict.get("amount", 0),
        "timeframe": adj_dict.get("timeframe", 7),
        "price_limit": adj_dict.get("price_limit", 5),
        "executed_at": datetime.utcnow().isoformat(),
        "notes": f"Executed from action: {action.get('title')} with adjustments"
    }
    graph.add_node(transaction_id, transaction)
    
    # Create relationship: Action -[:EXECUTED_AS]-> Transaction
    graph.add_relationship(action_id, transaction_id, "EXECUTED_AS")
    
    return {
        "message": "Action executed with adjustments",
        "action": action,
        "adjustments": adj_dict,
        "transaction": transaction
    }


# ==================== GRAPH TRAVERSAL ====================

@router.get("/traverse/{start_node_id}")
async def traverse_graph(
    start_node_id: str,
    relationship_types: str = Query("OWNS,HOLDS", description="Comma-separated relationship types"),
    max_depth: int = Query(3, description="Maximum traversal depth")
):
    """
    Traverse the graph from a starting node following specified relationship types.
    
    Example: Start from client, follow OWNS -> HOLDS to see all assets
    """
    graph = get_embedded_graph()
    
    start_node = graph.get_node(start_node_id)
    if not start_node:
        raise HTTPException(status_code=404, detail=f"Node {start_node_id} not found")
    
    rel_types = [r.strip() for r in relationship_types.split(",")]
    paths = graph.traverse(start_node_id, rel_types, max_depth)
    
    return {
        "start_node": start_node,
        "relationship_pattern": rel_types,
        "paths_found": len(paths),
        "paths": paths[:20]  # Limit to 20 paths
    }


@router.get("/client/{client_id}/full-picture")
async def get_client_full_picture(client_id: str):
    """
    Get a complete view of a client including all connected entities.
    
    Traverses: Client -> Household, Advisor, Accounts, Portfolios, Plans, Insights
    """
    graph = get_embedded_graph()
    
    client = graph.get_node(client_id)
    if not client:
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
    
    # Get household
    household_rels = graph.get_connected_nodes(client_id, "MEMBER_OF", "outgoing")
    household = household_rels[0] if household_rels else None
    
    # Get advisor
    advisor_rels = graph.get_connected_nodes(client_id, "MANAGED_BY", "outgoing")
    advisor = advisor_rels[0] if advisor_rels else None
    
    # Get portfolios with holdings
    portfolio_rels = graph.get_connected_nodes(client_id, "OWNS", "outgoing")
    portfolios = []
    for portfolio in portfolio_rels:
        holdings = graph.get_connected_nodes(portfolio["id"], "HOLDS", "outgoing")
        portfolio_data = {k: v for k, v in portfolio.items() if k != "_relationship"}
        portfolio_data["holdings"] = [
            {
                "asset": {k: v for k, v in h.items() if k != "_relationship"},
                "details": h.get("_relationship", {}).get("properties", {})
            }
            for h in holdings
        ]
        portfolios.append(portfolio_data)
    
    # Get financial plan with goals
    plan_rels = graph.get_connected_nodes(client_id, "HAS_PLAN", "outgoing")
    plans = [
        {k: v for k, v in p.items() if k != "_relationship"}
        for p in plan_rels
    ]
    
    # Get related insights
    insights = graph.get_nodes_by_label("Insight")
    client_insights = [
        i for i in insights 
        if client_id in i.get("client_ids", [])
    ]
    
    # Get pending actions for this client
    actions = graph.get_nodes_by_label("Action")
    client_actions = [
        a for a in actions 
        if a.get("client_id") == client_id and a.get("status") == "pending"
    ]
    
    return {
        "client": client,
        "household": {k: v for k, v in household.items() if k != "_relationship"} if household else None,
        "advisor": {k: v for k, v in advisor.items() if k != "_relationship"} if advisor else None,
        "portfolios": portfolios,
        "financial_plans": plans,
        "active_insights": client_insights,
        "pending_actions": client_actions,
        "retrieved_at": datetime.utcnow().isoformat()
    }
