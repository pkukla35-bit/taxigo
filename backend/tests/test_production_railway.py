"""Production Railway deployment verification tests.

Verifies backend deployment on Railway after fixing bloated requirements.txt bug.
Production URL: https://taxigo-production.up.railway.app
"""
import pytest
import requests

BASE_URL = "https://taxigo-production.up.railway.app"
ADMIN_PIN = "taxigo2025"

_created = {}


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
        "date": "2026-09-01",
        "time": "10:00",
        "name": "Prod Deploy Test",
        "phone": "+48 500 100 200",
        "email": "pkukla35@gmail.com",
        "notes": "Testing production deploy after slim requirements.txt fix",
        "lang": "pl",
    }


# Test 1: Backend is up
class TestBackendHealth:
    def test_root_endpoint(self, api):
        r = api.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "message" in data
        assert "TAXIGO" in data["message"], f"Expected 'TAXIGO API' in message, got: {data}"


# Test 2: NEW ride reservation endpoint is deployed
class TestNewReservationEndpoint:
    def test_create_reservation(self, api, reservation_payload):
        r = api.post(f"{BASE_URL}/api/rides/reservations", json=reservation_payload, timeout=30)
        assert r.status_code == 200, f"Endpoint should exist and return 200. Got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("ok") is True, f"Response missing ok=true: {data}"
        assert "reservation_id" in data, f"Response missing reservation_id: {data}"
        assert data["reservation_id"].startswith("rsv_"), f"reservation_id should start with rsv_: {data}"
        _created["id"] = data["reservation_id"]
        # email_sent may be false since RESEND_API_KEY not yet configured on Railway
        print(f"\n[INFO] Created reservation_id={data['reservation_id']}, email_sent={data.get('email_sent') or data.get('owner_notified')}, full response={data}")


# Test 3: Admin listing endpoint
class TestAdminListing:
    def test_list_with_admin_passcode(self, api):
        r = api.get(
            f"{BASE_URL}/api/rides/reservations",
            headers={"X-Admin-Passcode": ADMIN_PIN},
            timeout=30,
        )
        assert r.status_code == 200, f"Admin listing failed: {r.status_code}: {r.text}"
        items = r.json()
        assert isinstance(items, list), f"Expected list, got: {type(items)}"
        # Should contain reservation created in Test 2
        created_id = _created.get("id")
        if created_id:
            ids = [it.get("reservation_id") for it in items]
            assert created_id in ids, f"Created id {created_id} not found in admin listing. Got {len(ids)} items, first 5: {ids[:5]}"
        # Verify no _id leakage
        for it in items:
            assert "_id" not in it, f"MongoDB _id should be excluded: {it}"

    def test_list_wrong_passcode(self, api):
        r = api.get(
            f"{BASE_URL}/api/rides/reservations",
            headers={"X-Admin-Passcode": "wrong"},
            timeout=30,
        )
        assert r.status_code == 401, f"Expected 401 for wrong passcode: {r.status_code}"


# Test 4: Regression check - old endpoints still work
class TestRegression:
    def test_drivers_online(self, api):
        r = api.get(f"{BASE_URL}/api/drivers/online", timeout=30)
        assert r.status_code == 200, f"Drivers online endpoint broken: {r.status_code}: {r.text}"
        data = r.json()
        assert isinstance(data, list), f"Expected list from /drivers/online, got: {type(data)}"
