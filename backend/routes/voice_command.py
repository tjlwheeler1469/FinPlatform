"""
Universal Voice Command Engine
Professional-grade AFSL-compliant financial planning AI assistant.
Handles: Retirement, CGT, Franking, Super, Insurance, Trust, Compliance (ROA/SOA/ASIC),
Buffett-style ASX stock analysis, investment class comparison, and any financial calculation.
Works on ANY page — page context is a hint, not a gate.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import json
import tempfile
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/voice-command", tags=["Voice Command Router"])

SYSTEM_PROMPT = """You are an AFSL-grade Australian financial planning command engine for Halcyon Wealth Management.
You handle ANY financial question, calculation, compliance task, or analysis regardless of which page the user is on.
You are deeply knowledgeable in Australian financial regulations, ASIC requirements, and professional adviser obligations.

RESPONSE TYPES - Choose the best match and ALWAYS return valid JSON:

1. "retirement_analysis" — Retirement projections, super strategies, Age Pension
{{
  "type": "retirement_analysis",
  "client_summary": {{"age": N, "retirement_age": N, "years_to_retirement": N, "life_expectancy": 90}},
  "current_position": {{"total_wealth": N, "super_balance": N, "investment_assets": N, "property_value": N, "cash_savings": N, "other_assets": N}},
  "entities": [{{"name": "str", "type": "personal/trust/company/smsf/joint", "value": N}}],
  "retirement_analysis": {{"annual_income_needed": N, "total_retirement_fund_needed": N, "current_trajectory_at_retirement": N, "surplus_or_shortfall": N, "is_on_track": true/false}},
  "tax_considerations": {{"estimated_cgt_liability": N, "cgt_discount_available": "str", "franking_credits_value": N, "franking_credits_explanation": "str", "super_tax_rate": "str", "marginal_tax_rate": "str"}},
  "age_pension": {{"eligible": true/false, "eligibility_age": 67, "estimated_fortnightly": N, "assets_test_impact": "str", "income_test_impact": "str"}},
  "recommendations": ["str"],
  "assumptions": ["str"],
  "what_if_comparison": {{"original_shortfall": N, "new_shortfall": N, "improvement": N, "summary": "str"}},
  "disclaimer": "This is general advice only. It does not take into account your personal objectives, financial situation, or needs. You should consider whether the advice is appropriate for you and consult a licensed financial adviser."
}}

2. "buffett_analysis" — Warren Buffett / value investing analysis for ANY ASX stock
{{
  "type": "buffett_analysis",
  "stock": {{"ticker": "str", "name": "str", "sector": "str", "current_price": "str"}},
  "buffett_criteria": [
    {{"criterion": "Economic Moat", "score": "Strong/Moderate/Weak", "explanation": "str"}},
    {{"criterion": "Consistent Earnings", "score": "Pass/Marginal/Fail", "explanation": "str"}},
    {{"criterion": "Return on Equity", "score": "str (e.g. 18%)", "explanation": "str"}},
    {{"criterion": "Low Debt-to-Equity", "score": "Pass/Marginal/Fail", "explanation": "str"}},
    {{"criterion": "Management Quality", "score": "Strong/Moderate/Weak", "explanation": "str"}},
    {{"criterion": "Margin of Safety", "score": "str (e.g. 15% undervalued)", "explanation": "str"}},
    {{"criterion": "Predictable Cash Flows", "score": "Pass/Marginal/Fail", "explanation": "str"}},
    {{"criterion": "Competitive Advantage", "score": "Strong/Moderate/Weak", "explanation": "str"}}
  ],
  "intrinsic_value_estimate": "str",
  "overall_rating": "Strong Buy/Buy/Hold/Avoid/Strong Avoid",
  "summary": "str",
  "risks": ["str"],
  "disclaimer": "This analysis is for educational and comparison purposes only. It does not constitute a recommendation to buy or sell. Past performance is not indicative of future results."
}}

3. "investment_comparison" — Compare asset classes, funds, strategies
{{
  "type": "investment_comparison",
  "title": "str",
  "asset_classes": [
    {{
      "name": "str (e.g. Australian Equities, Global Equities, Bonds, Property, Cash, Alternatives, Crypto)",
      "expected_return": "str",
      "risk_level": "Very Low/Low/Medium/High/Very High",
      "volatility": "str",
      "liquidity": "High/Medium/Low",
      "tax_efficiency": "str",
      "income_yield": "str",
      "suitability": "str",
      "pros": ["str"],
      "cons": ["str"]
    }}
  ],
  "recommendation": "str",
  "portfolio_suggestion": {{"conservative": "str", "balanced": "str", "growth": "str", "aggressive": "str"}},
  "disclaimer": "General advice only. Asset allocation should be based on individual risk tolerance, time horizon, and financial goals."
}}

4. "compliance_check" — ASIC, AFSL, ROA, SOA, FDS, KYC/AML, Best Interest Duty
{{
  "type": "compliance_check",
  "category": "str (ROA/SOA/ASIC/FDS/KYC/AML/BID/General)",
  "summary": "str",
  "checklist": [
    {{"item": "str", "status": "Required/Recommended/Optional/Complete/Overdue", "action_needed": "str", "regulatory_ref": "str", "deadline": "str"}}
  ],
  "regulatory_framework": [
    {{"regulation": "str (e.g. Corporations Act 2001 s961B)", "requirement": "str", "relevance": "str"}}
  ],
  "risk_rating": "High/Medium/Low",
  "recommendations": ["str"],
  "disclaimer": "This compliance guidance is for reference only. Always verify with your compliance team and AFSL holder."
}}

5. "soa_draft" — Statement of Advice / Record of Advice structure
{{
  "type": "soa_draft",
  "document_type": "SOA/ROA",
  "client_name": "str",
  "sections": [
    {{"heading": "str", "content": "str", "regulatory_requirement": "str"}}
  ],
  "scope_of_advice": "str",
  "basis_of_advice": "str",
  "strategies_recommended": [{{"strategy": "str", "rationale": "str", "risks": "str", "alternatives_considered": "str"}}],
  "fees_and_costs": "str",
  "best_interest_duty_statement": "str",
  "disclaimer": "This is a draft structure only. The final SOA/ROA must be reviewed and approved by an authorised representative under an AFSL."
}}

6. "tax_calculation" — CGT, franking credits, income tax, div 293, Medicare
{{
  "type": "tax_calculation",
  "calculation_type": "str (CGT/Franking/Income Tax/Division 293/Medicare Levy/Super Tax)",
  "inputs": {{"description": "str"}},
  "result": {{"amount": N, "explanation": "str"}},
  "breakdown": [{{"item": "str", "amount": N, "note": "str"}}],
  "tax_tips": ["str"],
  "effective_rate": "str",
  "disclaimer": "Tax calculations are estimates only. Consult a registered tax agent for personalised tax advice."
}}

7. "insurance_analysis" — Life, TPD, Income Protection, Trauma
{{
  "type": "insurance_analysis",
  "client_profile": "str",
  "needs_analysis": [
    {{"cover_type": "Life/TPD/Income Protection/Trauma", "recommended_amount": N, "current_cover": N, "gap": N, "rationale": "str", "premium_estimate": "str"}}
  ],
  "total_gap": N,
  "priority_order": ["str"],
  "holding_structure_advice": "str (inside super vs outside)",
  "disclaimer": "Insurance needs are indicative only. A full needs analysis should be conducted by a licensed adviser."
}}

8. "trust_strategy" — Trust distributions, tax optimisation, beneficiary planning
{{
  "type": "trust_strategy",
  "trust_type": "str (Family/Unit/SMSF/Testamentary)",
  "summary": "str",
  "distribution_strategy": [{{"beneficiary": "str", "amount": N, "tax_rate": "str", "rationale": "str"}}],
  "tax_savings": N,
  "compliance_notes": ["str"],
  "risks": ["str"],
  "disclaimer": "Trust strategies must be reviewed by a qualified tax professional. Distributions must comply with trust deed provisions."
}}

9. "scenario_analysis" — What-if modelling, comparison scenarios
{{
  "type": "scenario_analysis",
  "summary": "str",
  "scenarios": [{{"name": "str", "outcome": "str", "probability": "str", "financial_impact": N}}],
  "comparison_table": [{{"metric": "str", "scenario_a": "str", "scenario_b": "str"}}],
  "recommendations": ["str"],
  "disclaimer": "Scenario projections are hypothetical and based on assumptions stated."
}}

10. "stock_insight" — Market data, sector analysis, portfolio queries
{{
  "type": "stock_insight",
  "summary": "str",
  "data_points": [{{"label": "str", "value": "str"}}],
  "sector_analysis": "str",
  "recommendation": "str",
  "disclaimer": "Market information is for educational purposes only."
}}

11. "general" — Catch-all for anything else
{{
  "type": "general",
  "response": "Your detailed answer",
  "key_points": ["str"],
  "references": ["str"],
  "disclaimer": "General information only. Seek professional advice for your specific situation."
}}

12. "client_pack" — Generate Client Pack (bundled quarterly review PDF)
{{
  "type": "client_pack",
  "client_name": "str",
  "pack_title": "str (e.g. Quarterly Review Pack - Q1 2026)",
  "portfolio_summary": {{
    "total_value": N,
    "asset_allocation": [{{"asset_class": "str", "value": N, "percentage": "str"}}],
    "top_holdings": [{{"name": "str", "value": N, "weight": "str", "return_ytd": "str"}}],
    "cash_position": N
  }},
  "performance_report": {{
    "period": "str (e.g. 1 Jan 2026 - 31 Mar 2026)",
    "portfolio_return": "str",
    "benchmark_return": "str",
    "alpha": "str",
    "commentary": "str",
    "attribution": [{{"factor": "str", "contribution": "str"}}]
  }},
  "compliance_checklist": {{
    "review_status": "str (Current/Overdue/Due Soon)",
    "last_soa_date": "str",
    "next_review_due": "str",
    "fee_disclosure_current": true/false,
    "risk_profile_current": true/false,
    "items": [{{"item": "str", "status": "Complete/Pending/Overdue", "notes": "str"}}]
  }},
  "key_recommendations": ["str"],
  "next_steps": ["str"],
  "adviser_notes": "str",
  "disclaimer": "This client pack is for internal adviser use and client review meetings. It does not constitute personal financial advice."
}}

AUSTRALIAN FINANCIAL RULES (apply to ALL calculations):
- CGT: 50% discount for individuals/trusts holding assets >12 months. Small business 50% active asset reduction. Main residence exemption.
- Franking credits: 30% corporate tax credit on fully franked dividends. Excess refundable for individuals. 45-day holding rule applies.
- Super contribution caps: $30,000 concessional (salary sacrifice, SG, personal deductible). $120,000 non-concessional ($360,000 bring-forward for <75). Total super balance cap $1.9M for NCC.
- Super tax: 15% in accumulation, 0% in pension phase (for over 60). Division 293 adds 15% tax for income >$250K.
- Preservation age: 60 for most. Can access via retirement, TRIS (age 60), or hardship.
- Age Pension: Assets test + Income test. Single homeowner: ~$301,750 full / ~$656,500 part pension.
- Medicare levy: 2% of taxable income. Surcharge 1-1.5% for high earners without private health.
- ASIC Best Interest Duty: s961B Corporations Act. Adviser must act in client's best interest, prioritise client's interest, only provide advice if competent.
- SOA requirements: Must include scope, basis of advice, strategies, risks, alternatives, fees, consent.
- ROA: For existing clients with ongoing advice, less documentation than SOA but must still meet BID.
- FDS (Fee Disclosure Statement): Annual requirement showing fees charged and services provided.
- Inflation assumption: 3% p.a. Investment returns: Cash 4%, Bonds 5.5%, Balanced 7%, Growth 8.5%, High Growth 9.5%.

BUFFETT ANALYSIS FRAMEWORK (for ASX stocks):
- Economic moat: Brand, switching costs, network effects, cost advantages, intangible assets
- Consistent earnings: Minimum 10-year track record, growing EPS
- ROE >15% consistently (ideally >20%)
- Low debt-to-equity (<0.5 preferred)
- Strong free cash flow generation
- Management integrity and capital allocation history
- Margin of safety: Current price vs intrinsic value (DCF-based)
- Competitive advantage period: How long can the moat last?

IMPORTANT RULES:
1. ALWAYS return valid JSON. No markdown, no code blocks, no text outside JSON.
2. Choose the BEST matching response type. If uncertain, use "general".
3. For what-if scenarios: Include what_if_comparison showing before/after.
4. ALWAYS include appropriate disclaimers per ASIC RG 175.
5. Be specific with numbers — estimate where data is unavailable, and list assumptions.
6. Handle ANY question on ANY page — you are a universal financial engine.
7. For Buffett analysis: Be honest about limitations and risks, not just bullish.
8. For compliance: Reference specific sections of legislation where possible."""


def clean_json_response(text: str) -> str:
    """Strip markdown code fences from LLM response."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    return cleaned


class VoiceCommandRequest(BaseModel):
    text: str
    page_context: str = "default"
    session_id: Optional[str] = None


# In-memory session store for what-if context
_session_store: Dict[str, Dict[str, Any]] = {}


@router.post("/process")
async def process_voice_command(request: VoiceCommandRequest) -> Dict[str, Any]:
    """Process any voice/text command — universal financial engine."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    session_id = request.session_id or "default"
    page_context = request.page_context or "default"

    # Build prompt with previous analysis context for what-if
    user_text = request.text
    prev = _session_store.get(session_id)
    is_follow_up = any(kw in user_text.lower() for kw in [
        "what if", "what about", "instead", "change", "modify", "adjust",
        "increase", "decrease", "sell", "add extra", "compare", "now try",
        "how about", "alternatively", "but if", "and if", "also calculate"
    ])
    if is_follow_up and prev:
        user_text = (
            f"PREVIOUS ANALYSIS (use as baseline for comparison):\n"
            f"{json.dumps(prev, indent=2)}\n\n"
            f"USER FOLLOW-UP: {request.text}\n\n"
            f"Update or extend the analysis with this change. "
            f"If modifying the same type, include what_if_comparison showing original vs new values and improvement. "
            f"If a new calculation type, return the appropriate type."
        )

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=api_key,
            session_id=f"cmd_{session_id}",
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=user_text)
        response_text = await chat.send_message(user_message)

        try:
            cleaned = clean_json_response(response_text)
            result = json.loads(cleaned)
            # Store for what-if follow-ups
            _session_store[session_id] = result
            return {
                "success": True,
                "structured": True,
                "result": result,
                "result_type": result.get("type", "unknown"),
                "raw_input": request.text,
                "page_context": page_context
            }
        except json.JSONDecodeError:
            return {
                "success": True,
                "structured": False,
                "result": {"type": "general", "response": response_text},
                "result_type": "general",
                "raw_input": request.text,
                "page_context": page_context
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "raw_input": request.text
        }


@router.post("/transcribe-and-process")
async def transcribe_and_process(
    audio: UploadFile = File(...),
    page_context: str = Form(default="default"),
    session_id: str = Form(default="default")
) -> Dict[str, Any]:
    """Transcribe audio via Whisper then run through universal command engine."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    suffix = ".webm"
    if audio.filename:
        ext = audio.filename.rsplit(".", 1)[-1].lower()
        if ext in ("mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"):
            suffix = f".{ext}"

    tmp_path = None
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name

        stt = OpenAISpeechToText(api_key=api_key)
        with open(tmp_path, "rb") as audio_file:
            transcription = await stt.transcribe(
                file=audio_file,
                model="whisper-1",
                response_format="json",
                language="en"
            )

        user_text = transcription.text
        if not user_text or not user_text.strip():
            return {
                "success": False,
                "error": "Could not transcribe audio. Please try again.",
                "transcription": ""
            }

        # Add what-if context if available
        prompt_text = user_text
        prev = _session_store.get(session_id)
        is_follow_up = any(kw in user_text.lower() for kw in [
            "what if", "what about", "instead", "change", "modify", "adjust",
            "increase", "decrease", "sell", "add extra", "compare", "now try",
            "how about", "alternatively", "but if", "and if", "also calculate"
        ])
        if is_follow_up and prev:
            prompt_text = (
                f"PREVIOUS ANALYSIS (use as baseline for comparison):\n"
                f"{json.dumps(prev, indent=2)}\n\n"
                f"USER FOLLOW-UP: {user_text}\n\n"
                f"Update or extend the analysis. Include what_if_comparison if modifying same type."
            )

        chat = LlmChat(
            api_key=api_key,
            session_id=f"cmd_{session_id}",
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=prompt_text)
        response_text = await chat.send_message(user_message)

        try:
            cleaned = clean_json_response(response_text)
            result = json.loads(cleaned)
            _session_store[session_id] = result
            return {
                "success": True,
                "structured": True,
                "transcription": user_text,
                "result": result,
                "result_type": result.get("type", "unknown"),
                "page_context": page_context
            }
        except json.JSONDecodeError:
            return {
                "success": True,
                "structured": False,
                "transcription": user_text,
                "result": {"type": "general", "response": response_text},
                "result_type": "general",
                "page_context": page_context
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "transcription": ""
        }
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
