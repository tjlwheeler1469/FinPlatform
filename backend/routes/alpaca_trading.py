"""
Alpaca Trading Integration - Paper Trading for One-Click Execution
Enables real trading execution through Alpaca's paper trading API.
This is the execution layer that transforms insights into market actions.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alpaca", tags=["Alpaca Trading"])

# Try to import Alpaca SDK
ALPACA_AVAILABLE = False
TradingClient = None

try:
    from alpaca.trading.client import TradingClient as AlpacaTradingClient
    from alpaca.trading.requests import (
        MarketOrderRequest,
        LimitOrderRequest,
        StopOrderRequest,
        GetOrdersRequest
    )
    from alpaca.trading.enums import OrderSide, TimeInForce, QueryOrderStatus
    TradingClient = AlpacaTradingClient
    ALPACA_AVAILABLE = True
    logger.info("Alpaca SDK loaded successfully")
except ImportError as e:
    logger.warning(f"Alpaca SDK not available: {e}")


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderSideEnum(str, Enum):
    BUY = "buy"
    SELL = "sell"


class TimeInForceEnum(str, Enum):
    DAY = "day"
    GTC = "gtc"  # Good-til-canceled
    IOC = "ioc"  # Immediate-or-cancel
    FOK = "fok"  # Fill-or-kill


# ==================== PYDANTIC MODELS ====================

class AlpacaCredentials(BaseModel):
    api_key: str
    secret_key: str


class MarketOrder(BaseModel):
    symbol: str = Field(..., description="Stock symbol (e.g., 'AAPL')")
    qty: float = Field(..., gt=0, description="Quantity to trade")
    side: OrderSideEnum = Field(..., description="Buy or sell")
    client_id: Optional[str] = Field(None, description="Client ID for tracking")
    reason: Optional[str] = Field(None, description="Reason for trade")


class LimitOrder(BaseModel):
    symbol: str
    qty: float = Field(..., gt=0)
    side: OrderSideEnum
    limit_price: float = Field(..., gt=0, description="Limit price")
    time_in_force: TimeInForceEnum = TimeInForceEnum.DAY
    client_id: Optional[str] = None
    reason: Optional[str] = None


class StopOrder(BaseModel):
    symbol: str
    qty: float = Field(..., gt=0)
    side: OrderSideEnum
    stop_price: float = Field(..., gt=0, description="Stop trigger price")
    client_id: Optional[str] = None
    reason: Optional[str] = None


class BatchOrder(BaseModel):
    orders: List[MarketOrder]
    client_id: Optional[str] = None
    batch_reason: Optional[str] = None


# ==================== TRADING CLIENT MANAGEMENT ====================

# Store trading client in memory (in production, use proper session management)
_trading_client = None


def get_trading_client():
    """Get or create Alpaca trading client."""
    global _trading_client
    
    if not ALPACA_AVAILABLE:
        return None
    
    if _trading_client is not None:
        return _trading_client
    
    # Try to get credentials from environment
    api_key = os.environ.get("ALPACA_API_KEY") or os.environ.get("APCA_API_KEY_ID")
    secret_key = os.environ.get("ALPACA_SECRET_KEY") or os.environ.get("APCA_API_SECRET_KEY")
    
    if api_key and secret_key:
        try:
            _trading_client = TradingClient(
                api_key=api_key,
                secret_key=secret_key,
                paper=True  # Always use paper trading
            )
            logger.info("Alpaca trading client initialized from environment")
            return _trading_client
        except Exception as e:
            logger.error(f"Failed to initialize Alpaca client: {e}")
    
    return None


def require_alpaca_client():
    """Dependency that requires Alpaca client to be available."""
    client = get_trading_client()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="Alpaca trading not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables."
        )
    return client


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_alpaca_status():
    """Check Alpaca integration status."""
    client = get_trading_client()
    
    if not ALPACA_AVAILABLE:
        return {
            "status": "unavailable",
            "sdk_installed": False,
            "configured": False,
            "message": "Alpaca SDK not installed. Run: pip install alpaca-py"
        }
    
    if client is None:
        return {
            "status": "not_configured",
            "sdk_installed": True,
            "configured": False,
            "message": "Alpaca API keys not configured. Set ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables."
        }
    
    try:
        # Test connection by getting account
        account = client.get_account()
        return {
            "status": "connected",
            "sdk_installed": True,
            "configured": True,
            "paper_trading": True,
            "account_status": account.status if hasattr(account, 'status') else "active",
            "message": "Alpaca paper trading connected and ready"
        }
    except Exception as e:
        return {
            "status": "error",
            "sdk_installed": True,
            "configured": True,
            "error": str(e),
            "message": "Failed to connect to Alpaca. Check your API keys."
        }


@router.post("/configure")
async def configure_alpaca(credentials: AlpacaCredentials):
    """Configure Alpaca API credentials."""
    global _trading_client
    
    if not ALPACA_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Alpaca SDK not installed. Run: pip install alpaca-py"
        )
    
    try:
        # Test credentials
        test_client = TradingClient(
            api_key=credentials.api_key,
            secret_key=credentials.secret_key,
            paper=True
        )
        
        # Verify by getting account
        account = test_client.get_account()
        
        # Store credentials in environment (for this session)
        os.environ["ALPACA_API_KEY"] = credentials.api_key
        os.environ["ALPACA_SECRET_KEY"] = credentials.secret_key
        
        # Update global client
        _trading_client = test_client
        
        return {
            "success": True,
            "message": "Alpaca paper trading configured successfully",
            "account_id": str(account.account_number) if hasattr(account, 'account_number') else "unknown",
            "paper_trading": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to configure Alpaca: {str(e)}"
        )


@router.get("/account")
async def get_account_info(client=Depends(require_alpaca_client)):
    """Get Alpaca account information."""
    try:
        account = client.get_account()
        
        return {
            "success": True,
            "account": {
                "account_id": str(account.account_number) if hasattr(account, 'account_number') else None,
                "status": account.status if hasattr(account, 'status') else None,
                "buying_power": float(account.buying_power) if hasattr(account, 'buying_power') else 0,
                "cash": float(account.cash) if hasattr(account, 'cash') else 0,
                "portfolio_value": float(account.portfolio_value) if hasattr(account, 'portfolio_value') else 0,
                "equity": float(account.equity) if hasattr(account, 'equity') else 0,
                "last_equity": float(account.last_equity) if hasattr(account, 'last_equity') else 0,
                "daily_pnl": float(account.equity) - float(account.last_equity) if hasattr(account, 'equity') and hasattr(account, 'last_equity') else 0,
                "trading_blocked": account.trading_blocked if hasattr(account, 'trading_blocked') else False,
                "pattern_day_trader": account.pattern_day_trader if hasattr(account, 'pattern_day_trader') else False,
            },
            "paper_trading": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get account info: {str(e)}")


@router.get("/positions")
async def get_positions(client=Depends(require_alpaca_client)):
    """Get all current positions."""
    try:
        positions = client.get_all_positions()
        
        position_list = []
        total_value = 0
        total_pnl = 0
        
        for pos in positions:
            market_value = float(pos.market_value) if hasattr(pos, 'market_value') and pos.market_value else 0
            unrealized_pl = float(pos.unrealized_pl) if hasattr(pos, 'unrealized_pl') and pos.unrealized_pl else 0
            
            position_list.append({
                "symbol": pos.symbol,
                "qty": float(pos.qty) if hasattr(pos, 'qty') else 0,
                "avg_entry_price": float(pos.avg_entry_price) if hasattr(pos, 'avg_entry_price') else 0,
                "current_price": float(pos.current_price) if hasattr(pos, 'current_price') and pos.current_price else 0,
                "market_value": market_value,
                "cost_basis": float(pos.cost_basis) if hasattr(pos, 'cost_basis') else 0,
                "unrealized_pl": unrealized_pl,
                "unrealized_pl_pct": float(pos.unrealized_plpc) * 100 if hasattr(pos, 'unrealized_plpc') and pos.unrealized_plpc else 0,
                "side": pos.side if hasattr(pos, 'side') else "long"
            })
            
            total_value += market_value
            total_pnl += unrealized_pl
        
        return {
            "success": True,
            "positions": position_list,
            "summary": {
                "total_positions": len(position_list),
                "total_market_value": round(total_value, 2),
                "total_unrealized_pnl": round(total_pnl, 2)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get positions: {str(e)}")


@router.get("/positions/{symbol}")
async def get_position(symbol: str, client=Depends(require_alpaca_client)):
    """Get position for a specific symbol."""
    try:
        position = client.get_open_position(symbol.upper())
        
        return {
            "success": True,
            "position": {
                "symbol": position.symbol,
                "qty": float(position.qty),
                "avg_entry_price": float(position.avg_entry_price),
                "current_price": float(position.current_price) if hasattr(position, 'current_price') and position.current_price else 0,
                "market_value": float(position.market_value) if hasattr(position, 'market_value') else 0,
                "cost_basis": float(position.cost_basis) if hasattr(position, 'cost_basis') else 0,
                "unrealized_pl": float(position.unrealized_pl) if hasattr(position, 'unrealized_pl') else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Position for {symbol} not found: {str(e)}")


@router.post("/orders/market")
async def place_market_order(order: MarketOrder, client=Depends(require_alpaca_client)):
    """Place a market order."""
    try:
        order_data = MarketOrderRequest(
            symbol=order.symbol.upper(),
            qty=order.qty,
            side=OrderSide.BUY if order.side == OrderSideEnum.BUY else OrderSide.SELL,
            time_in_force=TimeInForce.DAY
        )
        
        result = client.submit_order(order_data)
        
        return {
            "success": True,
            "order": {
                "order_id": str(result.id),
                "client_order_id": result.client_order_id,
                "symbol": result.symbol,
                "qty": float(result.qty),
                "side": result.side.value if hasattr(result.side, 'value') else str(result.side),
                "type": "market",
                "status": result.status.value if hasattr(result.status, 'value') else str(result.status),
                "submitted_at": result.submitted_at.isoformat() if result.submitted_at else None
            },
            "client_id": order.client_id,
            "reason": order.reason,
            "paper_trading": True,
            "message": f"Market {order.side.value} order for {order.qty} {order.symbol} submitted"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to place market order: {str(e)}")


@router.post("/orders/limit")
async def place_limit_order(order: LimitOrder, client=Depends(require_alpaca_client)):
    """Place a limit order."""
    try:
        tif_map = {
            TimeInForceEnum.DAY: TimeInForce.DAY,
            TimeInForceEnum.GTC: TimeInForce.GTC,
            TimeInForceEnum.IOC: TimeInForce.IOC,
            TimeInForceEnum.FOK: TimeInForce.FOK
        }
        
        order_data = LimitOrderRequest(
            symbol=order.symbol.upper(),
            qty=order.qty,
            side=OrderSide.BUY if order.side == OrderSideEnum.BUY else OrderSide.SELL,
            limit_price=order.limit_price,
            time_in_force=tif_map.get(order.time_in_force, TimeInForce.DAY)
        )
        
        result = client.submit_order(order_data)
        
        return {
            "success": True,
            "order": {
                "order_id": str(result.id),
                "symbol": result.symbol,
                "qty": float(result.qty),
                "side": result.side.value if hasattr(result.side, 'value') else str(result.side),
                "type": "limit",
                "limit_price": order.limit_price,
                "status": result.status.value if hasattr(result.status, 'value') else str(result.status)
            },
            "client_id": order.client_id,
            "paper_trading": True,
            "message": f"Limit {order.side.value} order for {order.qty} {order.symbol} at ${order.limit_price} submitted"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to place limit order: {str(e)}")


@router.post("/orders/stop")
async def place_stop_order(order: StopOrder, client=Depends(require_alpaca_client)):
    """Place a stop order."""
    try:
        order_data = StopOrderRequest(
            symbol=order.symbol.upper(),
            qty=order.qty,
            side=OrderSide.BUY if order.side == OrderSideEnum.BUY else OrderSide.SELL,
            stop_price=order.stop_price,
            time_in_force=TimeInForce.GTC  # Stop orders typically use GTC
        )
        
        result = client.submit_order(order_data)
        
        return {
            "success": True,
            "order": {
                "order_id": str(result.id),
                "symbol": result.symbol,
                "qty": float(result.qty),
                "side": result.side.value if hasattr(result.side, 'value') else str(result.side),
                "type": "stop",
                "stop_price": order.stop_price,
                "status": result.status.value if hasattr(result.status, 'value') else str(result.status)
            },
            "client_id": order.client_id,
            "paper_trading": True,
            "message": f"Stop {order.side.value} order for {order.qty} {order.symbol} at ${order.stop_price} submitted"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to place stop order: {str(e)}")


@router.get("/orders")
async def get_orders(
    status: str = "open",
    limit: int = 50,
    client=Depends(require_alpaca_client)
):
    """Get orders with optional status filtering."""
    try:
        status_map = {
            "open": QueryOrderStatus.OPEN,
            "closed": QueryOrderStatus.CLOSED,
            "all": QueryOrderStatus.ALL
        }
        
        request = GetOrdersRequest(
            status=status_map.get(status.lower(), QueryOrderStatus.OPEN),
            limit=limit
        )
        
        orders = client.get_orders(request)
        
        order_list = []
        for order in orders:
            order_list.append({
                "order_id": str(order.id),
                "symbol": order.symbol,
                "qty": float(order.qty),
                "filled_qty": float(order.filled_qty) if order.filled_qty else 0,
                "side": order.side.value if hasattr(order.side, 'value') else str(order.side),
                "type": order.order_type.value if hasattr(order.order_type, 'value') else str(order.order_type),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "limit_price": float(order.limit_price) if order.limit_price else None,
                "stop_price": float(order.stop_price) if order.stop_price else None,
                "filled_avg_price": float(order.filled_avg_price) if order.filled_avg_price else None,
                "submitted_at": order.submitted_at.isoformat() if order.submitted_at else None,
                "filled_at": order.filled_at.isoformat() if order.filled_at else None
            })
        
        return {
            "success": True,
            "orders": order_list,
            "total": len(order_list),
            "status_filter": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get orders: {str(e)}")


@router.get("/orders/{order_id}")
async def get_order(order_id: str, client=Depends(require_alpaca_client)):
    """Get a specific order by ID."""
    try:
        order = client.get_order_by_id(order_id)
        
        return {
            "success": True,
            "order": {
                "order_id": str(order.id),
                "symbol": order.symbol,
                "qty": float(order.qty),
                "filled_qty": float(order.filled_qty) if order.filled_qty else 0,
                "side": order.side.value if hasattr(order.side, 'value') else str(order.side),
                "type": order.order_type.value if hasattr(order.order_type, 'value') else str(order.order_type),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "limit_price": float(order.limit_price) if order.limit_price else None,
                "filled_avg_price": float(order.filled_avg_price) if order.filled_avg_price else None,
                "submitted_at": order.submitted_at.isoformat() if order.submitted_at else None,
                "filled_at": order.filled_at.isoformat() if order.filled_at else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Order not found: {str(e)}")


@router.delete("/orders/{order_id}")
async def cancel_order(order_id: str, client=Depends(require_alpaca_client)):
    """Cancel a specific order."""
    try:
        client.cancel_order_by_id(order_id)
        return {
            "success": True,
            "order_id": order_id,
            "message": f"Order {order_id} cancelled"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to cancel order: {str(e)}")


@router.delete("/orders")
async def cancel_all_orders(client=Depends(require_alpaca_client)):
    """Cancel all open orders."""
    try:
        cancelled = client.cancel_orders()
        return {
            "success": True,
            "cancelled_count": len(cancelled) if cancelled else 0,
            "message": "All open orders cancelled"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to cancel orders: {str(e)}")


@router.delete("/positions/{symbol}")
async def close_position(symbol: str, client=Depends(require_alpaca_client)):
    """Close a specific position."""
    try:
        order = client.close_position(symbol.upper())
        return {
            "success": True,
            "symbol": symbol.upper(),
            "order_id": str(order.id) if order else None,
            "message": f"Position for {symbol} closed"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to close position: {str(e)}")


@router.delete("/positions")
async def close_all_positions(cancel_orders: bool = True, client=Depends(require_alpaca_client)):
    """Close all positions (liquidate portfolio)."""
    try:
        result = client.close_all_positions(cancel_orders=cancel_orders)
        return {
            "success": True,
            "closed_count": len(result) if result else 0,
            "message": "All positions closed"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to close positions: {str(e)}")


@router.post("/orders/batch")
async def place_batch_orders(batch: BatchOrder, client=Depends(require_alpaca_client)):
    """Place multiple orders in a batch."""
    results = []
    errors = []
    
    for i, order in enumerate(batch.orders):
        try:
            order_data = MarketOrderRequest(
                symbol=order.symbol.upper(),
                qty=order.qty,
                side=OrderSide.BUY if order.side == OrderSideEnum.BUY else OrderSide.SELL,
                time_in_force=TimeInForce.DAY
            )
            
            result = client.submit_order(order_data)
            results.append({
                "index": i,
                "symbol": order.symbol,
                "order_id": str(result.id),
                "status": "submitted"
            })
        except Exception as e:
            errors.append({
                "index": i,
                "symbol": order.symbol,
                "error": str(e)
            })
    
    return {
        "success": len(errors) == 0,
        "submitted": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
        "client_id": batch.client_id,
        "batch_reason": batch.batch_reason,
        "paper_trading": True,
        "message": f"Batch complete: {len(results)} submitted, {len(errors)} failed"
    }


# ==================== DEMO ENDPOINTS (when Alpaca not configured) ====================

@router.get("/demo/account")
async def get_demo_account():
    """Get demo account data when Alpaca is not configured."""
    return {
        "success": True,
        "demo_mode": True,
        "account": {
            "account_id": "DEMO_ACCOUNT",
            "status": "ACTIVE",
            "buying_power": 100000.00,
            "cash": 50000.00,
            "portfolio_value": 150000.00,
            "equity": 150000.00,
            "last_equity": 148500.00,
            "daily_pnl": 1500.00,
            "trading_blocked": False,
            "pattern_day_trader": False
        },
        "message": "This is demo data. Configure Alpaca API keys for live paper trading.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/demo/positions")
async def get_demo_positions():
    """Get demo positions when Alpaca is not configured."""
    demo_positions = [
        {
            "symbol": "AAPL",
            "qty": 50,
            "avg_entry_price": 175.50,
            "current_price": 182.30,
            "market_value": 9115.00,
            "cost_basis": 8775.00,
            "unrealized_pl": 340.00,
            "unrealized_pl_pct": 3.87,
            "side": "long"
        },
        {
            "symbol": "MSFT",
            "qty": 30,
            "avg_entry_price": 380.25,
            "current_price": 395.80,
            "market_value": 11874.00,
            "cost_basis": 11407.50,
            "unrealized_pl": 466.50,
            "unrealized_pl_pct": 4.09,
            "side": "long"
        },
        {
            "symbol": "GOOGL",
            "qty": 25,
            "avg_entry_price": 142.00,
            "current_price": 138.50,
            "market_value": 3462.50,
            "cost_basis": 3550.00,
            "unrealized_pl": -87.50,
            "unrealized_pl_pct": -2.46,
            "side": "long"
        }
    ]
    
    return {
        "success": True,
        "demo_mode": True,
        "positions": demo_positions,
        "summary": {
            "total_positions": len(demo_positions),
            "total_market_value": sum(p["market_value"] for p in demo_positions),
            "total_unrealized_pnl": sum(p["unrealized_pl"] for p in demo_positions)
        },
        "message": "This is demo data. Configure Alpaca API keys for live paper trading.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/demo/orders/market")
async def place_demo_market_order(order: MarketOrder):
    """Place a demo market order when Alpaca is not configured."""
    import uuid
    import random
    
    # Simulate a price
    simulated_price = random.uniform(100, 500)
    
    return {
        "success": True,
        "demo_mode": True,
        "order": {
            "order_id": f"demo_{uuid.uuid4().hex[:8]}",
            "symbol": order.symbol.upper(),
            "qty": order.qty,
            "side": order.side.value,
            "type": "market",
            "status": "filled",
            "filled_price": round(simulated_price, 2),
            "total_value": round(order.qty * simulated_price, 2),
            "submitted_at": datetime.now(timezone.utc).isoformat()
        },
        "client_id": order.client_id,
        "reason": order.reason,
        "message": f"DEMO: Market {order.side.value} order for {order.qty} {order.symbol} would be executed at ~${simulated_price:.2f}"
    }
