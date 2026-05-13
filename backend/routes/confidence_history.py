"""
Historical Confidence Score Tracking
Track and visualize confidence scores over time for trend analysis
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/confidence-history", tags=["Confidence Score History"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== MODELS ====================

class ConfidenceSnapshot(BaseModel):
    client_id: str
    confidence_score: float
    risk_breakdown: Dict[str, float]
    inputs: Dict[str, Any]
    projections: Dict[str, float]
    calculated_by: str = "system"  # system, advisor, client
    notes: Optional[str] = None


class ConfidenceHistoryResponse(BaseModel):
    client_id: str
    history: List[Dict[str, Any]]
    trend: Dict[str, Any]
    summary: Dict[str, Any]


# ==================== HELPER FUNCTIONS ====================

def calculate_trend(scores: List[float]) -> Dict[str, Any]:
    """Calculate trend statistics from a list of scores."""
    if not scores:
        return {
            "direction": "neutral",
            "change_percent": 0,
            "volatility": 0,
            "average": 0
        }
    
    if len(scores) == 1:
        return {
            "direction": "neutral",
            "change_percent": 0,
            "volatility": 0,
            "average": scores[0]
        }
    
    # Calculate trend direction
    first_score = scores[0]
    last_score = scores[-1]
    change = last_score - first_score
    change_percent = (change / first_score * 100) if first_score > 0 else 0
    
    if change > 2:
        direction = "improving"
    elif change < -2:
        direction = "declining"
    else:
        direction = "stable"
    
    # Calculate volatility (standard deviation)
    avg = sum(scores) / len(scores)
    variance = sum((s - avg) ** 2 for s in scores) / len(scores)
    volatility = variance ** 0.5
    
    # Calculate moving average (last 3 points)
    recent_avg = sum(scores[-3:]) / min(3, len(scores))
    
    return {
        "direction": direction,
        "change_percent": round(change_percent, 2),
        "change_points": round(change, 1),
        "volatility": round(volatility, 2),
        "average": round(avg, 1),
        "recent_average": round(recent_avg, 1),
        "min_score": round(min(scores), 1),
        "max_score": round(max(scores), 1),
        "data_points": len(scores)
    }


# ==================== API ENDPOINTS ====================

@router.post("/record")
async def record_confidence_snapshot(snapshot: ConfidenceSnapshot):
    """
    Record a confidence score snapshot for historical tracking.
    Called automatically after each confidence calculation.
    """
    db = await get_db()
    
    record = {
        "id": str(uuid.uuid4()),
        "client_id": snapshot.client_id,
        "timestamp": datetime.now(timezone.utc),
        "confidence_score": snapshot.confidence_score,
        "risk_breakdown": snapshot.risk_breakdown,
        "inputs": snapshot.inputs,
        "projections": snapshot.projections,
        "calculated_by": snapshot.calculated_by,
        "notes": snapshot.notes
    }
    
    await db.confidence_history.insert_one(record)
    
    # Also update the client's latest score
    await db.clients.update_one(
        {"client_id": snapshot.client_id},
        {
            "$set": {
                "latest_confidence": {
                    "score": snapshot.confidence_score,
                    "calculated_at": datetime.now(timezone.utc),
                    "risk_breakdown": snapshot.risk_breakdown
                }
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "record_id": record["id"],
        "timestamp": record["timestamp"].isoformat()
    }


@router.get("/client/{client_id}")
async def get_confidence_history(
    client_id: str,
    days: int = Query(default=365, ge=1, le=3650),
    limit: int = Query(default=100, ge=1, le=1000)
):
    """
    Get historical confidence scores for a client.
    Returns trend analysis and all recorded snapshots.
    """
    db = await get_db()
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Fetch history
    cursor = db.confidence_history.find(
        {
            "client_id": client_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        },
        {"_id": 0}
    ).sort("timestamp", 1).limit(limit)
    
    history = await cursor.to_list(length=limit)
    
    # If no history, generate sample data for demo
    if not history:
        history = _generate_sample_history(client_id, days)
    
    # Extract scores for trend calculation
    scores = [h["confidence_score"] for h in history]
    
    # Calculate trend
    trend = calculate_trend(scores)
    
    # Calculate summary statistics
    risk_totals = {"longevity": [], "market": [], "spending": [], "inflation": []}
    for h in history:
        rb = h.get("risk_breakdown", {})
        risk_totals["longevity"].append(rb.get("longevity_risk", 0))
        risk_totals["market"].append(rb.get("market_risk", 0))
        risk_totals["spending"].append(rb.get("spending_risk", 0))
        risk_totals["inflation"].append(rb.get("inflation_risk", 0))
    
    summary = {
        "total_records": len(history),
        "date_range": {
            "from": history[0]["timestamp"].isoformat() if history else start_date.isoformat(),
            "to": history[-1]["timestamp"].isoformat() if history else end_date.isoformat()
        },
        "current_score": scores[-1] if scores else 0,
        "previous_score": scores[-2] if len(scores) > 1 else scores[0] if scores else 0,
        "average_risks": {
            "longevity": round(sum(risk_totals["longevity"]) / max(1, len(risk_totals["longevity"])), 2),
            "market": round(sum(risk_totals["market"]) / max(1, len(risk_totals["market"])), 2),
            "spending": round(sum(risk_totals["spending"]) / max(1, len(risk_totals["spending"])), 2),
            "inflation": round(sum(risk_totals["inflation"]) / max(1, len(risk_totals["inflation"])), 2)
        }
    }
    
    # Format history for response
    formatted_history = []
    for h in history:
        formatted_history.append({
            "id": h.get("id"),
            "timestamp": h["timestamp"].isoformat() if isinstance(h["timestamp"], datetime) else h["timestamp"],
            "confidence_score": h["confidence_score"],
            "risk_breakdown": h.get("risk_breakdown", {}),
            "calculated_by": h.get("calculated_by", "system"),
            "notes": h.get("notes")
        })
    
    return {
        "client_id": client_id,
        "history": formatted_history,
        "trend": trend,
        "summary": summary
    }


@router.get("/client/{client_id}/chart-data")
async def get_chart_data(
    client_id: str,
    interval: str = Query(default="monthly", enum=["daily", "weekly", "monthly", "quarterly"]),
    periods: int = Query(default=12, ge=1, le=60)
):
    """
    Get aggregated chart data for confidence score visualization.
    Returns data points suitable for line/area charts.
    """
    db = await get_db()
    
    # Calculate date range based on interval
    end_date = datetime.now(timezone.utc)
    if interval == "daily":
        start_date = end_date - timedelta(days=periods)
        group_format = "%Y-%m-%d"
    elif interval == "weekly":
        start_date = end_date - timedelta(weeks=periods)
        group_format = "%Y-W%V"
    elif interval == "quarterly":
        start_date = end_date - timedelta(days=periods * 90)
        group_format = "%Y-Q"
    else:  # monthly
        start_date = end_date - timedelta(days=periods * 30)
        group_format = "%Y-%m"
    
    # Fetch and aggregate
    cursor = db.confidence_history.find(
        {
            "client_id": client_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        },
        {"_id": 0}
    ).sort("timestamp", 1)
    
    records = await cursor.to_list(length=1000)
    
    # If no data, generate sample
    if not records:
        records = _generate_sample_history(client_id, (end_date - start_date).days)
    
    # Aggregate by interval
    aggregated = {}
    for r in records:
        ts = r["timestamp"] if isinstance(r["timestamp"], datetime) else datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00"))
        
        if interval == "quarterly":
            quarter = (ts.month - 1) // 3 + 1
            key = f"{ts.year}-Q{quarter}"
        else:
            key = ts.strftime(group_format)
        
        if key not in aggregated:
            aggregated[key] = {
                "scores": [],
                "risks": {"longevity": [], "market": [], "spending": [], "inflation": []}
            }
        
        aggregated[key]["scores"].append(r["confidence_score"])
        rb = r.get("risk_breakdown", {})
        aggregated[key]["risks"]["longevity"].append(rb.get("longevity_risk", 0))
        aggregated[key]["risks"]["market"].append(rb.get("market_risk", 0))
        aggregated[key]["risks"]["spending"].append(rb.get("spending_risk", 0))
        aggregated[key]["risks"]["inflation"].append(rb.get("inflation_risk", 0))
    
    # Build chart data
    chart_data = []
    for period, data in sorted(aggregated.items()):
        avg_score = sum(data["scores"]) / len(data["scores"])
        chart_data.append({
            "period": period,
            "confidence_score": round(avg_score, 1),
            "longevity_risk": round(sum(data["risks"]["longevity"]) / len(data["risks"]["longevity"]), 1),
            "market_risk": round(sum(data["risks"]["market"]) / len(data["risks"]["market"]), 1),
            "spending_risk": round(sum(data["risks"]["spending"]) / len(data["risks"]["spending"]), 1),
            "inflation_risk": round(sum(data["risks"]["inflation"]) / len(data["risks"]["inflation"]), 1),
            "data_points": len(data["scores"])
        })
    
    return {
        "client_id": client_id,
        "interval": interval,
        "periods": periods,
        "chart_data": chart_data,
        "total_data_points": len(records)
    }


@router.get("/client/{client_id}/milestones")
async def get_confidence_milestones(client_id: str):
    """
    Get key milestones in confidence score history.
    Identifies significant changes and achievements.
    """
    db = await get_db()
    
    cursor = db.confidence_history.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("timestamp", 1)
    
    records = await cursor.to_list(length=1000)
    
    # If no data, generate sample
    if not records:
        records = _generate_sample_history(client_id, 365)
    
    milestones = []
    prev_score = None
    highest_score = 0
    lowest_score = 100
    
    for r in records:
        score = r["confidence_score"]
        ts = r["timestamp"] if isinstance(r["timestamp"], datetime) else datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00"))
        
        # Check for significant changes
        if prev_score is not None:
            change = score - prev_score
            if abs(change) >= 5:  # 5 point change is significant
                milestones.append({
                    "type": "significant_change",
                    "date": ts.isoformat(),
                    "score": score,
                    "change": round(change, 1),
                    "description": f"Score {'increased' if change > 0 else 'decreased'} by {abs(round(change, 1))} points"
                })
        
        # Check for new high
        if score > highest_score:
            highest_score = score
            milestones.append({
                "type": "new_high",
                "date": ts.isoformat(),
                "score": score,
                "description": f"New all-time high: {round(score, 1)}%"
            })
        
        # Check for new low
        if score < lowest_score:
            lowest_score = score
            if prev_score is not None:  # Don't mark first score as low
                milestones.append({
                    "type": "new_low",
                    "date": ts.isoformat(),
                    "score": score,
                    "description": f"New low: {round(score, 1)}%"
                })
        
        # Check for threshold crossings
        thresholds = [90, 75, 50, 25]
        for threshold in thresholds:
            if prev_score is not None:
                if prev_score < threshold <= score:
                    milestones.append({
                        "type": "threshold_crossed_up",
                        "date": ts.isoformat(),
                        "score": score,
                        "threshold": threshold,
                        "description": f"Crossed above {threshold}% threshold"
                    })
                elif prev_score >= threshold > score:
                    milestones.append({
                        "type": "threshold_crossed_down",
                        "date": ts.isoformat(),
                        "score": score,
                        "threshold": threshold,
                        "description": f"Dropped below {threshold}% threshold"
                    })
        
        prev_score = score
    
    # Sort by date and limit
    milestones.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "client_id": client_id,
        "milestones": milestones[:20],
        "summary": {
            "total_milestones": len(milestones),
            "all_time_high": round(highest_score, 1),
            "all_time_low": round(lowest_score, 1)
        }
    }


@router.get("/compare")
async def compare_clients(
    client_ids: str = Query(..., description="Comma-separated client IDs"),
    days: int = Query(default=90, ge=1, le=365)
):
    """
    Compare confidence score history across multiple clients.
    Useful for advisor dashboards and peer comparisons.
    """
    db = await get_db()
    ids = [cid.strip() for cid in client_ids.split(",")][:5]  # Max 5 clients
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    comparison = []
    
    for client_id in ids:
        cursor = db.confidence_history.find(
            {
                "client_id": client_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            },
            {"_id": 0}
        ).sort("timestamp", -1).limit(1)
        
        latest = await cursor.to_list(length=1)
        
        # Get historical data for trend
        cursor = db.confidence_history.find(
            {
                "client_id": client_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            },
            {"_id": 0}
        ).sort("timestamp", 1)
        
        history = await cursor.to_list(length=100)
        
        if not history:
            history = _generate_sample_history(client_id, days)
            latest = [history[-1]] if history else []
        
        scores = [h["confidence_score"] for h in history]
        trend = calculate_trend(scores)
        
        comparison.append({
            "client_id": client_id,
            "current_score": latest[0]["confidence_score"] if latest else 0,
            "trend": trend,
            "data_points": len(history)
        })
    
    # Rank clients by score
    comparison.sort(key=lambda x: x["current_score"], reverse=True)
    for i, c in enumerate(comparison):
        c["rank"] = i + 1
    
    return {
        "clients": comparison,
        "date_range": {
            "from": start_date.isoformat(),
            "to": end_date.isoformat()
        },
        "comparison_period_days": days
    }


def _generate_sample_history(client_id: str, days: int) -> List[Dict[str, Any]]:
    """Generate sample historical data for demo purposes."""
    import secrets
    _rng = secrets.SystemRandom()
    
    history = []
    base_score = 75 + _rng.uniform(-10, 15)
    current_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    while current_date <= datetime.now(timezone.utc):
        # Add some random variation with slight upward trend
        variation = _rng.uniform(-3, 4)
        base_score = max(20, min(100, base_score + variation * 0.3))
        
        history.append({
            "id": str(uuid.uuid4()),
            "client_id": client_id,
            "timestamp": current_date,
            "confidence_score": round(base_score, 1),
            "risk_breakdown": {
                "longevity_risk": round(_rng.uniform(0, 15), 1),
                "market_risk": round(_rng.uniform(0, 20), 1),
                "spending_risk": round(_rng.uniform(0, 10), 1),
                "inflation_risk": round(_rng.uniform(0, 8), 1)
            },
            "calculated_by": "system",
            "notes": None
        })
        
        # Move forward by 7-14 days
        current_date += timedelta(days=_rng.randint(7, 14))
    
    return history
