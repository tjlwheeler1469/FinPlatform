"""
Universal Voice Command Router
Smart intent detection + page-context-aware routing with what-if scenario support.
Uses GPT-5.2 for intent classification and multi-turn conversation memory.
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

PAGE_CONTEXTS = {
    "retirement": "retirement planning, superannuation, pension, CGT, franking credits",
    "shares": "share portfolio, stocks, ETFs, dividends, market data, trading",
    "adviceos": "compliance, scenarios, audit, financial advice, SOA, risk assessment",
    "strategic": "goals, estate planning, net worth projection, scenario comparison",
    "insurance": "insurance gaps, life cover, TPD, income protection, trauma",
    "trust": "trust distributions, family trust, beneficiaries, tax optimization",
    "dashboard": "general financial overview, net worth, quick actions",
    "client": "client management, CRM, meetings, tasks, documents",
    "practice": "practice management, invoicing, revenue, team performance",
    "default": "general Australian financial planning"
}

def build_system_prompt(page_context: str) -> str:
    """Build a context-aware system prompt based on the current page."""
    context_desc = PAGE_CONTEXTS.get(page_context, PAGE_CONTEXTS["default"])

    return f"""You are an expert Australian financial planning command assistant for Halcyon Wealth.
The user is currently on the {page_context} page, focused on: {context_desc}.

CAPABILITIES:
1. **Retirement Analysis**: When given client details (age, wealth, super, assets), return structured retirement analysis as JSON.
2. **What-If Scenarios**: When the user says "what if", modify the PREVIOUS analysis with the new parameter and return updated JSON.
3. **Stock Queries**: When asked about stocks, sectors, or portfolio performance, provide market insights.
4. **Compliance Checks**: When asked about compliance, KYC, or audit items, provide regulatory guidance.
5. **Goal Planning**: When asked about financial goals, estate planning, or scenarios, provide strategic advice.
6. **General Finance**: For anything else, provide concise Australian financial planning guidance.

RESPONSE FORMAT RULES:
- For retirement analysis or what-if scenarios, ALWAYS return valid JSON with this structure:
{{
  "type": "retirement_analysis",
  "client_summary": {{"age": N, "retirement_age": N, "years_to_retirement": N, "life_expectancy": 90}},
  "current_position": {{"total_wealth": N, "super_balance": N, "investment_assets": N, "property_value": N, "cash_savings": N, "other_assets": N}},
  "entities": [{{"name": "str", "type": "personal/trust/company/smsf/joint", "value": N}}],
  "retirement_analysis": {{"annual_income_needed": N, "total_retirement_fund_needed": N, "current_trajectory_at_retirement": N, "surplus_or_shortfall": N, "is_on_track": bool}},
  "tax_considerations": {{"estimated_cgt_liability": N, "cgt_discount_available": "str", "franking_credits_value": N, "franking_credits_explanation": "str", "super_tax_rate": "str", "marginal_tax_rate": "str"}},
  "age_pension": {{"eligible": bool, "eligibility_age": 67, "estimated_fortnightly": N, "assets_test_impact": "str", "income_test_impact": "str"}},
  "recommendations": ["str"],
  "assumptions": ["str"],
  "what_if_comparison": {{"original_shortfall": N, "new_shortfall": N, "improvement": N, "summary": "str"}},
  "disclaimer": "General advice only. Consult a licensed financial adviser."
}}

- For stock/market queries, return JSON:
{{
  "type": "stock_insight",
  "summary": "str",
  "data_points": [{{"label": "str", "value": "str"}}],
  "recommendation": "str",
  "disclaimer": "General advice only."
}}

- For compliance/audit queries, return JSON:
{{
  "type": "compliance_check",
  "summary": "str",
  "checklist": [{{"item": "str", "status": "str", "action_needed": "str"}}],
  "regulatory_refs": ["str"],
  "disclaimer": "General advice only."
}}

- For goal/scenario queries, return JSON:
{{
  "type": "scenario_analysis",
  "summary": "str",
  "scenarios": [{{"name": "str", "outcome": "str", "probability": "str"}}],
  "recommendations": ["str"],
  "disclaimer": "General advice only."
}}

- For general questions, return JSON:
{{
  "type": "general",
  "response": "Your concise answer here",
  "disclaimer": "General advice only."
}}

Australian tax rules:
- CGT: 50% discount for assets held >12 months. Trusts distribute to beneficiaries.
- Franking: 30% corporate tax credit on fully franked dividends. Refundable under $18,200.
- Super caps: $30K concessional, $120K non-concessional/year.
- Super access: preservation age 60+. Tax-free in pension phase for 60+.
- Age Pension: Assets test + Income test. Single homeowner ~$301,750 full / ~$656,500 part.
- Inflation: 3% p.a. Investment return: 7% balanced / 8.5% growth.

IMPORTANT:
- For what-if scenarios, ALWAYS include the what_if_comparison field showing original vs new.
- Keep what_if context from previous messages in this session.
- ONLY return valid JSON. No markdown, no code blocks, no extra text."""


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
    """Process a voice/text command with page-context awareness and what-if support."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    session_id = request.session_id or "default"
    page_context = request.page_context or "default"

    # Build prompt with previous analysis context for what-if
    user_text = request.text
    prev = _session_store.get(session_id)
    is_what_if = any(kw in user_text.lower() for kw in ["what if", "what about", "instead", "change", "modify", "adjust", "increase", "decrease", "sell", "add extra"])
    if is_what_if and prev:
        user_text = f"PREVIOUS ANALYSIS (use as baseline):\n{json.dumps(prev, indent=2)}\n\nNOW THE USER ASKS: {user_text}\n\nUpdate the analysis with this change. Include what_if_comparison showing original vs new shortfall and improvement."

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        system_prompt = build_system_prompt(page_context)

        # Use a consistent session_id so multi-turn what-if works
        chat = LlmChat(
            api_key=api_key,
            session_id=f"cmd_{session_id}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=user_text)
        response_text = await chat.send_message(user_message)

        # Try to parse as structured JSON
        try:
            cleaned = clean_json_response(response_text)
            result = json.loads(cleaned)
            # Store retirement analysis for what-if follow-ups
            if result.get("type") == "retirement_analysis":
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
    """Transcribe audio via Whisper then process as voice command."""
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
        is_what_if = any(kw in user_text.lower() for kw in ["what if", "what about", "instead", "change", "modify", "adjust", "increase", "decrease", "sell", "add extra"])
        if is_what_if and prev:
            prompt_text = f"PREVIOUS ANALYSIS (use as baseline):\n{json.dumps(prev, indent=2)}\n\nNOW THE USER ASKS: {user_text}\n\nUpdate the analysis with this change. Include what_if_comparison showing original vs new shortfall and improvement."

        system_prompt = build_system_prompt(page_context)

        chat = LlmChat(
            api_key=api_key,
            session_id=f"cmd_{session_id}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=prompt_text)
        response_text = await chat.send_message(user_message)

        try:
            cleaned = clean_json_response(response_text)
            result = json.loads(cleaned)
            if result.get("type") == "retirement_analysis":
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
