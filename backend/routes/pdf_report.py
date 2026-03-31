"""
PDF Report Generator for Voice Analysis Results.
Generates professional, AFSL-compliant PDF reports from any voice command analysis.
Supports: SOA, ROA, Retirement Analysis, Buffett Analysis, Tax Calculations,
Insurance Analysis, Trust Strategy, Compliance Checks, Investment Comparison.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

router = APIRouter(prefix="/pdf-report", tags=["PDF Report Generator"])

# Brand colours
NAVY = colors.HexColor("#1a2744")
GOLD = colors.HexColor("#D4A84C")
LIGHT_GRAY = colors.HexColor("#F5F5F5")
MEDIUM_GRAY = colors.HexColor("#888888")
GREEN = colors.HexColor("#16a34a")
RED = colors.HexColor("#dc2626")
BLUE = colors.HexColor("#2563eb")
WHITE = colors.white


def build_styles() -> Dict[str, ParagraphStyle]:
    ss = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("Title", parent=ss["Title"], fontSize=22, textColor=NAVY, spaceAfter=4, alignment=TA_LEFT),
        "subtitle": ParagraphStyle("Subtitle", parent=ss["Normal"], fontSize=11, textColor=MEDIUM_GRAY, spaceAfter=12),
        "h2": ParagraphStyle("H2", parent=ss["Heading2"], fontSize=14, textColor=NAVY, spaceBefore=16, spaceAfter=6, borderPadding=4),
        "h3": ParagraphStyle("H3", parent=ss["Heading3"], fontSize=11, textColor=NAVY, spaceBefore=10, spaceAfter=4),
        "body": ParagraphStyle("Body", parent=ss["Normal"], fontSize=10, leading=14, textColor=colors.HexColor("#333333")),
        "small": ParagraphStyle("Small", parent=ss["Normal"], fontSize=8, textColor=MEDIUM_GRAY, leading=10),
        "disclaimer": ParagraphStyle("Disclaimer", parent=ss["Normal"], fontSize=7, textColor=MEDIUM_GRAY, leading=9, backColor=LIGHT_GRAY),
        "metric_label": ParagraphStyle("MetricLabel", parent=ss["Normal"], fontSize=8, textColor=MEDIUM_GRAY),
        "metric_value": ParagraphStyle("MetricValue", parent=ss["Normal"], fontSize=14, textColor=NAVY, fontName="Helvetica-Bold"),
        "green": ParagraphStyle("Green", parent=ss["Normal"], fontSize=10, textColor=GREEN, fontName="Helvetica-Bold"),
        "red": ParagraphStyle("Red", parent=ss["Normal"], fontSize=10, textColor=RED, fontName="Helvetica-Bold"),
        "gold": ParagraphStyle("Gold", parent=ss["Normal"], fontSize=10, textColor=GOLD, fontName="Helvetica-Bold"),
        "rec": ParagraphStyle("Rec", parent=ss["Normal"], fontSize=9, textColor=colors.HexColor("#333333"), bulletIndent=8, leftIndent=16, leading=12),
    }


def fmt_cur(val: Any) -> str:
    if val is None:
        return "$0"
    try:
        return f"${int(val):,}"
    except (ValueError, TypeError):
        return str(val)


def add_header(elements: list, styles: dict, title: str, subtitle: str) -> None:
    now = datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")
    elements.append(Paragraph("HALCYON WEALTH MANAGEMENT", styles["small"]))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(title, styles["title"]))
    elements.append(Paragraph(subtitle, styles["subtitle"]))
    elements.append(Paragraph(f"Generated: {now}", styles["small"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=12))


def add_disclaimer(elements: list, styles: dict, text: str) -> None:
    elements.append(Spacer(1, 8 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=MEDIUM_GRAY, spaceAfter=4))
    elements.append(Paragraph(f"DISCLAIMER: {text}", styles["disclaimer"]))


def metrics_table(items: list) -> Table:
    """Build a 2-column or 4-column metrics row."""
    data = []
    row = []
    for label, value in items:
        row.extend([Paragraph(f"<font size='8' color='#888888'>{label}</font><br/><font size='13'><b>{value}</b></font>", getSampleStyleSheet()["Normal"])])
        if len(row) == 4:
            data.append(row)
            row = []
    if row:
        while len(row) < 4:
            row.append("")
        data.append(row)

    t = Table(data, colWidths=[130, 130, 130, 130])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
        ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def checklist_table(items: list) -> Table:
    """Build a styled checklist table."""
    data = [["Item", "Status", "Action"]]
    for item in items:
        data.append([
            Paragraph(str(item.get("item", "")), getSampleStyleSheet()["Normal"]),
            str(item.get("status", "")),
            Paragraph(str(item.get("action_needed", "")), getSampleStyleSheet()["Normal"]),
        ])

    t = Table(data, colWidths=[220, 80, 220])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
        ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


# ── PDF builders per analysis type ──

def build_retirement_pdf(data: dict) -> io.BytesIO:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
    s = build_styles()
    el: list = []

    cs = data.get("client_summary", {})
    cp = data.get("current_position", {})
    ra = data.get("retirement_analysis", {})
    tc = data.get("tax_considerations", {})
    ap = data.get("age_pension", {})
    ents = data.get("entities", [])
    recs = data.get("recommendations", [])
    assumptions = data.get("assumptions", [])

    add_header(el, s, "Retirement Analysis Report", f"Client Age: {cs.get('age', 'N/A')} | Retirement Age: {cs.get('retirement_age', 'N/A')} | Years to Go: {cs.get('years_to_retirement', 'N/A')}")

    # Summary metrics
    el.append(metrics_table([
        ("Total Wealth", fmt_cur(cp.get("total_wealth"))),
        ("Super Balance", fmt_cur(cp.get("super_balance"))),
        ("Fund Required", fmt_cur(ra.get("total_retirement_fund_needed"))),
        ("Surplus/Shortfall", fmt_cur(ra.get("surplus_or_shortfall"))),
    ]))
    el.append(Spacer(1, 4 * mm))

    # Status
    on_track = ra.get("is_on_track", False)
    status_text = "ON TRACK" if on_track else "ACTION REQUIRED"
    status_style = s["green"] if on_track else s["red"]
    el.append(Paragraph(f"Retirement Status: {status_text}", status_style))
    el.append(Spacer(1, 4 * mm))

    # Current position
    el.append(Paragraph("Current Position", s["h2"]))
    pos_items = [("Super", fmt_cur(cp.get("super_balance"))), ("Investments", fmt_cur(cp.get("investment_assets"))),
                 ("Property", fmt_cur(cp.get("property_value"))), ("Cash", fmt_cur(cp.get("cash_savings")))]
    el.append(metrics_table(pos_items))

    # Entities
    if ents:
        el.append(Paragraph("Entity Structure", s["h2"]))
        ent_data = [["Entity", "Type", "Value"]]
        for ent in ents:
            ent_data.append([ent.get("name", ""), ent.get("type", ""), fmt_cur(ent.get("value"))])
        t = Table(ent_data, colWidths=[200, 120, 200])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
            ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4), ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]))
        el.append(t)

    # Tax
    el.append(Paragraph("Tax Considerations", s["h2"]))
    tax_items = []
    if tc.get("estimated_cgt_liability"):
        tax_items.append(("Est. CGT", fmt_cur(tc["estimated_cgt_liability"])))
    if tc.get("franking_credits_value"):
        tax_items.append(("Franking Credits", fmt_cur(tc["franking_credits_value"])))
    if tc.get("super_tax_rate"):
        tax_items.append(("Super Tax", str(tc["super_tax_rate"])))
    if tc.get("marginal_tax_rate"):
        tax_items.append(("Marginal Rate", str(tc["marginal_tax_rate"])))
    if tax_items:
        el.append(metrics_table(tax_items))
    if tc.get("cgt_discount_available"):
        el.append(Paragraph(f"CGT Discount: {tc['cgt_discount_available']}", s["body"]))

    # Age Pension
    el.append(Paragraph("Age Pension", s["h2"]))
    el.append(Paragraph(f"Eligible: {'Yes' if ap.get('eligible') else 'No'} | Est. Fortnightly: {fmt_cur(ap.get('estimated_fortnightly'))}", s["body"]))
    if ap.get("assets_test_impact"):
        el.append(Paragraph(f"Assets Test: {ap['assets_test_impact']}", s["small"]))

    # Recommendations
    if recs:
        el.append(Paragraph("Recommendations", s["h2"]))
        for rec in recs:
            el.append(Paragraph(f"  {rec}", s["rec"]))

    # Assumptions
    if assumptions:
        el.append(Paragraph("Assumptions", s["h3"]))
        for a in assumptions:
            el.append(Paragraph(f"  {a}", s["small"]))

    add_disclaimer(el, s, data.get("disclaimer", "General advice only."))
    doc.build(el)
    buf.seek(0)
    return buf


def build_buffett_pdf(data: dict) -> io.BytesIO:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
    s = build_styles()
    el: list = []

    stock = data.get("stock", {})
    add_header(el, s, f"Buffett Analysis: {stock.get('ticker', 'N/A')}", f"{stock.get('name', '')} | {stock.get('sector', '')} | Price: {stock.get('current_price', 'N/A')}")

    el.append(Paragraph(f"Overall Rating: {data.get('overall_rating', 'N/A')}", s["gold"]))
    if data.get("intrinsic_value_estimate"):
        el.append(Paragraph(f"Intrinsic Value Estimate: {data['intrinsic_value_estimate']}", s["body"]))
    el.append(Spacer(1, 4 * mm))

    # Criteria table
    criteria = data.get("buffett_criteria", [])
    if criteria:
        el.append(Paragraph("Buffett Criteria Assessment", s["h2"]))
        crit_data = [["Criterion", "Score", "Explanation"]]
        for c in criteria:
            crit_data.append([c.get("criterion", ""), c.get("score", ""), Paragraph(c.get("explanation", ""), s["small"])])
        t = Table(crit_data, colWidths=[130, 80, 310])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
            ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4), ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]))
        el.append(t)

    # Risks
    risks = data.get("risks", [])
    if risks:
        el.append(Paragraph("Key Risks", s["h2"]))
        for r in risks:
            el.append(Paragraph(f"  {r}", s["rec"]))

    if data.get("summary"):
        el.append(Paragraph("Summary", s["h2"]))
        el.append(Paragraph(data["summary"], s["body"]))

    add_disclaimer(el, s, data.get("disclaimer", "General advice only."))
    doc.build(el)
    buf.seek(0)
    return buf


def build_soa_pdf(data: dict) -> io.BytesIO:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
    s = build_styles()
    el: list = []

    doc_type = data.get("document_type", "SOA")
    client = data.get("client_name", "Client")
    add_header(el, s, f"{doc_type} — {client}", f"Draft {doc_type} prepared by Halcyon Wealth Command Engine")

    if data.get("scope_of_advice"):
        el.append(Paragraph("Scope of Advice", s["h2"]))
        el.append(Paragraph(data["scope_of_advice"], s["body"]))

    if data.get("basis_of_advice"):
        el.append(Paragraph("Basis of Advice", s["h2"]))
        el.append(Paragraph(data["basis_of_advice"], s["body"]))

    # Strategies
    strategies = data.get("strategies_recommended", [])
    if strategies:
        el.append(Paragraph("Strategies Recommended", s["h2"]))
        for strat in strategies:
            el.append(Paragraph(strat.get("strategy", ""), s["h3"]))
            el.append(Paragraph(f"Rationale: {strat.get('rationale', '')}", s["body"]))
            if strat.get("risks"):
                el.append(Paragraph(f"Risks: {strat['risks']}", s["small"]))
            if strat.get("alternatives_considered"):
                el.append(Paragraph(f"Alternatives Considered: {strat['alternatives_considered']}", s["small"]))
            el.append(Spacer(1, 2 * mm))

    # Fees
    if data.get("fees_and_costs"):
        el.append(Paragraph("Fees and Costs", s["h2"]))
        el.append(Paragraph(data["fees_and_costs"], s["body"]))

    # BID
    if data.get("best_interest_duty_statement"):
        el.append(Paragraph("Best Interest Duty Statement (s961B)", s["h2"]))
        el.append(Paragraph(data["best_interest_duty_statement"], s["body"]))

    # Sections
    sections = data.get("sections", [])
    for sec in sections:
        el.append(Paragraph(sec.get("heading", ""), s["h2"]))
        el.append(Paragraph(sec.get("content", ""), s["body"]))
        if sec.get("regulatory_requirement"):
            el.append(Paragraph(f"Regulatory: {sec['regulatory_requirement']}", s["small"]))

    add_disclaimer(el, s, data.get("disclaimer", "This is a draft. Must be reviewed by an authorised representative under an AFSL."))
    doc.build(el)
    buf.seek(0)
    return buf


def build_generic_pdf(data: dict, title: str = "Analysis Report") -> io.BytesIO:
    """Generic PDF builder for any other analysis type."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
    s = build_styles()
    el: list = []

    rtype = data.get("type", "general")
    add_header(el, s, title, f"Analysis Type: {rtype}")

    if data.get("summary"):
        el.append(Paragraph("Summary", s["h2"]))
        el.append(Paragraph(data["summary"], s["body"]))

    # Tax calculation
    if rtype == "tax_calculation":
        if data.get("calculation_type"):
            el.append(Paragraph(f"Calculation: {data['calculation_type']}", s["h2"]))
        result = data.get("result", {})
        if result.get("amount") is not None:
            el.append(Paragraph(f"Result: {fmt_cur(result['amount'])}", s["metric_value"]))
        if result.get("explanation"):
            el.append(Paragraph(result["explanation"], s["body"]))
        breakdown = data.get("breakdown", [])
        if breakdown:
            el.append(Paragraph("Breakdown", s["h3"]))
            bd_data = [["Item", "Amount", "Note"]]
            for b in breakdown:
                bd_data.append([str(b.get("item", "")), fmt_cur(b.get("amount")), str(b.get("note", ""))])
            t = Table(bd_data, colWidths=[200, 100, 220])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            el.append(t)
        tips = data.get("tax_tips", [])
        if tips:
            el.append(Paragraph("Tax Tips", s["h3"]))
            for tip in tips:
                el.append(Paragraph(f"  {tip}", s["rec"]))

    # Compliance check
    if rtype == "compliance_check":
        checklist = data.get("checklist", [])
        if checklist:
            el.append(Paragraph("Compliance Checklist", s["h2"]))
            el.append(checklist_table(checklist))
        reg = data.get("regulatory_framework", [])
        if reg:
            el.append(Paragraph("Regulatory Framework", s["h2"]))
            for r in reg:
                el.append(Paragraph(f"<b>{r.get('regulation', '')}</b>: {r.get('requirement', '')}", s["body"]))

    # Insurance
    if rtype == "insurance_analysis":
        needs = data.get("needs_analysis", [])
        if needs:
            el.append(Paragraph("Insurance Needs Analysis", s["h2"]))
            ins_data = [["Cover Type", "Recommended", "Current", "Gap"]]
            for n in needs:
                ins_data.append([n.get("cover_type", ""), fmt_cur(n.get("recommended_amount")), fmt_cur(n.get("current_cover")), fmt_cur(n.get("gap"))])
            t = Table(ins_data, colWidths=[130, 120, 120, 120])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            el.append(t)

    # Investment comparison
    if rtype == "investment_comparison":
        acs = data.get("asset_classes", [])
        if acs:
            el.append(Paragraph("Asset Class Comparison", s["h2"]))
            ac_data = [["Asset Class", "Return", "Risk", "Yield", "Liquidity"]]
            for ac in acs:
                ac_data.append([ac.get("name", ""), str(ac.get("expected_return", "")), ac.get("risk_level", ""), str(ac.get("income_yield", "")), ac.get("liquidity", "")])
            t = Table(ac_data, colWidths=[140, 80, 80, 80, 80])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            el.append(t)

    # Trust strategy
    if rtype == "trust_strategy":
        dist = data.get("distribution_strategy", [])
        if dist:
            el.append(Paragraph("Distribution Strategy", s["h2"]))
            dist_data = [["Beneficiary", "Amount", "Tax Rate", "Rationale"]]
            for d in dist:
                dist_data.append([d.get("beneficiary", ""), fmt_cur(d.get("amount")), str(d.get("tax_rate", "")), d.get("rationale", "")])
            t = Table(dist_data, colWidths=[120, 100, 80, 220])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            el.append(t)
        if data.get("tax_savings"):
            el.append(Paragraph(f"Estimated Tax Savings: {fmt_cur(data['tax_savings'])}", s["green"]))

    # General fields
    recs = data.get("recommendations", [])
    if recs:
        el.append(Paragraph("Recommendations", s["h2"]))
        for rec in recs:
            el.append(Paragraph(f"  {rec}", s["rec"]))

    if data.get("response"):
        el.append(Paragraph("Response", s["h2"]))
        el.append(Paragraph(data["response"], s["body"]))

    key_points = data.get("key_points", [])
    if key_points:
        el.append(Paragraph("Key Points", s["h2"]))
        for kp in key_points:
            el.append(Paragraph(f"  {kp}", s["rec"]))

    add_disclaimer(el, s, data.get("disclaimer", "General advice only."))
    doc.build(el)
    buf.seek(0)
    return buf


def build_client_pack_pdf(data: dict) -> io.BytesIO:
    """Build a multi-section Client Review Pack PDF."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
    s = build_styles()
    el: list = []

    client_name = data.get("client_name", "Client")
    pack_title = data.get("pack_title", "Client Review Pack")
    add_header(el, s, pack_title, f"Prepared for: {client_name}")

    # ── SECTION 1: Portfolio Summary ──
    ps = data.get("portfolio_summary", {})
    if ps:
        el.append(Paragraph("Portfolio Summary", s["h2"]))
        summary_items = [("Total Value", fmt_cur(ps.get("total_value"))), ("Cash Position", fmt_cur(ps.get("cash_position")))]
        el.append(metrics_table(summary_items))
        el.append(Spacer(1, 3 * mm))

        # Asset allocation table
        alloc = ps.get("asset_allocation", [])
        if alloc:
            el.append(Paragraph("Asset Allocation", s["h3"]))
            alloc_data = [["Asset Class", "Value", "Weight"]]
            for a in alloc:
                alloc_data.append([str(a.get("asset_class", "")), fmt_cur(a.get("value")), str(a.get("percentage", ""))])
            t = Table(alloc_data, colWidths=[200, 160, 160])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4), ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]))
            el.append(t)
            el.append(Spacer(1, 3 * mm))

        # Top holdings
        holdings = ps.get("top_holdings", [])
        if holdings:
            el.append(Paragraph("Top Holdings", s["h3"]))
            hold_data = [["Holding", "Value", "Weight", "YTD Return"]]
            for h in holdings:
                hold_data.append([str(h.get("name", "")), fmt_cur(h.get("value")), str(h.get("weight", "")), str(h.get("return_ytd", ""))])
            t = Table(hold_data, colWidths=[180, 120, 100, 120])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4), ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]))
            el.append(t)

    # ── SECTION 2: Performance Report ──
    perf = data.get("performance_report", {})
    if perf:
        el.append(Spacer(1, 4 * mm))
        el.append(Paragraph("Performance Report", s["h2"]))
        perf_items = [
            ("Period", str(perf.get("period", ""))),
            ("Portfolio Return", str(perf.get("portfolio_return", ""))),
            ("Benchmark Return", str(perf.get("benchmark_return", ""))),
            ("Alpha", str(perf.get("alpha", ""))),
        ]
        el.append(metrics_table(perf_items))
        if perf.get("commentary"):
            el.append(Spacer(1, 2 * mm))
            el.append(Paragraph(perf["commentary"], s["body"]))
        attr = perf.get("attribution", [])
        if attr:
            el.append(Paragraph("Performance Attribution", s["h3"]))
            attr_data = [["Factor", "Contribution"]]
            for a in attr:
                attr_data.append([str(a.get("factor", "")), str(a.get("contribution", ""))])
            t = Table(attr_data, colWidths=[300, 220])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, MEDIUM_GRAY), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            el.append(t)

    # ── SECTION 3: Compliance Checklist ──
    comp = data.get("compliance_checklist", {})
    if comp:
        el.append(Spacer(1, 4 * mm))
        el.append(Paragraph("Compliance Checklist", s["h2"]))
        comp_items = [
            ("Review Status", str(comp.get("review_status", "N/A"))),
            ("Last SOA", str(comp.get("last_soa_date", "N/A"))),
            ("Next Review", str(comp.get("next_review_due", "N/A"))),
        ]
        el.append(metrics_table(comp_items))

        # Status flags
        flags = []
        if comp.get("fee_disclosure_current") is not None:
            flags.append(f"Fee Disclosure: {'Current' if comp['fee_disclosure_current'] else 'OVERDUE'}")
        if comp.get("risk_profile_current") is not None:
            flags.append(f"Risk Profile: {'Current' if comp['risk_profile_current'] else 'NEEDS UPDATE'}")
        if flags:
            el.append(Paragraph(" | ".join(flags), s["body"]))

        items = comp.get("items", [])
        if items:
            el.append(Spacer(1, 2 * mm))
            el.append(checklist_table([
                {"item": it.get("item", ""), "status": it.get("status", ""), "action_needed": it.get("notes", "")}
                for it in items
            ]))

    # ── SECTION 4: Recommendations & Next Steps ──
    recs = data.get("key_recommendations", [])
    if recs:
        el.append(Spacer(1, 4 * mm))
        el.append(Paragraph("Key Recommendations", s["h2"]))
        for rec in recs:
            el.append(Paragraph(f"  {rec}", s["rec"]))

    steps = data.get("next_steps", [])
    if steps:
        el.append(Paragraph("Next Steps", s["h2"]))
        for step in steps:
            el.append(Paragraph(f"  {step}", s["rec"]))

    if data.get("adviser_notes"):
        el.append(Paragraph("Adviser Notes", s["h2"]))
        el.append(Paragraph(data["adviser_notes"], s["body"]))

    add_disclaimer(el, s, data.get("disclaimer", "This client pack is for internal adviser use and client review meetings."))
    doc.build(el)
    buf.seek(0)
    return buf



TYPE_TITLES = {
    "retirement_analysis": "Retirement Analysis Report",
    "buffett_analysis": "Buffett Investment Analysis",
    "soa_draft": "Statement of Advice",
    "compliance_check": "Compliance Check Report",
    "tax_calculation": "Tax Calculation Report",
    "insurance_analysis": "Insurance Needs Analysis",
    "trust_strategy": "Trust Strategy Report",
    "investment_comparison": "Investment Comparison Report",
    "scenario_analysis": "Scenario Analysis Report",
    "stock_insight": "Market Insight Report",
    "client_pack": "Client Review Pack",
    "general": "Financial Analysis Report",
}


class PDFRequest(BaseModel):
    analysis_data: Dict[str, Any]
    report_title: Optional[str] = None


@router.post("/generate")
async def generate_pdf(request: PDFRequest) -> StreamingResponse:
    """Generate a PDF report from any voice analysis result."""
    data = request.analysis_data
    rtype = data.get("type", "general")

    title = request.report_title or TYPE_TITLES.get(rtype, "Financial Analysis Report")

    try:
        if rtype == "retirement_analysis":
            buf = build_retirement_pdf(data)
        elif rtype == "buffett_analysis":
            buf = build_buffett_pdf(data)
        elif rtype == "soa_draft":
            buf = build_soa_pdf(data)
        elif rtype == "client_pack":
            buf = build_client_pack_pdf(data)
        else:
            buf = build_generic_pdf(data, title)

        filename = f"Halcyon_{rtype}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M')}.pdf"

        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
