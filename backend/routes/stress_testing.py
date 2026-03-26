"""
Stress Testing Module for AdviceOS
Provides load testing capabilities for 20,000 concurrent users simulation
Uses Locust-compatible patterns for realistic stress testing
"""

import os
import json
import asyncio
import random
import string
import time
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import concurrent.futures

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stress-test", tags=["Stress Testing"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ==================== MODELS ====================

class StressTestConfig(BaseModel):
    """Configuration for stress test"""
    test_id: str = Field(default_factory=lambda: f"STRESS-{uuid.uuid4().hex[:8].upper()}")
    concurrent_users: int = 1000  # Number of simulated concurrent users
    duration_seconds: int = 60  # Test duration
    ramp_up_seconds: int = 10  # Time to reach full load
    endpoints_to_test: List[str] = Field(default_factory=lambda: [
        "/api/health",
        "/api/push/status",
        "/api/platforms/status",
        "/api/ws/stats"
    ])
    include_writes: bool = False  # Include write operations
    include_notifications: bool = True  # Include notification sends
    include_websocket: bool = True  # Include WebSocket connections

class StressTestResult(BaseModel):
    """Results from stress test"""
    test_id: str
    config: Dict[str, Any]
    status: str  # "running", "completed", "failed"
    started_at: str
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None
    
    # Metrics
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    requests_per_second: float = 0
    
    # Latency
    avg_latency_ms: float = 0
    min_latency_ms: float = 0
    max_latency_ms: float = 0
    p50_latency_ms: float = 0
    p95_latency_ms: float = 0
    p99_latency_ms: float = 0
    
    # By endpoint
    endpoint_results: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    
    # Errors
    error_types: Dict[str, int] = Field(default_factory=dict)
    
    # System metrics
    memory_usage_mb: Optional[float] = None
    cpu_percent: Optional[float] = None

# Store for ongoing tests
active_tests: Dict[str, Dict] = {}

# ==================== SIMULATION FUNCTIONS ====================

async def simulate_user_session(
    test_id: str,
    user_id: str,
    endpoints: List[str],
    results_collector: Dict,
    duration_seconds: int
):
    """Simulate a single user session"""
    import httpx
    
    api_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
    start_time = time.time()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        while time.time() - start_time < duration_seconds:
            endpoint = random.choice(endpoints)
            request_start = time.time()
            
            try:
                response = await client.get(f"{api_url}{endpoint}")
                latency_ms = (time.time() - request_start) * 1000
                
                results_collector["total_requests"] += 1
                results_collector["latencies"].append(latency_ms)
                
                if response.status_code < 400:
                    results_collector["successful_requests"] += 1
                else:
                    results_collector["failed_requests"] += 1
                    error_key = f"HTTP_{response.status_code}"
                    results_collector["errors"][error_key] = results_collector["errors"].get(error_key, 0) + 1
                
                # Track per endpoint
                if endpoint not in results_collector["by_endpoint"]:
                    results_collector["by_endpoint"][endpoint] = {
                        "total": 0, "success": 0, "fail": 0, "latencies": []
                    }
                results_collector["by_endpoint"][endpoint]["total"] += 1
                results_collector["by_endpoint"][endpoint]["latencies"].append(latency_ms)
                if response.status_code < 400:
                    results_collector["by_endpoint"][endpoint]["success"] += 1
                else:
                    results_collector["by_endpoint"][endpoint]["fail"] += 1
                    
            except Exception as e:
                results_collector["failed_requests"] += 1
                error_type = type(e).__name__
                results_collector["errors"][error_type] = results_collector["errors"].get(error_type, 0) + 1
            
            # Random delay between requests (50-500ms)
            await asyncio.sleep(random.uniform(0.05, 0.5))

async def run_stress_test(config: StressTestConfig, test_state: Dict):
    """Run the actual stress test"""
    db = await get_db()
    
    results_collector = {
        "total_requests": 0,
        "successful_requests": 0,
        "failed_requests": 0,
        "latencies": [],
        "errors": {},
        "by_endpoint": {}
    }
    
    test_state["status"] = "running"
    test_state["started_at"] = datetime.now(timezone.utc).isoformat()
    
    # Store test start
    await db.stress_tests.update_one(
        {"test_id": config.test_id},
        {"$set": {"status": "running", "started_at": test_state["started_at"]}},
        upsert=True
    )
    
    try:
        # Ramp up users
        tasks = []
        users_per_batch = max(1, config.concurrent_users // max(1, config.ramp_up_seconds))
        
        for batch in range(0, config.concurrent_users, users_per_batch):
            batch_size = min(users_per_batch, config.concurrent_users - batch)
            
            for i in range(batch_size):
                user_id = f"stress_user_{batch + i}"
                task = asyncio.create_task(
                    simulate_user_session(
                        config.test_id,
                        user_id,
                        config.endpoints_to_test,
                        results_collector,
                        config.duration_seconds
                    )
                )
                tasks.append(task)
            
            # Progress update
            test_state["users_active"] = len(tasks)
            
            await asyncio.sleep(1)  # 1 second between batches
        
        # Wait for all tasks to complete
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Calculate final results
        latencies = results_collector["latencies"]
        sorted_latencies = sorted(latencies) if latencies else [0]
        
        total_time = time.time() - time.mktime(datetime.fromisoformat(test_state["started_at"].replace("Z", "+00:00")).timetuple())
        
        result = StressTestResult(
            test_id=config.test_id,
            config=config.model_dump(),
            status="completed",
            started_at=test_state["started_at"],
            completed_at=datetime.now(timezone.utc).isoformat(),
            duration_ms=int(total_time * 1000),
            total_requests=results_collector["total_requests"],
            successful_requests=results_collector["successful_requests"],
            failed_requests=results_collector["failed_requests"],
            requests_per_second=results_collector["total_requests"] / max(1, total_time),
            avg_latency_ms=sum(latencies) / max(1, len(latencies)),
            min_latency_ms=min(latencies) if latencies else 0,
            max_latency_ms=max(latencies) if latencies else 0,
            p50_latency_ms=sorted_latencies[len(sorted_latencies) // 2] if latencies else 0,
            p95_latency_ms=sorted_latencies[int(len(sorted_latencies) * 0.95)] if latencies else 0,
            p99_latency_ms=sorted_latencies[int(len(sorted_latencies) * 0.99)] if latencies else 0,
            endpoint_results={
                ep: {
                    "total": data["total"],
                    "success": data["success"],
                    "fail": data["fail"],
                    "success_rate": data["success"] / max(1, data["total"]) * 100,
                    "avg_latency_ms": sum(data["latencies"]) / max(1, len(data["latencies"]))
                }
                for ep, data in results_collector["by_endpoint"].items()
            },
            error_types=results_collector["errors"]
        )
        
        # Store results
        await db.stress_tests.update_one(
            {"test_id": config.test_id},
            {"$set": result.model_dump()}
        )
        
        test_state["result"] = result.model_dump()
        test_state["status"] = "completed"
        
    except Exception as e:
        test_state["status"] = "failed"
        test_state["error"] = str(e)
        logger.error(f"Stress test {config.test_id} failed: {e}")
        
        await db.stress_tests.update_one(
            {"test_id": config.test_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )

# ==================== API ENDPOINTS ====================

@router.post("/start")
async def start_stress_test(config: StressTestConfig, background_tasks: BackgroundTasks):
    """Start a stress test"""
    
    # Validate configuration
    if config.concurrent_users > 50000:
        raise HTTPException(400, "Maximum concurrent users is 50,000")
    if config.duration_seconds > 600:
        raise HTTPException(400, "Maximum duration is 600 seconds (10 minutes)")
    
    # Create test state
    test_state = {
        "test_id": config.test_id,
        "status": "starting",
        "config": config.model_dump(),
        "users_active": 0,
        "started_at": None,
        "result": None
    }
    
    active_tests[config.test_id] = test_state
    
    # Start test in background
    background_tasks.add_task(run_stress_test, config, test_state)
    
    return {
        "success": True,
        "test_id": config.test_id,
        "status": "starting",
        "config": config.model_dump(),
        "message": f"Stress test starting with {config.concurrent_users} concurrent users for {config.duration_seconds} seconds"
    }

@router.get("/status/{test_id}")
async def get_test_status(test_id: str):
    """Get status of a stress test"""
    
    # Check active tests first
    if test_id in active_tests:
        return active_tests[test_id]
    
    # Check database for completed tests
    db = await get_db()
    result = await db.stress_tests.find_one(
        {"test_id": test_id},
        {"_id": 0}
    )
    
    if not result:
        raise HTTPException(404, f"Test {test_id} not found")
    
    return result

@router.get("/results/{test_id}")
async def get_test_results(test_id: str):
    """Get full results of a completed stress test"""
    db = await get_db()
    
    result = await db.stress_tests.find_one(
        {"test_id": test_id},
        {"_id": 0}
    )
    
    if not result:
        raise HTTPException(404, f"Test {test_id} not found")
    
    if result.get("status") != "completed":
        return {
            "test_id": test_id,
            "status": result.get("status"),
            "message": "Test has not completed yet"
        }
    
    return result

@router.get("/history")
async def get_test_history(limit: int = 20):
    """Get history of stress tests"""
    db = await get_db()
    
    tests = await db.stress_tests.find(
        {},
        {"_id": 0, "test_id": 1, "status": 1, "started_at": 1, "completed_at": 1,
         "total_requests": 1, "requests_per_second": 1, "config.concurrent_users": 1}
    ).sort("started_at", -1).limit(limit).to_list(length=limit)
    
    return {
        "tests": tests,
        "total": len(tests)
    }

@router.delete("/cancel/{test_id}")
async def cancel_test(test_id: str):
    """Cancel a running stress test"""
    
    if test_id in active_tests:
        active_tests[test_id]["status"] = "cancelled"
        
        db = await get_db()
        await db.stress_tests.update_one(
            {"test_id": test_id},
            {"$set": {"status": "cancelled"}}
        )
        
        return {"success": True, "message": f"Test {test_id} cancelled"}
    
    raise HTTPException(404, f"Active test {test_id} not found")

# ==================== QUICK TEST PRESETS ====================

@router.post("/quick/light")
async def quick_light_test(background_tasks: BackgroundTasks):
    """Quick light stress test: 100 users, 30 seconds"""
    config = StressTestConfig(
        concurrent_users=100,
        duration_seconds=30,
        ramp_up_seconds=5
    )
    return await start_stress_test(config, background_tasks)

@router.post("/quick/medium")
async def quick_medium_test(background_tasks: BackgroundTasks):
    """Quick medium stress test: 1,000 users, 60 seconds"""
    config = StressTestConfig(
        concurrent_users=1000,
        duration_seconds=60,
        ramp_up_seconds=15
    )
    return await start_stress_test(config, background_tasks)

@router.post("/quick/heavy")
async def quick_heavy_test(background_tasks: BackgroundTasks):
    """Quick heavy stress test: 5,000 users, 120 seconds"""
    config = StressTestConfig(
        concurrent_users=5000,
        duration_seconds=120,
        ramp_up_seconds=30
    )
    return await start_stress_test(config, background_tasks)

@router.post("/quick/extreme")
async def quick_extreme_test(background_tasks: BackgroundTasks):
    """Extreme stress test: 20,000 users, 180 seconds"""
    config = StressTestConfig(
        concurrent_users=20000,
        duration_seconds=180,
        ramp_up_seconds=60
    )
    return await start_stress_test(config, background_tasks)

# ==================== NOTIFICATION STRESS TEST ====================

@router.post("/notifications/flood")
async def notification_flood_test(
    user_count: int = 1000,
    notifications_per_user: int = 10,
    background_tasks: BackgroundTasks = None
):
    """Flood test for notification system"""
    db = await get_db()
    
    test_id = f"NOTIF-FLOOD-{uuid.uuid4().hex[:8].upper()}"
    start_time = time.time()
    
    notifications_created = 0
    errors = 0
    
    for i in range(user_count):
        user_id = f"stress_user_{i}"
        
        for j in range(notifications_per_user):
            try:
                notification = {
                    "notification_id": f"NOTIF-{uuid.uuid4().hex[:12].upper()}",
                    "user_id": user_id,
                    "title": f"Stress Test Notification #{j}",
                    "message": f"This is notification {j} for user {i} during stress test {test_id}",
                    "notification_type": random.choice(["info", "warning", "alert", "success"]),
                    "priority": random.choice(["low", "normal", "high"]),
                    "category": random.choice(["compliance", "platform_sync", "portfolio", "general"]),
                    "read": False,
                    "dismissed": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.in_app_notifications.insert_one(notification)
                notifications_created += 1
            except Exception as e:
                errors += 1
    
    duration_ms = (time.time() - start_time) * 1000
    throughput = notifications_created / (duration_ms / 1000)
    
    result = {
        "test_id": test_id,
        "test_type": "notification_flood",
        "user_count": user_count,
        "notifications_per_user": notifications_per_user,
        "total_notifications_target": user_count * notifications_per_user,
        "notifications_created": notifications_created,
        "errors": errors,
        "duration_ms": duration_ms,
        "throughput_per_second": throughput,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.stress_tests.insert_one({**result, "_id": test_id})
    
    return result

# ==================== WEBSOCKET STRESS TEST ====================

@router.post("/websocket/connections")
async def websocket_connection_test(
    max_connections: int = 1000,
    hold_duration_seconds: int = 30
):
    """Test WebSocket connection capacity"""
    import websockets
    
    test_id = f"WS-STRESS-{uuid.uuid4().hex[:8].upper()}"
    start_time = time.time()
    
    ws_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
    ws_url = ws_url.replace("https://", "wss://").replace("http://", "ws://")
    ws_url = f"{ws_url}/api/ws/notifications"
    
    connections = []
    connected = 0
    failed = 0
    errors = []
    
    async def connect_and_hold():
        nonlocal connected, failed
        try:
            ws = await websockets.connect(ws_url, close_timeout=5)
            connections.append(ws)
            connected += 1
            await asyncio.sleep(hold_duration_seconds)
            await ws.close()
        except Exception as e:
            failed += 1
            errors.append(str(e)[:100])
    
    # Connect in batches
    batch_size = min(100, max_connections)
    for batch_start in range(0, max_connections, batch_size):
        batch_end = min(batch_start + batch_size, max_connections)
        tasks = [connect_and_hold() for _ in range(batch_end - batch_start)]
        await asyncio.gather(*tasks, return_exceptions=True)
        await asyncio.sleep(0.5)  # Brief pause between batches
    
    duration_ms = (time.time() - start_time) * 1000
    
    result = {
        "test_id": test_id,
        "test_type": "websocket_stress",
        "target_connections": max_connections,
        "successful_connections": connected,
        "failed_connections": failed,
        "success_rate": connected / max(1, max_connections) * 100,
        "hold_duration_seconds": hold_duration_seconds,
        "duration_ms": duration_ms,
        "sample_errors": errors[:5],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    return result

# ==================== SYSTEM METRICS ====================

@router.get("/system/metrics")
async def get_system_metrics():
    """Get current system metrics"""
    import psutil
    
    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory": {
            "total_mb": psutil.virtual_memory().total / (1024 * 1024),
            "used_mb": psutil.virtual_memory().used / (1024 * 1024),
            "percent": psutil.virtual_memory().percent
        },
        "disk": {
            "total_gb": psutil.disk_usage('/').total / (1024 * 1024 * 1024),
            "used_gb": psutil.disk_usage('/').used / (1024 * 1024 * 1024),
            "percent": psutil.disk_usage('/').percent
        },
        "connections": {
            "total": len(psutil.net_connections())
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/system/capacity-estimate")
async def estimate_capacity():
    """Estimate system capacity based on current metrics"""
    import psutil
    
    cpu_available = 100 - psutil.cpu_percent(interval=1)
    memory_available_mb = psutil.virtual_memory().available / (1024 * 1024)
    
    # Rough estimates (these would need tuning based on real data)
    estimated_users_by_cpu = int(cpu_available * 500)  # 500 users per % CPU
    estimated_users_by_memory = int(memory_available_mb / 2)  # 2MB per user
    
    return {
        "estimated_max_concurrent_users": min(estimated_users_by_cpu, estimated_users_by_memory),
        "limiting_factor": "CPU" if estimated_users_by_cpu < estimated_users_by_memory else "Memory",
        "cpu_headroom_percent": cpu_available,
        "memory_headroom_mb": memory_available_mb,
        "recommendations": [
            f"Current capacity estimate: {min(estimated_users_by_cpu, estimated_users_by_memory):,} concurrent users",
            "For 20,000 users: Consider horizontal scaling with load balancer",
            "Database connection pooling recommended for high load",
            "Redis caching recommended for session management"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
