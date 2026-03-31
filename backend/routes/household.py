"""
Household Intelligence System
Multi-generational family trees, business entities, trusts, and professional networks.
The foundation of wealth management - wealth is relational, not individual.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/household", tags=["Household Intelligence"])


class RelationshipType(str, Enum):
    SPOUSE = "spouse"
    CHILD = "child"
    PARENT = "parent"
    SIBLING = "sibling"
    GRANDPARENT = "grandparent"
    GRANDCHILD = "grandchild"
    IN_LAW = "in_law"
    PARTNER = "partner"
    EX_SPOUSE = "ex_spouse"
    BENEFICIARY = "beneficiary"
    TRUSTEE = "trustee"
    DIRECTOR = "director"
    SHAREHOLDER = "shareholder"


class EntityType(str, Enum):
    FAMILY_TRUST = "family_trust"
    DISCRETIONARY_TRUST = "discretionary_trust"
    UNIT_TRUST = "unit_trust"
    SMSF = "smsf"
    COMPANY = "company"
    PARTNERSHIP = "partnership"
    SOLE_TRADER = "sole_trader"
    ESTATE = "estate"


class ProfessionalType(str, Enum):
    ACCOUNTANT = "accountant"
    LAWYER = "lawyer"
    FINANCIAL_PLANNER = "financial_planner"
    MORTGAGE_BROKER = "mortgage_broker"
    INSURANCE_BROKER = "insurance_broker"
    BANKER = "banker"
    TAX_AGENT = "tax_agent"
    ESTATE_PLANNER = "estate_planner"


class MemberStatus(str, Enum):
    ACTIVE = "active"
    DECEASED = "deceased"
    INACTIVE = "inactive"


# ==================== DATA MODELS ====================

class FamilyMember(BaseModel):
    member_id: Optional[str] = None
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    employer: Optional[str] = None
    annual_income: Optional[float] = None
    tax_file_number: Optional[str] = None
    status: MemberStatus = MemberStatus.ACTIVE
    is_primary: bool = False
    notes: Optional[str] = None


class Relationship(BaseModel):
    from_member_id: str
    to_member_id: str
    relationship_type: RelationshipType
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None


class Entity(BaseModel):
    entity_id: Optional[str] = None
    name: str
    entity_type: EntityType
    abn: Optional[str] = None
    acn: Optional[str] = None
    tfn: Optional[str] = None
    establishment_date: Optional[str] = None
    registered_address: Optional[str] = None
    purpose: Optional[str] = None
    assets: Optional[float] = 0
    liabilities: Optional[float] = 0
    annual_income: Optional[float] = 0
    status: str = "active"
    notes: Optional[str] = None


class EntityRole(BaseModel):
    entity_id: str
    member_id: str
    role: RelationshipType  # trustee, director, shareholder, beneficiary
    ownership_percentage: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Professional(BaseModel):
    professional_id: Optional[str] = None
    name: str
    company: str
    professional_type: ProfessionalType
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    license_number: Optional[str] = None
    specializations: Optional[List[str]] = []
    notes: Optional[str] = None


class ProfessionalRelationship(BaseModel):
    professional_id: str
    household_id: str
    service_type: str
    start_date: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


# ==================== IN-MEMORY STORAGE ====================
# In production, this would be MongoDB

HOUSEHOLDS: Dict[str, Dict] = {
    "hh_wheeler": {
        "household_id": "hh_wheeler",
        "name": "Wheeler Family",
        "primary_client_id": "client_1",
        "created_at": "2024-01-15T00:00:00Z",
        "updated_at": "2025-03-17T00:00:00Z",
        "members": [
            {
                "member_id": "mem_001",
                "first_name": "John",
                "last_name": "Wheeler",
                "date_of_birth": "1968-05-15",
                "gender": "male",
                "email": "john.wheeler@email.com",
                "phone": "+61 412 345 678",
                "occupation": "Business Owner",
                "employer": "Wheeler Holdings Pty Ltd",
                "annual_income": 450000,
                "status": "active",
                "is_primary": True
            },
            {
                "member_id": "mem_002",
                "first_name": "Sarah",
                "last_name": "Wheeler",
                "date_of_birth": "1970-08-22",
                "gender": "female",
                "email": "sarah.wheeler@email.com",
                "phone": "+61 412 345 679",
                "occupation": "Medical Specialist",
                "employer": "Sydney Medical Centre",
                "annual_income": 320000,
                "status": "active",
                "is_primary": False
            },
            {
                "member_id": "mem_003",
                "first_name": "Emily",
                "last_name": "Wheeler",
                "date_of_birth": "1998-03-10",
                "gender": "female",
                "email": "emily.wheeler@email.com",
                "occupation": "Software Engineer",
                "employer": "Google Australia",
                "annual_income": 145000,
                "status": "active",
                "is_primary": False
            },
            {
                "member_id": "mem_004",
                "first_name": "James",
                "last_name": "Wheeler",
                "date_of_birth": "2001-11-28",
                "gender": "male",
                "email": "james.wheeler@email.com",
                "occupation": "University Student",
                "status": "active",
                "is_primary": False
            },
            {
                "member_id": "mem_005",
                "first_name": "Robert",
                "last_name": "Wheeler",
                "date_of_birth": "1942-02-14",
                "gender": "male",
                "occupation": "Retired",
                "status": "active",
                "is_primary": False
            },
            {
                "member_id": "mem_006",
                "first_name": "Margaret",
                "last_name": "Wheeler",
                "date_of_birth": "1945-06-30",
                "gender": "female",
                "occupation": "Retired",
                "status": "active",
                "is_primary": False
            }
        ],
        "relationships": [
            {"from_member_id": "mem_001", "to_member_id": "mem_002", "relationship_type": "spouse", "start_date": "1995-06-20"},
            {"from_member_id": "mem_001", "to_member_id": "mem_003", "relationship_type": "child"},
            {"from_member_id": "mem_001", "to_member_id": "mem_004", "relationship_type": "child"},
            {"from_member_id": "mem_002", "to_member_id": "mem_003", "relationship_type": "child"},
            {"from_member_id": "mem_002", "to_member_id": "mem_004", "relationship_type": "child"},
            {"from_member_id": "mem_001", "to_member_id": "mem_005", "relationship_type": "parent"},
            {"from_member_id": "mem_001", "to_member_id": "mem_006", "relationship_type": "parent"},
        ],
        "entities": [
            {
                "entity_id": "ent_001",
                "name": "Wheeler Family Trust",
                "entity_type": "family_trust",
                "abn": "12 345 678 901",
                "establishment_date": "2005-07-01",
                "purpose": "Asset protection and income distribution",
                "assets": 2850000,
                "liabilities": 0,
                "annual_income": 185000,
                "status": "active"
            },
            {
                "entity_id": "ent_002",
                "name": "Wheeler Holdings Pty Ltd",
                "entity_type": "company",
                "abn": "23 456 789 012",
                "acn": "123 456 789",
                "establishment_date": "1998-03-15",
                "purpose": "Operating company for consulting business",
                "assets": 1250000,
                "liabilities": 350000,
                "annual_income": 890000,
                "status": "active"
            },
            {
                "entity_id": "ent_003",
                "name": "Wheeler SMSF",
                "entity_type": "smsf",
                "abn": "34 567 890 123",
                "establishment_date": "2010-01-01",
                "purpose": "Retirement savings",
                "assets": 1580000,
                "liabilities": 0,
                "status": "active"
            },
            {
                "entity_id": "ent_004",
                "name": "Sarah Wheeler Medical Pty Ltd",
                "entity_type": "company",
                "abn": "45 678 901 234",
                "establishment_date": "2012-06-01",
                "purpose": "Medical practice service entity",
                "assets": 450000,
                "liabilities": 120000,
                "annual_income": 520000,
                "status": "active"
            }
        ],
        "entity_roles": [
            {"entity_id": "ent_001", "member_id": "mem_001", "role": "trustee"},
            {"entity_id": "ent_001", "member_id": "mem_002", "role": "trustee"},
            {"entity_id": "ent_001", "member_id": "mem_001", "role": "beneficiary", "ownership_percentage": 25},
            {"entity_id": "ent_001", "member_id": "mem_002", "role": "beneficiary", "ownership_percentage": 25},
            {"entity_id": "ent_001", "member_id": "mem_003", "role": "beneficiary", "ownership_percentage": 25},
            {"entity_id": "ent_001", "member_id": "mem_004", "role": "beneficiary", "ownership_percentage": 25},
            {"entity_id": "ent_002", "member_id": "mem_001", "role": "director"},
            {"entity_id": "ent_002", "member_id": "mem_001", "role": "shareholder", "ownership_percentage": 100},
            {"entity_id": "ent_003", "member_id": "mem_001", "role": "trustee"},
            {"entity_id": "ent_003", "member_id": "mem_002", "role": "trustee"},
            {"entity_id": "ent_004", "member_id": "mem_002", "role": "director"},
            {"entity_id": "ent_004", "member_id": "mem_002", "role": "shareholder", "ownership_percentage": 100},
        ],
        "professionals": [
            {
                "professional_id": "prof_001",
                "name": "David Chen",
                "company": "Chen & Associates",
                "professional_type": "accountant",
                "email": "david.chen@chenaccounting.com.au",
                "phone": "+61 2 9876 5432",
                "license_number": "CA 123456",
                "specializations": ["tax planning", "business advisory", "SMSF"]
            },
            {
                "professional_id": "prof_002",
                "name": "Jennifer Smith",
                "company": "Smith Legal",
                "professional_type": "lawyer",
                "email": "jennifer@smithlegal.com.au",
                "phone": "+61 2 9876 5433",
                "specializations": ["estate planning", "business law", "family law"]
            },
            {
                "professional_id": "prof_003",
                "name": "Michael Brown",
                "company": "Brown Mortgage Solutions",
                "professional_type": "mortgage_broker",
                "email": "michael@brownmortgage.com.au",
                "phone": "+61 2 9876 5434",
                "specializations": ["residential", "commercial", "investment"]
            }
        ]
    }
}


# ==================== HOUSEHOLD ENDPOINTS ====================

@router.get("/list")
async def list_households() -> dict:
    """List all households."""
    households = []
    for hh_id, hh in HOUSEHOLDS.items():
        members_count = len(hh.get("members", []))
        entities_count = len(hh.get("entities", []))
        
        # Calculate total household net worth
        _total_assets = sum(m.get("annual_income", 0) for m in hh.get("members", []))
        entity_assets = sum(e.get("assets", 0) - e.get("liabilities", 0) for e in hh.get("entities", []))
        
        households.append({
            "household_id": hh_id,
            "name": hh["name"],
            "primary_client_id": hh.get("primary_client_id"),
            "members_count": members_count,
            "entities_count": entities_count,
            "estimated_net_worth": entity_assets,
            "created_at": hh.get("created_at"),
            "updated_at": hh.get("updated_at")
        })
    
    return {
        "households": households,
        "total": len(households),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/{household_id}")
async def get_household(household_id: str) -> dict:
    """Get complete household details including family tree, entities, and professionals."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    hh = HOUSEHOLDS[household_id]
    
    # Calculate aggregated financials
    total_member_income = sum(m.get("annual_income", 0) or 0 for m in hh.get("members", []))
    total_entity_assets = sum(e.get("assets", 0) or 0 for e in hh.get("entities", []))
    total_entity_liabilities = sum(e.get("liabilities", 0) or 0 for e in hh.get("entities", []))
    total_entity_income = sum(e.get("annual_income", 0) or 0 for e in hh.get("entities", []))
    
    return {
        **hh,
        "aggregated_financials": {
            "total_member_income": total_member_income,
            "total_entity_assets": total_entity_assets,
            "total_entity_liabilities": total_entity_liabilities,
            "total_entity_net_worth": total_entity_assets - total_entity_liabilities,
            "total_entity_income": total_entity_income,
            "household_total_income": total_member_income + total_entity_income
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/{household_id}/family-tree")
async def get_family_tree(household_id: str) -> dict:
    """Get family tree structure for visualization."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    hh = HOUSEHOLDS[household_id]
    members = hh.get("members", [])
    relationships = hh.get("relationships", [])
    
    # Build tree structure
    nodes = []
    edges = []
    
    for member in members:
        age = None
        if member.get("date_of_birth"):
            try:
                dob = datetime.strptime(member["date_of_birth"], "%Y-%m-%d")
                age = (datetime.now() - dob).days // 365
            except Exception:
                pass
        
        nodes.append({
            "id": member["member_id"],
            "name": f"{member['first_name']} {member['last_name']}",
            "age": age,
            "occupation": member.get("occupation"),
            "income": member.get("annual_income"),
            "is_primary": member.get("is_primary", False),
            "status": member.get("status", "active"),
            "gender": member.get("gender")
        })
    
    for rel in relationships:
        edges.append({
            "from": rel["from_member_id"],
            "to": rel["to_member_id"],
            "type": rel["relationship_type"],
            "label": rel["relationship_type"].replace("_", " ").title()
        })
    
    return {
        "household_id": household_id,
        "household_name": hh["name"],
        "nodes": nodes,
        "edges": edges,
        "total_members": len(nodes),
        "generations": _count_generations(nodes, edges),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def _count_generations(nodes, edges) -> dict:
    """Count number of generations in family tree."""
    parent_edges = [e for e in edges if e["type"] in ["parent", "grandparent"]]
    if not parent_edges:
        return 1
    # Simplified - count unique parent-child chains
    return min(3, len(set(e["type"] for e in edges if e["type"] in ["parent", "grandparent", "child", "grandchild"])) + 1)


@router.get("/{household_id}/entities")
async def get_household_entities(household_id: str) -> dict:
    """Get all entities (trusts, companies, SMSFs) for a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    hh = HOUSEHOLDS[household_id]
    entities = hh.get("entities", [])
    entity_roles = hh.get("entity_roles", [])
    members = hh.get("members", [])
    
    # Enrich entities with roles
    enriched_entities = []
    for entity in entities:
        roles = [r for r in entity_roles if r["entity_id"] == entity["entity_id"]]
        role_details = []
        for role in roles:
            member = next((m for m in members if m["member_id"] == role["member_id"]), None)
            if member:
                role_details.append({
                    "member_name": f"{member['first_name']} {member['last_name']}",
                    "member_id": role["member_id"],
                    "role": role["role"],
                    "ownership_percentage": role.get("ownership_percentage")
                })
        
        enriched_entities.append({
            **entity,
            "roles": role_details,
            "net_worth": (entity.get("assets", 0) or 0) - (entity.get("liabilities", 0) or 0)
        })
    
    # Group by type
    by_type = {}
    for entity in enriched_entities:
        etype = entity["entity_type"]
        if etype not in by_type:
            by_type[etype] = []
        by_type[etype].append(entity)
    
    return {
        "household_id": household_id,
        "entities": enriched_entities,
        "by_type": by_type,
        "summary": {
            "total_entities": len(entities),
            "total_assets": sum(e.get("assets", 0) or 0 for e in entities),
            "total_liabilities": sum(e.get("liabilities", 0) or 0 for e in entities),
            "total_net_worth": sum(e.get("assets", 0) or 0 for e in entities) - sum(e.get("liabilities", 0) or 0 for e in entities),
            "entity_types": list(by_type.keys())
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/{household_id}/professionals")
async def get_household_professionals(household_id: str) -> dict:
    """Get professional network for a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    hh = HOUSEHOLDS[household_id]
    professionals = hh.get("professionals", [])
    
    # Group by type
    by_type = {}
    for prof in professionals:
        ptype = prof["professional_type"]
        if ptype not in by_type:
            by_type[ptype] = []
        by_type[ptype].append(prof)
    
    return {
        "household_id": household_id,
        "professionals": professionals,
        "by_type": by_type,
        "summary": {
            "total_professionals": len(professionals),
            "types_covered": list(by_type.keys()),
            "missing_types": [t.value for t in ProfessionalType if t.value not in by_type]
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/{household_id}/net-worth")
async def get_household_net_worth(household_id: str) -> dict:
    """Calculate complete household net worth across all members and entities."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    hh = HOUSEHOLDS[household_id]
    
    # Member-level assets (simplified - would normally link to portfolio data)
    member_assets = []
    for member in hh.get("members", []):
        # Simulated personal assets
        personal_assets = {
            "member_id": member["member_id"],
            "name": f"{member['first_name']} {member['last_name']}",
            "super": 0 if member.get("status") == "deceased" else 150000 + (member.get("annual_income", 0) or 0) * 0.5,
            "investments": 50000,
            "property": 0,
            "cash": 25000,
            "other": 10000
        }
        personal_assets["total"] = sum([
            personal_assets["super"],
            personal_assets["investments"],
            personal_assets["property"],
            personal_assets["cash"],
            personal_assets["other"]
        ])
        member_assets.append(personal_assets)
    
    # Entity assets
    entity_assets = []
    for entity in hh.get("entities", []):
        entity_assets.append({
            "entity_id": entity["entity_id"],
            "name": entity["name"],
            "type": entity["entity_type"],
            "assets": entity.get("assets", 0) or 0,
            "liabilities": entity.get("liabilities", 0) or 0,
            "net_worth": (entity.get("assets", 0) or 0) - (entity.get("liabilities", 0) or 0)
        })
    
    total_member_assets = sum(m["total"] for m in member_assets)
    total_entity_net_worth = sum(e["net_worth"] for e in entity_assets)
    
    return {
        "household_id": household_id,
        "household_name": hh["name"],
        "member_assets": member_assets,
        "entity_assets": entity_assets,
        "summary": {
            "total_member_assets": total_member_assets,
            "total_entity_net_worth": total_entity_net_worth,
            "household_net_worth": total_member_assets + total_entity_net_worth,
            "by_asset_class": {
                "superannuation": sum(m["super"] for m in member_assets),
                "investments": sum(m["investments"] for m in member_assets) + sum(e["assets"] for e in entity_assets if e["type"] == "family_trust"),
                "property": sum(m["property"] for m in member_assets),
                "business": sum(e["net_worth"] for e in entity_assets if e["type"] == "company"),
                "smsf": sum(e["assets"] for e in entity_assets if e["type"] == "smsf"),
                "cash": sum(m["cash"] for m in member_assets)
            }
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== MEMBER MANAGEMENT ====================

@router.post("/{household_id}/members")
async def add_member(household_id: str, member: FamilyMember) -> dict:
    """Add a new member to a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    member_data = member.dict()
    member_data["member_id"] = f"mem_{uuid.uuid4().hex[:6]}"
    
    HOUSEHOLDS[household_id]["members"].append(member_data)
    HOUSEHOLDS[household_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "member": member_data,
        "message": f"Added {member.first_name} {member.last_name} to household"
    }


@router.post("/{household_id}/relationships")
async def add_relationship(household_id: str, relationship: Relationship) -> dict:
    """Add a relationship between two members."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    rel_data = relationship.dict()
    HOUSEHOLDS[household_id]["relationships"].append(rel_data)
    HOUSEHOLDS[household_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "relationship": rel_data,
        "message": "Relationship added successfully"
    }


# ==================== ENTITY MANAGEMENT ====================

@router.post("/{household_id}/entities")
async def add_entity(household_id: str, entity: Entity) -> dict:
    """Add a new entity (trust, company, SMSF) to a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    entity_data = entity.dict()
    entity_data["entity_id"] = f"ent_{uuid.uuid4().hex[:6]}"
    
    if "entities" not in HOUSEHOLDS[household_id]:
        HOUSEHOLDS[household_id]["entities"] = []
    
    HOUSEHOLDS[household_id]["entities"].append(entity_data)
    HOUSEHOLDS[household_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "entity": entity_data,
        "message": f"Added {entity.name} to household"
    }


@router.post("/{household_id}/entity-roles")
async def add_entity_role(household_id: str, role: EntityRole) -> dict:
    """Add a member's role in an entity."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    role_data = role.dict()
    
    if "entity_roles" not in HOUSEHOLDS[household_id]:
        HOUSEHOLDS[household_id]["entity_roles"] = []
    
    HOUSEHOLDS[household_id]["entity_roles"].append(role_data)
    HOUSEHOLDS[household_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "role": role_data,
        "message": "Entity role added successfully"
    }


# ==================== PROFESSIONAL MANAGEMENT ====================

@router.post("/{household_id}/professionals")
async def add_professional(household_id: str, professional: Professional) -> dict:
    """Add a professional to a household's network."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    prof_data = professional.dict()
    prof_data["professional_id"] = f"prof_{uuid.uuid4().hex[:6]}"
    
    if "professionals" not in HOUSEHOLDS[household_id]:
        HOUSEHOLDS[household_id]["professionals"] = []
    
    HOUSEHOLDS[household_id]["professionals"].append(prof_data)
    HOUSEHOLDS[household_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "professional": prof_data,
        "message": f"Added {professional.name} to professional network"
    }


# ==================== HOUSEHOLD CREATION ====================

@router.post("/create")
async def create_household(name: str, primary_client_id: str) -> dict:
    """Create a new household."""
    household_id = f"hh_{uuid.uuid4().hex[:8]}"
    
    HOUSEHOLDS[household_id] = {
        "household_id": household_id,
        "name": name,
        "primary_client_id": primary_client_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "members": [],
        "relationships": [],
        "entities": [],
        "entity_roles": [],
        "professionals": []
    }
    
    return {
        "success": True,
        "household_id": household_id,
        "household": HOUSEHOLDS[household_id],
        "message": f"Created household '{name}'"
    }
