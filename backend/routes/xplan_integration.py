"""
Xplan Integration Service
=========================
Handles all communication with Xplan API (or mock).
Implements Phase 1 MVP:
- Client data read
- Portfolio read
- Transactions read
- Risk profile read
- File note write-back

Features:
- OAuth 2.0 authentication
- Full audit logging of all API interactions
- Real-time sync on client load
- Fallback scheduled sync
- Error handling and retry logic
"""

import os
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/xplan", tags=["Xplan Integration"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
xplan_clients_col = db["xplan_synced_clients"]
xplan_portfolios_col = db["xplan_synced_portfolios"]
xplan_transactions_col = db["xplan_synced_transactions"]
xplan_api_logs_col = db["xplan_api_logs"]
xplan_sync_status_col = db["xplan_sync_status"]
xplan_tokens_col = db["xplan_oauth_tokens"]
xplan_file_notes_col = db["xplan_file_notes"]

# Configuration
XPLAN_BASE_URL = os.environ.get("XPLAN_API_URL", "")  # Empty = use mock
XPLAN_CLIENT_ID = os.environ.get("XPLAN_CLIENT_ID", "mock_client")
XPLAN_CLIENT_SECRET = os.environ.get("XPLAN_CLIENT_SECRET", "mock_secret")

# Use internal mock API if no real Xplan URL configured
def get_xplan_base_url() -> dict:
    if XPLAN_BASE_URL:
        return XPLAN_BASE_URL
    # Use mock API
    return "http://localhost:8001/api/xplan-mock"


# ==================== MODELS ====================

class XplanOAuthConfig(BaseModel):
    client_id: str
    client_secret: str
    
class XplanSyncRequest(BaseModel):
    client_ids: Optional[List[str]] = None
    sync_type: str = "full"  # full, incremental, client_only
    
class FileNoteRequest(BaseModel):
    client_id: str
    title: str
    content: str  # Plain text
    adviser_id: str
    scenario_id: Optional[str] = None
    compliance_result: Optional[str] = None

class XplanFieldMapping(BaseModel):
    """Xplan to AdviceOS field mapping."""
    xplan_field: str
    adviceos_field: str
    transform: Optional[str] = None


# ==================== AUDIT LOGGING ====================

async def log_api_interaction(
    user_id: str,
    action: str,
    xplan_endpoint: str,
    request_payload: Optional[Dict] = None,
    response_payload: Optional[Dict] = None,
    status_code: Optional[int] = None,
    error: Optional[str] = None,
    duration_ms: Optional[float] = None
) -> dict:
    """Log every Xplan API interaction for audit trail."""
    log_entry = {
        "id": f"xlog_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "action": action,
        "xplan_endpoint": xplan_endpoint,
        "request_payload": request_payload,
        "response_payload": response_payload,
        "status_code": status_code,
        "error": error,
        "duration_ms": duration_ms,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await xplan_api_logs_col.insert_one(log_entry)
    
    # Also log to main audit service if available
    try:
        from routes.audit_service import log_audit_event, AuditEvent
        await log_audit_event(AuditEvent(
            event_type="xplan_api_call",
            entity_type="xplan_integration",
            entity_id=log_entry["id"],
            user_id=user_id,
            action_description=f"Xplan API: {action} - {xplan_endpoint}",
            metadata={"status_code": status_code, "duration_ms": duration_ms}
        ))
    except Exception as e:
        logger.warning(f"Failed to log to audit service: {e}")
    
    return log_entry


# ==================== OAUTH AUTHENTICATION ====================

async def get_access_token() -> str:
    """Get or refresh OAuth access token."""
    # Check for existing valid token
    token_doc = await xplan_tokens_col.find_one({"active": True})
    
    if token_doc:
        # Check if token is still valid (with 5 min buffer)
        created_at = datetime.fromisoformat(token_doc["created_at"].replace("Z", "+00:00"))
        expires_in = token_doc.get("expires_in", 3600)
        if datetime.now(timezone.utc) < created_at + timedelta(seconds=expires_in - 300):
            return token_doc["access_token"]
    
    # Request new token
    base_url = get_xplan_base_url()
    
    start_time = datetime.now(timezone.utc)
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                f"{base_url}/oauth/token",
                data={
                    "client_id": XPLAN_CLIENT_ID,
                    "client_secret": XPLAN_CLIENT_SECRET,
                    "grant_type": "client_credentials"
                },
                timeout=30
            )
            response.raise_for_status()
            token_data = response.json()
        
        duration = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        
        # Store token
        await xplan_tokens_col.update_many({}, {"$set": {"active": False}})
        await xplan_tokens_col.insert_one({
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "token_type": token_data.get("token_type", "Bearer"),
            "expires_in": token_data.get("expires_in", 3600),
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        await log_api_interaction(
            user_id="system",
            action="OAUTH_TOKEN",
            xplan_endpoint="/oauth/token",
            status_code=200,
            duration_ms=duration
        )
        
        return token_data["access_token"]
        
    except Exception as e:
        await log_api_interaction(
            user_id="system",
            action="OAUTH_TOKEN",
            xplan_endpoint="/oauth/token",
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=f"OAuth authentication failed: {str(e)}")


async def make_xplan_request(
    method: str,
    endpoint: str,
    user_id: str,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None
) -> Dict[str, Any]:
    """Make authenticated request to Xplan API with logging."""
    base_url = get_xplan_base_url()
    token = await get_access_token()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    start_time = datetime.now(timezone.utc)
    
    try:
        async with httpx.AsyncClient() as http_client:
            if method.upper() == "GET":
                response = await http_client.get(
                    f"{base_url}{endpoint}",
                    headers=headers,
                    params=params,
                    timeout=30
                )
            elif method.upper() == "POST":
                response = await http_client.post(
                    f"{base_url}{endpoint}",
                    headers=headers,
                    json=data,
                    timeout=30
                )
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            duration = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            response_data = response.json() if response.content else {}
            
            # Log the interaction
            await log_api_interaction(
                user_id=user_id,
                action=f"{method.upper()}_{endpoint.split('/')[-1].upper()}",
                xplan_endpoint=endpoint,
                request_payload=data,
                response_payload=response_data if response.status_code == 200 else None,
                status_code=response.status_code,
                duration_ms=duration
            )
            
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Xplan API error: {response_data}"
                )
            
            return response_data
            
    except httpx.RequestError as e:
        duration = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        await log_api_interaction(
            user_id=user_id,
            action=f"{method.upper()}_{endpoint.split('/')[-1].upper()}",
            xplan_endpoint=endpoint,
            request_payload=data,
            error=str(e),
            duration_ms=duration
        )
        raise HTTPException(status_code=500, detail=f"Xplan API request failed: {str(e)}")


# ==================== FIELD MAPPING ====================

def map_client_data(xplan_client: Dict) -> Dict:
    """Map Xplan client data to AdviceOS format."""
    return {
        "external_id": xplan_client.get("client_id"),
        "first_name": xplan_client.get("first_name"),
        "last_name": xplan_client.get("last_name"),
        "dob": xplan_client.get("date_of_birth"),
        "email": xplan_client.get("email"),
        "phone": xplan_client.get("phone"),
        "address": xplan_client.get("address"),
        "marital_status": xplan_client.get("marital_status"),
        "dependents": xplan_client.get("dependents"),
        "source": "xplan",
        "last_synced": datetime.now(timezone.utc).isoformat()
    }


def map_client_profile(xplan_profile: Dict) -> Dict:
    """Map Xplan client profile to AdviceOS format."""
    return {
        "risk_profile": xplan_profile.get("risk_profile"),
        "goals": xplan_profile.get("investment_objective"),
        "time_horizon": xplan_profile.get("time_horizon"),
        "income_requirement": xplan_profile.get("income_needs"),
        "assets": xplan_profile.get("assets"),
        "liabilities": xplan_profile.get("liabilities")
    }


def map_portfolio_data(xplan_portfolio: Dict) -> Dict:
    """Map Xplan portfolio to AdviceOS format."""
    holdings = []
    for h in xplan_portfolio.get("holdings", []):
        holdings.append({
            "product_id": h.get("security_code"),
            "product_name": h.get("product_name"),
            "quantity": h.get("quantity"),
            "price": h.get("price"),
            "market_value": h.get("value"),
            "asset_class": h.get("asset_class")
        })
    
    return {
        "portfolio_id": xplan_portfolio.get("portfolio_id"),
        "portfolio_value": xplan_portfolio.get("total_value"),
        "allocation": xplan_portfolio.get("asset_class_split"),
        "holdings": holdings,
        "last_synced": datetime.now(timezone.utc).isoformat()
    }


def map_transactions(xplan_transactions: List[Dict]) -> List[Dict]:
    """Map Xplan transactions to AdviceOS format."""
    return [{
        "transaction_id": t.get("transaction_id"),
        "transaction_date": t.get("date"),
        "transaction_type": t.get("type"),
        "amount": t.get("amount"),
        "product_id": t.get("product")
    } for t in xplan_transactions]


def map_risk_profile(xplan_risk: Dict) -> Dict:
    """Map Xplan risk profile to AdviceOS format."""
    return {
        "risk_score": xplan_risk.get("risk_score"),
        "risk_profile": xplan_risk.get("risk_band"),
        "risk_review_date": xplan_risk.get("last_review_date")
    }


# ==================== READ ENDPOINTS ====================

@router.get("/status")
async def get_integration_status() -> dict:
    """Get Xplan integration status."""
    using_mock = not XPLAN_BASE_URL
    
    # Get sync stats
    total_synced = await xplan_clients_col.count_documents({})
    recent_logs = await xplan_api_logs_col.count_documents({
        "timestamp": {"$gte": (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()}
    })
    
    # Check token status
    token = await xplan_tokens_col.find_one({"active": True})
    token_valid = False
    if token:
        created_at = datetime.fromisoformat(token["created_at"].replace("Z", "+00:00"))
        expires_in = token.get("expires_in", 3600)
        token_valid = datetime.now(timezone.utc) < created_at + timedelta(seconds=expires_in)
    
    return {
        "status": "connected" if token_valid else "disconnected",
        "mode": "mock" if using_mock else "production",
        "base_url": get_xplan_base_url(),
        "oauth_valid": token_valid,
        "clients_synced": total_synced,
        "api_calls_24h": recent_logs,
        "phase": "MVP Phase 1",
        "capabilities": {
            "read": ["clients", "portfolios", "transactions", "risk_profiles"],
            "write": ["file_notes", "scenario_summaries"]
        }
    }


@router.post("/connect")
async def connect_to_xplan() -> dict:
    """Establish connection to Xplan (get OAuth token)."""
    try:
        token = await get_access_token()
        return {
            "success": True,
            "message": "Connected to Xplan successfully",
            "token_prefix": token[:20] + "..."
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


@router.get("/clients")
async def list_xplan_clients(
    user_id: str = "system",
    sync_first: bool = False
) -> dict:
    """List clients from Xplan."""
    if sync_first:
        xplan_data = await make_xplan_request("GET", "/clients", user_id)
        
        # Store synced clients
        for client in xplan_data.get("clients", []):
            mapped = map_client_data(client)
            await xplan_clients_col.update_one(
                {"external_id": mapped["external_id"]},
                {"$set": mapped},
                upsert=True
            )
    
    # Return from local cache
    clients = await xplan_clients_col.find({}, {"_id": 0}).to_list(100)
    
    # If no cached clients, fetch from Xplan
    if not clients:
        xplan_data = await make_xplan_request("GET", "/clients", user_id)
        for client in xplan_data.get("clients", []):
            mapped = map_client_data(client)
            await xplan_clients_col.update_one(
                {"external_id": mapped["external_id"]},
                {"$set": mapped},
                upsert=True
            )
        clients = await xplan_clients_col.find({}, {"_id": 0}).to_list(100)
    
    return {
        "clients": clients,
        "total": len(clients),
        "source": "xplan_cache"
    }


@router.get("/clients/{client_id}")
async def get_xplan_client(
    client_id: str,
    user_id: str = "system",
    refresh: bool = False
) -> dict:
    """Get client data from Xplan with full profile."""
    # Check cache first unless refresh requested
    if not refresh:
        cached = await xplan_clients_col.find_one({"external_id": client_id}, {"_id": 0})
        if cached:
            return cached
    
    # Fetch from Xplan
    client_data = await make_xplan_request("GET", f"/clients/{client_id}", user_id)
    profile_data = await make_xplan_request("GET", f"/clients/{client_id}/profile", user_id)
    risk_data = await make_xplan_request("GET", f"/clients/{client_id}/risk", user_id)
    
    # Map and merge
    mapped_client = map_client_data(client_data)
    mapped_profile = map_client_profile(profile_data)
    mapped_risk = map_risk_profile(risk_data)
    
    full_client = {
        **mapped_client,
        **mapped_profile,
        **mapped_risk
    }
    
    # Store in cache
    await xplan_clients_col.update_one(
        {"external_id": client_id},
        {"$set": full_client},
        upsert=True
    )
    
    return full_client


@router.get("/clients/{client_id}/portfolio")
async def get_xplan_portfolio(
    client_id: str,
    user_id: str = "system"
) -> dict:
    """Get client portfolio from Xplan."""
    xplan_portfolio = await make_xplan_request("GET", f"/clients/{client_id}/portfolio", user_id)
    mapped = map_portfolio_data(xplan_portfolio)
    mapped["client_id"] = client_id
    
    # Store
    await xplan_portfolios_col.update_one(
        {"client_id": client_id},
        {"$set": mapped},
        upsert=True
    )
    
    return mapped


@router.get("/clients/{client_id}/transactions")
async def get_xplan_transactions(
    client_id: str,
    limit: int = 20,
    user_id: str = "system"
) -> dict:
    """Get client transactions from Xplan."""
    xplan_data = await make_xplan_request(
        "GET", 
        f"/clients/{client_id}/transactions",
        user_id,
        params={"limit": limit}
    )
    
    mapped = map_transactions(xplan_data.get("transactions", []))
    
    # Store
    await xplan_transactions_col.update_one(
        {"client_id": client_id},
        {"$set": {
            "client_id": client_id,
            "transactions": mapped,
            "last_synced": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {
        "client_id": client_id,
        "transactions": mapped,
        "total": len(mapped)
    }


# ==================== WRITE ENDPOINTS ====================

@router.post("/file-notes/write")
async def write_file_note(
    note: FileNoteRequest,
    user_id: str = "system"
) -> dict:
    """Write a file note back to Xplan."""
    # Format the content as plain text
    content_lines = [
        "AdviceOS Scenario Analysis",
        "=" * 40,
        "",
        f"Adviser: {note.adviser_id}",
        f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        ""
    ]
    
    if note.scenario_id:
        content_lines.append(f"Scenario ID: {note.scenario_id}")
    
    if note.compliance_result:
        content_lines.append(f"Compliance Result: {note.compliance_result}")
    
    content_lines.extend([
        "",
        "Notes:",
        "-" * 40,
        note.content,
        "",
        "-" * 40,
        "Generated by AdviceOS - Compliance-First Decision Support"
    ])
    
    formatted_content = "\n".join(content_lines)
    
    # Send to Xplan
    result = await make_xplan_request(
        "POST",
        f"/clients/{note.client_id}/file_notes",
        user_id,
        data={
            "title": note.title,
            "content": formatted_content,
            "created_by": note.adviser_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )
    
    # Store local record
    local_record = {
        "id": result.get("note_id"),
        "xplan_note_id": result.get("note_id"),
        "client_id": note.client_id,
        "title": note.title,
        "content": formatted_content,
        "adviser_id": note.adviser_id,
        "scenario_id": note.scenario_id,
        "compliance_result": note.compliance_result,
        "synced_to_xplan": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await xplan_file_notes_col.insert_one(local_record)
    
    return {
        "success": True,
        "note_id": result.get("note_id"),
        "client_id": note.client_id,
        "synced_to_xplan": True,
        "message": "File note written to Xplan successfully"
    }


@router.get("/file-notes/{client_id}")
async def list_file_notes(
    client_id: str,
    include_xplan: bool = True,
    user_id: str = "system"
) -> dict:
    """List file notes for a client."""
    # Get local notes
    local_notes = await xplan_file_notes_col.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Optionally get from Xplan too
    xplan_notes = []
    if include_xplan:
        try:
            xplan_data = await make_xplan_request("GET", f"/clients/{client_id}/file_notes", user_id)
            xplan_notes = xplan_data.get("file_notes", [])
        except Exception:
            pass
    
    return {
        "client_id": client_id,
        "local_notes": local_notes,
        "xplan_notes": xplan_notes,
        "total_local": len(local_notes),
        "total_xplan": len(xplan_notes)
    }


# ==================== SYNC OPERATIONS ====================

@router.post("/sync/client/{client_id}")
async def sync_single_client(
    client_id: str,
    user_id: str = "system",
    background_tasks: BackgroundTasks = None
) -> dict:
    """Sync a single client from Xplan (real-time on client load)."""
    start_time = datetime.now(timezone.utc)
    
    try:
        # Fetch all client data
        _client = await get_xplan_client(client_id, user_id, refresh=True)
        _portfolio = await get_xplan_portfolio(client_id, user_id)
        transactions = await get_xplan_transactions(client_id, 50, user_id)
        
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        # Update sync status
        await xplan_sync_status_col.update_one(
            {"client_id": client_id},
            {"$set": {
                "client_id": client_id,
                "last_sync": datetime.now(timezone.utc).isoformat(),
                "sync_type": "real_time",
                "duration_seconds": duration,
                "status": "success"
            }},
            upsert=True
        )
        
        return {
            "success": True,
            "client_id": client_id,
            "synced": {
                "client_data": True,
                "portfolio": True,
                "transactions": transactions["total"]
            },
            "duration_seconds": round(duration, 2)
        }
        
    except Exception as e:
        await xplan_sync_status_col.update_one(
            {"client_id": client_id},
            {"$set": {
                "client_id": client_id,
                "last_sync": datetime.now(timezone.utc).isoformat(),
                "sync_type": "real_time",
                "status": "failed",
                "error": str(e)
            }},
            upsert=True
        )
        raise


@router.post("/sync/all")
async def sync_all_clients(
    user_id: str = "system"
) -> dict:
    """Sync all clients from Xplan (scheduled/fallback sync)."""
    start_time = datetime.now(timezone.utc)
    
    # Get client list from Xplan
    xplan_clients = await make_xplan_request("GET", "/clients", user_id)
    client_ids = [c["client_id"] for c in xplan_clients.get("clients", [])]
    
    synced = 0
    failed = 0
    
    for cid in client_ids:
        try:
            await sync_single_client(cid, user_id)
            synced += 1
        except Exception:
            failed += 1
    
    duration = (datetime.now(timezone.utc) - start_time).total_seconds()
    
    # Update global sync status
    await xplan_sync_status_col.update_one(
        {"type": "full_sync"},
        {"$set": {
            "type": "full_sync",
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "clients_synced": synced,
            "clients_failed": failed,
            "duration_seconds": duration,
            "status": "completed"
        }},
        upsert=True
    )
    
    return {
        "success": True,
        "clients_synced": synced,
        "clients_failed": failed,
        "duration_seconds": round(duration, 2)
    }


# ==================== API LOGS ====================

@router.get("/logs")
async def get_api_logs(
    limit: int = 50,
    action: Optional[str] = None,
    user_id: Optional[str] = None
) -> dict:
    """Get Xplan API interaction logs."""
    query = {}
    if action:
        query["action"] = {"$regex": action, "$options": "i"}
    if user_id:
        query["user_id"] = user_id
    
    logs = await xplan_api_logs_col.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "logs": logs,
        "total": len(logs)
    }


@router.get("/sync/status")
async def get_sync_status() -> dict:
    """Get overall sync status."""
    # Get last full sync
    full_sync = await xplan_sync_status_col.find_one({"type": "full_sync"}, {"_id": 0})
    
    # Get recent client syncs
    recent_syncs = await xplan_sync_status_col.find(
        {"client_id": {"$exists": True}},
        {"_id": 0}
    ).sort("last_sync", -1).limit(10).to_list(10)
    
    # Count stats
    total_clients = await xplan_clients_col.count_documents({})
    
    return {
        "last_full_sync": full_sync,
        "recent_client_syncs": recent_syncs,
        "total_synced_clients": total_clients,
        "sync_strategy": {
            "primary": "real_time_on_load",
            "fallback": "scheduled_hourly"
        }
    }


# ==================== PHASE 2: SCENARIO DOCUMENTS & DEEP PORTFOLIO SYNC ====================

class ScenarioDocument(BaseModel):
    """Model for scenario document upload to Xplan."""
    client_id: str
    scenario_name: str
    scenario_type: str = "retirement"  # retirement, insurance, estate, investment
    document_type: str = "soa"  # soa, rop, fact_find, advice_document
    content: Dict[str, Any]  # Structured scenario data
    projections: Optional[List[Dict]] = None
    recommendations: Optional[List[str]] = None
    adviser_id: str
    notes: Optional[str] = None

class DeepPortfolioSyncRequest(BaseModel):
    """Request for deep portfolio sync with detailed holdings."""
    client_id: str
    include_transactions: bool = True
    include_performance: bool = True
    include_tax_lots: bool = True
    date_range_days: int = 365

# Collections for Phase 2
xplan_scenarios_col = db["xplan_scenarios"]
xplan_portfolio_deep_col = db["xplan_portfolio_deep"]

@router.post("/scenarios/upload")
async def upload_scenario_document(scenario: ScenarioDocument) -> dict:
    """
    Phase 2: Upload scenario document to Xplan.
    Supports retirement projections, insurance needs, estate plans.
    """
    user_id = scenario.adviser_id
    
    # Generate scenario ID
    scenario_id = f"SCN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{os.urandom(3).hex().upper()}"
    
    # Prepare scenario data for Xplan
    xplan_scenario = {
        "scenario_id": scenario_id,
        "client_id": scenario.client_id,
        "scenario_name": scenario.scenario_name,
        "scenario_type": scenario.scenario_type,
        "document_type": scenario.document_type,
        "content": scenario.content,
        "projections": scenario.projections,
        "recommendations": scenario.recommendations,
        "adviser_id": scenario.adviser_id,
        "notes": scenario.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sync_status": "pending"
    }
    
    # Store locally
    await xplan_scenarios_col.insert_one(xplan_scenario)
    
    # Attempt to push to Xplan
    try:
        result = await make_xplan_request(
            "POST",
            f"/clients/{scenario.client_id}/scenarios",
            user_id,
            payload=xplan_scenario
        )
        
        # Update sync status
        await xplan_scenarios_col.update_one(
            {"scenario_id": scenario_id},
            {"$set": {"sync_status": "synced", "xplan_ref": result.get("xplan_scenario_id")}}
        )
        
        # Broadcast update via WebSocket
        try:
            from .websocket_service import broadcast_platform_sync_event
            await broadcast_platform_sync_event("xplan", "scenario_uploaded", {
                "scenario_id": scenario_id,
                "client_id": scenario.client_id,
                "scenario_name": scenario.scenario_name
            })
        except Exception:
            pass
        
        return {
            "success": True,
            "scenario_id": scenario_id,
            "xplan_ref": result.get("xplan_scenario_id"),
            "message": f"Scenario '{scenario.scenario_name}' uploaded to Xplan"
        }
    except Exception as e:
        logger.error(f"Failed to upload scenario to Xplan: {e}")
        return {
            "success": False,
            "scenario_id": scenario_id,
            "error": str(e),
            "message": "Scenario saved locally, pending Xplan sync"
        }

@router.get("/scenarios/{client_id}")
async def get_client_scenarios(client_id: str) -> dict:
    """Get all scenarios for a client."""
    scenarios = await xplan_scenarios_col.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)
    
    return {
        "client_id": client_id,
        "scenarios": scenarios,
        "total": len(scenarios)
    }

@router.post("/portfolio/deep-sync")
async def deep_portfolio_sync(request: DeepPortfolioSyncRequest) -> dict:
    """
    Phase 2: Deep portfolio sync with detailed holdings, transactions, and performance.
    """
    user_id = "system"
    client_id = request.client_id
    
    sync_result = {
        "client_id": client_id,
        "sync_id": f"DEEP-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{os.urandom(3).hex().upper()}",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "components": {}
    }
    
    # Sync detailed holdings
    holdings_data = await make_xplan_request(
        "GET",
        f"/clients/{client_id}/portfolios/holdings",
        user_id
    )
    sync_result["components"]["holdings"] = {
        "count": len(holdings_data.get("holdings", [])),
        "status": "synced"
    }
    
    # Sync transactions if requested
    if request.include_transactions:
        transactions_data = await make_xplan_request(
            "GET",
            f"/clients/{client_id}/portfolios/transactions?days={request.date_range_days}",
            user_id
        )
        sync_result["components"]["transactions"] = {
            "count": len(transactions_data.get("transactions", [])),
            "status": "synced"
        }
    
    # Sync performance if requested
    if request.include_performance:
        performance_data = await make_xplan_request(
            "GET",
            f"/clients/{client_id}/portfolios/performance?days={request.date_range_days}",
            user_id
        )
        sync_result["components"]["performance"] = {
            "metrics": list(performance_data.get("metrics", {}).keys()),
            "status": "synced"
        }
    
    # Sync tax lots if requested
    if request.include_tax_lots:
        tax_lots_data = await make_xplan_request(
            "GET",
            f"/clients/{client_id}/portfolios/tax-lots",
            user_id
        )
        sync_result["components"]["tax_lots"] = {
            "count": len(tax_lots_data.get("lots", [])),
            "status": "synced"
        }
    
    # Store deep sync data
    deep_sync_record = {
        **sync_result,
        "holdings": holdings_data.get("holdings", []),
        "transactions": transactions_data.get("transactions", []) if request.include_transactions else [],
        "performance": performance_data.get("metrics", {}) if request.include_performance else {},
        "tax_lots": tax_lots_data.get("lots", []) if request.include_tax_lots else [],
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await xplan_portfolio_deep_col.update_one(
        {"client_id": client_id},
        {"$set": deep_sync_record},
        upsert=True
    )
    
    sync_result["completed_at"] = deep_sync_record["completed_at"]
    sync_result["status"] = "completed"
    
    # Broadcast update
    try:
        from .websocket_service import broadcast_platform_sync_event
        await broadcast_platform_sync_event("xplan", "deep_sync_completed", {
            "client_id": client_id,
            "sync_id": sync_result["sync_id"],
            "components": list(sync_result["components"].keys())
        })
    except Exception:
        pass
    
    return sync_result

@router.get("/portfolio/deep/{client_id}")
async def get_deep_portfolio_data(client_id: str) -> dict:
    """Get deep portfolio data for a client."""
    data = await xplan_portfolio_deep_col.find_one(
        {"client_id": client_id},
        {"_id": 0}
    )
    
    if not data:
        return {"client_id": client_id, "message": "No deep sync data found. Run deep-sync first."}
    
    return data

@router.post("/scenarios/sync-retirement/{client_id}")
async def sync_retirement_calculation_to_xplan(
    client_id: str,
    calculation_type: str = "accumulation",
    calculation_data: Dict[str, Any] = None
) -> dict:
    """
    Sync retirement calculator results directly to Xplan as a scenario.
    """
    if not calculation_data:
        calculation_data = {}
    
    scenario = ScenarioDocument(
        client_id=client_id,
        scenario_name=f"Retirement Projection - {calculation_type.title()}",
        scenario_type="retirement",
        document_type="advice_document",
        content=calculation_data,
        projections=calculation_data.get("projections", []),
        recommendations=calculation_data.get("recommendations", []),
        adviser_id=calculation_data.get("adviser_id", "system"),
        notes=f"Auto-generated from AdviceOS {calculation_type} calculator"
    )
    
    return await upload_scenario_document(scenario)

