"""
Enhanced AI Copilot Service
Conversational AI assistant for financial advisors and clients.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
import json

# Try to import LLM integration
try:
    from emergentintegrations.llm.chat import chat, LlmConfig
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


# Conversation context storage (in production, use Redis or database)
CONVERSATION_STORE: Dict[str, List[Dict]] = {}


async def process_copilot_message(
    session_id: str,
    user_message: str,
    client_context: Dict = None
) -> Dict[str, Any]:
    """
    Process a user message and generate an AI response with financial context.
    """
    
    # Initialize or retrieve conversation history
    if session_id not in CONVERSATION_STORE:
        CONVERSATION_STORE[session_id] = []
    
    conversation_history = CONVERSATION_STORE[session_id]
    
    # Add user message to history
    conversation_history.append({
        "role": "user",
        "content": user_message,
        "timestamp": datetime.now().isoformat()
    })
    
    # Build context from client data
    context_summary = _build_client_context(client_context) if client_context else ""
    
    # System prompt for the copilot
    system_prompt = f"""You are Halcyon, an AI financial advisor copilot for Australian financial advisors and their clients.
You have expertise in:
- Australian tax law and regulations (including Stage 3 tax cuts)
- Superannuation rules and strategies (contribution caps, Division 293, etc.)
- Investment portfolio management and asset allocation
- Property investment and negative gearing
- Estate planning and trusts
- Insurance needs analysis

{context_summary}

Guidelines:
1. Always provide practical, actionable advice
2. Reference specific Australian tax rates and thresholds when relevant
3. Consider the client's complete financial picture
4. Highlight tax implications and optimization opportunities
5. Be conversational but professional
6. If asked about something outside your expertise, acknowledge limitations
7. When discussing numbers, use Australian dollar format ($XXX,XXX)

Current date: {datetime.now().strftime('%d %B %Y')}
Current financial year: 2025-26"""

    # Generate response
    if LLM_AVAILABLE and EMERGENT_LLM_KEY:
        try:
            response_text = await _generate_llm_response(
                system_prompt=system_prompt,
                conversation_history=conversation_history,
                user_message=user_message
            )
        except Exception as e:
            response_text = f"I apologize, but I'm having trouble processing your request right now. Error: {str(e)}"
    else:
        # Fallback to rule-based responses
        response_text = _generate_fallback_response(user_message, client_context)
    
    # Add assistant response to history
    assistant_message = {
        "role": "assistant",
        "content": response_text,
        "timestamp": datetime.now().isoformat()
    }
    conversation_history.append(assistant_message)
    
    # Keep only last 20 messages to manage context window
    if len(conversation_history) > 20:
        CONVERSATION_STORE[session_id] = conversation_history[-20:]
    
    # Extract any actionable insights
    insights = _extract_insights(response_text)
    
    return {
        "session_id": session_id,
        "response": response_text,
        "insights": insights,
        "conversation_length": len(conversation_history),
        "timestamp": datetime.now().isoformat()
    }


async def _generate_llm_response(
    system_prompt: str,
    conversation_history: List[Dict],
    user_message: str
) -> str:
    """Generate response using LLM."""
    
    # Build conversation for LLM
    messages = []
    for msg in conversation_history[-10:]:  # Last 10 messages for context
        if msg["role"] == "user":
            messages.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "assistant":
            messages.append({"role": "assistant", "content": msg["content"]})
    
    config = LlmConfig(
        api_key=EMERGENT_LLM_KEY,
        model="gpt-4o",
        temperature=0.7,
        max_tokens=1000
    )
    
    # Format as a conversation
    conversation_text = ""
    for msg in messages[:-1]:  # Exclude the last user message as we'll send it separately
        role = "User" if msg["role"] == "user" else "Assistant"
        conversation_text += f"{role}: {msg['content']}\n\n"
    
    if conversation_text:
        full_prompt = f"Previous conversation:\n{conversation_text}\n\nUser: {user_message}"
    else:
        full_prompt = user_message
    
    response = await chat(
        config=config,
        prompt=full_prompt,
        system_message=system_prompt
    )
    
    return response.content


def _build_client_context(client_data: Dict) -> str:
    """Build a context summary from client data."""
    
    if not client_data:
        return ""
    
    context_parts = ["CLIENT CONTEXT:"]
    
    if "name" in client_data:
        context_parts.append(f"- Client: {client_data['name']}")
    
    if "age" in client_data:
        context_parts.append(f"- Age: {client_data['age']}")
    
    if "income" in client_data:
        context_parts.append(f"- Annual Income: ${client_data['income']:,.0f}")
    
    if "net_worth" in client_data:
        context_parts.append(f"- Net Worth: ${client_data['net_worth']:,.0f}")
    
    if "super_balance" in client_data:
        context_parts.append(f"- Super Balance: ${client_data['super_balance']:,.0f}")
    
    if "risk_profile" in client_data:
        context_parts.append(f"- Risk Profile: {client_data['risk_profile']}")
    
    if "goals" in client_data:
        context_parts.append(f"- Goals: {', '.join(client_data['goals'])}")
    
    return "\n".join(context_parts)


def _generate_fallback_response(user_message: str, client_context: Dict) -> str:
    """Generate a rule-based response when LLM is unavailable."""
    
    message_lower = user_message.lower()
    
    # Tax-related queries
    if any(word in message_lower for word in ["tax", "deduction", "ato", "bracket"]):
        return """Based on the 2024-25 tax rates:
        
**Australian Tax Brackets:**
- $0 - $18,200: Tax-free
- $18,201 - $45,000: 16% on income over $18,200
- $45,001 - $135,000: 30% on income over $45,000
- $135,001 - $190,000: 37% on income over $135,000
- $190,001+: 45% on income over $190,000

Plus 2% Medicare Levy.

The Stage 3 tax cuts (effective July 2024) provide significant savings for middle-income earners. Would you like me to calculate potential savings for a specific income level?"""
    
    # Super-related queries
    if any(word in message_lower for word in ["super", "superannuation", "contribution", "retirement"]):
        return """**2024-25 Superannuation Caps:**
        
- **Concessional Cap**: $30,000 (includes employer contributions & salary sacrifice)
- **Non-Concessional Cap**: $120,000 (or $360,000 with bring-forward)
- **Super Guarantee**: 11.5% (rising to 12% from July 2025)
- **Division 293**: Additional 15% tax if income + super > $250,000

Key strategies to consider:
1. Maximize concessional contributions for tax savings
2. Consider catch-up contributions if unused caps available
3. Review spouse contribution strategies for tax offsets
4. Check binding death benefit nominations are current

Would you like me to analyze specific contribution strategies?"""
    
    # Investment queries
    if any(word in message_lower for word in ["invest", "portfolio", "asset", "allocation", "etf", "shares"]):
        return """For investment portfolio optimization, consider:

**Asset Allocation by Risk Profile:**
- Conservative: 30% Growth / 70% Defensive
- Moderate: 60% Growth / 40% Defensive
- Aggressive: 80% Growth / 20% Defensive

**Key considerations:**
1. Diversification across asset classes and geographies
2. Tax efficiency (holding period for CGT discount, franking credits)
3. Rebalancing frequency (annually or when allocations drift >5%)
4. Fee minimization (low-cost ETFs vs active funds)

Would you like a detailed analysis of your current portfolio allocation?"""
    
    # Property queries
    if any(word in message_lower for word in ["property", "negative gear", "rental", "mortgage"]):
        return """**Property Investment Considerations:**

1. **Negative Gearing**: Claim losses against taxable income
   - Interest on investment loan
   - Depreciation (building 2.5%, fixtures vary)
   - Property management fees, repairs, insurance

2. **CGT Implications**: 
   - 50% discount if held >12 months (individuals)
   - No discount for companies

3. **Refinancing Opportunities**:
   - Compare rates across lenders
   - Consider offset accounts vs redraw
   - Debt recycling strategies

Would you like me to analyze a specific property scenario?"""
    
    # Default response
    return """I'm your AI financial advisor copilot. I can help you with:

📊 **Tax Planning**: Brackets, deductions, strategies
💼 **Superannuation**: Contributions, strategies, projections
📈 **Investments**: Portfolio analysis, allocation, rebalancing
🏠 **Property**: Negative gearing, CGT, comparisons
👨‍👩‍👧‍👦 **Estate Planning**: Wills, trusts, beneficiaries

Just ask me any question about Australian personal finance, and I'll provide detailed analysis and recommendations.

What would you like to explore?"""


def _extract_insights(response: str) -> List[Dict]:
    """Extract actionable insights from the response."""
    
    insights = []
    
    # Look for monetary amounts
    import re
    amounts = re.findall(r'\$[\d,]+(?:\.\d{2})?', response)
    if amounts:
        insights.append({
            "type": "monetary_reference",
            "values": amounts[:5],  # Limit to 5
            "icon": "dollar"
        })
    
    # Look for percentages
    percentages = re.findall(r'\d+(?:\.\d+)?%', response)
    if percentages:
        insights.append({
            "type": "percentage_reference", 
            "values": percentages[:5],
            "icon": "percent"
        })
    
    # Look for action keywords
    action_keywords = ["consider", "should", "recommend", "strategy", "optimize"]
    if any(keyword in response.lower() for keyword in action_keywords):
        insights.append({
            "type": "actionable_advice",
            "message": "This response contains actionable recommendations",
            "icon": "lightbulb"
        })
    
    return insights


def get_conversation_history(session_id: str) -> List[Dict]:
    """Get conversation history for a session."""
    return CONVERSATION_STORE.get(session_id, [])


def clear_conversation(session_id: str) -> Dict[str, Any]:
    """Clear conversation history for a session."""
    if session_id in CONVERSATION_STORE:
        del CONVERSATION_STORE[session_id]
    
    return {
        "success": True,
        "message": "Conversation cleared",
        "session_id": session_id
    }


def get_suggested_questions(client_context: Dict = None) -> List[str]:
    """Get contextual suggested questions."""
    
    general_questions = [
        "What are the current tax brackets in Australia?",
        "How much can I contribute to super this year?",
        "What's the optimal asset allocation for my age?",
        "Should I salary sacrifice or make personal contributions?",
        "How does negative gearing work?",
        "What are the CGT implications of selling shares?",
        "How can I reduce my tax this financial year?",
        "What insurance coverage do I need?"
    ]
    
    if client_context:
        # Add personalized questions based on context
        if client_context.get("age", 0) > 55:
            general_questions.insert(0, "What retirement strategies should I consider?")
            general_questions.insert(1, "When should I transition to pension phase?")
        
        if client_context.get("income", 0) > 180000:
            general_questions.insert(0, "How can I minimize Division 293 tax?")
        
        if client_context.get("properties", 0) > 0:
            general_questions.insert(0, "Should I refinance my investment loan?")
    
    return general_questions[:8]  # Return top 8
