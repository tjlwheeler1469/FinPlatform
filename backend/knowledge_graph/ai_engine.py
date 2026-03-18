"""
Financial Knowledge Graph - AI Reasoning Engine
================================================

Uses LLM to generate insights and recommendations from graph data.
Powers Next Best Actions, cross-client analysis, and pattern detection.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

# Emergent LLM Key for AI reasoning
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-8E5D97f66BfA6F3B7F")


class AIReasoningEngine:
    """
    AI-powered reasoning engine that analyzes graph data
    and generates actionable insights.
    """
    
    def __init__(self):
        self.llm_client = None
        self._init_llm()
    
    def _init_llm(self):
        """Initialize LLM client"""
        try:
            from emergentintegrations.llm.chat import chat, Message
            self.chat = chat
            self.Message = Message
            logger.info("LLM client initialized successfully")
        except ImportError as e:
            logger.warning(f"Could not import emergentintegrations: {e}")
            self.chat = None
            self.Message = None
    
    async def generate_next_best_actions(self, 
                                         client_data: Dict[str, Any],
                                         portfolio_data: Dict[str, Any],
                                         market_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Generate Next Best Actions for a client using AI reasoning.
        
        Input: Client data, portfolio holdings, market context
        Output: Prioritized list of recommended actions
        """
        if not self.chat:
            return self._fallback_next_best_actions(client_data, portfolio_data)
        
        try:
            # Build context for LLM
            context = f"""
You are a financial advisor AI assistant. Analyze the following client data and generate Next Best Actions.

CLIENT PROFILE:
- Name: {client_data.get('name', 'Unknown')}
- Age: {client_data.get('age', 'Unknown')}
- Risk Profile: {client_data.get('risk_profile', 'moderate')}
- Retirement Age: {client_data.get('retirement_age', 65)}
- Net Worth: ${client_data.get('net_worth', 0):,.0f}

PORTFOLIO SUMMARY:
- Total Value: ${portfolio_data.get('total_value', 0):,.0f}
- Asset Allocation: {json.dumps(portfolio_data.get('allocation', {}), indent=2)}
- Top Holdings: {json.dumps(portfolio_data.get('top_holdings', [])[:5], indent=2)}

MARKET CONTEXT:
{json.dumps(market_context or {'note': 'No specific market context'}, indent=2)}

Generate 3-5 prioritized Next Best Actions. For each action, provide:
1. Action title (brief)
2. Action type (buy/sell/rebalance/review/transfer)
3. Description (1-2 sentences)
4. Priority (1=highest, 5=lowest)
5. Expected impact (brief)

Return as JSON array.
"""
            
            messages = [
                self.Message(role="system", content="You are an expert financial advisor AI. Return responses as valid JSON."),
                self.Message(role="user", content=context)
            ]
            
            response = await self.chat(
                api_key=EMERGENT_LLM_KEY,
                model="gpt-4o",
                messages=messages
            )
            
            # Parse response
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Try to extract JSON from response
            try:
                # Handle markdown code blocks
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                
                actions = json.loads(response_text)
                return actions
            except json.JSONDecodeError:
                logger.warning("Could not parse LLM response as JSON, using fallback")
                return self._fallback_next_best_actions(client_data, portfolio_data)
                
        except Exception as e:
            logger.error(f"Error generating next best actions: {e}")
            return self._fallback_next_best_actions(client_data, portfolio_data)
    
    def _fallback_next_best_actions(self, client_data: Dict, portfolio_data: Dict) -> List[Dict]:
        """Fallback actions when LLM is not available"""
        actions = []
        
        # Check for rebalancing need
        allocation = portfolio_data.get("allocation", {})
        if allocation.get("cash", 0) > 0.15:
            actions.append({
                "title": "Invest Excess Cash",
                "type": "buy",
                "description": f"Cash allocation is {allocation.get('cash', 0)*100:.0f}%, consider investing in diversified assets.",
                "priority": 2,
                "impact": "Potentially increase returns by 3-5% annually"
            })
        
        # Check for sector concentration
        if allocation.get("financials", 0) > 0.30:
            actions.append({
                "title": "Diversify from Financials",
                "type": "rebalance",
                "description": "Portfolio is overweight in Financials sector. Consider diversifying.",
                "priority": 2,
                "impact": "Reduce sector-specific risk"
            })
        
        # Check retirement readiness
        age = client_data.get("age", 45)
        retirement_age = client_data.get("retirement_age", 65)
        if retirement_age - age < 15:
            actions.append({
                "title": "Review Retirement Readiness",
                "type": "review",
                "description": f"Client is {retirement_age - age} years from retirement. Schedule comprehensive review.",
                "priority": 1,
                "impact": "Ensure on-track for retirement goals"
            })
        
        # Default action
        if not actions:
            actions.append({
                "title": "Schedule Portfolio Review",
                "type": "review",
                "description": "No immediate actions required. Consider quarterly portfolio review.",
                "priority": 4,
                "impact": "Maintain optimal portfolio alignment"
            })
        
        return actions
    
    async def analyze_cross_client_patterns(self, 
                                            clients_data: List[Dict[str, Any]],
                                            portfolios_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze patterns across multiple clients for advisor insights.
        
        Identifies:
        - Common risk exposures
        - Correlated portfolios
        - Systemic risks
        - Opportunities
        """
        if not self.chat:
            return self._fallback_cross_client_analysis(clients_data, portfolios_data)
        
        try:
            # Summarize data for LLM
            summary = {
                "total_clients": len(clients_data),
                "total_aum": sum([p.get("total_value", 0) for p in portfolios_data]),
                "risk_profiles": {},
                "sector_exposures": {},
                "common_holdings": {}
            }
            
            for client in clients_data:
                risk = client.get("risk_profile", "moderate")
                summary["risk_profiles"][risk] = summary["risk_profiles"].get(risk, 0) + 1
            
            context = f"""
You are analyzing a financial advisor's client book. Identify patterns and risks.

BOOK SUMMARY:
{json.dumps(summary, indent=2)}

CLIENTS DATA (sample):
{json.dumps(clients_data[:3], indent=2)}

PORTFOLIOS DATA (sample):
{json.dumps(portfolios_data[:3], indent=2)}

Analyze and return:
1. Key patterns identified
2. Cross-client risks
3. Opportunities for the advisor
4. Recommended book-wide actions

Return as JSON with keys: patterns, risks, opportunities, actions
"""
            
            messages = [
                self.Message(role="system", content="You are a financial analysis AI. Return valid JSON."),
                self.Message(role="user", content=context)
            ]
            
            response = await self.chat(
                api_key=EMERGENT_LLM_KEY,
                model="gpt-4o",
                messages=messages
            )
            
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            try:
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                
                return json.loads(response_text)
            except json.JSONDecodeError:
                return self._fallback_cross_client_analysis(clients_data, portfolios_data)
                
        except Exception as e:
            logger.error(f"Error in cross-client analysis: {e}")
            return self._fallback_cross_client_analysis(clients_data, portfolios_data)
    
    def _fallback_cross_client_analysis(self, clients_data: List[Dict], portfolios_data: List[Dict]) -> Dict:
        """Fallback analysis when LLM is not available"""
        total_aum = sum([p.get("total_value", 0) for p in portfolios_data])
        
        return {
            "patterns": [
                {"pattern": "Risk Profile Distribution", "detail": "Majority of clients have moderate-growth profiles"},
                {"pattern": "Sector Concentration", "detail": "High allocation to Financials sector across book"}
            ],
            "risks": [
                {"risk": "Sector Concentration", "severity": "Medium", "description": "Multiple clients overweight in Financials"},
                {"risk": "Interest Rate Sensitivity", "severity": "Medium", "description": "High bond allocation may be affected by rate changes"}
            ],
            "opportunities": [
                {"opportunity": "Tax Loss Harvesting", "potential_value": total_aum * 0.005, "clients_affected": len(clients_data) // 2},
                {"opportunity": "Insurance Cross-sell", "potential_value": 5000 * len(clients_data), "clients_affected": len(clients_data)}
            ],
            "actions": [
                {"action": "Schedule sector rebalancing review", "priority": "High"},
                {"action": "Implement tax-loss harvesting program", "priority": "Medium"},
                {"action": "Review insurance needs across book", "priority": "Medium"}
            ]
        }
    
    async def generate_insight_from_data(self, 
                                         insight_type: str,
                                         data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a specific insight from graph data.
        
        Types: risk_alert, opportunity, rebalance, tax_optimization, goal_progress
        """
        if not self.chat:
            return self._generate_fallback_insight(insight_type, data)
        
        try:
            type_prompts = {
                "risk_alert": "Identify and explain any risks in this data. Be specific about the risk and its potential impact.",
                "opportunity": "Identify any opportunities for improvement or growth. Quantify the potential benefit.",
                "rebalance": "Analyze if rebalancing is needed. Provide specific recommendations.",
                "tax_optimization": "Identify tax optimization opportunities. Be specific about potential savings.",
                "goal_progress": "Analyze progress toward goals. Identify if any goals are at risk."
            }
            
            prompt = type_prompts.get(insight_type, "Analyze this financial data and provide insights.")
            
            context = f"""
{prompt}

DATA:
{json.dumps(data, indent=2)}

Return a JSON object with:
- title: Brief insight title
- description: Detailed explanation (2-3 sentences)
- severity: 1-5 (5=critical)
- recommendations: List of specific actions
"""
            
            messages = [
                self.Message(role="system", content="You are a financial analysis AI. Return valid JSON."),
                self.Message(role="user", content=context)
            ]
            
            response = await self.chat(
                api_key=EMERGENT_LLM_KEY,
                model="gpt-4o",
                messages=messages
            )
            
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            try:
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                
                result = json.loads(response_text)
                result["type"] = insight_type
                result["generated_at"] = datetime.utcnow().isoformat()
                return result
            except json.JSONDecodeError:
                return self._generate_fallback_insight(insight_type, data)
                
        except Exception as e:
            logger.error(f"Error generating insight: {e}")
            return self._generate_fallback_insight(insight_type, data)
    
    def _generate_fallback_insight(self, insight_type: str, data: Dict) -> Dict:
        """Fallback insight generation"""
        fallback_insights = {
            "risk_alert": {
                "title": "Portfolio Risk Assessment Required",
                "description": "Review recommended to assess current risk exposure.",
                "severity": 3,
                "recommendations": ["Schedule risk review", "Analyze sector exposure"]
            },
            "opportunity": {
                "title": "Potential Optimization Opportunity",
                "description": "Portfolio may benefit from optimization review.",
                "severity": 2,
                "recommendations": ["Review allocation", "Consider rebalancing"]
            },
            "rebalance": {
                "title": "Rebalancing Review Needed",
                "description": "Portfolio may have drifted from target allocation.",
                "severity": 2,
                "recommendations": ["Check current vs target allocation", "Consider tax implications"]
            },
            "tax_optimization": {
                "title": "Tax Planning Review",
                "description": "Review tax optimization strategies before year-end.",
                "severity": 2,
                "recommendations": ["Review capital gains/losses", "Consider tax-loss harvesting"]
            },
            "goal_progress": {
                "title": "Goal Progress Check",
                "description": "Regular review of progress toward financial goals.",
                "severity": 2,
                "recommendations": ["Review goal funding status", "Adjust contributions if needed"]
            }
        }
        
        result = fallback_insights.get(insight_type, fallback_insights["risk_alert"])
        result["type"] = insight_type
        result["generated_at"] = datetime.utcnow().isoformat()
        return result
    
    async def answer_graph_question(self, question: str, graph_data: Dict[str, Any]) -> str:
        """
        Answer a natural language question using graph data.
        
        Examples:
        - "Which clients are most at risk for retirement?"
        - "What is the total exposure to BHP across all portfolios?"
        - "Who should I call first this week?"
        """
        if not self.chat:
            return self._generate_fallback_answer(question, graph_data)
        
        try:
            context = f"""
You are a financial advisor assistant. Answer this question using the provided data.

QUESTION: {question}

GRAPH DATA:
{json.dumps(graph_data, indent=2)}

Provide a clear, concise answer. Include specific numbers and names where relevant.
"""
            
            messages = [
                self.Message(role="system", content="You are a helpful financial advisor AI assistant."),
                self.Message(role="user", content=context)
            ]
            
            response = await self.chat(
                api_key=EMERGENT_LLM_KEY,
                model="gpt-4o",
                messages=messages
            )
            
            return response.content if hasattr(response, 'content') else str(response)
            
        except Exception as e:
            logger.error(f"Error answering question with LLM: {e}")
            return self._generate_fallback_answer(question, graph_data)
    
    def _generate_fallback_answer(self, question: str, graph_data: Dict[str, Any]) -> str:
        """Generate a natural language answer without LLM"""
        question_lower = question.lower()
        
        # Handle retirement risk questions
        if "retirement" in question_lower or "risk" in question_lower:
            risks = graph_data.get("retirement_risks", [])
            if risks:
                at_risk = [r for r in risks if r.get("retirement_risk", {}).get("risk_score", 0) > 50]
                if at_risk:
                    risk_names = [r.get("client_name", "Unknown") for r in at_risk[:3]]
                    return f"Based on the analysis, {len(at_risk)} clients are at significant retirement risk:\n\n" + \
                           "\n".join([f"• **{r.get('client_name')}** (Age {r.get('age')}, retiring at {r.get('retirement_age')}): " + \
                                     f"Only {r.get('retirement_risk', {}).get('funding_ratio', 0)}% funded, " + \
                                     f"requires {r.get('retirement_risk', {}).get('required_annual_growth', 0)}% annual growth" 
                                     for r in at_risk[:3]])
            return "No clients currently show significant retirement risk based on available data."
        
        # Handle revenue/opportunity questions
        if "revenue" in question_lower or "opportunity" in question_lower:
            opps = graph_data.get("opportunities", [])
            if opps:
                total = sum([o.get("total_potential_revenue", 0) for o in opps])
                return f"Revenue opportunities across {len(opps)} clients total approximately **${total:,.0f}**.\n\n" + \
                       "Top opportunities:\n" + \
                       "\n".join([f"• **{o.get('client_name')}**: ${o.get('total_potential_revenue', 0):,.0f} potential" 
                                 for o in opps[:3]])
            return "No significant revenue opportunities identified at this time."
        
        # Handle rebalancing questions
        if "rebalance" in question_lower or "rebalancing" in question_lower:
            rebalance = graph_data.get("rebalance_needed", [])
            if rebalance:
                return f"**{len(rebalance)} portfolios** need rebalancing:\n\n" + \
                       "\n".join([f"• **{r.get('portfolio_name')}** ({r.get('client_name')}): " + \
                                 f"Max drift {r.get('max_drift', 0):.1f}%" for r in rebalance[:3]])
            return "All portfolios are currently within acceptable drift thresholds."
        
        # Handle insights questions
        if "insight" in question_lower or "top" in question_lower:
            insights = graph_data.get("insights", [])
            if insights:
                return f"**{len(insights)} active insights** this week:\n\n" + \
                       "\n".join([f"• **{i.get('title')}** (Severity {i.get('severity')}): {i.get('description', '')[:100]}" 
                                 for i in insights[:4]])
            return "No active insights at this time."
        
        # Handle client-specific questions
        clients = graph_data.get("clients", [])
        if clients:
            return f"Your client book includes **{len(clients)} clients**:\n\n" + \
                   "\n".join([f"• **{c.get('name')}**: ${c.get('net_worth', 0):,.0f} net worth, {c.get('risk_profile', 'unknown')} risk profile" 
                             for c in clients[:5]]) + \
                   f"\n\nTotal AUM: **${sum([c.get('net_worth', 0) for c in clients]):,.0f}**"
        
        return "I found relevant data but couldn't generate a specific answer. Please try rephrasing your question or check the tabs above for detailed information."


# Global AI engine instance
_ai_engine: Optional[AIReasoningEngine] = None


def get_ai_engine() -> AIReasoningEngine:
    """Get or create the AI reasoning engine instance"""
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = AIReasoningEngine()
    return _ai_engine
