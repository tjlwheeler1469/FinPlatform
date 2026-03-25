"""
Test Suite for Platform Integrations & Client Profile Retirement Features
Iteration 100 - Testing AMP North, Netwealth, Hub24, Class, IRESS integrations
and multi-structure retirement calculations

Features tested:
- Platform Integrations: 5 platforms with bi-directional sync
- Client Profile Retirement: Multi-structure calculations
- Write-back capabilities: file_notes, scenarios, documents
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPlatformIntegrationsAvailable:
    """Test GET /api/platforms/available - Returns 5 platforms with bidirectional=True"""
    
    def test_get_available_platforms(self):
        """Test that 5 platforms are returned with bidirectional support"""
        response = requests.get(f"{BASE_URL}/api/platforms/available")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "platforms" in data, "Response should contain 'platforms' key"
        assert "total_platforms" in data, "Response should contain 'total_platforms' key"
        
        platforms = data["platforms"]
        assert len(platforms) == 5, f"Expected 5 platforms, got {len(platforms)}"
        
        # Verify all 5 platforms are present
        platform_ids = [p["platform_id"] for p in platforms]
        expected_platforms = ["amp_north", "netwealth", "hub24", "class", "iress"]
        for expected in expected_platforms:
            assert expected in platform_ids, f"Platform {expected} not found"
        
        # Verify all platforms have bidirectional=True
        for platform in platforms:
            assert platform.get("bidirectional") == True, f"Platform {platform['platform_id']} should have bidirectional=True"
            assert "read_capabilities" in platform, f"Platform {platform['platform_id']} missing read_capabilities"
            assert "write_capabilities" in platform, f"Platform {platform['platform_id']} missing write_capabilities"
        
        print(f"PASS: GET /api/platforms/available - {len(platforms)} platforms with bidirectional support")


class TestPlatformConnect:
    """Test POST /api/platforms/connect/{platform} - Demo mode connection"""
    
    def test_connect_amp_north_demo(self):
        """Test connecting to AMP North in demo mode"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/connect/amp_north",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "connected", "Status should be 'connected'"
        assert data.get("mode") == "demo", "Mode should be 'demo'"
        assert data.get("platform") == "amp_north", "Platform should be 'amp_north'"
        assert data.get("bidirectional") == True, "Should have bidirectional=True"
        
        print("PASS: POST /api/platforms/connect/amp_north - Connected in demo mode")
    
    def test_connect_netwealth_demo(self):
        """Test connecting to Netwealth in demo mode"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/connect/netwealth",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "connected"
        assert data.get("mode") == "demo"
        print("PASS: POST /api/platforms/connect/netwealth - Connected in demo mode")
    
    def test_connect_hub24_demo(self):
        """Test connecting to Hub24 in demo mode"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/connect/hub24",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "connected"
        print("PASS: POST /api/platforms/connect/hub24 - Connected in demo mode")
    
    def test_connect_class_demo(self):
        """Test connecting to Class in demo mode"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/connect/class",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "connected"
        print("PASS: POST /api/platforms/connect/class - Connected in demo mode")
    
    def test_connect_iress_demo(self):
        """Test connecting to IRESS in demo mode"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/connect/iress",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "connected"
        print("PASS: POST /api/platforms/connect/iress - Connected in demo mode")


class TestPlatformStatus:
    """Test GET /api/platforms/status - Connection status for all platforms"""
    
    def test_get_connection_status(self):
        """Test getting connection status for all platforms"""
        response = requests.get(f"{BASE_URL}/api/platforms/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "connections" in data, "Response should contain 'connections' key"
        
        connections = data["connections"]
        assert len(connections) == 5, f"Expected 5 connections, got {len(connections)}"
        
        for conn in connections:
            assert "platform" in conn, "Connection should have 'platform' key"
            assert "status" in conn, "Connection should have 'status' key"
            assert "name" in conn, "Connection should have 'name' key"
        
        print(f"PASS: GET /api/platforms/status - {len(connections)} platform statuses returned")


class TestPlatformClients:
    """Test GET /api/platforms/{platform}/clients - Fetch mock client data"""
    
    def test_get_amp_north_clients(self):
        """Test fetching clients from AMP North"""
        response = requests.get(f"{BASE_URL}/api/platforms/amp_north/clients")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "clients" in data, "Response should contain 'clients' key"
        assert "total" in data, "Response should contain 'total' key"
        assert data["platform"] == "amp_north", "Platform should be 'amp_north'"
        
        clients = data["clients"]
        assert len(clients) > 0, "Should have at least one client"
        
        # Verify client structure
        client = clients[0]
        assert "client_id" in client, "Client should have 'client_id'"
        assert "name" in client, "Client should have 'name'"
        
        print(f"PASS: GET /api/platforms/amp_north/clients - {len(clients)} clients returned")
    
    def test_get_class_clients(self):
        """Test fetching SMSF clients from Class"""
        response = requests.get(f"{BASE_URL}/api/platforms/class/clients")
        assert response.status_code == 200
        
        data = response.json()
        clients = data.get("clients", [])
        assert len(clients) > 0, "Should have at least one SMSF client"
        
        # Class clients should have fund_name instead of name
        client = clients[0]
        assert "fund_name" in client or "name" in client, "Client should have fund_name or name"
        
        print(f"PASS: GET /api/platforms/class/clients - {len(clients)} SMSF clients returned")


class TestPlatformClientDetail:
    """Test GET /api/platforms/{platform}/clients/{client_id} - Client with portfolio"""
    
    def test_get_client_detail_with_portfolio(self):
        """Test fetching client detail with portfolio from AMP North"""
        response = requests.get(f"{BASE_URL}/api/platforms/amp_north/clients/AMP-001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "client" in data, "Response should contain 'client' key"
        assert "portfolio" in data, "Response should contain 'portfolio' key"
        
        portfolio = data["portfolio"]
        if portfolio:
            assert "holdings" in portfolio, "Portfolio should have 'holdings'"
            assert "total_value" in portfolio, "Portfolio should have 'total_value'"
        
        print("PASS: GET /api/platforms/amp_north/clients/AMP-001 - Client with portfolio returned")


class TestPlatformSync:
    """Test POST /api/platforms/sync - Bi-directional sync"""
    
    def test_sync_platform_bidirectional(self):
        """Test bi-directional sync with a platform"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/sync",
            json={
                "platform": "amp_north",
                "data_categories": ["client", "portfolio", "balance"],
                "direction": "bidirectional"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "sync_id" in data, "Response should contain 'sync_id'"
        assert "status" in data, "Response should contain 'status'"
        assert data.get("status") == "success", "Sync status should be 'success'"
        assert data.get("direction") == "bidirectional", "Direction should be 'bidirectional'"
        assert "inbound_records" in data, "Response should contain 'inbound_records'"
        
        print(f"PASS: POST /api/platforms/sync - Sync completed with {data.get('inbound_records', 0)} inbound records")


class TestPlatformWriteBack:
    """Test POST /api/platforms/write-back - Push data back to platform"""
    
    def test_write_file_note(self):
        """Test writing a file note back to platform"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/write-back",
            json={
                "platform": "amp_north",
                "client_id": "AMP-001",
                "data_type": "file_note",
                "data": {
                    "title": "TEST_Annual Review Meeting",
                    "content": "Discussed retirement planning and portfolio rebalancing",
                    "date": "2026-01-15"
                },
                "notes": "Test file note from AdviceOS"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "success", "Write status should be 'success'"
        assert "write_id" in data, "Response should contain 'write_id'"
        assert data.get("data_type") == "file_note", "Data type should be 'file_note'"
        
        print(f"PASS: POST /api/platforms/write-back (file_note) - Write ID: {data.get('write_id')}")
    
    def test_write_scenario(self):
        """Test writing a scenario back to platform"""
        response = requests.post(
            f"{BASE_URL}/api/platforms/write-back",
            json={
                "platform": "netwealth",
                "client_id": "NW-001",
                "data_type": "scenario",
                "data": {
                    "scenario_name": "TEST_Retirement at 65",
                    "projected_balance": 1500000,
                    "annual_income": 75000
                },
                "notes": "Test scenario from AdviceOS"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("data_type") == "scenario"
        
        print("PASS: POST /api/platforms/write-back (scenario) - Scenario written successfully")


class TestSyncLogs:
    """Test GET /api/platforms/sync-logs - Audit logs"""
    
    def test_get_sync_logs(self):
        """Test fetching sync audit logs"""
        response = requests.get(f"{BASE_URL}/api/platforms/sync-logs?limit=20")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "logs" in data, "Response should contain 'logs' key"
        assert "total" in data, "Response should contain 'total' key"
        
        logs = data["logs"]
        if len(logs) > 0:
            log = logs[0]
            assert "log_id" in log, "Log should have 'log_id'"
            assert "platform" in log, "Log should have 'platform'"
            assert "direction" in log, "Log should have 'direction'"
            assert "timestamp" in log, "Log should have 'timestamp'"
        
        print(f"PASS: GET /api/platforms/sync-logs - {len(logs)} logs returned")


class TestDemoAllClients:
    """Test GET /api/platforms/demo/all-clients - All clients from all platforms"""
    
    def test_get_all_demo_clients(self):
        """Test fetching all demo clients across platforms"""
        response = requests.get(f"{BASE_URL}/api/platforms/demo/all-clients")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "clients" in data, "Response should contain 'clients' key"
        assert "total_clients" in data, "Response should contain 'total_clients' key"
        assert "platforms_included" in data, "Response should contain 'platforms_included' key"
        
        clients = data["clients"]
        assert len(clients) > 0, "Should have at least one client"
        
        # Verify clients from multiple platforms
        platforms = set(c["platform"] for c in clients)
        assert len(platforms) >= 3, f"Should have clients from at least 3 platforms, got {len(platforms)}"
        
        print(f"PASS: GET /api/platforms/demo/all-clients - {len(clients)} clients from {len(platforms)} platforms")


class TestDemoPortfolioSummary:
    """Test GET /api/platforms/demo/portfolio-summary - Total AUM"""
    
    def test_get_portfolio_summary(self):
        """Test fetching portfolio summary with total AUM"""
        response = requests.get(f"{BASE_URL}/api/platforms/demo/portfolio-summary")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total_aum" in data, "Response should contain 'total_aum' key"
        assert "total_portfolios" in data, "Response should contain 'total_portfolios' key"
        assert "portfolios" in data, "Response should contain 'portfolios' key"
        
        total_aum = data["total_aum"]
        assert total_aum > 0, "Total AUM should be greater than 0"
        
        portfolios = data["portfolios"]
        assert len(portfolios) > 0, "Should have at least one portfolio"
        
        print(f"PASS: GET /api/platforms/demo/portfolio-summary - Total AUM: ${total_aum:,.2f}")


class TestClientProfileStructures:
    """Test GET /api/client-profile/structures - 6 structure types"""
    
    def test_get_available_structures(self):
        """Test fetching available entity structures"""
        response = requests.get(f"{BASE_URL}/api/client-profile/structures")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "structures" in data, "Response should contain 'structures' key"
        
        structures = data["structures"]
        assert len(structures) == 6, f"Expected 6 structures, got {len(structures)}"
        
        # Verify all 6 structure types
        structure_ids = [s["id"] for s in structures]
        expected_structures = ["personal", "joint", "company", "trust", "smsf", "super_fund"]
        for expected in expected_structures:
            assert expected in structure_ids, f"Structure {expected} not found"
        
        # Verify structure has required fields
        for structure in structures:
            assert "id" in structure, "Structure should have 'id'"
            assert "name" in structure, "Structure should have 'name'"
            assert "description" in structure, "Structure should have 'description'"
            assert "tax_treatment" in structure, "Structure should have 'tax_treatment'"
        
        print(f"PASS: GET /api/client-profile/structures - {len(structures)} structure types returned")


class TestMultiStructureCalculation:
    """Test POST /api/client-profile/multi-structure/calculate - Combined projection"""
    
    def test_multi_structure_accumulation(self):
        """Test multi-structure accumulation calculation"""
        response = requests.post(
            f"{BASE_URL}/api/client-profile/multi-structure/calculate",
            json={
                "client_id": "TEST_CLIENT_001",
                "client_name": "Test Client",
                "calculation_type": "accumulation",
                "current_age": 45,
                "retirement_age": 65,
                "gender": "male",
                "investment_profile": "balanced",
                "inflation_rate": 2.5,
                "include_age_pension": True,
                "structures": [
                    {
                        "structure": "personal",
                        "name": "Personal Assets",
                        "super_balance": 500000,
                        "investment_balance": 200000,
                        "property_value": 0,
                        "cash_balance": 50000,
                        "liabilities": 0
                    },
                    {
                        "structure": "joint",
                        "name": "Joint Assets",
                        "super_balance": 0,
                        "investment_balance": 150000,
                        "property_value": 800000,
                        "cash_balance": 30000,
                        "liabilities": 400000
                    },
                    {
                        "structure": "smsf",
                        "name": "Family SMSF",
                        "super_balance": 800000,
                        "investment_balance": 0,
                        "property_value": 0,
                        "cash_balance": 100000,
                        "liabilities": 0
                    }
                ]
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "calculation_id" in data, "Response should contain 'calculation_id'"
        assert data.get("is_multi_structure") == True, "Should be multi-structure calculation"
        assert "current_position" in data, "Response should contain 'current_position'"
        assert "projected_position" in data, "Response should contain 'projected_position'"
        assert "structure_breakdown" in data, "Response should contain 'structure_breakdown'"
        
        # Verify structure breakdown
        breakdown = data["structure_breakdown"]
        assert len(breakdown) == 3, f"Expected 3 structures in breakdown, got {len(breakdown)}"
        
        # Verify current position totals
        current = data["current_position"]
        assert current["total_super"] == 1300000, "Total super should be 1,300,000"
        assert current["structures_count"] == 3, "Should have 3 structures"
        
        print(f"PASS: POST /api/client-profile/multi-structure/calculate - Calculation ID: {data.get('calculation_id')}")
    
    def test_multi_structure_decumulation(self):
        """Test multi-structure decumulation calculation"""
        response = requests.post(
            f"{BASE_URL}/api/client-profile/multi-structure/calculate",
            json={
                "client_id": "TEST_CLIENT_002",
                "client_name": "Test Retiree",
                "calculation_type": "decumulation",
                "current_age": 67,
                "retirement_age": 67,
                "gender": "female",
                "investment_profile": "conservative",
                "inflation_rate": 2.5,
                "include_age_pension": True,
                "drawdown_strategy": "minimum",
                "target_income": 80000,
                "structures": [
                    {
                        "structure": "personal",
                        "name": "Personal",
                        "super_balance": 0,
                        "investment_balance": 300000,
                        "property_value": 0,
                        "cash_balance": 100000,
                        "liabilities": 0
                    },
                    {
                        "structure": "smsf",
                        "name": "SMSF Pension",
                        "super_balance": 1200000,
                        "investment_balance": 0,
                        "property_value": 0,
                        "cash_balance": 50000,
                        "liabilities": 0
                    }
                ]
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("calculation_type") == "decumulation"
        assert "decumulation" in data, "Response should contain 'decumulation' key"
        
        decumulation = data["decumulation"]
        assert "projected_annual_income" in decumulation, "Should have projected_annual_income"
        assert "years_funds_projected_to_last" in decumulation, "Should have years_funds_projected_to_last"
        
        print(f"PASS: POST /api/client-profile/multi-structure/calculate (decumulation) - Income: ${decumulation.get('projected_annual_income', 0):,.2f}")


class TestRetirementDataSave:
    """Test POST /api/client-profile/retirement/save - Save to client profile"""
    
    def test_save_retirement_data(self):
        """Test saving retirement calculation to client profile"""
        response = requests.post(
            f"{BASE_URL}/api/client-profile/retirement/save",
            json={
                "client_id": "TEST_CLIENT_003",
                "client_name": "Test Saver",
                "calculation_type": "accumulation",
                "calculation_id": "TEST_CALC_001",
                "calculation_data": {
                    "summary": {
                        "projected_final_balance": 2500000,
                        "projected_final_balance_real": 1800000,
                        "total_contributions": 500000,
                        "current_age": 45,
                        "retirement_age": 65
                    },
                    "investment": {
                        "profile": "balanced",
                        "allocation": {
                            "australian_equities": 30,
                            "international_equities": 30,
                            "fixed_income": 25,
                            "cash": 15
                        }
                    }
                },
                "structures": [
                    {
                        "structure": "personal",
                        "super_balance": 500000,
                        "investment_balance": 200000,
                        "property_value": 0,
                        "cash_balance": 50000,
                        "liabilities": 0
                    }
                ]
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "success", "Status should be 'success'"
        assert data.get("profile_updated") == True, "Profile should be updated"
        assert data.get("calculation_type") == "accumulation"
        
        print(f"PASS: POST /api/client-profile/retirement/save - Profile updated for {data.get('client_id')}")


class TestHealthCheck:
    """Test API health check"""
    
    def test_health_check(self):
        """Test that the API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "healthy", "Status should be 'healthy'"
        
        # Verify platform_integrations and client_profile_retirement are enabled
        adviceos = data.get("adviceos", {})
        assert adviceos.get("platform_integrations") == True, "platform_integrations should be enabled"
        assert adviceos.get("client_profile_retirement") == True, "client_profile_retirement should be enabled"
        
        print("PASS: Health check - API healthy with platform integrations enabled")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
