"""Iter 214 backend tests — /api/analyze/smsf accepts non_concessional + expected_return params."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://decision-engine-109.preview.emergentagent.com").rstrip("/")


class TestSMSFAnalyze:
    def test_smsf_with_new_params(self):
        params = {
            "age": 45,
            "current_super_balance": 350000,
            "taxable_income": 200000,
            "employer_contribution": 23000,
            "salary_sacrifice": 7000,
            "personal_contribution": 0,
            "spouse_contribution": 0,
            "non_concessional_contribution": 15000,
            "expected_return": 6.5,
        }
        r = requests.post(f"{BASE_URL}/api/analyze/smsf", params=params, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["current_contributions"]["non_concessional"] == 15000
        assert d["current_contributions"]["total_non_concessional"] == 15000
        assert d["caps"]["non_concessional_remaining"] == 105000
        assert d["projections"]["assumed_return"] == 6.5
        # tolerance for floating point
        assert abs(d["projections"]["projected_balance_at_67"] - 3265928) < 5

    def test_smsf_defaults_when_new_params_omitted(self):
        """Backwards-compat: omit non_concessional_contribution + expected_return."""
        params = {
            "age": 40,
            "current_super_balance": 200000,
            "taxable_income": 150000,
            "employer_contribution": 15000,
            "salary_sacrifice": 5000,
            "personal_contribution": 0,
            "spouse_contribution": 0,
        }
        r = requests.post(f"{BASE_URL}/api/analyze/smsf", params=params, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["current_contributions"]["non_concessional"] == 0
        assert d["current_contributions"]["total_non_concessional"] == 0
        assert d["caps"]["non_concessional_remaining"] == 120000
        assert d["projections"]["assumed_return"] == 7.0

    def test_smsf_only_required_params(self):
        """Only the truly-required args."""
        r = requests.post(
            f"{BASE_URL}/api/analyze/smsf",
            params={"age": 30, "current_super_balance": 50000, "taxable_income": 80000},
            timeout=20,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["current_contributions"]["non_concessional"] == 0
        assert d["projections"]["assumed_return"] == 7.0
