"""
Test Suite for New Features - Iteration 43
Testing: Document Vault, AI Document Analysis, Connected Accounts, 
         Account Aggregation, PDF Export, AI Copilot
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://advisor-crm-pro-1.preview.emergentagent.com')


class TestDocumentVault:
    """Test Document Vault API endpoints"""
    
    def test_get_documents(self):
        """Test GET /api/documents - List all documents"""
        response = requests.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "all_documents" in data or "documents" in data or isinstance(data, list), "Response should contain documents"
        print(f"Documents endpoint returned: {list(data.keys()) if isinstance(data, dict) else 'list'}")
    
    def test_search_documents(self):
        """Test GET /api/documents/search - Search documents"""
        response = requests.get(f"{BASE_URL}/api/documents/search", params={"query": "tax"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Search returned: {response.json()}")
    
    def test_upload_document(self):
        """Test POST /api/documents/upload - Upload a document"""
        doc_data = {
            "name": f"TEST_Tax_Return_2025_{datetime.now().timestamp()}",
            "category": "tax",
            "description": "Test tax return document",
            "tags": ["2025", "test", "tax"],
            "file_type": "pdf",
            "size": 125000
        }
        
        response = requests.post(f"{BASE_URL}/api/documents/upload", json=doc_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data or "document_id" in data or "success" in data, "Response should contain document ID or success"
        print(f"Upload response: {data}")
        return data


class TestAIDocumentAnalysis:
    """Test AI Document Analysis endpoints"""
    
    def test_analyze_document(self):
        """Test POST /api/documents/analyze - AI document analysis"""
        analysis_request = {
            "document_name": "2024 Tax Return",
            "document_type": "pdf",
            "document_category": "tax"
        }
        
        response = requests.post(f"{BASE_URL}/api/documents/analyze", json=analysis_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check for expected analysis fields
        assert "document_type" in data, "Response should contain document_type"
        assert "extracted_data" in data, "Response should contain extracted_data"
        assert "key_insights" in data, "Response should contain key_insights"
        assert "recommendations" in data, "Response should contain recommendations"
        assert "confidence_score" in data, "Response should contain confidence_score"
        
        print(f"AI Analysis - Document Type: {data.get('document_type')}")
        print(f"AI Analysis - Confidence: {data.get('confidence_score')}")
        print(f"AI Analysis - Key Insights: {len(data.get('key_insights', []))} insights")
    
    def test_analyze_insurance_document(self):
        """Test AI analysis for insurance documents"""
        analysis_request = {
            "document_name": "Life Insurance Policy",
            "document_type": "pdf",
            "document_category": "insurance"
        }
        
        response = requests.post(f"{BASE_URL}/api/documents/analyze", json=analysis_request)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("document_type") == "Insurance Policy"
        print(f"Insurance Analysis - Extracted Data: {list(data.get('extracted_data', {}).keys())}")
    
    def test_document_portfolio_insights(self):
        """Test POST /api/documents/insights - Portfolio-wide insights"""
        # Sample documents for insights
        documents = [
            {"id": "doc1", "name": "Tax Return 2025", "category": "tax"},
            {"id": "doc2", "name": "Life Insurance Policy", "category": "insurance"},
            {"id": "doc3", "name": "Super Statement", "category": "super"}
        ]
        
        response = requests.post(f"{BASE_URL}/api/documents/insights", json=documents)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "coverage_analysis" in data, "Response should contain coverage_analysis"
        assert "gaps_identified" in data, "Response should contain gaps_identified"
        print(f"Portfolio Insights - Coverage: {data.get('coverage_analysis')}")


class TestConnectedAccounts:
    """Test Connected Accounts (Account Aggregation) endpoints"""
    
    def test_get_aggregated_accounts(self):
        """Test GET /api/accounts/aggregated - Get all connected accounts"""
        response = requests.get(f"{BASE_URL}/api/accounts/aggregated")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "accounts" in data, "Response should contain accounts"
        assert "summary" in data, "Response should contain summary"
        
        summary = data.get("summary", {})
        assert "total_assets" in summary, "Summary should contain total_assets"
        assert "total_liabilities" in summary, "Summary should contain total_liabilities"
        assert "net_worth" in summary, "Summary should contain net_worth"
        
        print(f"Aggregated Accounts - Total: {summary.get('total_accounts', len(data.get('accounts', [])))}")
        print(f"Aggregated Accounts - Net Worth: ${summary.get('net_worth', 0):,.0f}")
        print(f"Aggregated Accounts - Institutions: {data.get('institutions', [])}")
    
    def test_get_account_transactions(self):
        """Test GET /api/accounts/{account_id}/transactions - Get transactions"""
        # First get accounts to find an account_id
        accounts_response = requests.get(f"{BASE_URL}/api/accounts/aggregated")
        accounts_data = accounts_response.json()
        
        accounts = accounts_data.get("accounts", [])
        if accounts:
            account_id = accounts[0].get("account_id")
            
            response = requests.get(f"{BASE_URL}/api/accounts/{account_id}/transactions")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert "transactions" in data, "Response should contain transactions"
            assert "summary" in data, "Response should contain summary"
            
            print(f"Transactions - Count: {len(data.get('transactions', []))}")
            print(f"Transactions - Summary: {data.get('summary')}")
        else:
            print("No accounts found to test transactions")
    
    def test_sync_accounts(self):
        """Test POST /api/accounts/sync - Sync all accounts"""
        response = requests.post(f"{BASE_URL}/api/accounts/sync")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data or "accounts_synced" in data, "Response should indicate sync status"
        print(f"Sync Response: {data}")
    
    def test_get_cashflow_analysis(self):
        """Test GET /api/accounts/cashflow - Get cashflow analysis"""
        response = requests.get(f"{BASE_URL}/api/accounts/cashflow")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "summary" in data, "Response should contain summary"
        assert "expense_breakdown" in data, "Response should contain expense_breakdown"
        
        summary = data.get("summary", {})
        print(f"Cashflow - Monthly Income: ${summary.get('average_monthly_income', 0):,.0f}")
        print(f"Cashflow - Monthly Expenses: ${summary.get('average_monthly_expenses', 0):,.0f}")
        print(f"Cashflow - Savings Rate: {summary.get('savings_rate', 0)}%")
    
    def test_get_available_institutions(self):
        """Test GET /api/accounts/institutions - Get available institutions"""
        response = requests.get(f"{BASE_URL}/api/accounts/institutions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "institutions" in data, "Response should contain institutions"
        assert "popular" in data, "Response should contain popular institutions"
        
        print(f"Available Institutions: {len(data.get('institutions', []))}")
        print(f"Popular Institutions: {[i.get('name') for i in data.get('popular', [])]}")
    
    def test_connect_account(self):
        """Test POST /api/accounts/connect - Connect a new account"""
        connect_data = {
            "institution": "ANZ Bank"
        }
        
        response = requests.post(f"{BASE_URL}/api/accounts/connect", json=connect_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data, "Response should indicate success"
        print(f"Connect Account Response: {data}")


class TestPDFExport:
    """Test PDF Export endpoints"""
    
    def test_export_financial_plan_pdf(self):
        """Test POST /api/export/financial-plan - Export financial plan as PDF"""
        plan_data = {
            "client_name": "Wheeler Family",
            "plan_id": f"FP-TEST-{datetime.now().strftime('%Y%m%d')}",
            "executive_summary": {
                "headline": "Comprehensive Financial Plan",
                "key_metrics": [
                    {"name": "Net Worth", "current": "$2,850,000", "target": "$4,000,000"},
                    {"name": "Retirement Income", "current": "$80,000", "target": "$120,000"}
                ]
            },
            "retirement_plan": {
                "target_age": 60,
                "success_probability": 85,
                "annual_income": 120000,
                "recommendations": ["Maximize super contributions", "Review asset allocation"]
            },
            "investment_strategy": {
                "risk_profile": "Moderate",
                "time_horizon": "15 years",
                "target_allocation": {
                    "australian_shares": {"current": 30, "target": 35, "action": "Increase"},
                    "international_shares": {"current": 25, "target": 30, "action": "Increase"}
                }
            },
            "tax_strategy": {
                "effective_rate": 32,
                "potential_savings": 15000,
                "strategies": [
                    {"name": "Super Contributions", "description": "Maximize concessional contributions"}
                ]
            },
            "action_items": [
                {"priority": "High", "action": "Review super contributions", "timeline": "This month", "impact": "Tax savings"}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/export/financial-plan", json=plan_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data or "data" in data, "Response should indicate success or contain PDF data"
        
        if "data" in data:
            # PDF data is base64 encoded
            assert len(data["data"]) > 100, "PDF data should be substantial"
            print(f"PDF Export - Filename: {data.get('filename', 'N/A')}")
            print(f"PDF Export - Data length: {len(data.get('data', ''))} chars")
        else:
            print(f"PDF Export Response: {data}")


class TestAICopilot:
    """Test AI Copilot chat endpoints"""
    
    def test_copilot_chat(self):
        """Test POST /api/copilot/chat - Send message to AI copilot"""
        chat_request = {
            "session_id": f"test_session_{datetime.now().timestamp()}",
            "message": "What are the current tax brackets in Australia?",
            "client_context": {
                "name": "Wheeler Family",
                "age": 45,
                "income": 185000,
                "net_worth": 2850000,
                "super_balance": 580000,
                "risk_profile": "moderate",
                "goals": ["retirement", "wealth building"]
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/copilot/chat", json=chat_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data, "Response should contain AI response"
        assert "session_id" in data, "Response should contain session_id"
        
        print(f"Copilot Response Length: {len(data.get('response', ''))}")
        print(f"Copilot Insights: {data.get('insights', [])}")
    
    def test_copilot_suggestions(self):
        """Test GET /api/copilot/suggestions - Get suggested questions"""
        response = requests.get(f"{BASE_URL}/api/copilot/suggestions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # API returns {"suggestions": [...]} or just a list
        suggestions = data.get("suggestions", data) if isinstance(data, dict) else data
        assert isinstance(suggestions, list), "Response should contain a list of suggestions"
        assert len(suggestions) > 0, "Should have at least one suggestion"
        print(f"Copilot Suggestions: {suggestions[:3]}...")
    
    def test_copilot_conversation_flow(self):
        """Test a multi-turn conversation with the copilot"""
        session_id = f"test_conversation_{datetime.now().timestamp()}"
        
        # First message
        response1 = requests.post(f"{BASE_URL}/api/copilot/chat", json={
            "session_id": session_id,
            "message": "How can I reduce my tax?",
            "client_context": {"income": 185000}
        })
        assert response1.status_code == 200
        
        # Follow-up message
        response2 = requests.post(f"{BASE_URL}/api/copilot/chat", json={
            "session_id": session_id,
            "message": "Tell me more about salary sacrifice",
            "client_context": {"income": 185000}
        })
        assert response2.status_code == 200
        
        # Check conversation history
        history_response = requests.get(f"{BASE_URL}/api/copilot/history/{session_id}")
        assert history_response.status_code == 200
        
        history = history_response.json()
        assert len(history) >= 2, "Conversation history should have at least 2 messages"
        print(f"Conversation History Length: {len(history)}")


class TestFinancialPlanGenerator:
    """Test Financial Plan Generator endpoint"""
    
    def test_generate_financial_plan(self):
        """Test POST /api/ai/generate-financial-plan - Generate comprehensive plan"""
        plan_request = {
            "client_name": "Wheeler Family",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 2850000,
            "annual_income": 185000,
            "annual_expenses": 120000,
            "total_assets": 3800000,
            "total_debt": 950000,
            "super_balance": 580000,
            "investment_portfolio": 485000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=plan_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify plan structure
        assert "plan_id" in data, "Plan should have plan_id"
        assert "executive_summary" in data, "Plan should have executive_summary"
        assert "retirement_plan" in data, "Plan should have retirement_plan"
        assert "investment_strategy" in data, "Plan should have investment_strategy"
        assert "tax_strategy" in data, "Plan should have tax_strategy"
        assert "action_plan" in data, "Plan should have action_plan"
        
        print(f"Financial Plan Generated - ID: {data.get('plan_id')}")
        print(f"Executive Summary: {data.get('executive_summary', {}).get('headline', 'N/A')}")
        print(f"Retirement Success Probability: {data.get('executive_summary', {}).get('retirement_probability', 'N/A')}%")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test GET /api/health - Health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"Health Check: {response.json()}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
