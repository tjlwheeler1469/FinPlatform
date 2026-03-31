"""
Unified Execution Layer - The Execution Brain
Transforms insights into actions across multiple trading systems.
"Insight → Action → Execution (1-click)"
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging
import os
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/execution", tags=["Unified Execution Layer"])


# ==================== ENUMS & MODELS ====================

class AssetClass(str, Enum):
    EQUITY = "equity"
    ETF = "etf"
    CRYPTO = "crypto"
    FX = "fx"
    BOND = "bond"
    OPTION = "option"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderStatus(str, Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class BrokerType(str, Enum):
    ALPACA = "alpaca"
    INTERACTIVE_BROKERS = "interactive_brokers"
    DRIVEWEALTH = "drivewealth"
    COINBASE = "coinbase"
    BINANCE = "binance"
    INTERNAL = "internal"


class ExecutionOrder(BaseModel):
    """Universal order model across all brokers."""
    order_id: str = Field(default_factory=lambda: f"ORD_{uuid.uuid4().hex[:12]}")
    client_id: str
    symbol: str
    asset_class: AssetClass
    side: OrderSide
    order_type: OrderType = OrderType.MARKET
    quantity: float
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    broker: BrokerType = BrokerType.INTERNAL
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0
    filled_price: Optional[float] = None
    commission: float = 0
    created_at: str = ""
    executed_at: Optional[str] = None
    notes: Optional[str] = None


class BlockOrder(BaseModel):
    """Block order for multiple clients."""
    block_id: str = Field(default_factory=lambda: f"BLK_{uuid.uuid4().hex[:8]}")
    symbol: str
    asset_class: AssetClass
    side: OrderSide
    total_quantity: float
    order_type: OrderType = OrderType.MARKET
    limit_price: Optional[float] = None
    allocations: List[Dict[str, Any]]  # [{client_id, quantity, percentage}]
    status: OrderStatus = OrderStatus.PENDING
    child_orders: List[str] = []  # Order IDs


class RebalanceRequest(BaseModel):
    """Portfolio rebalancing request."""
    client_id: str
    target_allocation: Dict[str, float]  # {symbol: target_percentage}
    tolerance: float = 2.0  # Drift tolerance %
    tax_aware: bool = True
    avoid_wash_sales: bool = True


# ==================== BROKER INTEGRATIONS ====================

class BrokerInterface:
    """Base interface for all broker integrations."""
    
    def __init__(self, broker_type: BrokerType) -> dict:
        self.broker_type = broker_type
        self.connected = False
        self.paper_trading = True
    
    async def connect(self) -> bool:
        raise NotImplementedError
    
    async def submit_order(self, order: ExecutionOrder) -> Dict:
        raise NotImplementedError
    
    async def get_positions(self, account_id: str) -> List[Dict]:
        raise NotImplementedError
    
    async def get_account(self, account_id: str) -> Dict:
        raise NotImplementedError
    
    async def cancel_order(self, order_id: str) -> bool:
        raise NotImplementedError


class AlpacaBroker(BrokerInterface):
    """Alpaca Trading API integration."""
    
    def __init__(self) -> dict:
        super().__init__(BrokerType.ALPACA)
        self.api_key = os.environ.get("ALPACA_API_KEY")
        self.api_secret = os.environ.get("ALPACA_SECRET_KEY")
        self.base_url = os.environ.get("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
        self.api = None
    
    async def connect(self) -> bool:
        if not self.api_key or not self.api_secret:
            logger.warning("Alpaca credentials not configured - using demo mode")
            self.connected = False
            return False
        
        try:
            import alpaca_trade_api as tradeapi
            self.api = tradeapi.REST(
                self.api_key,
                self.api_secret,
                self.base_url,
                api_version='v2'
            )
            account = self.api.get_account()
            self.connected = True
            self.paper_trading = "paper" in self.base_url
            logger.info(f"Alpaca connected: {account.status}, Paper: {self.paper_trading}")
            return True
        except Exception as e:
            logger.error(f"Alpaca connection failed: {e}")
            self.connected = False
            return False
    
    async def submit_order(self, order: ExecutionOrder) -> Dict:
        if not self.connected:
            return await self._demo_submit_order(order)
        
        try:
            alpaca_order = self.api.submit_order(
                symbol=order.symbol,
                qty=order.quantity,
                side=order.side.value,
                type=order.order_type.value,
                time_in_force='day',
                limit_price=order.limit_price,
                stop_price=order.stop_price
            )
            
            return {
                "broker_order_id": alpaca_order.id,
                "status": alpaca_order.status,
                "filled_qty": float(alpaca_order.filled_qty or 0),
                "filled_avg_price": float(alpaca_order.filled_avg_price or 0),
                "submitted_at": str(alpaca_order.submitted_at)
            }
        except Exception as e:
            logger.error(f"Alpaca order failed: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    async def _demo_submit_order(self, order: ExecutionOrder) -> Dict:
        """Demo mode order submission."""
        await asyncio.sleep(0.1)  # Simulate latency
        
        # Simulate market price
        demo_prices = {
            "AAPL": 178.50, "MSFT": 378.25, "GOOGL": 142.80,
            "AMZN": 178.90, "NVDA": 485.50, "META": 485.20,
            "CBA.AX": 118.50, "BHP.AX": 45.20, "CSL.AX": 285.00
        }
        price = demo_prices.get(order.symbol, 100.0)
        
        return {
            "broker_order_id": f"DEMO_{uuid.uuid4().hex[:8]}",
            "status": "filled",
            "filled_qty": order.quantity,
            "filled_avg_price": price,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "demo_mode": True
        }
    
    async def get_positions(self, account_id: str) -> List[Dict]:
        if not self.connected:
            return self._demo_positions()
        
        try:
            positions = self.api.list_positions()
            return [
                {
                    "symbol": p.symbol,
                    "quantity": float(p.qty),
                    "market_value": float(p.market_value),
                    "cost_basis": float(p.cost_basis),
                    "unrealized_pl": float(p.unrealized_pl),
                    "unrealized_plpc": float(p.unrealized_plpc),
                    "current_price": float(p.current_price)
                }
                for p in positions
            ]
        except Exception as e:
            logger.error(f"Failed to get positions: {e}")
            return self._demo_positions()
    
    def _demo_positions(self) -> List[Dict]:
        """Demo positions for testing."""
        return [
            {"symbol": "AAPL", "quantity": 100, "market_value": 17850, "cost_basis": 15000, "unrealized_pl": 2850, "current_price": 178.50},
            {"symbol": "MSFT", "quantity": 50, "market_value": 18912, "cost_basis": 17000, "unrealized_pl": 1912, "current_price": 378.25},
            {"symbol": "GOOGL", "quantity": 75, "market_value": 10710, "cost_basis": 10000, "unrealized_pl": 710, "current_price": 142.80},
        ]
    
    async def get_account(self, account_id: str) -> Dict:
        if not self.connected:
            return self._demo_account()
        
        try:
            account = self.api.get_account()
            return {
                "account_id": account.id,
                "status": account.status,
                "currency": account.currency,
                "cash": float(account.cash),
                "portfolio_value": float(account.portfolio_value),
                "buying_power": float(account.buying_power),
                "equity": float(account.equity),
                "pattern_day_trader": account.pattern_day_trader
            }
        except Exception as e:
            logger.error(f"Failed to get account: {e}")
            return self._demo_account()
    
    def _demo_account(self) -> Dict:
        return {
            "account_id": "DEMO_ACCOUNT",
            "status": "ACTIVE",
            "currency": "USD",
            "cash": 250000.00,
            "portfolio_value": 750000.00,
            "buying_power": 500000.00,
            "equity": 750000.00,
            "pattern_day_trader": False,
            "demo_mode": True
        }
    
    async def cancel_order(self, order_id: str) -> bool:
        if not self.connected:
            return True
        
        try:
            self.api.cancel_order(order_id)
            return True
        except Exception as e:
            logger.error(f"Failed to cancel order: {e}")
            return False


class CryptoBroker(BrokerInterface):
    """Unified crypto exchange integration using CCXT."""
    
    def __init__(self, exchange: str = "binance") -> dict:
        super().__init__(BrokerType.BINANCE if exchange == "binance" else BrokerType.COINBASE)
        self.exchange_name = exchange
        self.exchange = None
    
    async def connect(self) -> bool:
        try:
            import ccxt.async_support as ccxt
            
            api_key = os.environ.get(f"{self.exchange_name.upper()}_API_KEY")
            api_secret = os.environ.get(f"{self.exchange_name.upper()}_SECRET")
            
            exchange_class = getattr(ccxt, self.exchange_name, None)
            if not exchange_class:
                logger.warning(f"Exchange {self.exchange_name} not found - using demo mode")
                return False
            
            self.exchange = exchange_class({
                'apiKey': api_key,
                'secret': api_secret,
                'sandbox': True,  # Use testnet
                'enableRateLimit': True
            })
            
            if api_key and api_secret:
                await self.exchange.load_markets()
                self.connected = True
                logger.info(f"Connected to {self.exchange_name}")
                return True
            else:
                logger.warning(f"{self.exchange_name} credentials not configured - using demo mode")
                return False
                
        except Exception as e:
            logger.error(f"Crypto broker connection failed: {e}")
            return False
    
    async def submit_order(self, order: ExecutionOrder) -> Dict:
        if not self.connected:
            return await self._demo_crypto_order(order)
        
        try:
            result = await self.exchange.create_order(
                symbol=order.symbol,
                type=order.order_type.value,
                side=order.side.value,
                amount=order.quantity,
                price=order.limit_price
            )
            
            return {
                "broker_order_id": result['id'],
                "status": result['status'],
                "filled_qty": result.get('filled', 0),
                "filled_avg_price": result.get('average', 0),
                "submitted_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Crypto order failed: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    async def _demo_crypto_order(self, order: ExecutionOrder) -> Dict:
        """Demo crypto order."""
        demo_prices = {
            "BTC/USD": 67500.00, "ETH/USD": 3450.00, "SOL/USD": 145.00,
            "BTC/USDT": 67500.00, "ETH/USDT": 3450.00, "XRP/USDT": 0.52
        }
        price = demo_prices.get(order.symbol, 100.0)
        
        return {
            "broker_order_id": f"CRYPTO_DEMO_{uuid.uuid4().hex[:8]}",
            "status": "filled",
            "filled_qty": order.quantity,
            "filled_avg_price": price,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "demo_mode": True
        }
    
    async def get_positions(self, account_id: str) -> List[Dict]:
        if not self.connected:
            return self._demo_crypto_positions()
        
        try:
            balance = await self.exchange.fetch_balance()
            positions = []
            for currency, amount in balance['total'].items():
                if amount > 0:
                    positions.append({
                        "symbol": currency,
                        "quantity": amount,
                        "asset_class": "crypto"
                    })
            return positions
        except Exception as e:
            logger.error(f"Failed to get crypto positions: {e}")
            return self._demo_crypto_positions()
    
    def _demo_crypto_positions(self) -> List[Dict]:
        return [
            {"symbol": "BTC", "quantity": 2.5, "market_value": 168750, "current_price": 67500},
            {"symbol": "ETH", "quantity": 15.0, "market_value": 51750, "current_price": 3450},
            {"symbol": "SOL", "quantity": 100.0, "market_value": 14500, "current_price": 145},
        ]
    
    async def get_account(self, account_id: str) -> Dict:
        return {
            "account_id": "CRYPTO_DEMO",
            "exchange": self.exchange_name,
            "connected": self.connected,
            "demo_mode": not self.connected
        }
    
    async def cancel_order(self, order_id: str) -> bool:
        if not self.connected:
            return True
        try:
            await self.exchange.cancel_order(order_id)
            return True
        except Exception:
            return False
    
    async def close(self) -> dict:
        if self.exchange:
            await self.exchange.close()


# ==================== BROKER REGISTRY ====================

BROKERS: Dict[BrokerType, BrokerInterface] = {}

def get_broker(broker_type: BrokerType) -> BrokerInterface:
    """Get or create broker instance."""
    if broker_type not in BROKERS:
        if broker_type == BrokerType.ALPACA:
            BROKERS[broker_type] = AlpacaBroker()
        elif broker_type in [BrokerType.BINANCE, BrokerType.COINBASE]:
            BROKERS[broker_type] = CryptoBroker(broker_type.value)
        else:
            BROKERS[broker_type] = AlpacaBroker()  # Default
    return BROKERS[broker_type]


# ==================== ORDER STORAGE ====================

ORDERS_DB: Dict[str, ExecutionOrder] = {}
BLOCK_ORDERS_DB: Dict[str, BlockOrder] = {}


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_execution_status() -> dict:
    """Get execution layer status and connected brokers."""
    alpaca = get_broker(BrokerType.ALPACA)
    await alpaca.connect()
    
    return {
        "status": "operational",
        "version": "1.0.0",
        "brokers": {
            "alpaca": {
                "connected": alpaca.connected,
                "paper_trading": alpaca.paper_trading,
                "capabilities": ["equities", "etfs", "options"]
            },
            "crypto": {
                "connected": False,
                "demo_mode": True,
                "capabilities": ["btc", "eth", "altcoins"]
            }
        },
        "features": {
            "block_trading": True,
            "model_portfolios": True,
            "auto_rebalancing": True,
            "smart_order_routing": True,
            "tax_aware_execution": True
        }
    }


@router.post("/order")
async def submit_order(
    client_id: str,
    symbol: str,
    side: OrderSide,
    quantity: float,
    asset_class: AssetClass = AssetClass.EQUITY,
    order_type: OrderType = OrderType.MARKET,
    limit_price: Optional[float] = None,
    broker: BrokerType = BrokerType.ALPACA
) -> dict:
    """
    Submit a single order - the 1-click execution.
    Insight → Action → Execution
    """
    order = ExecutionOrder(
        client_id=client_id,
        symbol=symbol,
        asset_class=asset_class,
        side=side,
        order_type=order_type,
        quantity=quantity,
        limit_price=limit_price,
        broker=broker,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    # Get appropriate broker
    broker_instance = get_broker(broker)
    await broker_instance.connect()
    
    # Submit order
    result = await broker_instance.submit_order(order)
    
    # Update order with result
    order.status = OrderStatus.FILLED if result.get("status") == "filled" else OrderStatus.SUBMITTED
    order.filled_quantity = result.get("filled_qty", 0)
    order.filled_price = result.get("filled_avg_price")
    order.executed_at = result.get("submitted_at")
    
    # Store order
    ORDERS_DB[order.order_id] = order
    
    return {
        "success": True,
        "order_id": order.order_id,
        "broker_order_id": result.get("broker_order_id"),
        "status": order.status,
        "filled_quantity": order.filled_quantity,
        "filled_price": order.filled_price,
        "execution_time": order.executed_at,
        "demo_mode": result.get("demo_mode", False),
        "message": f"Order {order.status.value}: {side.value} {quantity} {symbol}"
    }


@router.post("/block-order")
async def submit_block_order(block: BlockOrder) -> dict:
    """
    Submit a block order for multiple clients.
    Execute once → Allocate to many clients.
    """
    broker = get_broker(BrokerType.ALPACA)
    await broker.connect()
    
    # Create master order
    master_order = ExecutionOrder(
        client_id="BLOCK_MASTER",
        symbol=block.symbol,
        asset_class=block.asset_class,
        side=block.side,
        order_type=block.order_type,
        quantity=block.total_quantity,
        limit_price=block.limit_price,
        broker=BrokerType.ALPACA,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    # Execute master order
    result = await broker.submit_order(master_order)
    
    filled_price = result.get("filled_avg_price", 0)
    filled_qty = result.get("filled_qty", block.total_quantity)
    
    # Allocate to individual clients
    child_orders = []
    for allocation in block.allocations:
        client_qty = allocation.get("quantity", 0)
        if allocation.get("percentage"):
            client_qty = filled_qty * allocation["percentage"] / 100
        
        child_order = ExecutionOrder(
            client_id=allocation["client_id"],
            symbol=block.symbol,
            asset_class=block.asset_class,
            side=block.side,
            order_type=block.order_type,
            quantity=client_qty,
            broker=BrokerType.ALPACA,
            status=OrderStatus.FILLED,
            filled_quantity=client_qty,
            filled_price=filled_price,
            created_at=datetime.now(timezone.utc).isoformat(),
            executed_at=datetime.now(timezone.utc).isoformat(),
            notes=f"Allocated from block {block.block_id}"
        )
        
        ORDERS_DB[child_order.order_id] = child_order
        child_orders.append(child_order.order_id)
    
    # Update block order
    block.status = OrderStatus.FILLED
    block.child_orders = child_orders
    BLOCK_ORDERS_DB[block.block_id] = block
    
    return {
        "success": True,
        "block_id": block.block_id,
        "status": "filled",
        "total_quantity": filled_qty,
        "average_price": filled_price,
        "allocations_count": len(child_orders),
        "child_orders": child_orders,
        "demo_mode": result.get("demo_mode", False),
        "message": f"Block order executed: {block.side.value} {filled_qty} {block.symbol} allocated to {len(child_orders)} clients"
    }


@router.get("/orders")
async def get_orders(client_id: Optional[str] = None, status: Optional[OrderStatus] = None) -> dict:
    """Get order history."""
    orders = list(ORDERS_DB.values())
    
    if client_id:
        orders = [o for o in orders if o.client_id == client_id]
    if status:
        orders = [o for o in orders if o.status == status]
    
    return {
        "orders": [o.model_dump() for o in orders],
        "total": len(orders)
    }


@router.get("/orders/{order_id}")
async def get_order(order_id: str) -> dict:
    """Get specific order details."""
    if order_id not in ORDERS_DB:
        raise HTTPException(status_code=404, detail="Order not found")
    return ORDERS_DB[order_id].model_dump()


@router.delete("/orders/{order_id}")
async def cancel_order(order_id: str) -> dict:
    """Cancel an order."""
    if order_id not in ORDERS_DB:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = ORDERS_DB[order_id]
    broker = get_broker(order.broker)
    
    success = await broker.cancel_order(order_id)
    if success:
        order.status = OrderStatus.CANCELLED
    
    return {"success": success, "order_id": order_id, "status": order.status}


@router.get("/positions/{account_id}")
async def get_positions(account_id: str, broker: BrokerType = BrokerType.ALPACA) -> dict:
    """Get positions from a broker."""
    broker_instance = get_broker(broker)
    await broker_instance.connect()
    
    positions = await broker_instance.get_positions(account_id)
    
    return {
        "account_id": account_id,
        "broker": broker,
        "positions": positions,
        "total_positions": len(positions),
        "demo_mode": not broker_instance.connected
    }


@router.get("/account/{account_id}")
async def get_account(account_id: str, broker: BrokerType = BrokerType.ALPACA) -> dict:
    """Get account details from a broker."""
    broker_instance = get_broker(broker)
    await broker_instance.connect()
    
    account = await broker_instance.get_account(account_id)
    
    return {
        "broker": broker,
        "account": account
    }
