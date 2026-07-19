"""TAXIGO Backend - Driver email+password authentication tests.

Covers:
- POST /api/admin/drivers  (create + upgrade + auth failures + validation)
- GET  /api/admin/drivers  (list)
- DELETE /api/admin/drivers/{user_id}
- POST /api/auth/driver-login (success, wrong pw, unknown email, lockout)
- Integration: driver_phone populated on accept_ride
- Non-regression: /api/auth/session endpoint still exists
"""
import os
import uuid
import time
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")

BASE_URL = os.environ.get("BACKEND_TEST_URL", "http://localhost:8001").rstrip("/")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
ADMIN_PASSCODE = os.environ.get("ADMIN_PASSCODE", "taxigo2025")

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


def _admin_hdr(passcode: str = ADMIN_PASSCODE):
    return {"X-Admin-Passcode": passcode, "Content-Type": "application/json"}


def _fresh_email(prefix="TEST_drv"):
    return f"{prefix}_{uuid.uuid4().hex[:10]}@taxigo-test.local"


def _fresh_payload(email=None):
    return {
        "email": email or _fresh_email(),
        "password": "MocneHaslo123",
        "name": "TEST Driver",
        "phone": "+48500100200",
        "car_model": "Toyota Camry",
        "plate": "kr12345",
    }


@pytest.fixture(autouse=True)
def _cleanup_between_tests():
    """Clean TEST_ users and their sessions/rides before + after each test."""
    def _wipe():
        emails = list(_db.users.find({"email": {"$regex": "^TEST_"}}, {"user_id": 1, "email": 1}))
        ids = [u["user_id"] for u in emails]
        if ids:
            _db.user_sessions.delete_many({"user_id": {"$in": ids}})
            _db.rides.delete_many({"$or": [{"passenger_id": {"$in": ids}}, {"driver_id": {"$in": ids}}]})
        _db.users.delete_many({"email": {"$regex": "^TEST_"}})
    _wipe()
    yield
    _wipe()


# ============================================================
# 1. ADMIN CREATES NEW DRIVER
# ============================================================
class TestAdminCreateNewDriver:
    def test_create_new_driver_success(self):
        payload = _fresh_payload()
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=payload, headers=_admin_hdr(), timeout=15)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body.get("upgraded") is not True, "Fresh driver must not have upgraded=true"
        user = body["user"]
        assert user["email"] == payload["email"].lower()
        assert user["role"] == "driver"
        assert user["phone"] == payload["phone"]
        assert user["car_model"] == payload["car_model"]
        assert user["plate"] == payload["plate"].upper()
        assert "password_hash" not in user, "password_hash MUST NOT leak in response"
        assert "_id" not in user

        # Verify persistence
        doc = _db.users.find_one({"email": payload["email"].lower()})
        assert doc is not None
        assert doc.get("password_hash", "").startswith("$2b$"), "password should be bcrypt hashed"
        assert doc.get("auth_provider") == "password"


# ============================================================
# 2. ADMIN UPGRADES EXISTING USER
# ============================================================
class TestAdminUpgradeExistingUser:
    def test_upgrade_existing_passenger_to_driver(self):
        # 1) Seed a passenger with a live session (lowercased email — API stores lowercased)
        email = _fresh_email().lower()
        user_id = f"user_TEST_{uuid.uuid4().hex[:8]}"
        _db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": "TEST Passenger",
            "role": "passenger",
            "created_at": datetime.now(timezone.utc),
        })
        old_token = f"old_session_{uuid.uuid4().hex}"
        _db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": old_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
            "created_at": datetime.now(timezone.utc),
        })

        # 2) Upgrade
        payload = _fresh_payload(email=email)
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=payload, headers=_admin_hdr(), timeout=15)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body.get("upgraded") is True, "Existing user upgrade must set upgraded=true"

        user = body["user"]
        assert user["user_id"] == user_id, "user_id preserved on upgrade"
        assert user["role"] == "driver"
        assert user["phone"] == payload["phone"]
        assert user["car_model"] == payload["car_model"]
        assert user["plate"] == payload["plate"].upper()
        assert "password_hash" not in user

        # 3) Prior sessions revoked
        remaining = _db.user_sessions.count_documents({"user_id": user_id})
        assert remaining == 0, "All existing sessions must be deleted after upgrade"

        # 4) Password now works
        r2 = requests.post(f"{BASE_URL}/api/auth/driver-login",
                           json={"email": email, "password": payload["password"]}, timeout=15)
        assert r2.status_code == 200, r2.text


# ============================================================
# 3. ADMIN AUTH
# ============================================================
class TestAdminAuth:
    def test_missing_passcode_rejected(self):
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=_fresh_payload(),
                          headers={"Content-Type": "application/json"}, timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_wrong_passcode_rejected(self):
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=_fresh_payload(),
                          headers=_admin_hdr("wrong-code-xyz"), timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_list_drivers_requires_passcode(self):
        r = requests.get(f"{BASE_URL}/api/admin/drivers", timeout=15)
        assert r.status_code in (401, 403)

    def test_list_drivers_success(self):
        # create one
        p = _fresh_payload()
        requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        r = requests.get(f"{BASE_URL}/api/admin/drivers", headers=_admin_hdr(), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "drivers" in body and "count" in body
        emails = [d["email"] for d in body["drivers"]]
        assert p["email"].lower() in emails
        # password_hash never included
        for d in body["drivers"]:
            assert "password_hash" not in d

    def test_delete_driver(self):
        p = _fresh_payload()
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        user_id = r.json()["user"]["user_id"]
        r2 = requests.delete(f"{BASE_URL}/api/admin/drivers/{user_id}", headers=_admin_hdr(), timeout=15)
        assert r2.status_code == 200
        assert _db.users.find_one({"user_id": user_id}) is None

    def test_delete_unknown_driver_404(self):
        r = requests.delete(f"{BASE_URL}/api/admin/drivers/does_not_exist", headers=_admin_hdr(), timeout=15)
        assert r.status_code == 404


# ============================================================
# 4. PAYLOAD VALIDATION
# ============================================================
class TestPayloadValidation:
    def test_missing_fields_422(self):
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json={"email": _fresh_email()},
                          headers=_admin_hdr(), timeout=15)
        assert r.status_code == 422, r.text

    def test_short_password_422(self):
        p = _fresh_payload()
        p["password"] = "short"
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        assert r.status_code == 422, r.text

    def test_invalid_email_400(self):
        p = _fresh_payload()
        p["email"] = "not-an-email"
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        assert r.status_code == 400, r.text


# ============================================================
# 5. DRIVER LOGIN SUCCESS
# ============================================================
class TestDriverLoginSuccess:
    def test_login_returns_token_and_user(self):
        p = _fresh_payload()
        r = requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        assert r.status_code == 201

        r2 = requests.post(f"{BASE_URL}/api/auth/driver-login",
                           json={"email": p["email"], "password": p["password"]}, timeout=15)
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert "session_token" in body and body["session_token"]
        assert "user" in body
        assert body["user"]["email"] == p["email"].lower()
        assert body["user"]["role"] == "driver"
        assert "password_hash" not in body["user"]

    def test_token_works_for_auth_me(self):
        p = _fresh_payload()
        requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        r2 = requests.post(f"{BASE_URL}/api/auth/driver-login",
                           json={"email": p["email"], "password": p["password"]}, timeout=15)
        token = r2.json()["session_token"]
        r3 = requests.get(f"{BASE_URL}/api/auth/me",
                          headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r3.status_code == 200, r3.text
        me = r3.json()
        assert me["email"] == p["email"].lower()
        assert me["role"] == "driver"
        assert me["phone"] == p["phone"]

    def test_success_resets_failed_count(self):
        p = _fresh_payload()
        requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        # 2 wrong tries
        for _ in range(2):
            requests.post(f"{BASE_URL}/api/auth/driver-login",
                          json={"email": p["email"], "password": "WRONG_PW"}, timeout=15)
        doc = _db.users.find_one({"email": p["email"].lower()})
        assert doc.get("failed_login_count", 0) == 2

        # correct login
        r2 = requests.post(f"{BASE_URL}/api/auth/driver-login",
                           json={"email": p["email"], "password": p["password"]}, timeout=15)
        assert r2.status_code == 200
        doc = _db.users.find_one({"email": p["email"].lower()})
        assert doc.get("failed_login_count") == 0
        assert doc.get("last_login_at") is not None


# ============================================================
# 6. DRIVER LOGIN FAILURES + LOCKOUT
# ============================================================
class TestDriverLoginFailures:
    def test_wrong_password_401_generic(self):
        p = _fresh_payload()
        requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        r = requests.post(f"{BASE_URL}/api/auth/driver-login",
                         json={"email": p["email"], "password": "wrong_pw"}, timeout=15)
        assert r.status_code == 401
        assert "invalid" in r.json().get("detail", "").lower()

    def test_unknown_email_401_generic_same_message(self):
        r_unknown = requests.post(f"{BASE_URL}/api/auth/driver-login",
                                  json={"email": _fresh_email(), "password": "AnyPass123"}, timeout=15)
        assert r_unknown.status_code == 401
        # Create a driver and try wrong password to compare messages
        p = _fresh_payload()
        requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        r_wrong = requests.post(f"{BASE_URL}/api/auth/driver-login",
                                json={"email": p["email"], "password": "wrong_pw"}, timeout=15)
        assert r_wrong.status_code == 401
        # No enumeration hint — both must return same detail
        assert r_unknown.json().get("detail") == r_wrong.json().get("detail")

    def test_lockout_after_5_wrong_attempts(self):
        p = _fresh_payload()
        requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        # 5 wrong attempts
        for i in range(5):
            r = requests.post(f"{BASE_URL}/api/auth/driver-login",
                             json={"email": p["email"], "password": "wrong_pw"}, timeout=15)
            assert r.status_code == 401, f"attempt {i+1}: {r.status_code} {r.text}"
        # 6th attempt should be 423 (locked)
        r6 = requests.post(f"{BASE_URL}/api/auth/driver-login",
                          json={"email": p["email"], "password": "wrong_pw"}, timeout=15)
        assert r6.status_code == 423, r6.text
        assert "lock" in r6.json().get("detail", "").lower()

        # Even correct password fails while locked
        r_correct = requests.post(f"{BASE_URL}/api/auth/driver-login",
                                 json={"email": p["email"], "password": p["password"]}, timeout=15)
        assert r_correct.status_code == 423, r_correct.text

        # Verify lockout timestamp in DB (~15 min ahead)
        doc = _db.users.find_one({"email": p["email"].lower()})
        assert doc.get("locked_until") is not None


# ============================================================
# 7. FULL INTEGRATION - driver_phone on ride
# ============================================================
class TestDriverPhoneOnRide:
    def test_driver_phone_populated_after_accept(self):
        # Create driver
        p = _fresh_payload()
        requests.post(f"{BASE_URL}/api/admin/drivers", json=p, headers=_admin_hdr(), timeout=15)
        r = requests.post(f"{BASE_URL}/api/auth/driver-login",
                         json={"email": p["email"], "password": p["password"]}, timeout=15)
        drv_tok = r.json()["session_token"]

        # Guest passenger
        guest_id = f"guest_TEST_{uuid.uuid4().hex[:8]}"
        guest_hdr = {"Authorization": f"Bearer guest:{guest_id}", "Content-Type": "application/json"}
        # Auto-provisions on any authed call — hit /auth/me first
        me = requests.get(f"{BASE_URL}/api/auth/me", headers=guest_hdr, timeout=15)
        assert me.status_code == 200
        # Guests default to passenger — good.

        # Passenger creates ride
        ride_payload = {
            "pickup_address": "TEST Pickup", "pickup_lat": 50.06, "pickup_lng": 19.94,
            "dest_address": "TEST Dest", "dest_lat": 50.07, "dest_lng": 19.95,
            "distance_km": 5.0, "price_pln": 25.0,
            "passenger_phone": "+48500999888",
        }
        rc = requests.post(f"{BASE_URL}/api/rides", headers=guest_hdr, json=ride_payload, timeout=15)
        assert rc.status_code == 200, rc.text
        ride_id = rc.json()["ride_id"]

        # Driver accepts
        ra = requests.post(f"{BASE_URL}/api/rides/{ride_id}/accept",
                          headers={"Authorization": f"Bearer {drv_tok}"}, timeout=15)
        assert ra.status_code == 200, ra.text
        accepted = ra.json()
        assert accepted["driver_phone"] == p["phone"], f"driver_phone should be set on accept, got {accepted.get('driver_phone')}"

        # Passenger fetches /api/rides/active
        act = requests.get(f"{BASE_URL}/api/rides/active", headers=guest_hdr, timeout=15)
        assert act.status_code == 200
        ride = act.json()
        assert ride is not None
        assert ride["ride_id"] == ride_id
        assert ride.get("driver_phone") == p["phone"], f"driver_phone missing on active ride: {ride.get('driver_phone')}"

        # Cleanup guest
        _db.users.delete_many({"user_id": guest_id})
        _db.rides.delete_many({"passenger_id": guest_id})


# ============================================================
# 8. GOOGLE LOGIN ENDPOINT STILL EXISTS
# ============================================================
class TestGoogleLoginNotRemoved:
    def test_auth_session_endpoint_still_present(self):
        # Invalid session_id should reach the Emergent backend and return 401
        r = requests.post(f"{BASE_URL}/api/auth/session",
                         json={"session_id": "definitely-not-valid", "role": "passenger"}, timeout=20)
        # Endpoint exists = not 404. Expected 401 (invalid), but 400/500 also acceptable — just not 404
        assert r.status_code != 404, f"/api/auth/session was removed: {r.status_code} {r.text}"
