"""
Real-Time Data Layer
Live pricing, position updates, alerts, and triggers via WebSocket.
Powers the real-time nature of the execution platform.
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timezone, timedelta
import asyncio
import json
import logging
import random

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/realtime", tags=["Real-Time Data Layer"])


# ==================== CONNECTION MANAGER ====================

class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # channel -> connections
        self.user_connections: Dict[str, WebSocket] = {}  # user_id -> connection
        self.subscriptions: Dict[str, Set[str]] = {}  # connection_id -> channels
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.user_connections[user_id] = websocket
        logger.info(f"WebSocket connected: {user_id}")
    
    def disconnect(self, user_id: str):
        if user_id in self.user_connections:
            del self.user_connections[user_id]
            logger.info(f"WebSocket disconnected: {user_id}")
    
    async def subscribe(self, user_id: str, channel: str):
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        
        websocket = self.user_connections.get(user_id)
        if websocket:
            self.active_connections[channel].add(websocket)
            logger.info(f"User {user_id} subscribed to {channel}")
    
    async def unsubscribe(self, user_id: str, channel: str):
        websocket = self.user_connections.get(user_id)
        if websocket and channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
    
    async def broadcast(self, channel: str, message: dict):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Broadcast error: {e}")
    
    async def send_to_user(self, user_id: str, message: dict):
        websocket = self.user_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Send error to {user_id}: {e}")


manager = ConnectionManager()


# ==================== MARKET DATA ====================

# Simulated real-time prices
LIVE_PRICES: Dict[str, Dict] = {
    # US Equities
    "AAPL": {"price": 178.50, "change": 1.25, "change_pct": 0.71, "volume": 45000000, "bid": 178.48, "ask": 178.52},
    "MSFT": {"price": 378.25, "change": -2.15, "change_pct": -0.57, "volume": 22000000, "bid": 378.20, "ask": 378.30},
    "GOOGL": {"price": 142.80, "change": 0.95, "change_pct": 0.67, "volume": 18000000, "bid": 142.78, "ask": 142.82},
    "AMZN": {"price": 178.90, "change": 2.40, "change_pct": 1.36, "volume": 35000000, "bid": 178.88, "ask": 178.92},
    "NVDA": {"price": 485.50, "change": -5.20, "change_pct": -1.06, "volume": 52000000, "bid": 485.45, "ask": 485.55},
    "META": {"price": 485.20, "change": 3.80, "change_pct": 0.79, "volume": 15000000, "bid": 485.15, "ask": 485.25},
    "TSLA": {"price": 242.30, "change": -8.50, "change_pct": -3.39, "volume": 98000000, "bid": 242.25, "ask": 242.35},
    
    # Australian Equities
    "CBA.AX": {"price": 118.50, "change": 0.85, "change_pct": 0.72, "volume": 3500000, "bid": 118.48, "ask": 118.52},
    "BHP.AX": {"price": 45.20, "change": -0.30, "change_pct": -0.66, "volume": 8200000, "bid": 45.18, "ask": 45.22},
    "CSL.AX": {"price": 285.00, "change": 2.50, "change_pct": 0.88, "volume": 1200000, "bid": 284.95, "ask": 285.05},
    
    # Crypto
    "BTC": {"price": 67500.00, "change": 1250.00, "change_pct": 1.89, "volume": 28000000000, "bid": 67480, "ask": 67520},
    "ETH": {"price": 3450.00, "change": -45.00, "change_pct": -1.29, "volume": 15000000000, "bid": 3448, "ask": 3452},
    "SOL": {"price": 145.00, "change": 5.20, "change_pct": 3.72, "volume": 2500000000, "bid": 144.90, "ask": 145.10},
    
    # ETFs
    "VAS.AX": {"price": 92.50, "change": 0.45, "change_pct": 0.49, "volume": 850000, "bid": 92.48, "ask": 92.52},
    "VGS": {"price": 108.30, "change": 0.80, "change_pct": 0.74, "volume": 620000, "bid": 108.28, "ask": 108.32},
    "NDQ": {"price": 42.80, "change": -0.25, "change_pct": -0.58, "volume": 450000, "bid": 42.78, "ask": 42.82},
}


# Market indices
MARKET_INDICES = {
    "^GSPC": {"name": "S&P 500", "value": 5234.18, "change": 15.32, "change_pct": 0.29},
    "^DJI": {"name": "Dow Jones", "value": 38892.80, "change": -45.20, "change_pct": -0.12},
    "^IXIC": {"name": "NASDAQ", "value": 16384.47, "change": 85.63, "change_pct": 0.53},
    "^AXJO": {"name": "ASX 200", "value": 7892.30, "change": 28.40, "change_pct": 0.36},
    "BTC-USD": {"name": "Bitcoin", "value": 67500.00, "change": 1250.00, "change_pct": 1.89},
}


# ==================== ALERTS & TRIGGERS ====================

class AlertType:
    PRICE_TARGET = "price_target"
    PRICE_DROP = "price_drop"
    PRICE_RISE = "price_rise"
    VOLUME_SPIKE = "volume_spike"
    DRIFT_ALERT = "drift_alert"
    ORDER_FILLED = "order_filled"
    COMPLIANCE_FLAG = "compliance_flag"


ACTIVE_ALERTS: Dict[str, Dict] = {}


class PriceAlert(BaseModel):
    alert_id: str
    user_id: str
    symbol: str
    alert_type: str
    target_price: Optional[float] = None
    percentage: Optional[float] = None
    triggered: bool = False
    created_at: str


def simulate_price_update(symbol: str) -> Dict:
    """Simulate a real-time price update."""
    if symbol not in LIVE_PRICES:
        return None
    
    current = LIVE_PRICES[symbol].copy()
    
    # Random price movement (-0.5% to +0.5%)
    change_pct = random.uniform(-0.5, 0.5)
    price_change = current["price"] * change_pct / 100
    
    current["price"] = round(current["price"] + price_change, 2)
    current["change"] = round(current["change"] + price_change, 2)
    current["change_pct"] = round(current["change_pct"] + change_pct, 2)
    current["bid"] = round(current["price"] - 0.02, 2)
    current["ask"] = round(current["price"] + 0.02, 2)
    current["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    LIVE_PRICES[symbol] = current
    return current


async def check_alerts(symbol: str, price: float):
    """Check and trigger price alerts."""
    for alert_id, alert in ACTIVE_ALERTS.items():
        if alert["symbol"] != symbol or alert["triggered"]:
            continue
        
        triggered = False
        
        if alert["alert_type"] == AlertType.PRICE_TARGET:
            if alert.get("direction") == "above" and price >= alert["target_price"]:
                triggered = True
            elif alert.get("direction") == "below" and price <= alert["target_price"]:
                triggered = True
        
        if triggered:
            alert["triggered"] = True
            alert["triggered_at"] = datetime.now(timezone.utc).isoformat()
            alert["triggered_price"] = price
            
            # Send notification
            await manager.send_to_user(alert["user_id"], {
                "type": "alert_triggered",
                "alert": alert
            })


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_realtime_status():
    """Get real-time data layer status."""
    return {
        "status": "operational",
        "connections": len(manager.user_connections),
        "channels": list(manager.active_connections.keys()),
        "symbols_tracked": len(LIVE_PRICES),
        "active_alerts": len([a for a in ACTIVE_ALERTS.values() if not a.get("triggered")]),
        "market_status": "open" if datetime.now().hour >= 9 and datetime.now().hour < 16 else "closed"
    }


@router.get("/prices")
async def get_all_prices():
    """Get all live prices."""
    return {
        "prices": LIVE_PRICES,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/prices/{symbol}")
async def get_price(symbol: str):
    """Get live price for a symbol."""
    symbol = symbol.upper()
    
    if symbol not in LIVE_PRICES:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    return {
        "symbol": symbol,
        **LIVE_PRICES[symbol],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/indices")
async def get_indices():
    """Get market indices."""
    return {
        "indices": MARKET_INDICES,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/alerts")
async def create_alert(
    user_id: str,
    symbol: str,
    alert_type: str,
    target_price: Optional[float] = None,
    direction: str = "above"
):
    """Create a price alert."""
    alert_id = f"ALT_{uuid.uuid4().hex[:8]}"
    
    alert = {
        "alert_id": alert_id,
        "user_id": user_id,
        "symbol": symbol.upper(),
        "alert_type": alert_type,
        "target_price": target_price,
        "direction": direction,
        "triggered": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    ACTIVE_ALERTS[alert_id] = alert
    
    return {
        "success": True,
        "alert_id": alert_id,
        "message": f"Alert created: {symbol} {direction} ${target_price}"
    }


@router.get("/alerts")
async def get_alerts(user_id: Optional[str] = None, triggered: Optional[bool] = None):
    """Get alerts."""
    alerts = list(ACTIVE_ALERTS.values())
    
    if user_id:
        alerts = [a for a in alerts if a["user_id"] == user_id]
    if triggered is not None:
        alerts = [a for a in alerts if a["triggered"] == triggered]
    
    return {
        "alerts": alerts,
        "total": len(alerts)
    }


@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert."""
    if alert_id not in ACTIVE_ALERTS:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    del ACTIVE_ALERTS[alert_id]
    return {"success": True, "alert_id": alert_id}


@router.get("/market-summary")
async def get_market_summary():
    """Get comprehensive market summary."""
    
    # Top movers
    sorted_by_change = sorted(LIVE_PRICES.items(), key=lambda x: x[1]["change_pct"], reverse=True)
    
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "indices": MARKET_INDICES,
        "top_gainers": [
            {"symbol": s, **d} for s, d in sorted_by_change[:5]
        ],
        "top_losers": [
            {"symbol": s, **d} for s, d in sorted_by_change[-5:][::-1]
        ],
        "most_active": sorted(
            [{"symbol": s, **d} for s, d in LIVE_PRICES.items()],
            key=lambda x: x["volume"],
            reverse=True
        )[:5],
        "market_mood": "bullish" if sum(d["change_pct"] for d in LIVE_PRICES.values()) > 0 else "bearish"
    }


@router.post("/simulate-update/{symbol}")
async def simulate_update(symbol: str):
    """Simulate a price update (for testing)."""
    symbol = symbol.upper()
    
    if symbol not in LIVE_PRICES:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    updated = simulate_price_update(symbol)
    
    # Check alerts
    await check_alerts(symbol, updated["price"])
    
    # Broadcast to subscribers
    await manager.broadcast(f"price:{symbol}", {
        "type": "price_update",
        "symbol": symbol,
        **updated
    })
    
    return {
        "symbol": symbol,
        "updated": updated
    }


# WebSocket endpoint for real-time updates
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time updates."""
    await manager.connect(websocket, user_id)
    
    try:
        # Send initial market data
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "Connected to real-time data feed"
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe":
                channel = message.get("channel")
                await manager.subscribe(user_id, channel)
                await websocket.send_json({
                    "type": "subscribed",
                    "channel": channel
                })
            
            elif message.get("action") == "unsubscribe":
                channel = message.get("channel")
                await manager.unsubscribe(user_id, channel)
                await websocket.send_json({
                    "type": "unsubscribed",
                    "channel": channel
                })
            
            elif message.get("action") == "get_price":
                symbol = message.get("symbol", "").upper()
                if symbol in LIVE_PRICES:
                    await websocket.send_json({
                        "type": "price",
                        "symbol": symbol,
                        **LIVE_PRICES[symbol]
                    })
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(user_id)


import uuid
