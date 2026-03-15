"""
PDF Export Service
Generate PDF reports for financial plans, statements, and summaries.
Uses ReportLab for PDF generation.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from io import BytesIO
import base64

# Try to import reportlab
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# Brand colors
PRIMARY_COLOR = HexColor("#1a2744") if REPORTLAB_AVAILABLE else "#1a2744"
GOLD_COLOR = HexColor("#D4A84C") if REPORTLAB_AVAILABLE else "#D4A84C"
LIGHT_GRAY = HexColor("#f5f5f5") if REPORTLAB_AVAILABLE else "#f5f5f5"


def generate_financial_plan_pdf(plan_data: Dict[str, Any]) -> bytes:
    """
    Generate a comprehensive financial plan PDF.
    Returns PDF as bytes.
    """
    
    if not REPORTLAB_AVAILABLE:
        # Return a simple text version if reportlab not available
        return _generate_text_report(plan_data).encode('utf-8')
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=PRIMARY_COLOR,
        spaceAfter=12,
        spaceBefore=20
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=PRIMARY_COLOR,
        spaceAfter=8,
        spaceBefore=12
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        leading=14
    )
    
    # Build document content
    story = []
    
    # Title Page
    story.append(Spacer(1, 100))
    story.append(Paragraph("HALCYON WEALTH", title_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Comprehensive Financial Plan", heading_style))
    story.append(Spacer(1, 30))
    
    client_name = plan_data.get("client_name", "Wheeler Family")
    story.append(Paragraph(f"Prepared for: {client_name}", body_style))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d %B %Y')}", body_style))
    story.append(Paragraph(f"Plan ID: {plan_data.get('plan_id', 'FP-' + datetime.now().strftime('%Y%m%d'))}", body_style))
    
    story.append(PageBreak())
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    
    exec_summary = plan_data.get("executive_summary", {})
    if exec_summary:
        story.append(Paragraph(exec_summary.get("headline", "Your financial plan has been prepared."), body_style))
        
        # Key metrics table
        metrics = exec_summary.get("key_metrics", [])
        if metrics:
            story.append(Spacer(1, 10))
            story.append(Paragraph("Key Financial Metrics", subheading_style))
            
            metric_data = [["Metric", "Current Value", "Target"]]
            for metric in metrics:
                metric_data.append([
                    metric.get("name", ""),
                    metric.get("current", ""),
                    metric.get("target", "")
                ])
            
            metric_table = Table(metric_data, colWidths=[200, 120, 120])
            metric_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
                ('GRID', (0, 0), (-1, -1), 1, black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY])
            ]))
            story.append(metric_table)
    
    story.append(Spacer(1, 20))
    
    # Retirement Analysis
    story.append(Paragraph("Retirement Analysis", heading_style))
    
    retirement = plan_data.get("retirement_plan", {})
    if retirement:
        story.append(Paragraph(f"Target Retirement Age: {retirement.get('target_age', 65)}", body_style))
        story.append(Paragraph(f"Success Probability: {retirement.get('success_probability', 0)}%", body_style))
        story.append(Paragraph(f"Projected Retirement Income: ${retirement.get('annual_income', 0):,.0f}/year", body_style))
        
        if retirement.get("recommendations"):
            story.append(Spacer(1, 10))
            story.append(Paragraph("Recommendations:", subheading_style))
            for rec in retirement.get("recommendations", []):
                story.append(Paragraph(f"• {rec}", body_style))
    
    story.append(PageBreak())
    
    # Investment Strategy
    story.append(Paragraph("Investment Strategy", heading_style))
    
    investments = plan_data.get("investment_strategy", {})
    if investments:
        story.append(Paragraph(f"Risk Profile: {investments.get('risk_profile', 'Moderate')}", body_style))
        story.append(Paragraph(f"Time Horizon: {investments.get('time_horizon', '15+ years')}", body_style))
        
        # Asset allocation
        allocation = investments.get("target_allocation", {})
        if allocation:
            story.append(Spacer(1, 10))
            story.append(Paragraph("Target Asset Allocation", subheading_style))
            
            alloc_data = [["Asset Class", "Current %", "Target %", "Action"]]
            for asset, details in allocation.items():
                if isinstance(details, dict):
                    alloc_data.append([
                        asset.replace("_", " ").title(),
                        f"{details.get('current', 0)}%",
                        f"{details.get('target', 0)}%",
                        details.get('action', '-')
                    ])
            
            if len(alloc_data) > 1:
                alloc_table = Table(alloc_data, colWidths=[150, 80, 80, 130])
                alloc_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
                    ('TEXTCOLOR', (0, 0), (-1, 0), white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                    ('GRID', (0, 0), (-1, -1), 1, black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY])
                ]))
                story.append(alloc_table)
    
    story.append(Spacer(1, 20))
    
    # Tax Strategy
    story.append(Paragraph("Tax Strategy", heading_style))
    
    tax = plan_data.get("tax_strategy", {})
    if tax:
        story.append(Paragraph(f"Current Effective Tax Rate: {tax.get('effective_rate', 0)}%", body_style))
        story.append(Paragraph(f"Potential Annual Tax Savings: ${tax.get('potential_savings', 0):,.0f}", body_style))
        
        if tax.get("strategies"):
            story.append(Spacer(1, 10))
            story.append(Paragraph("Tax Optimization Strategies:", subheading_style))
            for strategy in tax.get("strategies", []):
                story.append(Paragraph(f"• {strategy.get('name', '')}: {strategy.get('description', '')}", body_style))
    
    story.append(PageBreak())
    
    # Action Plan
    story.append(Paragraph("Action Plan", heading_style))
    story.append(Paragraph("Prioritized steps to implement your financial plan:", body_style))
    
    actions = plan_data.get("action_items", [])
    if actions:
        action_data = [["Priority", "Action", "Timeline", "Impact"]]
        for action in actions:
            action_data.append([
                action.get("priority", "Medium"),
                action.get("action", ""),
                action.get("timeline", ""),
                action.get("impact", "")
            ])
        
        action_table = Table(action_data, colWidths=[60, 200, 80, 100])
        action_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 1, black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        story.append(action_table)
    
    story.append(Spacer(1, 30))
    
    # Disclaimer
    story.append(Paragraph("Important Information", heading_style))
    disclaimer = """This document contains general information only and does not constitute personal financial advice. 
    The projections and scenarios presented are based on assumptions that may not reflect actual market conditions. 
    Past performance is not indicative of future results. Please consult with a licensed financial adviser before 
    making any investment decisions."""
    story.append(Paragraph(disclaimer, body_style))
    
    # Build PDF
    doc.build(story)
    
    return buffer.getvalue()


def generate_portfolio_statement_pdf(portfolio_data: Dict[str, Any]) -> bytes:
    """Generate a portfolio statement PDF."""
    
    if not REPORTLAB_AVAILABLE:
        return _generate_text_report(portfolio_data).encode('utf-8')
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=PRIMARY_COLOR,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=PRIMARY_COLOR,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    story = []
    
    # Header
    story.append(Paragraph("Portfolio Statement", title_style))
    story.append(Paragraph(f"As at {datetime.now().strftime('%d %B %Y')}", body_style))
    story.append(Spacer(1, 20))
    
    # Summary
    summary = portfolio_data.get("summary", {})
    story.append(Paragraph("Portfolio Summary", heading_style))
    story.append(Paragraph(f"Total Value: ${summary.get('total_value', 0):,.2f}", body_style))
    story.append(Paragraph(f"Total Return: {summary.get('total_return', 0):.2f}%", body_style))
    
    # Holdings table
    holdings = portfolio_data.get("holdings", [])
    if holdings:
        story.append(Spacer(1, 15))
        story.append(Paragraph("Holdings", heading_style))
        
        holdings_data = [["Asset", "Units", "Price", "Value", "Return"]]
        for holding in holdings:
            holdings_data.append([
                holding.get("name", ""),
                f"{holding.get('units', 0):,.0f}",
                f"${holding.get('price', 0):,.2f}",
                f"${holding.get('value', 0):,.2f}",
                f"{holding.get('return_pct', 0):.1f}%"
            ])
        
        holdings_table = Table(holdings_data, colWidths=[180, 60, 70, 90, 60])
        holdings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY])
        ]))
        story.append(holdings_table)
    
    doc.build(story)
    return buffer.getvalue()


def generate_meeting_summary_pdf(meeting_data: Dict[str, Any]) -> bytes:
    """Generate a meeting summary PDF."""
    
    if not REPORTLAB_AVAILABLE:
        return _generate_text_report(meeting_data).encode('utf-8')
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=PRIMARY_COLOR,
        spaceAfter=15
    )
    
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=PRIMARY_COLOR,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    story = []
    
    # Header
    story.append(Paragraph("Meeting Summary", title_style))
    story.append(Paragraph(f"Client: {meeting_data.get('client_name', 'Client')}", body_style))
    story.append(Paragraph(f"Date: {meeting_data.get('meeting_date', datetime.now().strftime('%d %B %Y'))}", body_style))
    story.append(Paragraph(f"Advisor: {meeting_data.get('advisor_name', 'Financial Advisor')}", body_style))
    story.append(Spacer(1, 15))
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    story.append(Paragraph(meeting_data.get("executive_summary", "Meeting summary not available."), body_style))
    story.append(Spacer(1, 10))
    
    # Topics Discussed
    topics = meeting_data.get("topics_discussed", [])
    if topics:
        story.append(Paragraph("Topics Discussed", heading_style))
        for topic in topics:
            story.append(Paragraph(f"• {topic}", body_style))
        story.append(Spacer(1, 10))
    
    # Action Items
    actions = meeting_data.get("action_items", [])
    if actions:
        story.append(Paragraph("Action Items", heading_style))
        
        action_data = [["Action", "Owner", "Due Date", "Priority"]]
        for action in actions:
            action_data.append([
                action.get("task", ""),
                action.get("assignee", ""),
                action.get("due_date", ""),
                action.get("priority", "")
            ])
        
        action_table = Table(action_data, colWidths=[200, 80, 80, 60])
        action_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY])
        ]))
        story.append(action_table)
    
    doc.build(story)
    return buffer.getvalue()


def _generate_text_report(data: Dict[str, Any]) -> str:
    """Generate a simple text report when reportlab is not available."""
    
    lines = [
        "=" * 60,
        "HALCYON WEALTH - FINANCIAL REPORT",
        "=" * 60,
        f"Generated: {datetime.now().strftime('%d %B %Y')}",
        "",
        "SUMMARY",
        "-" * 40
    ]
    
    for key, value in data.items():
        if isinstance(value, dict):
            lines.append(f"\n{key.upper().replace('_', ' ')}:")
            for k, v in value.items():
                lines.append(f"  {k}: {v}")
        elif isinstance(value, list):
            lines.append(f"\n{key.upper().replace('_', ' ')}:")
            for item in value[:10]:  # Limit items
                if isinstance(item, dict):
                    lines.append(f"  - {item}")
                else:
                    lines.append(f"  - {item}")
        else:
            lines.append(f"{key}: {value}")
    
    lines.append("")
    lines.append("=" * 60)
    lines.append("This report is for informational purposes only.")
    
    return "\n".join(lines)


def encode_pdf_base64(pdf_bytes: bytes) -> str:
    """Encode PDF bytes to base64 for API response."""
    return base64.b64encode(pdf_bytes).decode('utf-8')
