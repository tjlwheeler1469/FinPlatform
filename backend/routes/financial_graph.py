"""
Client Financial Graph
Maps entire client financial life including relationships, entities, and cross-holdings.
Now with MongoDB persistence for real data storage.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/financial-graph", tags=["Client Financial Graph"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
financial_graphs_col = db["financial_graphs"]
entities_col = db["financial_entities"]
relationships_col = db["financial_relationships"]

# Complete client financial graphs
CLIENT_GRAPHS = {
    "client_1": {
        "primary": {
            "id": "person_001",
            "type": "individual",
            "name": "James Wheeler",
            "age": 45,
            "occupation": "Business Owner",
            "income": 280000,
            "tax_bracket": 45,
        },
        "family": [
            {
                "id": "person_002",
                "type": "spouse",
                "name": "Sarah Wheeler",
                "age": 43,
                "occupation": "Marketing Director",
                "income": 175000,
                "tax_bracket": 37,
                "relationship": "spouse"
            },
            {
                "id": "person_003",
                "type": "dependent",
                "name": "Emily Wheeler",
                "age": 18,
                "status": "University Student",
                "relationship": "child"
            },
            {
                "id": "person_004",
                "type": "dependent",
                "name": "James Wheeler Jr",
                "age": 15,
                "status": "High School",
                "relationship": "child"
            }
        ],
        "entities": [
            {
                "id": "entity_001",
                "type": "family_trust",
                "name": "Wheeler Family Trust",
                "established": "2018-06-15",
                "beneficiaries": ["James Wheeler", "Sarah Wheeler", "Emily Wheeler", "James Wheeler Jr"],
                "trustee": "James Wheeler",
                "assets": 850000,
                "income_distributed_ytd": 65000
            },
            {
                "id": "entity_002",
                "type": "company",
                "name": "Wheeler Consulting Pty Ltd",
                "abn": "12 345 678 901",
                "industry": "Management Consulting",
                "directors": ["James Wheeler"],
                "shareholders": [{"name": "Wheeler Family Trust", "percent": 100}],
                "revenue": 680000,
                "profit": 220000,
                "retained_earnings": 180000
            },
            {
                "id": "entity_003",
                "type": "smsf",
                "name": "Wheeler Superannuation Fund",
                "members": [
                    {"name": "James Wheeler", "balance": 580000},
                    {"name": "Sarah Wheeler", "balance": 320000}
                ],
                "total_balance": 900000,
                "investment_strategy": "Balanced Growth"
            }
        ],
        "assets": {
            "property": [
                {
                    "id": "prop_001",
                    "type": "primary_residence",
                    "address": "42 Harbour View Drive, Sydney NSW 2000",
                    "ownership": "James Wheeler & Sarah Wheeler (Joint Tenants)",
                    "value": 1850000,
                    "mortgage": 450000,
                    "equity": 1400000,
                    "purchased": "2015-03-20",
                    "purchase_price": 1200000
                },
                {
                    "id": "prop_002",
                    "type": "investment",
                    "address": "Unit 12, 88 Collins St, Melbourne VIC 3000",
                    "ownership": "Wheeler Family Trust",
                    "value": 720000,
                    "mortgage": 380000,
                    "equity": 340000,
                    "rental_yield": 4.2,
                    "tenant": "Corporate lease",
                    "purchased": "2019-08-10",
                    "purchase_price": 580000
                }
            ],
            "vehicles": [
                {"type": "car", "model": "Tesla Model Y", "value": 65000, "ownership": "Wheeler Consulting"},
                {"type": "car", "model": "BMW X5", "value": 85000, "ownership": "James Wheeler"}
            ],
            "collectibles": [
                {"type": "art", "description": "Contemporary Art Collection", "value": 45000}
            ]
        },
        "insurance": [
            {
                "type": "life",
                "provider": "AIA",
                "insured": "James Wheeler",
                "sum_insured": 2000000,
                "premium_annual": 3200,
                "ownership": "Inside Super"
            },
            {
                "type": "tpd",
                "provider": "AIA",
                "insured": "James Wheeler",
                "sum_insured": 1500000,
                "premium_annual": 1800,
                "ownership": "Inside Super"
            },
            {
                "type": "income_protection",
                "provider": "TAL",
                "insured": "James Wheeler",
                "monthly_benefit": 15000,
                "waiting_period": "30 days",
                "benefit_period": "To age 65",
                "premium_annual": 4500,
                "ownership": "Outside Super"
            }
        ],
        "liabilities": [
            {
                "type": "mortgage",
                "property": "Primary Residence",
                "lender": "CBA",
                "balance": 450000,
                "rate": 6.24,
                "repayment_monthly": 3200,
                "term_remaining": "18 years"
            },
            {
                "type": "mortgage",
                "property": "Investment Property",
                "lender": "Westpac",
                "balance": 380000,
                "rate": 6.49,
                "repayment_monthly": 2800,
                "term_remaining": "22 years",
                "interest_only": True
            }
        ],
        "cash_flow": {
            "income": {
                "james_salary": 280000,
                "sarah_salary": 175000,
                "trust_distribution": 65000,
                "rental_income": 30000,
                "dividends": 12000,
                "total": 562000
            },
            "expenses": {
                "living_expenses": 120000,
                "mortgage_payments": 72000,
                "insurance": 9500,
                "education": 35000,
                "discretionary": 45000,
                "total": 281500
            },
            "surplus": 280500
        }
    }
}


class EntityCreateRequest(BaseModel):
    client_id: str
    entity_type: str
    name: str
    details: Dict[str, Any]


# Initialize default graph data in MongoDB on startup
async def init_default_graph_data():
    """Initialize default demo graph data if not exists."""
    existing = await financial_graphs_col.find_one({"client_id": "client_1"})
    if not existing:
        await financial_graphs_col.insert_one({
            "client_id": "client_1",
            **CLIENT_GRAPHS["client_1"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Initialized default financial graph data for client_1")


@router.on_event("startup")
async def startup_init():
    """Initialize data on router startup."""
    try:
        await init_default_graph_data()
    except Exception as e:
        logger.warning(f"Failed to init graph data: {e}")


@router.get("/client/{client_id}")
async def get_client_graph(client_id: str):
    """Get complete financial graph for a client from MongoDB."""
    # Try MongoDB first
    graph_doc = await financial_graphs_col.find_one(
        {"client_id": client_id},
        {"_id": 0}
    )
    
    if graph_doc:
        graph = graph_doc
    elif client_id in CLIENT_GRAPHS:
        # Fallback to static data and store in MongoDB
        graph = CLIENT_GRAPHS[client_id]
        await financial_graphs_col.update_one(
            {"client_id": client_id},
            {"$set": {**graph, "client_id": client_id, "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    else:
        # Return a basic template for unknown clients
        return {
            "client_id": client_id,
            "message": "Client financial graph not yet mapped",
            "template": {
                "primary": {},
                "family": [],
                "entities": [],
                "assets": {"property": [], "vehicles": [], "collectibles": []},
                "insurance": [],
                "liabilities": [],
                "cash_flow": {}
            }
        }
    
    # Calculate totals
    total_assets = (
        sum(p.get("value", 0) for p in graph.get("assets", {}).get("property", [])) +
        sum(v.get("value", 0) for v in graph.get("assets", {}).get("vehicles", [])) +
        sum(c.get("value", 0) for c in graph.get("assets", {}).get("collectibles", [])) +
        sum(e.get("assets", 0) for e in graph.get("entities", []) if e.get("type") == "family_trust") +
        sum(e.get("total_balance", 0) for e in graph.get("entities", []) if e.get("type") == "smsf")
    )
    
    total_liabilities = sum(item.get("balance", 0) for item in graph.get("liabilities", []))
    
    return {
        "client_id": client_id,
        "graph": graph,
        "summary": {
            "total_household_income": graph.get("cash_flow", {}).get("income", {}).get("total", 0),
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_worth": total_assets - total_liabilities,
            "annual_surplus": graph.get("cash_flow", {}).get("surplus", 0),
            "entity_count": len(graph.get("entities", [])),
            "property_count": len(graph.get("assets", {}).get("property", [])),
            "family_members": len(graph.get("family", [])) + 1  # +1 for primary
        },
        "source": "mongodb" if graph_doc else "static",
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/client/{client_id}/save")
async def save_client_graph(client_id: str, graph_data: Dict[str, Any]):
    """Save or update a client's financial graph in MongoDB."""
    await financial_graphs_col.update_one(
        {"client_id": client_id},
        {
            "$set": {
                **graph_data,
                "client_id": client_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$setOnInsert": {
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "client_id": client_id,
        "message": "Financial graph saved to database"
    }


@router.get("/client/{client_id}/entities")
async def get_client_entities(client_id: str):
    """Get all entities related to a client from MongoDB."""
    # Try MongoDB first
    graph_doc = await financial_graphs_col.find_one(
        {"client_id": client_id},
        {"_id": 0, "entities": 1}
    )
    
    if graph_doc and "entities" in graph_doc:
        entities = graph_doc["entities"]
    elif client_id in CLIENT_GRAPHS:
        entities = CLIENT_GRAPHS[client_id].get("entities", [])
    else:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return {
        "client_id": client_id,
        "entities": entities,
        "count": len(entities)
    }


@router.get("/client/{client_id}/cash-flow")
async def get_client_cash_flow(client_id: str):
    """Get detailed cash flow analysis from MongoDB."""
    # Try MongoDB first
    graph_doc = await financial_graphs_col.find_one(
        {"client_id": client_id},
        {"_id": 0, "cash_flow": 1}
    )
    
    if graph_doc and "cash_flow" in graph_doc:
        cash_flow = graph_doc["cash_flow"]
    elif client_id in CLIENT_GRAPHS:
        cash_flow = CLIENT_GRAPHS[client_id].get("cash_flow", {})
    else:
        raise HTTPException(status_code=404, detail="Client not found")
    
    income = cash_flow.get("income", {})
    expenses = cash_flow.get("expenses", {})
    
    return {
        "client_id": client_id,
        "income": income,
        "expenses": expenses,
        "surplus": cash_flow.get("surplus", 0),
        "savings_rate": round(cash_flow.get("surplus", 0) / income.get("total", 1) * 100, 1) if income.get("total") else 0,
        "analysis": {
            "income_diversification": len([k for k, v in income.items() if v > 0 and k != "total"]),
            "largest_income_source": max([(k, v) for k, v in income.items() if k != "total"], key=lambda x: x[1], default=("none", 0)),
            "largest_expense": max([(k, v) for k, v in expenses.items() if k != "total"], key=lambda x: x[1], default=("none", 0))
        }
    }


@router.get("/client/{client_id}/insurance-analysis")
async def get_insurance_analysis(client_id: str):
    """Analyze client's insurance coverage."""
    if client_id not in CLIENT_GRAPHS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    graph = CLIENT_GRAPHS[client_id]
    insurance = graph.get("insurance", [])
    income = graph.get("cash_flow", {}).get("income", {}).get("total", 0)
    
    # Calculate coverage adequacy
    life_cover = sum(p.get("sum_insured", 0) for p in insurance if p.get("type") == "life")
    tpd_cover = sum(p.get("sum_insured", 0) for p in insurance if p.get("type") == "tpd")
    ip_cover = sum(p.get("monthly_benefit", 0) * 12 for p in insurance if p.get("type") == "income_protection")
    
    total_premium = sum(p.get("premium_annual", 0) for p in insurance)
    
    return {
        "client_id": client_id,
        "policies": insurance,
        "coverage_summary": {
            "life_insurance": life_cover,
            "tpd_insurance": tpd_cover,
            "income_protection_annual": ip_cover,
            "total_annual_premium": total_premium
        },
        "adequacy_analysis": {
            "life_cover_multiple": round(life_cover / income, 1) if income > 0 else 0,
            "recommended_life_multiple": 10,
            "ip_coverage_percent": round(ip_cover / income * 100, 1) if income > 0 else 0,
            "recommended_ip_percent": 75
        },
        "recommendations": []
    }


@router.get("/client/{client_id}/estate-summary")
async def get_estate_summary(client_id: str):
    """Get estate planning summary."""
    if client_id not in CLIENT_GRAPHS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    graph = CLIENT_GRAPHS[client_id]
    
    # Calculate estate value
    property_value = sum(p.get("value", 0) for p in graph.get("assets", {}).get("property", []))
    vehicle_value = sum(v.get("value", 0) for v in graph.get("assets", {}).get("vehicles", []))
    collectibles_value = sum(c.get("value", 0) for c in graph.get("assets", {}).get("collectibles", []))
    trust_assets = sum(e.get("assets", 0) for e in graph.get("entities", []) if e.get("type") == "family_trust")
    super_balance = sum(e.get("total_balance", 0) for e in graph.get("entities", []) if e.get("type") == "smsf")
    
    liabilities = sum(item.get("balance", 0) for item in graph.get("liabilities", []))
    
    total_estate = property_value + vehicle_value + collectibles_value + trust_assets + super_balance - liabilities
    
    return {
        "client_id": client_id,
        "estate_value": {
            "property": property_value,
            "vehicles": vehicle_value,
            "collectibles": collectibles_value,
            "trust_assets": trust_assets,
            "superannuation": super_balance,
            "liabilities": liabilities,
            "total_estate": total_estate
        },
        "beneficiaries": graph.get("family", []),
        "entities_in_estate": [e.get("name") for e in graph.get("entities", [])],
        "planning_status": {
            "will_current": True,
            "power_of_attorney": True,
            "binding_death_nomination": True,
            "last_review": "2024-06-15"
        }
    }


@router.get("/client/{client_id}/relationship-map")
async def get_relationship_map(client_id: str):
    """Get visual relationship map data."""
    if client_id not in CLIENT_GRAPHS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    graph = CLIENT_GRAPHS[client_id]
    
    # Build nodes
    nodes = []
    edges = []
    
    # Primary client
    primary = graph.get("primary", {})
    nodes.append({
        "id": primary.get("id", "primary"),
        "type": "person",
        "label": primary.get("name"),
        "role": "Primary Client",
        "data": primary
    })
    
    # Family members
    for member in graph.get("family", []):
        nodes.append({
            "id": member.get("id"),
            "type": "person",
            "label": member.get("name"),
            "role": member.get("relationship").title(),
            "data": member
        })
        edges.append({
            "from": primary.get("id", "primary"),
            "to": member.get("id"),
            "relationship": member.get("relationship")
        })
    
    # Entities
    for entity in graph.get("entities", []):
        nodes.append({
            "id": entity.get("id"),
            "type": "entity",
            "label": entity.get("name"),
            "role": entity.get("type").replace("_", " ").title(),
            "data": entity
        })
        edges.append({
            "from": primary.get("id", "primary"),
            "to": entity.get("id"),
            "relationship": "owns/controls"
        })
    
    # Properties
    for prop in graph.get("assets", {}).get("property", []):
        nodes.append({
            "id": prop.get("id"),
            "type": "property",
            "label": prop.get("type").replace("_", " ").title(),
            "role": prop.get("address", "")[:30] + "...",
            "data": prop
        })
    
    return {
        "client_id": client_id,
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
