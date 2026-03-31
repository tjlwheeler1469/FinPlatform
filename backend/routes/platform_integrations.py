"""
Platform Integrations Module - AMP North, Netwealth, Hub24, Class, IRESS
Bi-directional data sync with audit logging for enterprise wealth platforms
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import os

router = APIRouter(prefix="/platforms", tags=["Platform Integrations"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "adviceos")

async def get_db() -> dict:
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ============== ENUMS ==============

class Platform(str, Enum):
    AMP_NORTH = "amp_north"
    NETWEALTH = "netwealth"
    HUB24 = "hub24"
    CLASS = "class"
    IRESS = "iress"

class SyncDirection(str, Enum):
    INBOUND = "inbound"   # Platform -> AdviceOS
    OUTBOUND = "outbound" # AdviceOS -> Platform
    BIDIRECTIONAL = "bidirectional"

class SyncStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    SYNCING = "syncing"
    ERROR = "error"
    PENDING = "pending"

class DataCategory(str, Enum):
    CLIENT = "client"
    PORTFOLIO = "portfolio"
    TRANSACTION = "transaction"
    BALANCE = "balance"
    INSURANCE = "insurance"
    PENSION = "pension"
    DOCUMENT = "document"
    SCENARIO = "scenario"
    FILE_NOTE = "file_note"

# ============== PLATFORM CONFIGURATIONS ==============

PLATFORM_CONFIGS = {
    "amp_north": {
        "name": "AMP North",
        "description": "AMP North Platform - Wrap and Retirement Solutions",
        "api_base_url": "https://api.ampnorth.com.au/v2",
        "oauth_url": "https://auth.ampnorth.com.au/oauth2/token",
        "supported_data": ["client", "portfolio", "transaction", "balance", "pension", "insurance"],
        "read_capabilities": ["clients", "portfolios", "transactions", "balances", "pension_accounts", "insurance_policies"],
        "write_capabilities": ["file_notes", "scenarios", "documents"],
        "sync_frequency_minutes": 15,
        "rate_limit_per_minute": 60,
        "supports_webhooks": True,
        "supports_real_time": False,
    },
    "netwealth": {
        "name": "Netwealth",
        "description": "Netwealth Wealth Accelerator Platform",
        "api_base_url": "https://api.netwealth.com.au/v3",
        "oauth_url": "https://identity.netwealth.com.au/connect/token",
        "supported_data": ["client", "portfolio", "transaction", "balance", "pension", "document"],
        "read_capabilities": ["clients", "portfolios", "transactions", "balances", "pension_accounts", "documents"],
        "write_capabilities": ["file_notes", "scenarios", "documents", "model_portfolios"],
        "sync_frequency_minutes": 10,
        "rate_limit_per_minute": 100,
        "supports_webhooks": True,
        "supports_real_time": True,
    },
    "hub24": {
        "name": "HUB24",
        "description": "HUB24 Investment and Super Platform",
        "api_base_url": "https://api.hub24.com.au/v2",
        "oauth_url": "https://auth.hub24.com.au/oauth/token",
        "supported_data": ["client", "portfolio", "transaction", "balance", "pension", "insurance"],
        "read_capabilities": ["clients", "portfolios", "transactions", "balances", "pension_accounts", "insurance_policies"],
        "write_capabilities": ["file_notes", "scenarios", "rebalance_orders"],
        "sync_frequency_minutes": 15,
        "rate_limit_per_minute": 80,
        "supports_webhooks": True,
        "supports_real_time": False,
    },
    "class": {
        "name": "Class Super",
        "description": "Class SMSF Administration Software",
        "api_base_url": "https://api.class.com.au/v1",
        "oauth_url": "https://auth.class.com.au/oauth2/token",
        "supported_data": ["client", "portfolio", "transaction", "balance", "pension", "document"],
        "read_capabilities": ["smsf_funds", "members", "investments", "transactions", "compliance_status", "documents"],
        "write_capabilities": ["file_notes", "documents", "pension_commencements"],
        "sync_frequency_minutes": 30,
        "rate_limit_per_minute": 50,
        "supports_webhooks": False,
        "supports_real_time": False,
    },
    "iress": {
        "name": "IRESS (Xplan)",
        "description": "IRESS Xplan Financial Planning Software",
        "api_base_url": "https://api.iress.com/xplan/v2",
        "oauth_url": "https://auth.iress.com/oauth2/token",
        "supported_data": ["client", "portfolio", "transaction", "balance", "pension", "insurance", "document", "scenario"],
        "read_capabilities": ["clients", "portfolios", "transactions", "balances", "risk_profiles", "insurance_needs", "scenarios"],
        "write_capabilities": ["file_notes", "scenarios", "documents", "soa_data", "risk_profiles"],
        "sync_frequency_minutes": 15,
        "rate_limit_per_minute": 100,
        "supports_webhooks": True,
        "supports_real_time": True,
    }
}

# ============== MOCK DATA ==============

MOCK_CLIENTS = {
    "amp_north": [
        {"client_id": "AMP-001", "name": "Robert Wilson", "email": "robert.wilson@email.com", "dob": "1960-05-15", "risk_profile": "balanced", "adviser_code": "ADV001", "total_balance": 850000},
        {"client_id": "AMP-002", "name": "Helen Parker", "email": "helen.parker@email.com", "dob": "1958-08-22", "risk_profile": "conservative", "adviser_code": "ADV001", "total_balance": 1200000},
        {"client_id": "AMP-003", "name": "Thomas & Jane Mitchell", "email": "tmitchell@email.com", "dob": "1962-03-10", "risk_profile": "growth", "adviser_code": "ADV002", "total_balance": 2100000},
    ],
    "netwealth": [
        {"client_id": "NW-001", "name": "Sarah Thompson", "email": "sarah.t@email.com", "dob": "1965-11-30", "risk_profile": "balanced", "adviser_code": "ADV001", "total_balance": 650000},
        {"client_id": "NW-002", "name": "Michael Chen", "email": "m.chen@email.com", "dob": "1955-07-18", "risk_profile": "conservative", "adviser_code": "ADV001", "total_balance": 1850000},
    ],
    "hub24": [
        {"client_id": "H24-001", "name": "David & Emma Brown", "email": "brown.family@email.com", "dob": "1963-04-25", "risk_profile": "growth", "adviser_code": "ADV001", "total_balance": 920000},
        {"client_id": "H24-002", "name": "Jennifer White", "email": "jwhite@email.com", "dob": "1970-12-05", "risk_profile": "aggressive", "adviser_code": "ADV002", "total_balance": 380000},
    ],
    "class": [
        {"client_id": "CLS-001", "fund_name": "Wilson Family SMSF", "members": ["Robert Wilson", "Margaret Wilson"], "trustee_type": "individual", "compliance_status": "compliant", "total_balance": 1450000},
        {"client_id": "CLS-002", "fund_name": "Chen Investments SMSF", "members": ["Michael Chen", "Lisa Chen"], "trustee_type": "corporate", "compliance_status": "compliant", "total_balance": 2800000},
    ],
    "iress": [
        {"client_id": "XP-001", "name": "James Mitchell", "email": "james.m@email.com", "dob": "1968-09-12", "risk_profile": "balanced", "adviser_code": "ADV001", "total_balance": 1250000},
        {"client_id": "XP-002", "name": "Amanda Foster", "email": "a.foster@email.com", "dob": "1972-02-28", "risk_profile": "growth", "adviser_code": "ADV001", "total_balance": 580000},
    ]
}

MOCK_PORTFOLIOS = {
    "amp_north": {
        "AMP-001": {
            "account_name": "North Personal Super",
            "account_number": "AMP123456",
            "account_type": "super_pension",
            "total_value": 850000,
            "holdings": [
                {"security": "AMP Capital Australian Equity", "units": 5000, "price": 45.50, "value": 227500},
                {"security": "AMP Capital Global Equity", "units": 3500, "price": 62.30, "value": 218050},
                {"security": "AMP Capital Fixed Income", "units": 8000, "price": 28.50, "value": 228000},
                {"security": "Cash Account", "units": 1, "price": 176450, "value": 176450},
            ],
            "asset_allocation": {"australian_equities": 27, "international_equities": 26, "fixed_income": 27, "cash": 20}
        }
    },
    "netwealth": {
        "NW-001": {
            "account_name": "Netwealth Super Account",
            "account_number": "NW789012",
            "account_type": "super_accumulation",
            "total_value": 650000,
            "holdings": [
                {"security": "Vanguard Australian Shares", "units": 2000, "price": 95.20, "value": 190400},
                {"security": "Vanguard International Shares", "units": 1500, "price": 128.40, "value": 192600},
                {"security": "Vanguard Diversified Bonds", "units": 3000, "price": 55.80, "value": 167400},
                {"security": "Cash Management Trust", "units": 1, "price": 99600, "value": 99600},
            ],
            "asset_allocation": {"australian_equities": 29, "international_equities": 30, "fixed_income": 26, "cash": 15}
        }
    },
    "hub24": {
        "H24-001": {
            "account_name": "HUB24 Invest Account",
            "account_number": "H24345678",
            "account_type": "investment",
            "total_value": 920000,
            "holdings": [
                {"security": "Magellan Global Fund", "units": 4000, "price": 55.00, "value": 220000},
                {"security": "Platinum International Fund", "units": 3000, "price": 48.50, "value": 145500},
                {"security": "Australian Foundation Investment", "units": 25000, "price": 8.80, "value": 220000},
                {"security": "Argo Investments", "units": 30000, "price": 9.50, "value": 285000},
                {"security": "Cash Hub", "units": 1, "price": 49500, "value": 49500},
            ],
            "asset_allocation": {"australian_equities": 55, "international_equities": 40, "cash": 5}
        }
    },
    "class": {
        "CLS-001": {
            "fund_name": "Wilson Family SMSF",
            "total_value": 1450000,
            "members": [
                {"name": "Robert Wilson", "balance": 780000, "phase": "pension", "tbc_used": 780000},
                {"name": "Margaret Wilson", "balance": 670000, "phase": "accumulation", "tbc_used": 0},
            ],
            "holdings": [
                {"security": "CBA", "units": 5000, "price": 115.00, "value": 575000},
                {"security": "BHP", "units": 3000, "price": 45.00, "value": 135000},
                {"security": "Residential Property - 12 Smith St", "units": 1, "price": 650000, "value": 650000},
                {"security": "Cash at Bank", "units": 1, "price": 90000, "value": 90000},
            ],
            "compliance": {"audit_due": "2026-10-15", "ato_lodgment_due": "2026-05-15", "status": "compliant"}
        }
    },
    "iress": {
        "XP-001": {
            "account_name": "Xplan Investment Account",
            "account_number": "XP901234",
            "account_type": "super_pension",
            "total_value": 1250000,
            "holdings": [
                {"security": "Colonial First State Wholesale Global", "units": 6000, "price": 85.00, "value": 510000},
                {"security": "Pendal Australian Share Fund", "units": 4500, "price": 72.00, "value": 324000},
                {"security": "PIMCO Income Fund", "units": 5000, "price": 52.00, "value": 260000},
                {"security": "Cash Account", "units": 1, "price": 156000, "value": 156000},
            ],
            "asset_allocation": {"australian_equities": 26, "international_equities": 41, "fixed_income": 21, "cash": 12}
        }
    }
}

# ============== MODELS ==============

class PlatformCredentials(BaseModel):
    platform: Optional[Platform] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    api_key: Optional[str] = None
    adviser_code: Optional[str] = None
    practice_id: Optional[str] = None

class ConnectionStatus(BaseModel):
    platform: Platform
    status: SyncStatus
    connected_at: Optional[datetime] = None
    last_sync: Optional[datetime] = None
    next_sync: Optional[datetime] = None
    error_message: Optional[str] = None

class SyncRequest(BaseModel):
    platform: Platform
    client_ids: Optional[List[str]] = None  # None = sync all
    data_categories: List[DataCategory] = Field(default=[DataCategory.CLIENT, DataCategory.PORTFOLIO, DataCategory.BALANCE])
    direction: SyncDirection = Field(default=SyncDirection.BIDIRECTIONAL)
    force_full_sync: bool = Field(default=False)

class WriteBackRequest(BaseModel):
    platform: Platform
    client_id: str
    data_type: DataCategory
    data: Dict[str, Any]
    notes: Optional[str] = None

class RetirementDataPush(BaseModel):
    client_id: str
    target_platforms: List[Platform]
    calculation_type: str  # accumulation or decumulation
    calculation_id: str
    data: Dict[str, Any]

# ============== STORAGE ==============

# In-memory storage for demo (would be MongoDB in production)
platform_connections: Dict[str, Dict] = {}
sync_logs: List[Dict] = []

# ============== HELPER FUNCTIONS ==============

async def log_sync_event(
    platform: str,
    direction: str,
    category: str,
    client_id: Optional[str],
    status: str,
    records_affected: int,
    details: Optional[Dict] = None
) -> dict:
    """Log sync event for audit trail"""
    db = await get_db()
    log_entry = {
        "log_id": f"SYNC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        "platform": platform,
        "direction": direction,
        "category": category,
        "client_id": client_id,
        "status": status,
        "records_affected": records_affected,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.platform_sync_logs.insert_one(log_entry)
    sync_logs.append(log_entry)
    
    return log_entry

async def get_mock_data(platform: str, category: str, client_id: Optional[str] = None) -> dict:
    """Get mock data for a platform"""
    if category == "client":
        clients = MOCK_CLIENTS.get(platform, [])
        if client_id:
            return next((c for c in clients if c["client_id"] == client_id), None)
        return clients
    elif category == "portfolio":
        portfolios = MOCK_PORTFOLIOS.get(platform, {})
        if client_id:
            return portfolios.get(client_id)
        return portfolios
    return None

# ============== ENDPOINTS ==============

@router.get("/available")
async def get_available_platforms() -> dict:
    """Get list of available platform integrations with capabilities"""
    platforms = []
    for key, config in PLATFORM_CONFIGS.items():
        platforms.append({
            "platform_id": key,
            "name": config["name"],
            "description": config["description"],
            "read_capabilities": config["read_capabilities"],
            "write_capabilities": config["write_capabilities"],
            "supports_webhooks": config["supports_webhooks"],
            "supports_real_time": config["supports_real_time"],
            "sync_frequency_minutes": config["sync_frequency_minutes"],
            "bidirectional": len(config["write_capabilities"]) > 0
        })
    return {
        "platforms": platforms,
        "total_platforms": len(platforms),
        "bidirectional_note": "All platforms support bi-directional data flow. READ operations pull data from platforms; WRITE operations push scenarios, file notes, and documents back."
    }

@router.get("/status")
async def get_all_connection_status() -> dict:
    """Get connection status for all platforms"""
    statuses = []
    for platform_id in PLATFORM_CONFIGS.keys():
        conn = platform_connections.get(platform_id, {})
        statuses.append({
            "platform": platform_id,
            "name": PLATFORM_CONFIGS[platform_id]["name"],
            "status": conn.get("status", "disconnected"),
            "connected_at": conn.get("connected_at"),
            "last_sync": conn.get("last_sync"),
            "clients_synced": conn.get("clients_synced", 0),
            "mode": conn.get("mode", "demo")
        })
    return {"connections": statuses}

@router.post("/connect/{platform}")
async def connect_platform(platform: Platform, credentials: Optional[PlatformCredentials] = None) -> dict:
    """
    Connect to a platform (demo mode if no credentials provided)
    """
    platform_key = platform.value
    config = PLATFORM_CONFIGS.get(platform_key)
    
    if not config:
        raise HTTPException(status_code=404, detail=f"Platform {platform} not found")
    
    # Demo mode or production mode
    mode = "production" if credentials and credentials.client_id else "demo"
    
    connection = {
        "platform": platform_key,
        "name": config["name"],
        "status": "connected",
        "mode": mode,
        "connected_at": datetime.now(timezone.utc).isoformat(),
        "last_sync": None,
        "clients_synced": 0,
        "credentials_provided": credentials is not None,
        "api_base": config["api_base_url"],
        "capabilities": {
            "read": config["read_capabilities"],
            "write": config["write_capabilities"]
        }
    }
    
    platform_connections[platform_key] = connection
    
    # Log connection event
    await log_sync_event(
        platform=platform_key,
        direction="connection",
        category="system",
        client_id=None,
        status="success",
        records_affected=0,
        details={"mode": mode}
    )
    
    return {
        "status": "connected",
        "platform": platform_key,
        "name": config["name"],
        "mode": mode,
        "message": f"Successfully connected to {config['name']} in {mode} mode",
        "capabilities": connection["capabilities"],
        "bidirectional": True,
        "next_steps": [
            "Use GET /platforms/{platform}/clients to fetch client data",
            "Use POST /platforms/sync to synchronize data",
            "Use POST /platforms/write-back to push data back to platform"
        ]
    }

@router.delete("/disconnect/{platform}")
async def disconnect_platform(platform: Platform) -> dict:
    """Disconnect from a platform"""
    platform_key = platform.value
    
    if platform_key in platform_connections:
        del platform_connections[platform_key]
        
        await log_sync_event(
            platform=platform_key,
            direction="disconnection",
            category="system",
            client_id=None,
            status="success",
            records_affected=0
        )
        
        return {"status": "disconnected", "platform": platform_key}
    
    raise HTTPException(status_code=404, detail=f"No active connection for {platform}")

@router.get("/{platform}/clients")
async def get_platform_clients(platform: Platform) -> dict:
    """
    READ: Fetch clients from a platform
    """
    platform_key = platform.value
    
    # Check connection
    if platform_key not in platform_connections:
        # Auto-connect in demo mode
        await connect_platform(platform)
    
    clients = await get_mock_data(platform_key, "client")
    
    await log_sync_event(
        platform=platform_key,
        direction="inbound",
        category="client",
        client_id=None,
        status="success",
        records_affected=len(clients) if clients else 0
    )
    
    return {
        "platform": platform_key,
        "platform_name": PLATFORM_CONFIGS[platform_key]["name"],
        "clients": clients,
        "total": len(clients) if clients else 0,
        "synced_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/{platform}/clients/{client_id}")
async def get_platform_client_detail(platform: Platform, client_id: str) -> dict:
    """
    READ: Get detailed client data including portfolio
    """
    platform_key = platform.value
    
    client = await get_mock_data(platform_key, "client", client_id)
    portfolio = await get_mock_data(platform_key, "portfolio", client_id)
    
    if not client and not portfolio:
        raise HTTPException(status_code=404, detail=f"Client {client_id} not found on {platform}")
    
    await log_sync_event(
        platform=platform_key,
        direction="inbound",
        category="portfolio",
        client_id=client_id,
        status="success",
        records_affected=1
    )
    
    return {
        "platform": platform_key,
        "client": client,
        "portfolio": portfolio,
        "synced_at": datetime.now(timezone.utc).isoformat()
    }

@router.post("/sync")
async def sync_platform_data(request: SyncRequest) -> dict:
    """
    Bi-directional sync with a platform
    """
    platform_key = request.platform.value
    config = PLATFORM_CONFIGS.get(platform_key)
    
    if not config:
        raise HTTPException(status_code=404, detail=f"Platform {request.platform} not found")
    
    # Ensure connection
    if platform_key not in platform_connections:
        await connect_platform(request.platform)
    
    sync_results = {
        "sync_id": f"SYNC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        "platform": platform_key,
        "direction": request.direction.value,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "categories_synced": [],
        "inbound_records": 0,
        "outbound_records": 0,
        "errors": []
    }
    
    # Simulate sync for each category
    for category in request.data_categories:
        if request.direction in [SyncDirection.INBOUND, SyncDirection.BIDIRECTIONAL]:
            # Pull data from platform
            if category.value == "client":
                clients = await get_mock_data(platform_key, "client")
                sync_results["inbound_records"] += len(clients) if clients else 0
            elif category.value == "portfolio":
                portfolios = MOCK_PORTFOLIOS.get(platform_key, {})
                sync_results["inbound_records"] += len(portfolios)
        
        if request.direction in [SyncDirection.OUTBOUND, SyncDirection.BIDIRECTIONAL]:
            # Would push pending changes to platform
            sync_results["outbound_records"] += 0  # Demo mode
        
        sync_results["categories_synced"].append(category.value)
    
    sync_results["completed_at"] = datetime.now(timezone.utc).isoformat()
    sync_results["status"] = "success"
    
    # Update connection status
    platform_connections[platform_key]["last_sync"] = sync_results["completed_at"]
    platform_connections[platform_key]["clients_synced"] = sync_results["inbound_records"]
    
    # Log sync
    await log_sync_event(
        platform=platform_key,
        direction=request.direction.value,
        category=",".join([c.value for c in request.data_categories]),
        client_id=",".join(request.client_ids) if request.client_ids else "all",
        status="success",
        records_affected=sync_results["inbound_records"] + sync_results["outbound_records"],
        details=sync_results
    )
    
    return sync_results

@router.post("/write-back")
async def write_back_to_platform(request: WriteBackRequest) -> dict:
    """
    WRITE: Push data back to a platform
    Supports: file_notes, scenarios, documents
    """
    platform_key = request.platform.value
    config = PLATFORM_CONFIGS.get(platform_key)
    
    if not config:
        raise HTTPException(status_code=404, detail=f"Platform {request.platform} not found")
    
    # Check if write is supported for this data type
    data_type_mapping = {
        "file_note": "file_notes",
        "scenario": "scenarios",
        "document": "documents"
    }
    
    write_capability = data_type_mapping.get(request.data_type.value, request.data_type.value)
    
    if write_capability not in config["write_capabilities"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Platform {platform_key} does not support writing {request.data_type.value}. Supported: {config['write_capabilities']}"
        )
    
    # Create write record
    write_record = {
        "write_id": f"WR-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        "platform": platform_key,
        "client_id": request.client_id,
        "data_type": request.data_type.value,
        "data": request.data,
        "notes": request.notes,
        "status": "success",
        "written_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Store in database
    db = await get_db()
    await db.platform_write_backs.insert_one({**write_record, "_id": write_record["write_id"]})
    
    # Log the write
    await log_sync_event(
        platform=platform_key,
        direction="outbound",
        category=request.data_type.value,
        client_id=request.client_id,
        status="success",
        records_affected=1,
        details={"write_id": write_record["write_id"]}
    )
    
    return {
        "status": "success",
        "write_id": write_record["write_id"],
        "platform": platform_key,
        "platform_name": config["name"],
        "client_id": request.client_id,
        "data_type": request.data_type.value,
        "message": f"Successfully wrote {request.data_type.value} to {config['name']}",
        "written_at": write_record["written_at"]
    }

@router.post("/push-retirement-data")
async def push_retirement_data(request: RetirementDataPush) -> dict:
    """
    Push retirement calculator results to client profiles on platforms
    Supports both accumulation and decumulation data
    """
    results = []
    
    for platform in request.target_platforms:
        platform_key = platform.value
        config = PLATFORM_CONFIGS.get(platform_key)
        
        if not config:
            results.append({
                "platform": platform_key,
                "status": "error",
                "message": f"Platform {platform_key} not found"
            })
            continue
        
        # Prepare retirement data for the platform
        retirement_data = {
            "client_id": request.client_id,
            "calculation_type": request.calculation_type,
            "calculation_id": request.calculation_id,
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "summary": request.data.get("summary", {}),
            "projections": request.data.get("projections", []),
            "recommendations": request.data.get("recommendations", []),
            "source": "AdviceOS"
        }
        
        # Store locally and mark for sync
        db = await get_db()
        await db.client_retirement_profiles.update_one(
            {"client_id": request.client_id, "platform": platform_key},
            {"$set": {
                "retirement_data": retirement_data,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "sync_status": "pending"
            }},
            upsert=True
        )
        
        # Simulate write to platform
        write_result = await write_back_to_platform(WriteBackRequest(
            platform=platform,
            client_id=request.client_id,
            data_type=DataCategory.SCENARIO,
            data=retirement_data,
            notes=f"Retirement {request.calculation_type} calculation from AdviceOS"
        ))
        
        results.append({
            "platform": platform_key,
            "platform_name": config["name"],
            "status": "success",
            "write_id": write_result["write_id"],
            "message": f"Retirement data pushed to {config['name']}"
        })
    
    return {
        "push_id": f"PUSH-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        "client_id": request.client_id,
        "calculation_type": request.calculation_type,
        "calculation_id": request.calculation_id,
        "results": results,
        "pushed_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/sync-logs")
async def get_sync_logs(
    platform: Optional[Platform] = None,
    direction: Optional[SyncDirection] = None,
    limit: int = 50
) -> dict:
    """Get sync audit logs"""
    db = await get_db()
    
    query = {}
    if platform:
        query["platform"] = platform.value
    if direction:
        query["direction"] = direction.value
    
    logs = await db.platform_sync_logs.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    return {
        "logs": logs,
        "total": len(logs),
        "filters": {
            "platform": platform.value if platform else None,
            "direction": direction.value if direction else None
        }
    }

@router.get("/demo/all-clients")
async def get_all_demo_clients() -> dict:
    """Get all demo clients across all platforms for testing"""
    all_clients = []
    for platform, clients in MOCK_CLIENTS.items():
        for client in clients:
            all_clients.append({
                "platform": platform,
                "platform_name": PLATFORM_CONFIGS[platform]["name"],
                **client
            })
    
    return {
        "total_clients": len(all_clients),
        "clients": all_clients,
        "platforms_included": list(MOCK_CLIENTS.keys())
    }

@router.get("/demo/portfolio-summary")
async def get_demo_portfolio_summary() -> dict:
    """Get summary of all demo portfolios"""
    summary = []
    total_value = 0
    
    for platform, portfolios in MOCK_PORTFOLIOS.items():
        platform_total = 0
        for client_id, portfolio in portfolios.items():
            value = portfolio.get("total_value", 0)
            platform_total += value
            summary.append({
                "platform": platform,
                "platform_name": PLATFORM_CONFIGS[platform]["name"],
                "client_id": client_id,
                "account_name": portfolio.get("account_name") or portfolio.get("fund_name"),
                "account_type": portfolio.get("account_type", "unknown"),
                "total_value": value,
                "holdings_count": len(portfolio.get("holdings", []))
            })
        total_value += platform_total
    
    return {
        "total_aum": total_value,
        "total_portfolios": len(summary),
        "portfolios": summary
    }
