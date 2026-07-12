"""Backend tests for TAXIGO ride reservations feature (Resend email + admin path).

Covers:
  1. Health check (GET /api/)
  2. POST /api/rides/reservations (public, no auth) - Resend email should be sent
  3. GET /api/rides/reservations with admin passcode (X-Admin-Passcode: taxigo2025)
  4. Admin auth negative: wrong passcode -> 401
  5. Driver path with no auth -> 401/403 (should NOT leak reservations)
  6. requirements.txt sanity: length + expected packages present, dev packages absent
"""
import os
import pytest
import requests

BASE_URL = "http://localhost:8001/api"
ADMIN_PIN = "taxigo2025"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def reservation_payload():
    return {
        "pickup": {"name": "Krakow Central", "lat": 50.067, "lng": 19.947},
        "dest": {"name": "Zakopane", "lat": 49.299, "lng": 19.951},
        "distance_km": 105.5,
        "price_pln": 321.50,
        "date": "2026-08-15",
        "time": "09:00",
        "name": "TEST_User",
        "phone": "+48 500 100 200",
        "email": "pkukla35@gmail.com",
        "notes": "TEST_ reservation from pytest",
        "lang": "pl",
    }


# Module-level cache to pass created id between tests
_created = {}


# ============ 1. Health ============
class TestHealth:
    def test_root_api(self, api):
        r = api.get(f"{BASE_URL}/")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "message" in data
        assert "TAXIGO" in data["message"]


# ============ 2. Create reservation (public) ============
class TestCreateReservation:
    def test_create_reservation_success(self, api, reservation_payload):
        r = api.post(f"{BASE_URL}/rides/reservations", json=reservation_payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert "reservation_id" in data and data["reservation_id"].startswith("rsv_")
        # Resend imported + call succeeded => owner_notified True
        assert data.get("owner_notified") is True, f"Owner email should have been sent via Resend: {data}"
        _created["id"] = data["reservation_id"]

    def test_create_reservation_missing_field(self, api, reservation_payload):
        bad = dict(reservation_payload)
        bad.pop("phone")  # required field
        r = api.post(f"{BASE_URL}/rides/reservations", json=bad)
        assert r.status_code == 422, r.text


# ============ 3. Admin list reservations ============
class TestAdminListReservations:
    def test_list_with_admin_passcode(self, api):
        r = api.get(
            f"{BASE_URL}/rides/reservations",
            headers={"X-Admin-Passcode": ADMIN_PIN},
        )
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        ids = [it.get("reservation_id") for it in items]
        assert _created.get("id") in ids, f"Created id {_created.get('id')} not in list: {ids[:5]}"
        # Verify no _id leakage
        for it in items:
            assert "_id" not in it

    def test_list_wrong_admin_passcode(self, api):
        r = api.get(
            f"{BASE_URL}/rides/reservations",
            headers={"X-Admin-Passcode": "wrong-passcode"},
        )
        # check_admin raises 401
        assert r.status_code == 401, r.text

    def test_list_no_auth_no_passcode(self, api):
        # No admin passcode -> falls to driver path -> get_current_user should reject
        r = api.get(f"{BASE_URL}/rides/reservations")
        assert r.status_code in (401, 403), r.text


# ============ 6. requirements.txt sanity ============
class TestRequirementsFile:
    REQ_PATH = "/app/backend/requirements.txt"

    def test_line_count_short(self):
        with open(self.REQ_PATH) as f:
            lines = [ln.strip() for ln in f if ln.strip()]
        # Should be around 13 packages
        assert 10 <= len(lines) <= 20, f"requirements.txt should be slimmed (~13 lines), got {len(lines)}"

    def test_required_packages_present(self):
        with open(self.REQ_PATH) as f:
            content = f.read().lower()
        for pkg in ["fastapi", "motor", "resend", "stripe", "pydantic", "uvicorn"]:
            assert pkg in content, f"{pkg} missing from requirements.txt"
        assert "resend==2.32.2" in content, "resend must be pinned to 2.32.2"

    def test_dev_packages_absent(self):
        with open(self.REQ_PATH) as f:
            content = f.read().lower()
        for pkg in ["black", "flake8", "boto3", "google-genai", "mypy", "pytest"]:
            assert pkg not in content, f"Dev package {pkg} should not be in production requirements.txt"


# ============ Resend import check ============
class TestResendImport:
    def test_resend_module_importable(self):
        import importlib
        m = importlib.import_module("resend")
        assert m is not None
        # email_service uses resend.Emails.send
        assert hasattr(m, "Emails") or hasattr(m, "api_key")

    def test_email_service_loads(self):
        import sys
        sys.path.insert(0, "/app/backend")
        from email_service import _RESEND_READY, OWNER_CC
        assert _RESEND_READY is True, "Resend should be initialized with API key from .env"
        assert OWNER_CC == "pkukla35@gmail.com"
