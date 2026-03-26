"""
Test Suite for Iteration 102 - Budget & Expenses, Retirement Milestones, SOA/ROA Compliance
Tests comprehensive budgeting module, retirement milestones tracking, and SOA/ROA compliance workflow
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBudgetCategories:
    """Test budget categories endpoint"""
    
    def test_get_budget_categories(self):
        """GET /api/budget/categories returns expense and income categories"""
        response = requests.get(f"{BASE_URL}/api/budget/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "expense_categories" in data
        assert "income_categories" in data
        assert "frequencies" in data
        
        # Verify expense categories have required fields
        assert len(data["expense_categories"]) > 0
        for cat in data["expense_categories"]:
            assert "id" in cat
            assert "name" in cat
            assert "icon" in cat
        
        # Verify income categories
        assert len(data["income_categories"]) > 0
        for cat in data["income_categories"]:
            assert "id" in cat
            assert "name" in cat
        
        # Verify frequencies have multipliers
        assert len(data["frequencies"]) > 0
        for freq in data["frequencies"]:
            assert "id" in freq
            assert "monthly_multiplier" in freq
        
        print(f"✓ Budget categories: {len(data['expense_categories'])} expense, {len(data['income_categories'])} income categories")


class TestDemoBudget:
    """Test demo budget endpoint"""
    
    def test_get_demo_budget(self):
        """GET /api/budget/demo/sample returns demo budget with incomes, expenses, goals"""
        response = requests.get(f"{BASE_URL}/api/budget/demo/sample")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == "DEMO-001"
        assert data["client_name"] == "Sample Client"
        
        # Verify incomes
        assert "incomes" in data
        assert len(data["incomes"]) >= 3
        for income in data["incomes"]:
            assert "income_id" in income
            assert "source" in income
            assert "category" in income
            assert "amount" in income
            assert "frequency" in income
        
        # Verify expenses
        assert "expenses" in data
        assert len(data["expenses"]) >= 5
        for expense in data["expenses"]:
            assert "expense_id" in expense
            assert "description" in expense
            assert "category" in expense
            assert "amount" in expense
            assert "frequency" in expense
        
        # Verify goals
        assert "goals" in data
        assert len(data["goals"]) >= 3
        for goal in data["goals"]:
            assert "goal_id" in goal
            assert "name" in goal
            assert "target_amount" in goal
            assert "current_amount" in goal
        
        # Verify category budgets
        assert "category_budgets" in data
        assert len(data["category_budgets"]) > 0
        
        print(f"✓ Demo budget: {len(data['incomes'])} incomes, {len(data['expenses'])} expenses, {len(data['goals'])} goals")


class TestClientBudget:
    """Test client budget CRUD operations"""
    
    @pytest.fixture
    def test_client_id(self):
        return "TEST-BUDGET-001"
    
    def test_create_client_budget(self, test_client_id):
        """POST /api/budget/client/{client_id} creates/updates budget"""
        budget_data = {
            "client_id": test_client_id,
            "client_name": "Test Budget Client",
            "incomes": [
                {
                    "source": "Test Salary",
                    "category": "salary",
                    "amount": 10000,
                    "frequency": "monthly",
                    "is_taxable": True
                }
            ],
            "expenses": [
                {
                    "description": "Test Rent",
                    "category": "housing",
                    "amount": 2500,
                    "frequency": "monthly",
                    "is_essential": True
                }
            ],
            "goals": [
                {
                    "name": "Test Emergency Fund",
                    "target_amount": 20000,
                    "current_amount": 5000,
                    "monthly_contribution": 500,
                    "status": "active"
                }
            ],
            "category_budgets": {
                "housing": 3000,
                "groceries": 800
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/budget/client/{test_client_id}",
            json=budget_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        assert data["status"] == "saved"
        assert "summary" in data
        
        print(f"✓ Created budget for client {test_client_id}")
    
    def test_get_client_budget(self, test_client_id):
        """GET /api/budget/client/{client_id} returns client budget with summary"""
        # First create a budget
        self.test_create_client_budget(test_client_id)
        
        response = requests.get(f"{BASE_URL}/api/budget/client/{test_client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        
        # Verify summary calculations
        if "summary" in data:
            summary = data["summary"]
            assert "monthly_income" in summary
            assert "monthly_expenses" in summary
            assert "monthly_surplus" in summary
            assert "savings_rate" in summary
            print(f"✓ Budget summary: Income ${summary['monthly_income']}, Expenses ${summary['monthly_expenses']}, Surplus ${summary['monthly_surplus']}")
        
        print(f"✓ Retrieved budget for client {test_client_id}")
    
    def test_get_nonexistent_budget(self):
        """GET /api/budget/client/{client_id} returns message for nonexistent budget"""
        response = requests.get(f"{BASE_URL}/api/budget/client/NONEXISTENT-CLIENT")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        print("✓ Nonexistent budget returns appropriate message")


class TestSpendingAnalysis:
    """Test spending analysis endpoint"""
    
    def test_get_spending_analysis(self):
        """GET /api/budget/client/{client_id}/spending-analysis returns spending analysis"""
        client_id = "TEST-BUDGET-001"
        
        response = requests.get(f"{BASE_URL}/api/budget/client/{client_id}/spending-analysis?months=3")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == client_id
        assert "analysis_period_months" in data
        assert data["analysis_period_months"] == 3
        
        print(f"✓ Spending analysis for {client_id}")


class TestMilestoneTemplates:
    """Test milestone templates endpoint"""
    
    def test_get_milestone_templates(self):
        """GET /api/milestones/templates returns standard retirement milestones by category"""
        response = requests.get(f"{BASE_URL}/api/milestones/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert "templates" in data
        assert "categories" in data
        assert "priorities" in data
        assert "statuses" in data
        
        templates = data["templates"]
        # Verify expected categories exist
        expected_categories = ["accumulation", "debt_reduction", "insurance", "pension", "estate", "transition"]
        for cat in expected_categories:
            assert cat in templates, f"Missing category: {cat}"
            assert len(templates[cat]) > 0, f"Empty category: {cat}"
        
        # Verify template structure
        for cat, milestones in templates.items():
            for m in milestones:
                assert "name" in m
                assert "description" in m
                assert "metric" in m
                assert "default_target" in m
        
        print(f"✓ Milestone templates: {len(templates)} categories with milestones")


class TestClientMilestones:
    """Test client milestones CRUD operations"""
    
    @pytest.fixture
    def test_client_id(self):
        return "TEST-MILESTONE-001"
    
    def test_initialize_client_milestones(self, test_client_id):
        """POST /api/milestones/client/{client_id}/initialize creates client milestones"""
        plan_data = {
            "client_id": test_client_id,
            "client_name": "Test Milestone Client",
            "retirement_age": 65,
            "current_age": 45,
            "adviser_id": "ADV001",
            "use_standard_milestones": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/milestones/client/{test_client_id}/initialize",
            json=plan_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        assert "milestones_created" in data
        assert data["milestones_created"] > 0
        assert "years_to_retirement" in data
        assert data["years_to_retirement"] == 20
        
        print(f"✓ Initialized {data['milestones_created']} milestones for client {test_client_id}")
        return data
    
    def test_get_client_milestones(self, test_client_id):
        """GET /api/milestones/client/{client_id} returns client milestones with summary"""
        # First initialize milestones
        self.test_initialize_client_milestones(test_client_id)
        
        response = requests.get(f"{BASE_URL}/api/milestones/client/{test_client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        assert "milestones" in data
        assert "summary" in data
        
        summary = data["summary"]
        assert "total" in summary
        assert "completed" in summary
        assert "on_track" in summary
        assert "at_risk" in summary
        assert "completion_rate" in summary
        
        print(f"✓ Retrieved {summary['total']} milestones, {summary['completion_rate']}% complete")
    
    def test_get_retirement_readiness(self, test_client_id):
        """GET /api/milestones/client/{client_id}/retirement-readiness returns readiness score"""
        # First initialize milestones
        self.test_initialize_client_milestones(test_client_id)
        
        response = requests.get(f"{BASE_URL}/api/milestones/client/{test_client_id}/retirement-readiness")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        assert "overall_readiness_score" in data
        assert "readiness_level" in data
        assert "readiness_message" in data
        assert "category_scores" in data
        assert "total_milestones" in data
        
        print(f"✓ Retirement readiness: {data['overall_readiness_score']}% ({data['readiness_level']})")


class TestComplianceDocuments:
    """Test SOA/ROA compliance document operations"""
    
    @pytest.fixture
    def test_client_id(self):
        return "TEST-COMPLIANCE-001"
    
    @pytest.fixture
    def test_adviser_id(self):
        return "ADV-TEST-001"
    
    def test_create_soa_document(self, test_client_id, test_adviser_id):
        """POST /api/compliance-docs/document creates SOA/ROA document"""
        doc_data = {
            "client_id": test_client_id,
            "client_name": "Test Compliance Client",
            "document_type": "soa",
            "advice_type": "personal",
            "title": "Test SOA - Superannuation Advice",
            "description": "Test statement of advice for superannuation rollover",
            "advice_areas": ["superannuation", "insurance"],
            "adviser_id": test_adviser_id,
            "adviser_name": "Test Adviser",
            "advice_date": datetime.now().isoformat(),
            "advice_fee": 2500,
            "risk_profile_confirmed": True,
            "conflicts_disclosed": True,
            "fees_disclosed": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/compliance-docs/document",
            json=doc_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "document_id" in data
        assert data["document_id"].startswith("DOC-SOA-")
        assert data["client_id"] == test_client_id
        assert data["status"] == "draft"
        assert "status_history" in data
        assert len(data["status_history"]) > 0
        
        print(f"✓ Created SOA document: {data['document_id']}")
        return data["document_id"]
    
    def test_create_roa_document(self, test_client_id, test_adviser_id):
        """POST /api/compliance-docs/document creates ROA document"""
        doc_data = {
            "client_id": test_client_id,
            "client_name": "Test Compliance Client",
            "document_type": "roa",
            "advice_type": "scaled",
            "title": "Test ROA - Investment Switch",
            "description": "Record of advice for investment option switch",
            "advice_areas": ["investments"],
            "adviser_id": test_adviser_id,
            "adviser_name": "Test Adviser",
            "advice_date": datetime.now().isoformat(),
            "advice_fee": 500
        }
        
        response = requests.post(
            f"{BASE_URL}/api/compliance-docs/document",
            json=doc_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["document_id"].startswith("DOC-ROA-")
        
        print(f"✓ Created ROA document: {data['document_id']}")
        return data["document_id"]
    
    def test_get_client_documents(self, test_client_id, test_adviser_id):
        """GET /api/compliance-docs/client/{client_id} returns client compliance documents"""
        # First create documents
        self.test_create_soa_document(test_client_id, test_adviser_id)
        self.test_create_roa_document(test_client_id, test_adviser_id)
        
        response = requests.get(f"{BASE_URL}/api/compliance-docs/client/{test_client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        assert "documents" in data
        assert "total" in data
        assert "soa_count" in data
        assert "roa_count" in data
        
        print(f"✓ Client documents: {data['total']} total, {data['soa_count']} SOA, {data['roa_count']} ROA")
    
    def test_update_document_status(self, test_client_id, test_adviser_id):
        """PUT /api/compliance-docs/document/{id}/status updates document status"""
        # First create a document
        doc_id = self.test_create_soa_document(test_client_id, test_adviser_id)
        
        # Update status to pending_review
        response = requests.put(
            f"{BASE_URL}/api/compliance-docs/document/{doc_id}/status",
            json={
                "status": "pending_review",
                "notes": "Submitted for compliance review"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "updated"
        assert data["new_status"] == "pending_review"
        
        print(f"✓ Updated document status to pending_review")
    
    def test_submit_document_review(self, test_client_id, test_adviser_id):
        """POST /api/compliance-docs/document/{id}/review submits compliance review"""
        # First create and submit a document
        doc_id = self.test_create_soa_document(test_client_id, test_adviser_id)
        
        # Submit for review
        requests.put(
            f"{BASE_URL}/api/compliance-docs/document/{doc_id}/status",
            json={"status": "pending_review"}
        )
        
        # Submit review
        response = requests.post(
            f"{BASE_URL}/api/compliance-docs/document/{doc_id}/review",
            json={
                "reviewer_id": "REV001",
                "reviewer_name": "Compliance Officer",
                "outcome": "approved",
                "notes": "Document meets compliance requirements"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["document_id"] == doc_id
        assert data["review_outcome"] == "approved"
        assert data["new_status"] == "reviewed"
        
        print(f"✓ Submitted review: {data['review_outcome']}")


class TestPendingReviews:
    """Test pending reviews endpoints"""
    
    def test_get_pending_reviews(self):
        """GET /api/compliance-docs/reviews/pending returns pending reviews"""
        response = requests.get(f"{BASE_URL}/api/compliance-docs/reviews/pending")
        assert response.status_code == 200
        
        data = response.json()
        assert "pending_reviews" in data
        assert "total" in data
        
        print(f"✓ Pending reviews: {data['total']}")
    
    def test_get_reviews_due(self):
        """GET /api/compliance-docs/reviews/due returns overdue reviews"""
        response = requests.get(f"{BASE_URL}/api/compliance-docs/reviews/due?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "due_within_days" in data
        assert data["due_within_days"] == 30
        assert "reviews_due" in data
        assert "overdue_reviews" in data
        assert "total_due" in data
        assert "total_overdue" in data
        
        print(f"✓ Reviews due: {data['total_due']} in 30 days, {data['total_overdue']} overdue")


class TestComplianceSummary:
    """Test compliance summary endpoint"""
    
    def test_get_compliance_summary(self):
        """GET /api/compliance-docs/compliance-summary returns overall summary"""
        response = requests.get(f"{BASE_URL}/api/compliance-docs/compliance-summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "document_summary" in data
        assert "pending_compliance_review" in data
        assert "overdue_reviews" in data
        assert "timestamp" in data
        
        print(f"✓ Compliance summary: {data['pending_compliance_review']} pending, {data['overdue_reviews']} overdue")


class TestHealthCheck:
    """Test that new features are registered in health check"""
    
    def test_health_includes_new_features(self):
        """Health check includes budget, milestones, and SOA/ROA compliance"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        
        # Check adviceos section includes new features
        adviceos = data.get("adviceos", {})
        assert adviceos.get("retirement_milestones") == True, "retirement_milestones not in health check"
        assert adviceos.get("soa_roa_compliance") == True, "soa_roa_compliance not in health check"
        assert adviceos.get("budget_expenses") == True, "budget_expenses not in health check"
        
        print("✓ Health check includes all new features")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
