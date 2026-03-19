"""
Xplan Integration Module for Wealth Command
============================================

This module provides integration with IRESS Xplan financial planning software.
Each advisor practice connects their own Xplan instance.

Core Principle:
- Xplan = System of Record (compliance, storage)
- Wealth Command = System of Intelligence (modelling, insights, actions)

Authentication Methods Supported:
- HTTP Basic Authentication (username/password)
- HTTP Basic + 2FA (username/password + OTP)
- OAuth 2.0 (for user-authorized access)
"""

import os
import base64
import httpx
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
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
xplan_configs = db["xplan_configs"]
xplan_sync_logs = db["xplan_sync_logs"]
xplan_clients = db["xplan_clients"]
xplan_portfolios = db["xplan_portfolios"]
xplan_assets = db["xplan_assets"]
xplan_goals = db["xplan_goals"]

# ==================== MODELS ====================

class XplanConnectionConfig(BaseModel):
    """Configuration for connecting to an Xplan instance"""
    site_url: str = Field(..., description="Xplan site URL (e.g., yoursite.xplan.iress.com.au)")
    username: str = Field(..., description="Xplan username")
    password: str = Field(..., description="Xplan password")
    app_id: Optional[str] = Field(None, description="Xplan App ID for API access")
    use_2fa: bool = Field(False, description="Whether 2FA is enabled")
    totp_secret: Optional[str] = Field(None, description="TOTP secret for 2FA")
    auth_method: str = Field("basic", description="Auth method: basic, basic_2fa, oauth")

class XplanTestConnectionRequest(BaseModel):
    site_url: str
    username: str
    password: str
    app_id: Optional[str] = None

class XplanSyncRequest(BaseModel):
    advisor_id: str
    sync_type: str = Field("full", description="Sync type: full, clients, portfolios, assets, goals")
    client_ids: Optional[List[str]] = Field(None, description="Specific client IDs to sync")

class XplanPushRequest(BaseModel):
    advisor_id: str
    client_id: str
    data_type: str = Field(..., description="Data type: strategy, scenario, document, note")
    data: Dict[str, Any]

class XplanClientData(BaseModel):
    """Client data structure from Xplan"""
    xplan_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    risk_profile: Optional[str] = None
    employment_status: Optional[str] = None
    occupation: Optional[str] = None
    employer: Optional[str] = None
    marital_status: Optional[str] = None
    dependants: Optional[int] = None
    # Financial fact find
    annual_income: Optional[float] = None
    annual_expenses: Optional[float] = None
    tax_residency: Optional[str] = None

# ==================== XPLAN API CLIENT ====================

class XplanAPIClient:
    """
    Client for interacting with Xplan's Resourceful API (RAPI)
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.site_url = config.get("site_url", "").rstrip("/")
        self.username = config.get("username", "")
        self.password = config.get("password", "")
        self.app_id = config.get("app_id", "wealth-command")
        self.use_2fa = config.get("use_2fa", False)
        self.totp_secret = config.get("totp_secret")
        self.session_cookie = None
        self.is_demo_mode = config.get("demo_mode", False)
        
        # Construct base URL
        if self.site_url and not self.site_url.startswith("http"):
            self.base_url = f"https://{self.site_url}"
        else:
            self.base_url = self.site_url
            
    def _get_auth_header(self) -> str:
        """Generate Basic Auth header"""
        credentials = f"{self.username}:{self.password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Xplan API requests"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-xplan-app-id": self.app_id,
        }
        
        # Add forwarded host for Xplan routing
        if self.site_url:
            headers["x-forwarded-host"] = self.site_url.replace("https://", "").replace("http://", "")
        
        # Add auth
        if self.session_cookie:
            headers["Cookie"] = f"XPLANID={self.session_cookie}"
        else:
            headers["Authorization"] = self._get_auth_header()
            
        return headers
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to Xplan"""
        if self.is_demo_mode:
            return {
                "success": True,
                "mode": "demo",
                "message": "Demo mode - connection simulated",
                "site": self.site_url or "demo.xplan.iress.com.au"
            }
        
        if not self.site_url or not self.username:
            return {
                "success": False,
                "error": "Missing site URL or username"
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Try to authenticate and get user info
                response = await client.get(
                    f"{self.base_url}/resourceful/entity/user-v2/self",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    # Extract session cookie if present
                    if "XPLANID" in response.cookies:
                        self.session_cookie = response.cookies["XPLANID"]
                    
                    return {
                        "success": True,
                        "mode": "live",
                        "site": self.site_url,
                        "user_info": response.json()
                    }
                elif response.status_code == 401:
                    return {
                        "success": False,
                        "error": "Authentication failed - check credentials"
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Connection failed: {response.status_code}"
                    }
                    
        except httpx.ConnectError:
            return {
                "success": False,
                "error": f"Could not connect to {self.site_url}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_clients(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch clients from Xplan"""
        if self.is_demo_mode:
            return self._get_demo_clients()
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/resourceful/entity/client-v2",
                    headers=self._get_headers(),
                    params={"limit": limit, "offset": offset}
                )
                
                if response.status_code == 200:
                    return response.json().get("data", [])
                else:
                    logger.error(f"Failed to fetch clients: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching clients: {e}")
            return []
    
    async def get_client_details(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Fetch detailed client information"""
        if self.is_demo_mode:
            return self._get_demo_client_details(client_id)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/resourceful/entity/client-v2/{client_id}",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
                
        except Exception as e:
            logger.error(f"Error fetching client details: {e}")
            return None
    
    async def get_client_portfolios(self, client_id: str) -> List[Dict[str, Any]]:
        """Fetch portfolios for a client"""
        if self.is_demo_mode:
            return self._get_demo_portfolios(client_id)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/resourceful/portfolio",
                    headers=self._get_headers(),
                    params={"client_id": client_id}
                )
                
                if response.status_code == 200:
                    return response.json().get("data", [])
                return []
                
        except Exception as e:
            logger.error(f"Error fetching portfolios: {e}")
            return []
    
    async def get_portfolio_holdings(self, portfolio_id: str) -> List[Dict[str, Any]]:
        """Fetch holdings for a portfolio"""
        if self.is_demo_mode:
            return self._get_demo_holdings(portfolio_id)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/resourceful/portfolio/{portfolio_id}/holdings",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    return response.json().get("data", [])
                return []
                
        except Exception as e:
            logger.error(f"Error fetching holdings: {e}")
            return []
    
    async def get_client_assets(self, client_id: str) -> List[Dict[str, Any]]:
        """Fetch assets for a client"""
        if self.is_demo_mode:
            return self._get_demo_assets(client_id)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/resourceful/entity/asset",
                    headers=self._get_headers(),
                    params={"client_id": client_id}
                )
                
                if response.status_code == 200:
                    return response.json().get("data", [])
                return []
                
        except Exception as e:
            logger.error(f"Error fetching assets: {e}")
            return []
    
    async def get_client_liabilities(self, client_id: str) -> List[Dict[str, Any]]:
        """Fetch liabilities for a client"""
        if self.is_demo_mode:
            return self._get_demo_liabilities(client_id)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/resourceful/entity/liability",
                    headers=self._get_headers(),
                    params={"client_id": client_id}
                )
                
                if response.status_code == 200:
                    return response.json().get("data", [])
                return []
                
        except Exception as e:
            logger.error(f"Error fetching liabilities: {e}")
            return []
    
    async def get_client_goals(self, client_id: str) -> List[Dict[str, Any]]:
        """Fetch goals/objectives for a client"""
        if self.is_demo_mode:
            return self._get_demo_goals(client_id)
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/resourceful/entity/goal",
                    headers=self._get_headers(),
                    params={"client_id": client_id}
                )
                
                if response.status_code == 200:
                    return response.json().get("data", [])
                return []
                
        except Exception as e:
            logger.error(f"Error fetching goals: {e}")
            return []
    
    async def push_strategy(self, client_id: str, strategy_data: Dict[str, Any]) -> Dict[str, Any]:
        """Push strategy recommendation to Xplan"""
        if self.is_demo_mode:
            return {
                "success": True,
                "mode": "demo",
                "message": "Strategy would be pushed to Xplan",
                "xplan_ref": f"DEMO-STR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/resourceful/entity/strategy",
                    headers=self._get_headers(),
                    json={
                        "client_id": client_id,
                        **strategy_data
                    }
                )
                
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "mode": "live",
                        "data": response.json()
                    }
                return {
                    "success": False,
                    "error": f"Failed to push strategy: {response.status_code}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def push_document(self, client_id: str, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Push document/report to Xplan"""
        if self.is_demo_mode:
            return {
                "success": True,
                "mode": "demo",
                "message": "Document would be uploaded to Xplan",
                "xplan_ref": f"DEMO-DOC-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/resourceful/entity/document",
                    headers=self._get_headers(),
                    json={
                        "client_id": client_id,
                        **document_data
                    }
                )
                
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "mode": "live",
                        "data": response.json()
                    }
                return {
                    "success": False,
                    "error": f"Failed to upload document: {response.status_code}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def push_note(self, client_id: str, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Push note/comment to Xplan"""
        if self.is_demo_mode:
            return {
                "success": True,
                "mode": "demo",
                "message": "Note would be added to Xplan",
                "xplan_ref": f"DEMO-NOTE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/resourceful/entity/note",
                    headers=self._get_headers(),
                    json={
                        "client_id": client_id,
                        **note_data
                    }
                )
                
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "mode": "live",
                        "data": response.json()
                    }
                return {
                    "success": False,
                    "error": f"Failed to add note: {response.status_code}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== DEMO DATA ====================
    
    def _get_demo_clients(self) -> List[Dict[str, Any]]:
        """Return demo client data"""
        return [
            {
                "entity_id": "xplan_001",
                "first_name": "James",
                "last_name": "Wheeler",
                "email": "james.wheeler@email.com",
                "phone": "0412 345 678",
                "date_of_birth": "1968-07-22",
                "risk_profile": "Growth",
                "marital_status": "Married",
                "occupation": "Business Owner",
                "employer": "Wheeler Consulting",
                "annual_income": 350000
            },
            {
                "entity_id": "xplan_002",
                "first_name": "Sarah",
                "last_name": "Wheeler",
                "email": "sarah.wheeler@email.com",
                "phone": "0412 345 679",
                "date_of_birth": "1970-03-15",
                "risk_profile": "Balanced",
                "marital_status": "Married",
                "occupation": "Marketing Director",
                "employer": "Global Media Co",
                "annual_income": 180000
            },
            {
                "entity_id": "xplan_003",
                "first_name": "Michael",
                "last_name": "Chen",
                "email": "m.chen@email.com",
                "phone": "0423 456 789",
                "date_of_birth": "1975-11-08",
                "risk_profile": "Aggressive",
                "marital_status": "Single",
                "occupation": "Software Engineer",
                "employer": "Tech Corp",
                "annual_income": 220000
            },
            {
                "entity_id": "xplan_004",
                "first_name": "Emma",
                "last_name": "Thompson",
                "email": "emma.t@email.com",
                "phone": "0434 567 890",
                "date_of_birth": "1982-05-20",
                "risk_profile": "Conservative",
                "marital_status": "Divorced",
                "occupation": "Doctor",
                "employer": "St Vincent's Hospital",
                "annual_income": 420000
            }
        ]
    
    def _get_demo_client_details(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Return demo client details"""
        clients = {c["entity_id"]: c for c in self._get_demo_clients()}
        base = clients.get(client_id)
        if base:
            base.update({
                "address": {
                    "street": "42 Harbour View Drive",
                    "suburb": "Mosman",
                    "state": "NSW",
                    "postcode": "2088",
                    "country": "Australia"
                },
                "dependants": 2,
                "annual_expenses": 120000,
                "tax_residency": "Australia",
                "tfn_provided": True,
                "client_since": "2019-03-15"
            })
        return base
    
    def _get_demo_portfolios(self, client_id: str) -> List[Dict[str, Any]]:
        """Return demo portfolio data"""
        return [
            {
                "portfolio_id": f"{client_id}_super",
                "name": "Superannuation",
                "type": "superannuation",
                "institution": "AustralianSuper",
                "value": 520000,
                "last_updated": "2026-03-18"
            },
            {
                "portfolio_id": f"{client_id}_invest",
                "name": "Investment Portfolio",
                "type": "investment",
                "institution": "Macquarie",
                "value": 650000,
                "last_updated": "2026-03-18"
            },
            {
                "portfolio_id": f"{client_id}_smsf",
                "name": "Family SMSF",
                "type": "smsf",
                "institution": "Self-Managed",
                "value": 380000,
                "last_updated": "2026-03-18"
            }
        ]
    
    def _get_demo_holdings(self, portfolio_id: str) -> List[Dict[str, Any]]:
        """Return demo holdings data"""
        return [
            {"security_code": "VAS", "name": "Vanguard Australian Shares", "units": 1500, "price": 95.50, "value": 143250, "weight": 22.0},
            {"security_code": "IVV", "name": "iShares S&P 500", "units": 120, "price": 580.00, "value": 69600, "weight": 10.7},
            {"security_code": "BHP", "name": "BHP Group", "units": 1200, "price": 45.50, "value": 54600, "weight": 8.4},
            {"security_code": "CBA", "name": "Commonwealth Bank", "units": 400, "price": 118.50, "value": 47400, "weight": 7.3},
            {"security_code": "CSL", "name": "CSL Limited", "units": 150, "price": 295.00, "value": 44250, "weight": 6.8},
            {"security_code": "CASH", "name": "Cash", "units": 1, "price": 85000, "value": 85000, "weight": 13.1}
        ]
    
    def _get_demo_assets(self, client_id: str) -> List[Dict[str, Any]]:
        """Return demo assets data"""
        return [
            {"asset_id": f"{client_id}_prop1", "type": "property", "name": "Family Home - Mosman", "value": 2200000, "debt": 850000},
            {"asset_id": f"{client_id}_prop2", "type": "property", "name": "Investment Unit - Parramatta", "value": 850000, "debt": 0, "rental_income": 2800},
            {"asset_id": f"{client_id}_car1", "type": "vehicle", "name": "Tesla Model 3", "value": 65000, "debt": 0},
            {"asset_id": f"{client_id}_art", "type": "collectible", "name": "Art Collection", "value": 45000, "debt": 0}
        ]
    
    def _get_demo_liabilities(self, client_id: str) -> List[Dict[str, Any]]:
        """Return demo liabilities data"""
        return [
            {"liability_id": f"{client_id}_mort", "type": "mortgage", "name": "Home Loan - CBA", "balance": 850000, "interest_rate": 6.2, "monthly_payment": 5200},
            {"liability_id": f"{client_id}_cc", "type": "credit_card", "name": "Amex Platinum", "balance": 8500, "interest_rate": 20.99, "limit": 25000}
        ]
    
    def _get_demo_goals(self, client_id: str) -> List[Dict[str, Any]]:
        """Return demo goals data"""
        return [
            {"goal_id": f"{client_id}_ret", "name": "Retirement at 62", "target": 3500000, "current": 2850000, "target_date": "2030-07-22", "priority": "high"},
            {"goal_id": f"{client_id}_mort", "name": "Pay off mortgage", "target": 850000, "current": 110000, "target_date": "2035-01-01", "priority": "high"},
            {"goal_id": f"{client_id}_edu", "name": "Children's education", "target": 200000, "current": 85000, "target_date": "2028-01-01", "priority": "medium"},
            {"goal_id": f"{client_id}_travel", "name": "European holiday", "target": 25000, "current": 15000, "target_date": "2026-06-01", "priority": "low"}
        ]


# ==================== API ROUTES ====================

@router.get("/status")
async def get_xplan_status(advisor_id: str = "default"):
    """Get Xplan connection status for an advisor"""
    config = await xplan_configs.find_one({"advisor_id": advisor_id}, {"_id": 0, "password": 0, "totp_secret": 0})
    
    if not config:
        return {
            "connected": False,
            "mode": "not_configured",
            "message": "Xplan integration not configured. Set up your connection in Settings."
        }
    
    return {
        "connected": True,
        "mode": "demo" if config.get("demo_mode") else "live",
        "site_url": config.get("site_url"),
        "last_sync": config.get("last_sync"),
        "sync_status": config.get("sync_status", "idle")
    }


@router.post("/configure")
async def configure_xplan(config: XplanConnectionConfig, advisor_id: str = "default"):
    """Configure Xplan connection for an advisor"""
    # Test connection first
    api_client = XplanAPIClient({
        "site_url": config.site_url,
        "username": config.username,
        "password": config.password,
        "app_id": config.app_id,
        "demo_mode": config.site_url.lower() == "demo" or not config.site_url
    })
    
    test_result = await api_client.test_connection()
    
    if not test_result.get("success"):
        raise HTTPException(status_code=400, detail=test_result.get("error", "Connection failed"))
    
    # Save configuration (encrypt password in production)
    config_data = {
        "advisor_id": advisor_id,
        "site_url": config.site_url,
        "username": config.username,
        "password": config.password,  # Should be encrypted in production
        "app_id": config.app_id,
        "use_2fa": config.use_2fa,
        "auth_method": config.auth_method,
        "demo_mode": config.site_url.lower() == "demo" or not config.site_url,
        "configured_at": datetime.now(timezone.utc).isoformat(),
        "last_sync": None,
        "sync_status": "idle"
    }
    
    await xplan_configs.update_one(
        {"advisor_id": advisor_id},
        {"$set": config_data},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Xplan connection configured successfully",
        "mode": "demo" if config_data["demo_mode"] else "live",
        "connection_test": test_result
    }


@router.post("/test-connection")
async def test_xplan_connection(request: XplanTestConnectionRequest):
    """Test Xplan connection without saving"""
    api_client = XplanAPIClient({
        "site_url": request.site_url,
        "username": request.username,
        "password": request.password,
        "app_id": request.app_id,
        "demo_mode": request.site_url.lower() == "demo" or not request.site_url
    })
    
    result = await api_client.test_connection()
    return result


@router.post("/enable-demo")
async def enable_demo_mode(advisor_id: str = "default"):
    """Enable demo mode for Xplan integration"""
    config_data = {
        "advisor_id": advisor_id,
        "site_url": "demo.xplan.iress.com.au",
        "username": "demo_user",
        "password": "",
        "demo_mode": True,
        "configured_at": datetime.now(timezone.utc).isoformat(),
        "last_sync": None,
        "sync_status": "idle"
    }
    
    await xplan_configs.update_one(
        {"advisor_id": advisor_id},
        {"$set": config_data},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Demo mode enabled",
        "mode": "demo"
    }


@router.post("/sync")
async def sync_from_xplan(request: XplanSyncRequest, background_tasks: BackgroundTasks):
    """Sync data from Xplan"""
    config = await xplan_configs.find_one({"advisor_id": request.advisor_id})
    
    if not config:
        raise HTTPException(status_code=404, detail="Xplan not configured for this advisor")
    
    # Update sync status
    await xplan_configs.update_one(
        {"advisor_id": request.advisor_id},
        {"$set": {"sync_status": "syncing"}}
    )
    
    # Run sync in background
    background_tasks.add_task(
        perform_sync,
        request.advisor_id,
        config,
        request.sync_type,
        request.client_ids
    )
    
    return {
        "success": True,
        "message": "Sync started",
        "sync_type": request.sync_type
    }


async def perform_sync(advisor_id: str, config: Dict, sync_type: str, client_ids: Optional[List[str]]):
    """Background task to perform Xplan sync"""
    api_client = XplanAPIClient(config)
    sync_log = {
        "advisor_id": advisor_id,
        "sync_type": sync_type,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "running",
        "records_synced": 0,
        "errors": []
    }
    
    try:
        # Fetch clients
        if sync_type in ["full", "clients"]:
            clients = await api_client.get_clients()
            for client in clients:
                client["advisor_id"] = advisor_id
                client["synced_at"] = datetime.now(timezone.utc).isoformat()
                await xplan_clients.update_one(
                    {"advisor_id": advisor_id, "entity_id": client["entity_id"]},
                    {"$set": client},
                    upsert=True
                )
                sync_log["records_synced"] += 1
        
        # Fetch portfolios and holdings
        if sync_type in ["full", "portfolios"]:
            clients = await xplan_clients.find({"advisor_id": advisor_id}).to_list(1000)
            for client in clients:
                portfolios = await api_client.get_client_portfolios(client["entity_id"])
                for portfolio in portfolios:
                    portfolio["advisor_id"] = advisor_id
                    portfolio["client_id"] = client["entity_id"]
                    portfolio["synced_at"] = datetime.now(timezone.utc).isoformat()
                    
                    # Fetch holdings for each portfolio
                    holdings = await api_client.get_portfolio_holdings(portfolio["portfolio_id"])
                    portfolio["holdings"] = holdings
                    
                    await xplan_portfolios.update_one(
                        {"advisor_id": advisor_id, "portfolio_id": portfolio["portfolio_id"]},
                        {"$set": portfolio},
                        upsert=True
                    )
                    sync_log["records_synced"] += 1
        
        # Fetch assets and liabilities
        if sync_type in ["full", "assets"]:
            clients = await xplan_clients.find({"advisor_id": advisor_id}).to_list(1000)
            for client in clients:
                assets = await api_client.get_client_assets(client["entity_id"])
                liabilities = await api_client.get_client_liabilities(client["entity_id"])
                
                for asset in assets:
                    asset["advisor_id"] = advisor_id
                    asset["client_id"] = client["entity_id"]
                    asset["synced_at"] = datetime.now(timezone.utc).isoformat()
                    await xplan_assets.update_one(
                        {"advisor_id": advisor_id, "asset_id": asset["asset_id"]},
                        {"$set": asset},
                        upsert=True
                    )
                    sync_log["records_synced"] += 1
                
                for liability in liabilities:
                    liability["advisor_id"] = advisor_id
                    liability["client_id"] = client["entity_id"]
                    liability["asset_type"] = "liability"
                    liability["synced_at"] = datetime.now(timezone.utc).isoformat()
                    await xplan_assets.update_one(
                        {"advisor_id": advisor_id, "liability_id": liability["liability_id"]},
                        {"$set": liability},
                        upsert=True
                    )
                    sync_log["records_synced"] += 1
        
        # Fetch goals
        if sync_type in ["full", "goals"]:
            clients = await xplan_clients.find({"advisor_id": advisor_id}).to_list(1000)
            for client in clients:
                goals = await api_client.get_client_goals(client["entity_id"])
                for goal in goals:
                    goal["advisor_id"] = advisor_id
                    goal["client_id"] = client["entity_id"]
                    goal["synced_at"] = datetime.now(timezone.utc).isoformat()
                    await xplan_goals.update_one(
                        {"advisor_id": advisor_id, "goal_id": goal["goal_id"]},
                        {"$set": goal},
                        upsert=True
                    )
                    sync_log["records_synced"] += 1
        
        sync_log["status"] = "completed"
        sync_log["completed_at"] = datetime.now(timezone.utc).isoformat()
        
    except Exception as e:
        sync_log["status"] = "failed"
        sync_log["errors"].append(str(e))
        sync_log["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    # Save sync log
    await xplan_sync_logs.insert_one(sync_log)
    
    # Update config
    await xplan_configs.update_one(
        {"advisor_id": advisor_id},
        {"$set": {
            "sync_status": "idle",
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "last_sync_result": sync_log["status"]
        }}
    )


@router.get("/clients")
async def get_synced_clients(advisor_id: str = "default"):
    """Get clients synced from Xplan"""
    clients = await xplan_clients.find(
        {"advisor_id": advisor_id},
        {"_id": 0}
    ).to_list(1000)
    
    return {
        "clients": clients,
        "count": len(clients)
    }


@router.get("/client/{client_id}")
async def get_synced_client_details(client_id: str, advisor_id: str = "default"):
    """Get detailed client data from Xplan sync"""
    client = await xplan_clients.find_one(
        {"advisor_id": advisor_id, "entity_id": client_id},
        {"_id": 0}
    )
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get related data
    portfolios = await xplan_portfolios.find(
        {"advisor_id": advisor_id, "client_id": client_id},
        {"_id": 0}
    ).to_list(100)
    
    assets = await xplan_assets.find(
        {"advisor_id": advisor_id, "client_id": client_id, "asset_type": {"$ne": "liability"}},
        {"_id": 0}
    ).to_list(100)
    
    liabilities = await xplan_assets.find(
        {"advisor_id": advisor_id, "client_id": client_id, "asset_type": "liability"},
        {"_id": 0}
    ).to_list(100)
    
    goals = await xplan_goals.find(
        {"advisor_id": advisor_id, "client_id": client_id},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "client": client,
        "portfolios": portfolios,
        "assets": assets,
        "liabilities": liabilities,
        "goals": goals
    }


@router.post("/push")
async def push_to_xplan(request: XplanPushRequest):
    """Push data back to Xplan"""
    config = await xplan_configs.find_one({"advisor_id": request.advisor_id})
    
    if not config:
        raise HTTPException(status_code=404, detail="Xplan not configured")
    
    api_client = XplanAPIClient(config)
    
    if request.data_type == "strategy":
        result = await api_client.push_strategy(request.client_id, request.data)
    elif request.data_type == "document":
        result = await api_client.push_document(request.client_id, request.data)
    elif request.data_type == "note":
        result = await api_client.push_note(request.client_id, request.data)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown data type: {request.data_type}")
    
    # Log the push
    push_log = {
        "advisor_id": request.advisor_id,
        "client_id": request.client_id,
        "data_type": request.data_type,
        "pushed_at": datetime.now(timezone.utc).isoformat(),
        "result": result
    }
    await xplan_sync_logs.insert_one(push_log)
    
    return result


@router.get("/sync-history")
async def get_sync_history(advisor_id: str = "default", limit: int = 10):
    """Get sync history for an advisor"""
    logs = await xplan_sync_logs.find(
        {"advisor_id": advisor_id},
        {"_id": 0}
    ).sort("started_at", -1).limit(limit).to_list(limit)
    
    return {"history": logs}
