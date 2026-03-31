"""
Email Notification Routes
Trade confirmations, alerts, and notifications via SendGrid.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging

from services.email_service import (
    email_service,
    send_trade_confirmation_email,
    send_portfolio_alert_email,
    send_daily_digest_email,
    get_email_service_status
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/email", tags=["Email"])


class TradeConfirmationRequest(BaseModel):
    to_email: str
    order_id: str
    action: str  # BUY or SELL
    symbol: str
    security_name: str
    units: int
    price: float
    gross_amount: float
    brokerage: float
    net_amount: float
    cgt_info: Optional[Dict] = None
    is_demo: bool = True


class PortfolioAlertRequest(BaseModel):
    to_email: str
    client_name: str
    alert_type: str
    alert_title: str
    alert_headline: str
    alert_message: str
    recommendation: str
    metrics: Dict[str, Any]
    severity: str = "medium"


class DailyDigestRequest(BaseModel):
    to_email: str
    total_aum: str
    client_count: int
    alerts: List[Dict]
    meetings: List[Dict]


@router.get("/status")
async def get_status():
    """Get email service status."""
    return get_email_service_status()


@router.post("/trade-confirmation")
async def send_trade_confirmation(request: TradeConfirmationRequest, background_tasks: BackgroundTasks):
    """Send trade confirmation email."""
    try:
        result = send_trade_confirmation_email(
            to_email=request.to_email,
            order_id=request.order_id,
            action=request.action,
            symbol=request.symbol,
            security_name=request.security_name,
            units=request.units,
            price=request.price,
            gross_amount=request.gross_amount,
            brokerage=request.brokerage,
            net_amount=request.net_amount,
            cgt_info=request.cgt_info,
            is_demo=request.is_demo
        )
        return result
    except Exception as e:
        logger.error(f"Error sending trade confirmation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio-alert")
async def send_portfolio_alert(request: PortfolioAlertRequest):
    """Send portfolio alert email."""
    try:
        result = send_portfolio_alert_email(
            to_email=request.to_email,
            client_name=request.client_name,
            alert_type=request.alert_type,
            alert_title=request.alert_title,
            alert_headline=request.alert_headline,
            alert_message=request.alert_message,
            recommendation=request.recommendation,
            metrics=request.metrics,
            severity=request.severity
        )
        return result
    except Exception as e:
        logger.error(f"Error sending portfolio alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/daily-digest")
async def send_daily_digest(request: DailyDigestRequest):
    """Send daily digest email."""
    try:
        result = send_daily_digest_email(
            to_email=request.to_email,
            total_aum=request.total_aum,
            client_count=request.client_count,
            alerts=request.alerts,
            meetings=request.meetings
        )
        return result
    except Exception as e:
        logger.error(f"Error sending daily digest: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test")
async def send_test_email(to_email: str):
    """Send a test email."""
    try:
        result = email_service.send_email(
            to_email=to_email,
            subject="Wealth Command - Test Email",
            html_content="""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #1a2744;">Test Email from Wealth Command</h1>
                <p>This is a test email to verify your email configuration is working.</p>
                <p style="color: #666;">If you received this, your email service is configured correctly!</p>
            </body>
            </html>
            """
        )
        return result
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        raise HTTPException(status_code=500, detail=str(e))
