"""
Test Strategic Planning and Import/Export APIs
Tests for:
- Investment Comparison API
- Tax Structures API
- Asset Classes API
- Import Template API
- Export Clients API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStrategicAPIs:
    """Strategic Planning API tests"""
    
    def test_get_asset_classes(self):
        """Test GET /api/strategic/asset-classes returns asset class data"""
        response = requests.get(f"{BASE_URL}/api/strategic/asset-classes")
        assert response.status_code == 200
        
        data = response.json()
        assert "asset_classes" in data
        asset_classes = data["asset_classes"]
        
        # Verify expected asset classes exist
        expected_assets = ["au_shares", "international_shares", "property", "crypto", "bonds", "cash"]
        for asset in expected_assets:
            assert asset in asset_classes, f"Missing asset class: {asset}"
            assert "name" in asset_classes[asset]
            assert "expected_return" in asset_classes[asset]
        
        print(f"✓ Asset classes API returned {len(asset_classes)} asset classes")
    
    def test_get_tax_structures(self):
        """Test GET /api/strategic/tax-structures returns tax structure data"""
        response = requests.get(f"{BASE_URL}/api/strategic/tax-structures")
        assert response.status_code == 200
        
        data = response.json()
        assert "tax_structures" in data
        tax_structures = data["tax_structures"]
        
        # Verify expected tax structures exist
        expected_structures = ["personal", "company", "trust", "smsf"]
        for structure in expected_structures:
            assert structure in tax_structures, f"Missing tax structure: {structure}"
            assert "name" in tax_structures[structure]
        
        print(f"✓ Tax structures API returned {len(tax_structures)} structures")
    
    def test_investment_comparison_basic(self):
        """Test POST /api/strategic/investment-comparison with basic parameters"""
        payload = {
            "investment_amount": 100000,
            "holding_period_years": 10,
            "marginal_tax_rate": 0.37,
            "asset_classes": ["au_shares", "property"],
            "tax_structures": ["personal", "smsf"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/strategic/investment-comparison",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify response structure
        assert "parameters" in data
        assert "all_results" in data
        assert "best_overall" in data
        assert "best_by_asset_class" in data
        assert "best_by_tax_structure" in data
        
        # Verify parameters echoed back
        assert data["parameters"]["investment_amount"] == 100000
        assert data["parameters"]["holding_period_years"] == 10
        
        # Verify results exist
        assert len(data["all_results"]) > 0
        
        # Verify result structure
        first_result = data["all_results"][0]
        assert "asset_class" in first_result
        assert "tax_structure" in first_result
        assert "gross_return" in first_result
        assert "after_tax_return" in first_result
        assert "total_tax" in first_result
        
        print(f"✓ Investment comparison returned {len(data['all_results'])} results")
        print(f"  Best overall: {data['best_overall']['asset_class']} in {data['best_overall']['tax_structure']}")
    
    def test_investment_comparison_all_assets(self):
        """Test investment comparison with all asset classes"""
        payload = {
            "investment_amount": 500000,
            "holding_period_years": 20,
            "marginal_tax_rate": 0.45,
            "asset_classes": ["au_shares", "international_shares", "property", "crypto", "bonds", "cash"],
            "tax_structures": ["personal", "company", "trust", "smsf"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/strategic/investment-comparison",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have 6 assets * 4 structures = 24 results
        assert len(data["all_results"]) == 24
        
        # Results should be sorted by after_tax_return descending
        returns = [r["after_tax_return"] for r in data["all_results"]]
        assert returns == sorted(returns, reverse=True), "Results not sorted by after_tax_return"
        
        print(f"✓ Full comparison returned {len(data['all_results'])} results (sorted correctly)")


class TestImportExportAPIs:
    """Import/Export API tests"""
    
    def test_get_client_template_json(self):
        """Test GET /api/import/template/client returns JSON template"""
        response = requests.get(f"{BASE_URL}/api/import/template/client?format=json")
        assert response.status_code == 200
        
        data = response.json()
        assert "template" in data
        assert "data_type" in data
        assert data["data_type"] == "client"
        
        template = data["template"]
        # Verify template has expected sections
        expected_sections = ["personal", "employment", "assets", "liabilities", "goals", "insurance"]
        for section in expected_sections:
            assert section in template, f"Missing template section: {section}"
        
        print(f"✓ Client template JSON returned with {len(template)} sections")
    
    def test_get_adviser_template_json(self):
        """Test GET /api/import/template/adviser returns JSON template"""
        response = requests.get(f"{BASE_URL}/api/import/template/adviser?format=json")
        assert response.status_code == 200
        
        data = response.json()
        assert "template" in data
        assert data["data_type"] == "adviser"
        
        print("✓ Adviser template JSON returned successfully")
    
    def test_get_client_template_csv(self):
        """Test GET /api/import/template/client?format=csv returns CSV file"""
        response = requests.get(f"{BASE_URL}/api/import/template/client?format=csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        
        # Verify it's valid CSV content
        content = response.text
        assert len(content) > 0
        assert "," in content  # CSV should have commas
        
        print("✓ Client template CSV returned successfully")
    
    def test_get_client_template_xlsx(self):
        """Test GET /api/import/template/client?format=xlsx returns Excel file"""
        response = requests.get(f"{BASE_URL}/api/import/template/client?format=xlsx")
        assert response.status_code == 200
        assert "spreadsheet" in response.headers.get("content-type", "")
        
        # Verify it's binary content (Excel file)
        assert len(response.content) > 0
        
        print("✓ Client template XLSX returned successfully")
    
    def test_export_clients_json(self):
        """Test GET /api/export/clients returns client data or 404 if no data"""
        response = requests.get(f"{BASE_URL}/api/export/clients?format=json")
        
        # Either returns data or 404 if no clients exist
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "clients" in data
            assert "total" in data
            print(f"✓ Export clients returned {data['total']} clients")
        else:
            print("✓ Export clients returned 404 (no client data - expected for fresh DB)")
    
    def test_export_advisers_json(self):
        """Test GET /api/export/advisers returns adviser data or 404 if no data"""
        response = requests.get(f"{BASE_URL}/api/export/advisers?format=json")
        
        # Either returns data or 404 if no advisers exist
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "advisers" in data
            assert "total" in data
            print(f"✓ Export advisers returned {data['total']} advisers")
        else:
            print("✓ Export advisers returned 404 (no adviser data - expected for fresh DB)")
    
    def test_invalid_data_type_template(self):
        """Test GET /api/import/template/invalid returns 400 error"""
        response = requests.get(f"{BASE_URL}/api/import/template/invalid")
        assert response.status_code == 400
        
        print("✓ Invalid data type correctly returns 400 error")


class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        
        print("✓ Health endpoint returns healthy")
    
    def test_root_endpoint(self):
        """Test /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        
        print("✓ Root endpoint returns API info")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
