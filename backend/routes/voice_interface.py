"""
Voice Interface for Wealth Command
Uses OpenAI Whisper for speech-to-text transcription.
Enables voice commands and queries for the financial advisory platform.
"""

import os
import io
import uuid
import tempfile
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice Interface"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
voice_transcriptions_col = db["voice_transcriptions"]
voice_commands_col = db["voice_commands"]

# Emergent LLM Key for Whisper
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Supported audio formats
SUPPORTED_FORMATS = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"]
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

# ==================== MODELS ====================

class TranscriptionResponse(BaseModel):
    id: str
    text: str
    duration: Optional[float] = None
    language: Optional[str] = None
    confidence: Optional[float] = None
    timestamp: str

class VoiceCommand(BaseModel):
    transcription_id: str
    text: str
    intent: str
    entities: Dict[str, Any] = {}
    action: Optional[str] = None
    response: Optional[str] = None

# ==================== VOICE COMMAND PARSING ====================

def parse_voice_command(text: str) -> Dict[str, Any]:
    """
    Parse transcribed text to identify intent and entities.
    Simple rule-based parser for financial commands.
    """
    text_lower = text.lower().strip()
    
    # Intent patterns
    intents = {
        "show_portfolio": ["show my portfolio", "display portfolio", "view portfolio", "portfolio overview", "what's my portfolio"],
        "check_balance": ["check balance", "what's my balance", "how much do i have", "account balance", "total value"],
        "generate_scenario": ["generate scenario", "create scenario", "new scenario", "run scenario", "scenario analysis"],
        "compliance_check": ["compliance check", "check compliance", "run compliance", "compliance status"],
        "market_update": ["market update", "how are markets", "market news", "market summary", "what's happening in markets"],
        "client_info": ["client information", "show client", "client details", "client overview"],
        "schedule_meeting": ["schedule meeting", "book meeting", "set up meeting", "arrange meeting"],
        "add_note": ["add note", "create note", "save note", "make a note"],
        "help": ["help", "what can you do", "commands", "options"]
    }
    
    # Match intent
    detected_intent = "unknown"
    for intent, patterns in intents.items():
        for pattern in patterns:
            if pattern in text_lower:
                detected_intent = intent
                break
        if detected_intent != "unknown":
            break
    
    # Extract entities
    entities = {}
    
    # Client name extraction
    client_indicators = ["client", "for", "about"]
    for indicator in client_indicators:
        if indicator in text_lower:
            parts = text_lower.split(indicator)
            if len(parts) > 1:
                potential_name = parts[1].strip().split()[0] if parts[1].strip() else ""
                if potential_name and potential_name not in ["the", "a", "an", "my"]:
                    entities["client_name"] = potential_name.title()
    
    # Time period extraction
    time_indicators = {
        "today": "1d",
        "this week": "1w",
        "this month": "1m",
        "this year": "1y",
        "last month": "1m",
        "last year": "1y"
    }
    for indicator, period in time_indicators.items():
        if indicator in text_lower:
            entities["time_period"] = period
    
    # Amount extraction
    import re
    amounts = re.findall(r'\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|k|thousand|million)?', text_lower)
    if amounts:
        entities["amount"] = amounts[0].replace(",", "")
    
    # Generate suggested action
    action_map = {
        "show_portfolio": "/dashboard",
        "check_balance": "/net-worth",
        "generate_scenario": "/scenario-modelling",
        "compliance_check": "/adviceos",
        "market_update": "/macro",
        "client_info": "/client/overview",
        "schedule_meeting": "/calendar",
        "add_note": "/notes",
        "help": "/help"
    }
    
    return {
        "intent": detected_intent,
        "entities": entities,
        "action": action_map.get(detected_intent),
        "original_text": text
    }

def generate_voice_response(command: Dict[str, Any]) -> str:
    """Generate a spoken response for the command."""
    intent = command.get("intent", "unknown")
    entities = command.get("entities", {})
    
    responses = {
        "show_portfolio": "Opening your portfolio dashboard now.",
        "check_balance": "Let me show you your current balance and net worth.",
        "generate_scenario": "Starting the scenario generator. Please select your parameters.",
        "compliance_check": "Opening the AdviceOS compliance dashboard.",
        "market_update": "Loading the latest market updates and news.",
        "client_info": f"Showing information for client {entities.get('client_name', 'selected')}.",
        "schedule_meeting": "Opening the meeting scheduler.",
        "add_note": "Ready to add a new note. Please continue with your note content.",
        "help": "I can help you with portfolio viewing, balance checking, scenario generation, compliance checks, market updates, and more. Try saying 'show my portfolio' or 'run compliance check'.",
        "unknown": "I didn't quite catch that. Could you please repeat or try saying 'help' for available commands?"
    }
    
    return responses.get(intent, responses["unknown"])

# ==================== TRANSCRIPTION FUNCTIONS ====================

async def transcribe_audio(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Transcribe audio using OpenAI Whisper via emergentintegrations."""
    if not EMERGENT_LLM_KEY:
        logger.warning("EMERGENT_LLM_KEY not configured - using mock transcription")
        return {
            "text": "Mock transcription - please configure EMERGENT_LLM_KEY for real voice support",
            "mock": True
        }
    
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        
        # Initialize STT
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        # Create temp file for transcription
        with tempfile.NamedTemporaryFile(suffix=f".{filename.split('.')[-1]}", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        
        try:
            # Transcribe
            with open(tmp_path, "rb") as audio_file:
                response = await stt.transcribe(
                    file=audio_file,
                    model="whisper-1",
                    response_format="verbose_json",
                    language="en"
                )
            
            result = {
                "text": response.text,
                "duration": getattr(response, 'duration', None),
                "language": getattr(response, 'language', 'en'),
                "mock": False
            }
            
            # Add segments if available
            if hasattr(response, 'segments'):
                result["segments"] = [
                    {"start": s.start, "end": s.end, "text": s.text}
                    for s in response.segments
                ]
            
            return result
            
        finally:
            # Cleanup temp file
            os.unlink(tmp_path)
            
    except ImportError:
        logger.error("emergentintegrations not available")
        return {
            "text": "Voice integration unavailable - library not installed",
            "mock": True,
            "error": "emergentintegrations not installed"
        }
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return {
            "text": "",
            "mock": True,
            "error": str(e)
        }

# ==================== API ENDPOINTS ====================

@router.post("/transcribe")
async def transcribe_voice(
    file: UploadFile = File(...),
    parse_command: bool = Form(default=True)
):
    """
    Transcribe an audio file to text using OpenAI Whisper.
    Optionally parse the transcription for voice commands.
    """
    # Validate file format
    file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if file_ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format. Supported: {', '.join(SUPPORTED_FORMATS)}"
        )
    
    # Read file
    file_bytes = await file.read()
    
    # Check file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f} MB"
        )
    
    # Transcribe
    transcription_result = await transcribe_audio(file_bytes, file.filename)
    
    # Create transcription record
    transcription_id = f"trans_{uuid.uuid4().hex[:12]}"
    transcription = {
        "id": transcription_id,
        "text": transcription_result.get("text", ""),
        "duration": transcription_result.get("duration"),
        "language": transcription_result.get("language"),
        "filename": file.filename,
        "file_size": len(file_bytes),
        "mock": transcription_result.get("mock", False),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Store in MongoDB
    await voice_transcriptions_col.insert_one(transcription)
    
    response = {
        "transcription": {
            "id": transcription_id,
            "text": transcription_result.get("text", ""),
            "duration": transcription_result.get("duration"),
            "language": transcription_result.get("language"),
            "mock": transcription_result.get("mock", False)
        },
        "timestamp": transcription["timestamp"]
    }
    
    # Parse command if requested
    if parse_command and transcription_result.get("text"):
        command_result = parse_voice_command(transcription_result["text"])
        voice_response = generate_voice_response(command_result)
        
        # Store command
        command = {
            "id": f"cmd_{uuid.uuid4().hex[:12]}",
            "transcription_id": transcription_id,
            "text": transcription_result["text"],
            "intent": command_result["intent"],
            "entities": command_result["entities"],
            "action": command_result["action"],
            "response": voice_response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await voice_commands_col.insert_one(command)
        
        response["command"] = {
            "intent": command_result["intent"],
            "entities": command_result["entities"],
            "action": command_result["action"],
            "response": voice_response
        }
    
    return response

@router.post("/command")
async def process_voice_command(text: str):
    """
    Process a text command as if it were transcribed from voice.
    Useful for testing voice command parsing.
    """
    command_result = parse_voice_command(text)
    voice_response = generate_voice_response(command_result)
    
    # Store command
    command = {
        "id": f"cmd_{uuid.uuid4().hex[:12]}",
        "transcription_id": None,
        "text": text,
        "intent": command_result["intent"],
        "entities": command_result["entities"],
        "action": command_result["action"],
        "response": voice_response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await voice_commands_col.insert_one(command)
    
    return {
        "text": text,
        "intent": command_result["intent"],
        "entities": command_result["entities"],
        "action": command_result["action"],
        "response": voice_response
    }

@router.get("/commands")
async def get_voice_commands(limit: int = 20):
    """Get recent voice commands."""
    commands = await voice_commands_col.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "commands": commands,
        "count": len(commands)
    }

@router.get("/transcriptions")
async def get_transcriptions(limit: int = 20):
    """Get recent transcriptions."""
    transcriptions = await voice_transcriptions_col.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "transcriptions": transcriptions,
        "count": len(transcriptions)
    }

@router.get("/supported-commands")
async def get_supported_commands():
    """Get list of supported voice commands."""
    return {
        "commands": [
            {
                "intent": "show_portfolio",
                "examples": ["Show my portfolio", "Display portfolio", "Portfolio overview"],
                "action": "Navigate to portfolio dashboard"
            },
            {
                "intent": "check_balance",
                "examples": ["Check my balance", "What's my balance", "Account balance"],
                "action": "Show current net worth and balances"
            },
            {
                "intent": "generate_scenario",
                "examples": ["Generate scenario", "Create scenario", "Run scenario analysis"],
                "action": "Open scenario modelling tool"
            },
            {
                "intent": "compliance_check",
                "examples": ["Run compliance check", "Check compliance", "Compliance status"],
                "action": "Open AdviceOS compliance dashboard"
            },
            {
                "intent": "market_update",
                "examples": ["Market update", "How are markets", "Market news"],
                "action": "Show market overview and news"
            },
            {
                "intent": "client_info",
                "examples": ["Client information for [name]", "Show client details"],
                "action": "Display client overview"
            },
            {
                "intent": "schedule_meeting",
                "examples": ["Schedule a meeting", "Book meeting"],
                "action": "Open meeting scheduler"
            },
            {
                "intent": "add_note",
                "examples": ["Add a note", "Create note", "Make a note"],
                "action": "Create new note"
            },
            {
                "intent": "help",
                "examples": ["Help", "What can you do", "Show commands"],
                "action": "Display available commands"
            }
        ],
        "supported_formats": SUPPORTED_FORMATS,
        "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024)
    }

@router.get("/status")
async def get_voice_status():
    """Check voice interface status."""
    return {
        "whisper_configured": bool(EMERGENT_LLM_KEY),
        "status": "ready" if EMERGENT_LLM_KEY else "not_configured",
        "supported_formats": SUPPORTED_FORMATS,
        "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024),
        "message": "Voice interface ready" if EMERGENT_LLM_KEY else "Configure EMERGENT_LLM_KEY for voice support"
    }
