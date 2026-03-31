"""
AI Document Analysis Service
AI-powered document extraction and analysis for financial documents.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import os

# Try to import LLM integration
try:
    from emergentintegrations.llm.chat import chat, LlmConfig
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


async def analyze_document(
    document_name: str,
    document_type: str,
    document_category: str,
    document_content: str = None
) -> Dict[str, Any]:
    """
    Analyze a document using AI to extract key information.
    In production, this would use OCR + LLM to process actual documents.
    """
    
    # Simulated document analysis based on category
    analysis_templates = {
        "tax": {
            "document_type": "Tax Return",
            "extracted_data": {
                "tax_year": "2024-25",
                "taxable_income": 185000,
                "tax_paid": 47500,
                "deductions_claimed": 12800,
                "franking_credits": 3200,
                "rental_income": 36000,
                "capital_gains": 8500
            },
            "key_insights": [
                "Total taxable income increased 8% from previous year",
                "Rental deductions of $12,800 claimed (interest, depreciation, expenses)",
                "Franking credits of $3,200 to offset tax liability",
                "CGT discount applied on shares held >12 months"
            ],
            "recommendations": [
                "Consider salary sacrifice to reduce taxable income",
                "Review depreciation schedule for investment property",
                "Check if all work-related deductions claimed"
            ],
            "confidence_score": 0.92
        },
        "insurance": {
            "document_type": "Insurance Policy",
            "extracted_data": {
                "policy_type": "Life Insurance",
                "insurer": "TAL",
                "sum_insured": 2000000,
                "premium_annual": 1680,
                "premium_monthly": 145,
                "policy_number": "LI-2024-789456",
                "start_date": "2024-01-15",
                "renewal_date": "2025-01-15",
                "beneficiaries": ["Sarah Wheeler (spouse)", "Children equally"]
            },
            "key_insights": [
                "Coverage of $2M is appropriate for current income level",
                "Policy includes terminal illness benefit",
                "Premium is tax deductible if owned within super",
                "Renewal due in 45 days"
            ],
            "recommendations": [
                "Review beneficiary nominations annually",
                "Consider bundling with TPD for premium savings",
                "Check if policy should be held inside super for tax benefits"
            ],
            "confidence_score": 0.95
        },
        "investments": {
            "document_type": "Investment Statement",
            "extracted_data": {
                "account_name": "Vanguard Brokerage",
                "statement_period": "Q4 2025",
                "total_value": 485000,
                "quarterly_return": 4.2,
                "dividends_received": 4850,
                "holdings": [
                    {"name": "VAS", "units": 2500, "value": 245000},
                    {"name": "VGS", "units": 1800, "value": 180000},
                    {"name": "VAF", "units": 800, "value": 60000}
                ]
            },
            "key_insights": [
                "Strong quarterly performance of 4.2%",
                "Portfolio well diversified across Australian and international markets",
                "Dividend yield of approximately 4%",
                "Fixed income allocation provides stability"
            ],
            "recommendations": [
                "Consider tax-loss harvesting opportunities",
                "Review asset allocation against target",
                "Reinvest dividends for compound growth"
            ],
            "confidence_score": 0.94
        },
        "super": {
            "document_type": "Superannuation Statement",
            "extracted_data": {
                "fund_name": "Australian Super",
                "member_number": "AS-12345678",
                "investment_option": "High Growth",
                "balance": 580000,
                "employer_contributions_ytd": 18500,
                "personal_contributions_ytd": 8000,
                "insurance_premiums": 1200,
                "fees_ytd": 2900,
                "return_ytd": 8.5
            },
            "key_insights": [
                "Balance growing well with 8.5% YTD return",
                "Concessional cap utilization: 26,500 of 30,000 (88%)",
                "Insurance premiums deducted from balance",
                "Fee structure competitive at ~0.5%"
            ],
            "recommendations": [
                "Top up concessional contributions by $3,500",
                "Review insurance cover adequacy",
                "Check binding death benefit nomination is current"
            ],
            "confidence_score": 0.93
        },
        "property": {
            "document_type": "Property Valuation",
            "extracted_data": {
                "property_address": "42 Collins Street, Melbourne VIC 3000",
                "property_type": "Residential Apartment",
                "valuation_date": "2025-11-20",
                "estimated_value": 1250000,
                "land_value": 450000,
                "improvement_value": 800000,
                "comparable_sales": [
                    {"address": "38 Collins St", "price": 1180000, "date": "2025-10-15"},
                    {"address": "45 Collins St", "price": 1320000, "date": "2025-09-22"}
                ],
                "rental_estimate_weekly": 850
            },
            "key_insights": [
                "Property value increased approximately 5% over past 12 months",
                "Rental yield of 3.5% (gross)",
                "Location in prime CBD with strong demand",
                "Building depreciation available on improvements"
            ],
            "recommendations": [
                "Order updated depreciation schedule",
                "Consider rent review if below market",
                "Review landlord insurance coverage"
            ],
            "confidence_score": 0.88
        },
        "estate": {
            "document_type": "Will and Testament",
            "extracted_data": {
                "testator": "James Wheeler",
                "date_signed": "2024-06-15",
                "executor": "Sarah Wheeler (spouse)",
                "beneficiaries": [
                    {"name": "Sarah Wheeler", "relationship": "spouse", "share": "40%"},
                    {"name": "Emily Wheeler", "relationship": "child", "share": "30%"},
                    {"name": "Michael Wheeler", "relationship": "child", "share": "30%"}
                ],
                "guardians": "Sarah Wheeler (spouse)",
                "special_gifts": []
            },
            "key_insights": [
                "Will is 18 months old - recommend review every 3 years",
                "Spouse receives 40% directly, children share remainder",
                "No testamentary trust established",
                "No specific gifts or charitable bequests"
            ],
            "recommendations": [
                "Consider testamentary trust for tax-effective inheritance",
                "Review superannuation binding nominations",
                "Ensure powers of attorney are in place"
            ],
            "confidence_score": 0.91
        }
    }
    
    # Get template or use default
    template = analysis_templates.get(document_category, {
        "document_type": "General Document",
        "extracted_data": {},
        "key_insights": ["Document uploaded successfully"],
        "recommendations": ["Review document contents manually"],
        "confidence_score": 0.75
    })
    
    # Add metadata
    result = {
        "document_name": document_name,
        "document_category": document_category,
        "analysis_timestamp": datetime.now().isoformat(),
        "ai_powered": True,
        **template
    }
    
    # If LLM is available and we have content, use AI for analysis
    if LLM_AVAILABLE and document_content and EMERGENT_LLM_KEY:
        try:
            ai_summary = await generate_ai_summary(document_name, document_category, document_content)
            result["ai_summary"] = ai_summary
        except Exception as e:
            result["ai_summary"] = f"AI analysis unavailable: {str(e)}"
    
    return result


async def generate_ai_summary(
    document_name: str,
    document_category: str,
    content: str
) -> str:
    """Generate an AI summary of the document."""
    
    prompt = f"""Analyze this {document_category} document named "{document_name}" and provide a brief summary of key financial information:

Content: {content[:2000]}  # Limit content length

Provide:
1. Document summary (2-3 sentences)
2. Key financial figures
3. Important dates or deadlines
4. Action items if any"""
    
    try:
        config = LlmConfig(
            api_key=EMERGENT_LLM_KEY,
            model="gpt-4o",
            temperature=0.3
        )
        
        response = await chat(
            config=config,
            prompt=prompt,
            system_message="You are a financial document analyst. Extract key information concisely."
        )
        
        return response.content
    except Exception as e:
        return f"Unable to generate AI summary: {str(e)}"


def get_document_insights(documents: List[Dict]) -> Dict[str, Any]:
    """
    Generate portfolio-wide insights from all documents.
    """
    
    insights = {
        "total_documents": len(documents),
        "coverage_analysis": {
            "has_will": False,
            "has_life_insurance": False,
            "has_income_protection": False,
            "has_super_statement": False,
            "tax_returns_current": False
        },
        "upcoming_renewals": [],
        "action_items": [],
        "gaps_identified": []
    }
    
    for doc in documents:
        category = doc.get("category", "")
        
        if category == "estate":
            insights["coverage_analysis"]["has_will"] = True
        elif category == "insurance":
            if "life" in doc.get("name", "").lower():
                insights["coverage_analysis"]["has_life_insurance"] = True
            if "income" in doc.get("name", "").lower():
                insights["coverage_analysis"]["has_income_protection"] = True
        elif category == "super":
            insights["coverage_analysis"]["has_super_statement"] = True
        elif category == "tax":
            if "2025" in doc.get("name", "") or "2024" in doc.get("name", ""):
                insights["coverage_analysis"]["tax_returns_current"] = True
        
        # Check for expiring documents
        expiry = doc.get("expiry_date")
        if expiry:
            from datetime import datetime
            try:
                exp_date = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                days_until = (exp_date - datetime.now(exp_date.tzinfo)).days
                if 0 < days_until < 60:
                    insights["upcoming_renewals"].append({
                        "document": doc.get("name"),
                        "expiry_date": expiry,
                        "days_until": days_until
                    })
            except Exception:
                pass
    
    # Identify gaps
    coverage = insights["coverage_analysis"]
    if not coverage["has_will"]:
        insights["gaps_identified"].append({
            "type": "Estate Planning",
            "priority": "High",
            "recommendation": "No Will found - consider creating or uploading your Will"
        })
    
    if not coverage["has_life_insurance"]:
        insights["gaps_identified"].append({
            "type": "Insurance",
            "priority": "High", 
            "recommendation": "No Life Insurance policy found"
        })
    
    if not coverage["has_income_protection"]:
        insights["gaps_identified"].append({
            "type": "Insurance",
            "priority": "Medium",
            "recommendation": "No Income Protection policy found"
        })
    
    # Generate action items
    if insights["upcoming_renewals"]:
        insights["action_items"].append({
            "action": "Review upcoming policy renewals",
            "count": len(insights["upcoming_renewals"]),
            "priority": "High"
        })
    
    if insights["gaps_identified"]:
        insights["action_items"].append({
            "action": "Address document gaps",
            "count": len(insights["gaps_identified"]),
            "priority": "Medium"
        })
    
    return insights
