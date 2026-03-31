"""
Voice-Activated Financial Planning Assistant
Uses OpenAI Whisper for STT and GPT for financial advice responses
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from emergentintegrations.llm.openai import OpenAISpeechToText
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import tempfile
import uuid
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/voice-assistant", tags=["Voice Assistant"])

SYSTEM_PROMPT = """You are a knowledgeable Australian financial planning assistant for Halcyon Wealth. 
You help clients with questions about:
- Superannuation and retirement planning
- Investment strategies (stocks, bonds, property)
- Tax planning and optimization
- Insurance and risk management
- Estate planning
- Government benefits (Age Pension, Medicare)
- Budgeting and cash flow management

Guidelines:
- Keep responses concise (2-3 paragraphs max)
- Reference Australian-specific regulations (ATO, ASIC, SIS Act)
- Always include a disclaimer that this is general advice only
- Use Australian dollar figures and terminology
- Be warm and professional in tone
- If unsure, suggest consulting a licensed financial adviser"""


@router.post("/transcribe")
async def transcribe_and_respond(
    audio: UploadFile = File(...),
    session_id: str = Form(default=None)
) -> Dict[str, Any]:
    """Transcribe audio and generate financial planning response"""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    if not session_id:
        session_id = str(uuid.uuid4())

    # Save uploaded audio to temp file
    suffix = ".webm"
    if audio.filename:
        ext = audio.filename.rsplit(".", 1)[-1].lower()
        if ext in ("mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"):
            suffix = f".{ext}"

    try:
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
                "session_id": session_id,
                "transcription": "",
                "response": "I couldn't hear anything. Could you please try again?",
                "error": False
            }

        # Generate financial planning response with GPT
        chat = LlmChat(
            api_key=api_key,
            session_id=f"voice_{session_id}",
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=user_text)
        response_text = await chat.send_message(user_message)

        return {
            "session_id": session_id,
            "transcription": user_text,
            "response": response_text,
            "error": False
        }

    except Exception as e:
        return {
            "session_id": session_id,
            "transcription": "",
            "response": f"Sorry, I encountered an issue processing your request. Please try again.",
            "error": True,
            "detail": str(e)
        }
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@router.post("/chat")
async def text_chat(
    message: str = Form(...),
    session_id: str = Form(default=None)
) -> Dict[str, Any]:
    """Text-based financial planning chat"""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")

    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"text_{session_id}",
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=message)
        response_text = await chat.send_message(user_message)

        return {
            "session_id": session_id,
            "response": response_text,
            "error": False
        }
    except Exception as e:
        return {
            "session_id": session_id,
            "response": "Sorry, I encountered an issue. Please try again.",
            "error": True,
            "detail": str(e)
        }
