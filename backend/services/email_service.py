"""
Email Notification Service using SendGrid
Handles trade confirmations, alerts, and general notifications.
"""
import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, Attachment, FileContent, FileName, FileType, Disposition

logger = logging.getLogger(__name__)

# SendGrid configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'notifications@wealthcommand.io')
SENDER_NAME = os.environ.get('SENDER_NAME', 'Wealth Command')

# Email templates
TEMPLATES = {
    "trade_confirmation": {
        "subject": "Trade Confirmation: {action} {units} {symbol}",
        "template": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1a2744 0%, #2a3754 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }}
        .trade-summary {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .trade-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }}
        .trade-row:last-child {{ border-bottom: none; }}
        .label {{ color: #666; }}
        .value {{ font-weight: bold; color: #1a2744; }}
        .cgt-section {{ background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }}
        .cgt-section.loss {{ background: #d4edda; border-left-color: #28a745; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        .btn {{ display: inline-block; background: #D4A84C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
        .demo-badge {{ background: #ff9800; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 15px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Trade Confirmation</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #{order_id}</p>
        </div>
        <div class="content">
            {demo_badge}
            <h2 style="color: #1a2744; margin-top: 0;">Your order has been executed</h2>
            
            <div class="trade-summary">
                <div class="trade-row">
                    <span class="label">Action</span>
                    <span class="value" style="color: {action_color};">{action}</span>
                </div>
                <div class="trade-row">
                    <span class="label">Security</span>
                    <span class="value">{symbol} - {security_name}</span>
                </div>
                <div class="trade-row">
                    <span class="label">Units</span>
                    <span class="value">{units}</span>
                </div>
                <div class="trade-row">
                    <span class="label">Price</span>
                    <span class="value">${price:.2f}</span>
                </div>
                <div class="trade-row">
                    <span class="label">Gross {proceeds_label}</span>
                    <span class="value">${gross_amount:.2f}</span>
                </div>
                <div class="trade-row">
                    <span class="label">Brokerage</span>
                    <span class="value">${brokerage:.2f}</span>
                </div>
                <div class="trade-row" style="font-size: 18px;">
                    <span class="label">Net {proceeds_label}</span>
                    <span class="value">${net_amount:.2f}</span>
                </div>
            </div>
            
            {cgt_section}
            
            <div style="text-align: center;">
                <a href="{dashboard_url}" class="btn">View in Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated notification from Wealth Command.</p>
            <p>© 2025 Wealth Command. All rights reserved.</p>
            <p style="font-size: 10px; color: #999;">
                This email was sent to {recipient_email}. 
                If you have questions, contact your financial adviser.
            </p>
        </div>
    </div>
</body>
</html>
"""
    },
    "portfolio_alert": {
        "subject": "Portfolio Alert: {alert_type} - {client_name}",
        "template": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {header_color}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }}
        .alert-box {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {alert_color}; }}
        .metric {{ display: inline-block; margin: 10px 20px 10px 0; }}
        .metric-value {{ font-size: 24px; font-weight: bold; color: #1a2744; }}
        .metric-label {{ font-size: 12px; color: #666; }}
        .btn {{ display: inline-block; background: #1a2744; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{alert_title}</h1>
        </div>
        <div class="content">
            <h2 style="color: #1a2744;">Client: {client_name}</h2>
            
            <div class="alert-box">
                <h3 style="margin-top: 0; color: {alert_color};">{alert_headline}</h3>
                <p>{alert_message}</p>
            </div>
            
            <div style="margin: 20px 0;">
                {metrics_html}
            </div>
            
            <h3>Recommended Action</h3>
            <p>{recommendation}</p>
            
            <div style="text-align: center;">
                <a href="{action_url}" class="btn">Take Action</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2025 Wealth Command. Automated alert notification.</p>
        </div>
    </div>
</body>
</html>
"""
    },
    "daily_digest": {
        "subject": "Daily Digest: {date} - {alert_count} Alerts",
        "template": """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1a2744 0%, #2a3754 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }}
        .stats-row {{ display: flex; justify-content: space-around; margin: 20px 0; }}
        .stat {{ text-align: center; }}
        .stat-value {{ font-size: 28px; font-weight: bold; color: #1a2744; }}
        .stat-label {{ font-size: 12px; color: #666; }}
        .alert-item {{ padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }}
        .alert-high {{ background: #ffebee; border-color: #f44336; }}
        .alert-medium {{ background: #fff3e0; border-color: #ff9800; }}
        .alert-low {{ background: #e3f2fd; border-color: #2196f3; }}
        .btn {{ display: inline-block; background: #D4A84C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Daily Intelligence Digest</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">{date}</p>
        </div>
        <div class="content">
            <div class="stats-row">
                <div class="stat">
                    <div class="stat-value">{total_aum}</div>
                    <div class="stat-label">Assets Under Advice</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{client_count}</div>
                    <div class="stat-label">Active Clients</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{alert_count}</div>
                    <div class="stat-label">Alerts Today</div>
                </div>
            </div>
            
            <h3>Priority Alerts</h3>
            {alerts_html}
            
            <h3>Today's Meetings</h3>
            {meetings_html}
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="{dashboard_url}" class="btn">Open Command Center</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2025 Wealth Command. Your AI-powered financial advisor platform.</p>
        </div>
    </div>
</body>
</html>
"""
    }
}


class EmailService:
    """Email notification service using SendGrid."""
    
    def __init__(self):
        self.api_key = SENDGRID_API_KEY
        self.sender_email = SENDER_EMAIL
        self.sender_name = SENDER_NAME
        self.client = SendGridAPIClient(self.api_key) if self.api_key else None
        self.demo_mode = not bool(self.api_key)
        
        if self.demo_mode:
            logger.warning("EmailService running in DEMO MODE - no emails will be sent")
    
    def _render_template(self, template_name: str, **kwargs) -> tuple:
        """Render an email template with the given parameters."""
        template = TEMPLATES.get(template_name)
        if not template:
            raise ValueError(f"Unknown template: {template_name}")
        
        subject = template["subject"].format(**kwargs)
        body = template["template"].format(**kwargs)
        
        return subject, body
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str = None,
        from_name: str = None
    ) -> Dict:
        """Send an email via SendGrid."""
        
        result = {
            "success": False,
            "to": to_email,
            "subject": subject,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "demo_mode": self.demo_mode
        }
        
        if self.demo_mode:
            logger.info(f"DEMO MODE: Would send email to {to_email}: {subject}")
            result["success"] = True
            result["message"] = "Email logged (demo mode - not actually sent)"
            result["would_send"] = {
                "to": to_email,
                "from": from_email or self.sender_email,
                "subject": subject,
                "content_preview": html_content[:200] + "..."
            }
            return result
        
        try:
            message = Mail(
                from_email=Email(from_email or self.sender_email, from_name or self.sender_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            response = self.client.send(message)
            
            result["success"] = response.status_code in [200, 201, 202]
            result["status_code"] = response.status_code
            result["message_id"] = response.headers.get('X-Message-Id')
            
            logger.info(f"Email sent to {to_email}: {subject} (status: {response.status_code})")
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            result["error"] = str(e)
        
        return result
    
    def send_trade_confirmation(
        self,
        to_email: str,
        order_id: str,
        action: str,  # BUY or SELL
        symbol: str,
        security_name: str,
        units: int,
        price: float,
        gross_amount: float,
        brokerage: float,
        net_amount: float,
        cgt_info: Optional[Dict] = None,
        dashboard_url: str = "https://wealthcommand.io/stock-trading",
        is_demo: bool = True
    ) -> Dict:
        """Send trade confirmation email."""
        
        # Prepare CGT section
        cgt_section = ""
        if cgt_info and action == "SELL":
            is_loss = cgt_info.get('is_capital_loss', False)
            cgt_class = "loss" if is_loss else ""
            
            cgt_section = f"""
            <div class="cgt-section {cgt_class}">
                <h3 style="margin-top: 0;">Capital Gains Tax Impact</h3>
                <div class="trade-row">
                    <span class="label">Gross {'Loss' if is_loss else 'Gain'}</span>
                    <span class="value">${abs(cgt_info.get('gross_capital_gain', 0)):.2f}</span>
                </div>
                {'<div class="trade-row"><span class="label">CGT Discount (50%)</span><span class="value">-$' + f"{cgt_info.get('discount_applied', 0):.2f}" + '</span></div>' if cgt_info.get('eligible_for_discount') else ''}
                <div class="trade-row">
                    <span class="label">Net Capital {'Loss' if is_loss else 'Gain'}</span>
                    <span class="value">${cgt_info.get('net_capital_gain', 0):.2f}</span>
                </div>
                <div class="trade-row">
                    <span class="label">Estimated Tax {'Benefit' if is_loss else 'Liability'}</span>
                    <span class="value" style="color: {'#28a745' if is_loss else '#dc3545'};">${cgt_info.get('estimated_cgt_liability', 0):.2f}</span>
                </div>
            </div>
            """
        
        demo_badge = '<span class="demo-badge">DEMO MODE - Simulated Trade</span>' if is_demo else ''
        
        subject, html = self._render_template(
            "trade_confirmation",
            order_id=order_id,
            action=action,
            action_color="#28a745" if action == "BUY" else "#dc3545",
            symbol=symbol,
            security_name=security_name,
            units=units,
            price=price,
            proceeds_label="Cost" if action == "BUY" else "Proceeds",
            gross_amount=gross_amount,
            brokerage=brokerage,
            net_amount=net_amount,
            cgt_section=cgt_section,
            demo_badge=demo_badge,
            dashboard_url=dashboard_url,
            recipient_email=to_email
        )
        
        return self.send_email(to_email, subject, html)
    
    def send_portfolio_alert(
        self,
        to_email: str,
        client_name: str,
        alert_type: str,
        alert_title: str,
        alert_headline: str,
        alert_message: str,
        recommendation: str,
        metrics: Dict[str, Any],
        severity: str = "medium",
        action_url: str = "https://wealthcommand.io/advisor-command-center"
    ) -> Dict:
        """Send portfolio alert email."""
        
        colors = {
            "high": {"header": "#c62828", "alert": "#f44336"},
            "medium": {"header": "#ef6c00", "alert": "#ff9800"},
            "low": {"header": "#1565c0", "alert": "#2196f3"}
        }
        
        color_config = colors.get(severity, colors["medium"])
        
        # Build metrics HTML
        metrics_html = ""
        for label, value in metrics.items():
            metrics_html += f"""
            <div class="metric">
                <div class="metric-value">{value}</div>
                <div class="metric-label">{label}</div>
            </div>
            """
        
        subject, html = self._render_template(
            "portfolio_alert",
            client_name=client_name,
            alert_type=alert_type,
            alert_title=alert_title,
            header_color=color_config["header"],
            alert_color=color_config["alert"],
            alert_headline=alert_headline,
            alert_message=alert_message,
            metrics_html=metrics_html,
            recommendation=recommendation,
            action_url=action_url
        )
        
        return self.send_email(to_email, subject, html)
    
    def send_daily_digest(
        self,
        to_email: str,
        total_aum: str,
        client_count: int,
        alerts: List[Dict],
        meetings: List[Dict],
        dashboard_url: str = "https://wealthcommand.io/advisor-command-center"
    ) -> Dict:
        """Send daily digest email."""
        
        date = datetime.now().strftime("%B %d, %Y")
        
        # Build alerts HTML
        alerts_html = ""
        for alert in alerts[:5]:  # Top 5 alerts
            severity_class = f"alert-{alert.get('severity', 'medium')}"
            alerts_html += f"""
            <div class="alert-item {severity_class}">
                <strong>{alert.get('title', 'Alert')}</strong><br>
                <span style="color: #666;">{alert.get('message', '')}</span>
            </div>
            """
        
        if not alerts:
            alerts_html = '<p style="color: #28a745;">✓ No priority alerts today</p>'
        
        # Build meetings HTML
        meetings_html = ""
        for meeting in meetings[:3]:  # Top 3 meetings
            meetings_html += f"""
            <div style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 6px;">
                <strong>{meeting.get('time', '')} - {meeting.get('client_name', '')}</strong><br>
                <span style="color: #666; font-size: 12px;">{meeting.get('type', 'Meeting')}</span>
            </div>
            """
        
        if not meetings:
            meetings_html = '<p style="color: #666;">No meetings scheduled today</p>'
        
        subject, html = self._render_template(
            "daily_digest",
            date=date,
            total_aum=total_aum,
            client_count=client_count,
            alert_count=len(alerts),
            alerts_html=alerts_html,
            meetings_html=meetings_html,
            dashboard_url=dashboard_url
        )
        
        return self.send_email(to_email, subject, html)


# Global email service instance
email_service = EmailService()


def send_trade_confirmation_email(**kwargs) -> Dict:
    """Convenience function to send trade confirmation."""
    return email_service.send_trade_confirmation(**kwargs)


def send_portfolio_alert_email(**kwargs) -> Dict:
    """Convenience function to send portfolio alert."""
    return email_service.send_portfolio_alert(**kwargs)


def send_daily_digest_email(**kwargs) -> Dict:
    """Convenience function to send daily digest."""
    return email_service.send_daily_digest(**kwargs)


def get_email_service_status() -> Dict:
    """Get email service status."""
    return {
        "configured": bool(SENDGRID_API_KEY),
        "demo_mode": email_service.demo_mode,
        "sender_email": SENDER_EMAIL,
        "sender_name": SENDER_NAME,
        "templates_available": list(TEMPLATES.keys())
    }
