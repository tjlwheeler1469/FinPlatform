"""
Voice-Activated Retirement Analysis Engine
Uses GPT-5.2 to parse spoken client details into structured retirement analysis
with CGT, franking credits, super rules, and Age Pension calculations.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import json
import tempfile
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/voice-retirement", tags=["Voice Retirement Analysis"])

RETIREMENT_SYSTEM_PROMPT = """You are an expert Australian financial planning calculator. 
When a user provides client details (age, wealth, funds, assets, entities, retirement goals), 
you MUST respond with a JSON object containing structured analysis.

ALWAYS respond with valid JSON in this exact format:
{
  "client_summary": {
    "age": <number>,
    "retirement_age": <number>,
    "years_to_retirement": <number>,
    "life_expectancy": 90
  },
  "current_position": {
    "total_wealth": <number>,
    "super_balance": <number>,
    "investment_assets": <number>,
    "property_value": <number>,
    "cash_savings": <number>,
    "other_assets": <number>
  },
  "entities": [
    {"name": "<entity name>", "type": "<personal/trust/company/smsf/joint>", "value": <number>}
  ],
  "retirement_analysis": {
    "annual_income_needed": <number>,
    "total_retirement_fund_needed": <number>,
    "current_trajectory_at_retirement": <number>,
    "surplus_or_shortfall": <number>,
    "is_on_track": <boolean>
  },
  "tax_considerations": {
    "estimated_cgt_liability": <number>,
    "cgt_discount_available": "<50% discount for assets held >12 months>",
    "franking_credits_value": <number>,
    "franking_credits_explanation": "<explanation>",
    "super_tax_rate": "<15% accumulation / 0% pension phase>",
    "marginal_tax_rate": "<estimated marginal rate>"
  },
  "age_pension": {
    "eligible": <boolean>,
    "eligibility_age": 67,
    "estimated_fortnightly": <number>,
    "assets_test_impact": "<explanation>",
    "income_test_impact": "<explanation>"
  },
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "assumptions": [
    "<assumption 1>",
    "<assumption 2>"
  ],
  "disclaimer": "This is general advice only and does not consider your personal circumstances. Consult a licensed financial adviser."
}

Australian tax rules to apply:
- CGT: 50% discount for individuals holding assets >12 months. Trusts can distribute to beneficiaries.
- Franking credits: Fully franked dividends carry 30% corporate tax credit. Refundable for individuals <$18,200 income.
- Super contribution caps: $30,000 concessional, $120,000 non-concessional per year.
- Super preservation: accessible at preservation age (60 for most). Tax-free in pension phase for over 60.
- Age Pension: Assets test + Income test. Single homeowner threshold ~$301,750 (full), ~$656,500 (part).
- Medicare levy: 2% of taxable income.
- Inflation assumption: 3% p.a.
- Investment return assumption: 7% balanced / 8.5% growth.

If the user provides incomplete data, make reasonable assumptions and list them.
ONLY return valid JSON. No markdown, no code blocks, no explanation text outside the JSON."""


class RetirementAnalysisRequest(BaseModel):
    text: str
    session_id: Optional[str] = None


@router.post("/analyze")
async def analyze_retirement_voice(request: RetirementAnalysisRequest) -> Dict[str, Any]:
    """Parse spoken/typed client details into structured retirement analysis"""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=api_key,
            session_id=f"retirement_{request.session_id or 'default'}",
            system_message=RETIREMENT_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=f"Analyze this client's retirement position and provide structured JSON: {request.text}")
        response_text = await chat.send_message(user_message)

        # Try to parse as JSON
        try:
            # Clean potential markdown code blocks
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()

            analysis = json.loads(cleaned)
            return {
                "success": True,
                "structured": True,
                "analysis": analysis,
                "raw_input": request.text
            }
        except json.JSONDecodeError:
            # If GPT didn't return valid JSON, return as text
            return {
                "success": True,
                "structured": False,
                "response": response_text,
                "raw_input": request.text
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "raw_input": request.text
        }


@router.post("/transcribe-and-analyze")
async def transcribe_and_analyze(
    audio: UploadFile = File(...),
    session_id: str = Form(default="default")
) -> Dict[str, Any]:
    """Transcribe audio via Whisper then run retirement analysis"""
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

        # Transcribe with Whisper
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

        # Run retirement analysis on transcribed text
        chat = LlmChat(
            api_key=api_key,
            session_id=f"retirement_{session_id}",
            system_message=RETIREMENT_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=f"Analyze this client's retirement position and provide structured JSON: {user_text}")
        response_text = await chat.send_message(user_message)

        # Parse JSON response
        try:
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()

            analysis = json.loads(cleaned)
            return {
                "success": True,
                "structured": True,
                "transcription": user_text,
                "analysis": analysis
            }
        except json.JSONDecodeError:
            return {
                "success": True,
                "structured": False,
                "transcription": user_text,
                "response": response_text
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
