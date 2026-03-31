"""
Document Generation Service
Generate professional SOA (Statement of Advice), portfolio reports, and compliance documents.
"""
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import logging
import io

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents/generate", tags=["Document Generation"])

# Try to import PDF libraries
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm, cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("ReportLab not available - PDF generation will use HTML fallback")


# Color scheme
COLORS = {
    "primary": colors.HexColor("#1a2744"),
    "secondary": colors.HexColor("#D4A84C"),
    "text": colors.HexColor("#374151"),
    "muted": colors.HexColor("#6B7280"),
    "border": colors.HexColor("#E5E7EB"),
    "success": colors.HexColor("#10B981"),
    "warning": colors.HexColor("#F59E0B"),
    "danger": colors.HexColor("#EF4444")
}


class SOARequest(BaseModel):
    client_id: str
    client_name: str
    adviser_name: str
    adviser_afsl: str
    advice_date: str
    advice_summary: str
    recommendations: List[Dict]
    risk_profile: str
    current_situation: Dict
    goals: List[Dict]
    strategy: Dict
    fees: Dict
    warnings: List[str]


class PortfolioReportRequest(BaseModel):
    client_id: str
    client_name: str
    report_date: str
    portfolio_summary: Dict
    holdings: List[Dict]
    performance: Dict
    allocation: Dict


def generate_soa_pdf(request: SOARequest) -> bytes:
    """Generate Statement of Advice PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='Title',
        fontSize=24,
        textColor=COLORS["primary"],
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='Heading1',
        fontSize=16,
        textColor=COLORS["primary"],
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='Heading2',
        fontSize=12,
        textColor=COLORS["primary"],
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='BodyText',
        fontSize=10,
        textColor=COLORS["text"],
        spaceBefore=6,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        leading=14
    ))
    
    styles.add(ParagraphStyle(
        name='Warning',
        fontSize=10,
        textColor=COLORS["warning"],
        spaceBefore=6,
        spaceAfter=6,
        backColor=colors.HexColor("#FEF3C7"),
        borderPadding=10
    ))
    
    story = []
    
    # Header
    story.append(Paragraph("STATEMENT OF ADVICE", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Client and Adviser Details
    header_data = [
        ["Prepared For:", request.client_name, "Prepared By:", request.adviser_name],
        ["Date:", request.advice_date, "AFSL:", request.adviser_afsl]
    ]
    
    header_table = Table(header_data, colWidths=[3*cm, 6*cm, 3*cm, 5*cm])
    header_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (-1, -1), COLORS["text"]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # Important Notice
    story.append(Paragraph("IMPORTANT NOTICE", styles['Heading1']))
    notice_text = """This Statement of Advice (SOA) contains personal financial advice that has been prepared 
    after considering your objectives, financial situation and needs. You should read this document carefully 
    before making any decision based on its contents. If you have any questions, please contact your adviser."""
    story.append(Paragraph(notice_text, styles['BodyText']))
    story.append(Spacer(1, 10))
    
    # Advice Summary
    story.append(Paragraph("ADVICE SUMMARY", styles['Heading1']))
    story.append(Paragraph(request.advice_summary, styles['BodyText']))
    story.append(Spacer(1, 10))
    
    # Your Situation
    story.append(Paragraph("YOUR CURRENT SITUATION", styles['Heading1']))
    
    situation = request.current_situation
    situation_data = [
        ["Risk Profile:", situation.get("risk_profile", request.risk_profile)],
        ["Investment Timeframe:", situation.get("investment_timeframe", "N/A")],
        ["Current Portfolio Value:", f"${situation.get('portfolio_value', 0):,.0f}"],
        ["Annual Income:", f"${situation.get('annual_income', 0):,.0f}"]
    ]
    
    situation_table = Table(situation_data, colWidths=[5*cm, 12*cm])
    situation_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), COLORS["text"]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, COLORS["border"]),
    ]))
    
    story.append(situation_table)
    story.append(Spacer(1, 10))
    
    # Goals
    story.append(Paragraph("YOUR GOALS", styles['Heading1']))
    
    for goal in request.goals:
        story.append(Paragraph(f"• {goal.get('name', 'Goal')}: {goal.get('description', '')}", styles['BodyText']))
    
    story.append(Spacer(1, 10))
    
    # Recommendations
    story.append(Paragraph("OUR RECOMMENDATIONS", styles['Heading1']))
    
    for i, rec in enumerate(request.recommendations, 1):
        story.append(Paragraph(f"Recommendation {i}: {rec.get('title', '')}", styles['Heading2']))
        story.append(Paragraph(rec.get('description', ''), styles['BodyText']))
        if rec.get('rationale'):
            story.append(Paragraph(f"Rationale: {rec.get('rationale')}", styles['BodyText']))
        story.append(Spacer(1, 6))
    
    # Fees
    story.append(Paragraph("FEES AND COSTS", styles['Heading1']))
    
    fees = request.fees
    fees_data = [
        ["Fee Type", "Amount", "Frequency"],
        ["Advice Fee", f"${fees.get('advice_fee', 0):,.0f}", "One-off"],
        ["Ongoing Fee", f"${fees.get('ongoing_fee', 0):,.0f}", "Annual"],
        ["Implementation Fee", f"${fees.get('implementation_fee', 0):,.0f}", "One-off"],
    ]
    
    fees_table = Table(fees_data, colWidths=[6*cm, 5*cm, 6*cm])
    fees_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), COLORS["primary"]),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), COLORS["text"]),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
    ]))
    
    story.append(fees_table)
    story.append(Spacer(1, 10))
    
    # Warnings
    story.append(Paragraph("IMPORTANT WARNINGS", styles['Heading1']))
    
    for warning in request.warnings:
        story.append(Paragraph(f"⚠ {warning}", styles['Warning']))
    
    story.append(Spacer(1, 20))
    
    # Authority to Proceed
    story.append(Paragraph("AUTHORITY TO PROCEED", styles['Heading1']))
    authority_text = """By signing below, I/we acknowledge that I/we have read and understood this Statement of Advice 
    and wish to proceed with the recommendations contained herein."""
    story.append(Paragraph(authority_text, styles['BodyText']))
    story.append(Spacer(1, 30))
    
    # Signature lines
    sig_data = [
        ["_________________________", "_________________________"],
        ["Client Signature", "Date"],
        ["", ""],
        ["_________________________", "_________________________"],
        ["Adviser Signature", "Date"]
    ]
    
    sig_table = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    story.append(sig_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_portfolio_report_pdf(request: PortfolioReportRequest) -> bytes:
    """Generate Portfolio Report PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='ReportTitle',
        fontSize=20,
        textColor=COLORS["primary"],
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontSize=14,
        textColor=COLORS["primary"],
        spaceBefore=16,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='Normal',
        fontSize=10,
        textColor=COLORS["text"],
        spaceBefore=4,
        spaceAfter=4,
        leading=12
    ))
    
    story = []
    
    # Header
    story.append(Paragraph("PORTFOLIO REPORT", styles['ReportTitle']))
    story.append(Paragraph(f"For: {request.client_name}", styles['Normal']))
    story.append(Paragraph(f"Report Date: {request.report_date}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Portfolio Summary
    story.append(Paragraph("PORTFOLIO SUMMARY", styles['SectionTitle']))
    
    summary = request.portfolio_summary
    summary_data = [
        ["Total Value", f"${summary.get('total_value', 0):,.0f}"],
        ["Change (Period)", f"${summary.get('change_value', 0):,.0f} ({summary.get('change_percent', 0):.2f}%)"],
        ["Unrealized Gain/Loss", f"${summary.get('unrealized_gain', 0):,.0f}"],
    ]
    
    summary_table = Table(summary_data, colWidths=[6*cm, 11*cm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (-1, -1), COLORS["text"]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, COLORS["border"]),
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 16))
    
    # Holdings
    story.append(Paragraph("HOLDINGS", styles['SectionTitle']))
    
    holdings_data = [["Asset", "Units", "Price", "Value", "Gain/Loss"]]
    
    for holding in request.holdings:
        holdings_data.append([
            holding.get('name', 'N/A'),
            f"{holding.get('units', 0):,.0f}",
            f"${holding.get('price', 0):,.2f}",
            f"${holding.get('value', 0):,.0f}",
            f"${holding.get('gain_loss', 0):,.0f}"
        ])
    
    holdings_table = Table(holdings_data, colWidths=[5*cm, 2.5*cm, 3*cm, 3.5*cm, 3*cm])
    holdings_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), COLORS["primary"]),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), COLORS["text"]),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
    ]))
    
    story.append(holdings_table)
    story.append(Spacer(1, 16))
    
    # Allocation
    story.append(Paragraph("ASSET ALLOCATION", styles['SectionTitle']))
    
    allocation = request.allocation
    alloc_data = [["Asset Class", "Value", "Allocation %", "Target %"]]
    
    for asset_class, data in allocation.items():
        alloc_data.append([
            asset_class,
            f"${data.get('value', 0):,.0f}",
            f"{data.get('current', 0):.1f}%",
            f"{data.get('target', 0):.1f}%"
        ])
    
    alloc_table = Table(alloc_data, colWidths=[5*cm, 4*cm, 4*cm, 4*cm])
    alloc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), COLORS["primary"]),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), COLORS["text"]),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
    ]))
    
    story.append(alloc_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


@router.post("/soa")
async def generate_soa(request: SOARequest):
    """Generate Statement of Advice PDF."""
    if not PDF_AVAILABLE:
        return {
            "success": False,
            "error": "PDF generation not available",
            "fallback": "Use HTML version"
        }
    
    try:
        pdf_bytes = generate_soa_pdf(request)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=SOA_{request.client_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error generating SOA: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio-report")
async def generate_portfolio_report(request: PortfolioReportRequest):
    """Generate Portfolio Report PDF."""
    if not PDF_AVAILABLE:
        return {
            "success": False,
            "error": "PDF generation not available",
            "fallback": "Use HTML version"
        }
    
    try:
        pdf_bytes = generate_portfolio_report_pdf(request)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Portfolio_Report_{request.client_id}_{request.report_date}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error generating portfolio report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/soa/template")
async def get_soa_template():
    """Get SOA template structure."""
    return {
        "template": {
            "client_id": "string",
            "client_name": "string",
            "adviser_name": "string",
            "adviser_afsl": "string",
            "advice_date": "YYYY-MM-DD",
            "advice_summary": "string",
            "recommendations": [
                {
                    "title": "string",
                    "description": "string",
                    "rationale": "string"
                }
            ],
            "risk_profile": "Conservative|Balanced|Growth|High Growth",
            "current_situation": {
                "risk_profile": "string",
                "investment_timeframe": "string",
                "portfolio_value": 0,
                "annual_income": 0
            },
            "goals": [
                {
                    "name": "string",
                    "description": "string"
                }
            ],
            "strategy": {},
            "fees": {
                "advice_fee": 0,
                "ongoing_fee": 0,
                "implementation_fee": 0
            },
            "warnings": ["string"]
        }
    }


@router.post("/compliance-checklist")
async def generate_compliance_checklist(client_id: str, review_type: str = "annual"):
    """Generate compliance checklist PDF."""
    if not PDF_AVAILABLE:
        return {"error": "PDF generation not available"}
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    styles = getSampleStyleSheet()
    story = []
    
    story.append(Paragraph(f"COMPLIANCE CHECKLIST - {review_type.upper()} REVIEW", styles['Title']))
    story.append(Paragraph(f"Client ID: {client_id}", styles['Normal']))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    checklist_items = [
        ("Client identification verified", "☐"),
        ("Risk profile reviewed and confirmed", "☐"),
        ("Investment objectives reviewed", "☐"),
        ("Current financial situation reviewed", "☐"),
        ("Portfolio performance reviewed", "☐"),
        ("Fees discussed and disclosed", "☐"),
        ("Product suitability confirmed", "☐"),
        ("Best interests duty met", "☐"),
        ("Conflicts of interest disclosed", "☐"),
        ("Record of advice documented", "☐"),
    ]
    
    checklist_data = [["Item", "Complete"]] + list(checklist_items)
    
    checklist_table = Table(checklist_data, colWidths=[14*cm, 3*cm])
    checklist_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    story.append(checklist_table)
    
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Compliance_Checklist_{client_id}.pdf"
        }
    )



# ==================== CONFIDENCE ENGINE REPORT ====================

class ConfidenceReportRequest(BaseModel):
    client_id: str
    client_name: str
    adviser_name: str
    report_date: str
    confidence_score: float
    risk_breakdown: Dict
    projections: Dict
    inputs: Dict
    assumptions: Dict
    scenarios: Optional[List[Dict]] = []
    ai_explanation: Optional[str] = ""


def generate_confidence_report_pdf(request: ConfidenceReportRequest) -> bytes:
    """Generate Retirement Confidence Report PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=COLORS["primary"],
        alignment=TA_CENTER
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=COLORS["primary"]
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        textColor=COLORS["text"]
    )
    
    story = []
    
    # Header
    story.append(Paragraph("Retirement Confidence Report", title_style))
    story.append(Paragraph(f"Prepared for: {request.client_name}", body_style))
    story.append(Paragraph(f"Prepared by: {request.adviser_name}", body_style))
    story.append(Paragraph(f"Date: {request.report_date}", body_style))
    story.append(Spacer(1, 20))
    
    # Confidence Score Section
    story.append(Paragraph("Retirement Confidence Score", section_style))
    
    score = request.confidence_score
    status = "Excellent" if score >= 90 else "Good" if score >= 75 else "Moderate" if score >= 50 else "Concerning" if score >= 25 else "Critical"
    score_color = COLORS["success"] if score >= 75 else COLORS["warning"] if score >= 50 else COLORS["danger"]
    
    score_text = f"<font color='{score_color}'><b>{score:.0f}%</b></font> - {status}"
    story.append(Paragraph(score_text, ParagraphStyle('Score', fontSize=18, alignment=TA_CENTER)))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f"Based on {request.assumptions.get('num_simulations', 1000):,} Monte Carlo simulations",
        ParagraphStyle('SimNote', fontSize=9, alignment=TA_CENTER, textColor=COLORS["muted"])
    ))
    story.append(Spacer(1, 20))
    
    # Client Inputs Summary
    story.append(Paragraph("Client Profile Summary", section_style))
    inputs = request.inputs
    profile_data = [
        ["Current Age", f"{inputs.get('current_age', 45)} years"],
        ["Retirement Age", f"{inputs.get('retirement_age', 65)} years"],
        ["Life Expectancy", f"{inputs.get('life_expectancy', 90)} years"],
        ["Household Type", "Couple" if inputs.get('is_couple') else "Single"],
        ["Entity Type", inputs.get('entity_type', 'personal').title()],
    ]
    profile_table = Table(profile_data, colWidths=[8*cm, 8*cm])
    profile_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
    ]))
    story.append(profile_table)
    story.append(Spacer(1, 15))
    
    # Financial Summary
    story.append(Paragraph("Financial Summary", section_style))
    
    def fmt_currency(val):
        return f"${val:,.0f}"
    
    financial_data = [
        ["Net Worth", fmt_currency(inputs.get('net_worth', 0))],
        ["Superannuation", fmt_currency(inputs.get('super_balance', 0))],
        ["Other Investments", fmt_currency(inputs.get('investment_balance', 0))],
        ["Annual Income", fmt_currency(inputs.get('annual_income', 0))],
        ["Annual Expenses", fmt_currency(inputs.get('annual_expenses', 0))],
    ]
    financial_table = Table(financial_data, colWidths=[8*cm, 8*cm])
    financial_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    story.append(financial_table)
    story.append(Spacer(1, 15))
    
    # Risk Breakdown
    story.append(Paragraph("Risk Analysis", section_style))
    risk = request.risk_breakdown
    risk_data = [
        ["Risk Factor", "Score"],
        ["Longevity Risk", f"{risk.get('longevity_risk', 0):.1f}%"],
        ["Market Risk", f"{risk.get('market_risk', 0):.1f}%"],
        ["Spending Risk", f"{risk.get('spending_risk', 0):.1f}%"],
        ["Inflation Risk", f"{risk.get('inflation_risk', 0):.1f}%"],
    ]
    risk_table = Table(risk_data, colWidths=[8*cm, 8*cm])
    risk_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
        ('BACKGROUND', (0, 0), (-1, 0), COLORS["primary"]),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 15))
    
    # Projections
    story.append(Paragraph("Projected Outcomes", section_style))
    proj = request.projections
    projection_data = [
        ["Scenario", "Projected Wealth at Retirement"],
        ["Best Case (90th Percentile)", fmt_currency(proj.get('best_case_wealth', 0))],
        ["Median Outcome", fmt_currency(proj.get('median_wealth', 0))],
        ["Worst Case (10th Percentile)", fmt_currency(proj.get('worst_case_wealth', 0))],
    ]
    proj_table = Table(projection_data, colWidths=[8*cm, 8*cm])
    proj_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
        ('BACKGROUND', (0, 0), (-1, 0), COLORS["primary"]),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    story.append(proj_table)
    story.append(Spacer(1, 15))
    
    # Assumptions
    story.append(Paragraph("Modelling Assumptions", section_style))
    assumptions = request.assumptions
    assumption_data = [
        ["Inflation Rate", f"{assumptions.get('inflation_rate', 2.5)}% p.a."],
        ["Expected Investment Return", f"{assumptions.get('expected_return', 7.0)}% p.a."],
        ["Monte Carlo Simulations", f"{assumptions.get('num_simulations', 1000):,}"],
    ]
    assumption_table = Table(assumption_data, colWidths=[8*cm, 8*cm])
    assumption_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, COLORS["border"]),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
    ]))
    story.append(assumption_table)
    
    # AI Explanation (if available)
    if request.ai_explanation:
        story.append(Spacer(1, 15))
        story.append(Paragraph("AI Analysis", section_style))
        story.append(Paragraph(request.ai_explanation, body_style))
    
    # Disclaimer
    story.append(Spacer(1, 30))
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=COLORS["muted"],
        spaceAfter=4
    )
    story.append(Paragraph(
        "<b>Important Information:</b> This report is based on the information provided and various assumptions about future economic conditions. "
        "Actual results may vary significantly from projections. Past performance is not a reliable indicator of future performance. "
        "This report does not constitute personal financial advice. Please consult your financial adviser before making any decisions.",
        disclaimer_style
    ))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


@router.post("/confidence-report")
async def generate_confidence_report(request: ConfidenceReportRequest):
    """Generate PDF report for Retirement Confidence Engine results."""
    if not PDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation not available")
    
    try:
        pdf_bytes = generate_confidence_report_pdf(request)
        filename = f"Confidence_Report_{request.client_id}_{request.report_date}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logger.error(f"Failed to generate confidence report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
