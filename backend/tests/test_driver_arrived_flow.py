"""TAXIGO Backend - Driver arrival communication feature tests.

Covers new endpoints:
- POST /api/rides/{ride_id}/driver-arrived
- POST /api/rides/{ride_id}/driver-cannot-find
- POST /api/rides/{ride_id}/passenger-reply
- POST /api/push/subscribe (with user_id)
"""
import os
import sys
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

# Load backend .env
BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")

# Prefer local supervisor URL as requested in review
BASE_URL = os.environ.get("BACKEND_TEST_URL", "http://localhost:8001").rstrip("/")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


def _mk_user(role: str, name: str):
    """Directly seed a user + a session token in Mongo (bypass Emergent OAuth)."""
    user_id = f"user_TEST_{uuid.uuid4().hex[:10]}"
    email = f"TEST_{uuid.uuid4().hex[:6]}@taxigo-test.local"
    _db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "car_model": "Toyota Prius" if role == "driver" else None,
        "plate": "TEST 1234" if role == "driver" else None,
        "rating_avg": 5.0,
        "rating_count": 0,
        "is_online": False,
        "created_at": datetime.now(timezone.utc),
    })
    token = f"testtok_{uuid.uuid4().hex}"
    _db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
        "created_at": datetime.now(timezone.utc),
    })
    return user_id, token, email


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------- Shared fixtures ----------
@pytest.fixture(scope="module")
def users():
    p_id, p_tok, p_email = _mk_user("passenger", "TEST Passenger")
    d_id, d_tok, d_email = _mk_user("driver", "TEST Driver")
    d2_id, d2_tok, d2_email = _mk_user("driver", "TEST Driver2")
    yield {
        "pass_id": p_id, "pass_tok": p_tok, "pass_email": p_email,
        "drv_id": d_id, "drv_tok": d_tok, "drv_email": d_email,
        "drv2_id": d2_id, "drv2_tok": d2_tok, "drv2_email": d2_email,
    }
    # Cleanup
    for uid, email in [(p_id, p_email), (d_id, d_email), (d2_id, d2_email)]:
        _db.users.delete_many({"user_id": uid})
        _db.user_sessions.delete_many({"user_id": uid})
    _db.rides.delete_many({"passenger_id": p_id})


@pytest.fixture(scope="module")
def accepted_ride(users):
    """Create a ride as passenger, accept as driver."""
    payload = {
        "pickup_address": "TEST Pickup Warszawa",
        "pickup_lat": 52.2297, "pickup_lng": 21.0122,
        "dest_address": "TEST Dest Lotnisko",
        "dest_lat": 52.1657, "dest_lng": 20.9671,
        "distance_km": 12.5, "price_pln": 45.0,
        "passenger_phone": "+48500999888",
    }
    r = requests.post(f"{BASE_URL}/api/rides", headers=H(users["pass_tok"]), json=payload, timeout=15)
    assert r.status_code == 200, f"create ride failed: {r.status_code} {r.text}"
    ride_id = r.json()["ride_id"]
    r2 = requests.post(f"{BASE_URL}/api/rides/{ride_id}/accept", headers=H(users["drv_tok"]), timeout=15)
    assert r2.status_code == 200, f"accept failed: {r2.status_code} {r2.text}"
    assert r2.json()["status"] == "accepted"
    assert r2.json()["driver_id"] == users["drv_id"]
    return ride_id


# ============================================================
# 1. AUTH REQUIRED
# ============================================================
class TestAuthRequired:
    def test_driver_arrived_no_auth_401(self):
        r = requests.post(f"{BASE_URL}/api/rides/ride_dummy/driver-arrived", timeout=10)
        assert r.status_code == 401, r.text

    def test_driver_cannot_find_no_auth_401(self):
        r = requests.post(f"{BASE_URL}/api/rides/ride_dummy/driver-cannot-find", timeout=10)
        assert r.status_code == 401, r.text

    def test_passenger_reply_no_auth_401(self):
        r = requests.post(f"{BASE_URL}/api/rides/ride_dummy/passenger-reply",
                          json={"code": "coming"}, timeout=10)
        assert r.status_code == 401, r.text


# ============================================================
# 2. HAPPY PATH FLOW
# ============================================================
class TestHappyFlow:
    def test_driver_arrived_success(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/driver-arrived",
            headers=H(users["drv_tok"]), timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        assert body["event"]["kind"] == "driver_arrived"
        assert body["event"]["by"] == "driver"

    def test_passenger_sees_driver_arrived_in_active(self, users, accepted_ride):
        r = requests.get(f"{BASE_URL}/api/rides/active", headers=H(users["pass_tok"]), timeout=15)
        assert r.status_code == 200
        ride = r.json()
        assert ride is not None
        assert ride["ride_id"] == accepted_ride
        assert ride.get("last_event", {}).get("kind") == "driver_arrived"
        assert "_id" not in ride

    def test_driver_cannot_find_success(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/driver-cannot-find",
            headers=H(users["drv_tok"]), timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["event"]["kind"] == "driver_cannot_find"

    def test_passenger_reply_coming_success(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/passenger-reply",
            headers=H(users["pass_tok"]), json={"code": "coming"}, timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["event"]["kind"] == "passenger_reply_coming"
        assert body["event"]["code"] == "coming"
        assert body["event"]["by"] == "passenger"

    def test_driver_sees_passenger_reply_in_active(self, users, accepted_ride):
        r = requests.get(f"{BASE_URL}/api/rides/active", headers=H(users["drv_tok"]), timeout=15)
        assert r.status_code == 200
        ride = r.json()
        assert ride is not None
        assert ride["ride_id"] == accepted_ride
        assert ride.get("last_event", {}).get("kind") == "passenger_reply_coming"

    def test_passenger_reply_two_min(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/passenger-reply",
            headers=H(users["pass_tok"]), json={"code": "two_min"}, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["event"]["kind"] == "passenger_reply_two_min"

    def test_passenger_reply_cant_see_car(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/passenger-reply",
            headers=H(users["pass_tok"]), json={"code": "cant_see_car"}, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["event"]["kind"] == "passenger_reply_cant_see_car"


# ============================================================
# 3. AUTHORIZATION
# ============================================================
class TestAuthorization:
    def test_different_driver_cannot_arrive(self, users, accepted_ride):
        """Driver who did not accept the ride -> 404."""
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/driver-arrived",
            headers=H(users["drv2_tok"]), timeout=15,
        )
        assert r.status_code == 404, r.text

    def test_passenger_cannot_call_driver_arrived(self, users, accepted_ride):
        """Passenger calling driver-arrived -> 404 (filter mismatch)."""
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/driver-arrived",
            headers=H(users["pass_tok"]), timeout=15,
        )
        assert r.status_code == 404, r.text

    def test_passenger_cannot_call_driver_cannot_find(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/driver-cannot-find",
            headers=H(users["pass_tok"]), timeout=15,
        )
        assert r.status_code == 404, r.text

    def test_driver_cannot_call_passenger_reply(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/passenger-reply",
            headers=H(users["drv_tok"]), json={"code": "coming"}, timeout=15,
        )
        assert r.status_code == 404, r.text

    def test_driver_arrived_nonexistent_ride(self, users):
        r = requests.post(
            f"{BASE_URL}/api/rides/ride_doesnotexist/driver-arrived",
            headers=H(users["drv_tok"]), timeout=15,
        )
        assert r.status_code == 404


# ============================================================
# 4. INVALID PAYLOAD
# ============================================================
class TestInvalidPayload:
    def test_passenger_reply_invalid_code(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/passenger-reply",
            headers=H(users["pass_tok"]), json={"code": "bogus"}, timeout=15,
        )
        assert r.status_code == 422, r.text

    def test_passenger_reply_missing_code(self, users, accepted_ride):
        r = requests.post(
            f"{BASE_URL}/api/rides/{accepted_ride}/passenger-reply",
            headers=H(users["pass_tok"]), json={}, timeout=15,
        )
        assert r.status_code == 422, r.text


# ============================================================
# 5. PUSH SUBSCRIBE with user_id
# ============================================================
class TestPushSubscribeUserId:
    def test_subscribe_with_user_id_persists(self, users):
        endpoint = f"https://fcm.googleapis.com/fcm/send/TEST_{uuid.uuid4().hex[:12]}"
        payload = {
            "subscription": {
                "endpoint": endpoint,
                "keys": {"p256dh": "TEST_p256dh", "auth": "TEST_auth"},
            },
            "role": "driver",
            "label": "TEST driver PWA",
            "user_id": users["drv_id"],
        }
        try:
            r = requests.post(f"{BASE_URL}/api/push/subscribe", json=payload, timeout=15)
            assert r.status_code == 200, r.text
            assert r.json().get("ok") is True

            # Verify persisted with user_id
            doc = _db.push_subscriptions.find_one({"endpoint": endpoint})
            assert doc is not None
            assert doc.get("user_id") == users["drv_id"]
            assert doc.get("role") == "driver"
            assert doc.get("label") == "TEST driver PWA"
        finally:
            _db.push_subscriptions.delete_many({"endpoint": endpoint})

    def test_subscribe_without_user_id_stores_none(self):
        endpoint = f"https://fcm.googleapis.com/fcm/send/TEST_{uuid.uuid4().hex[:12]}"
        payload = {
            "subscription": {"endpoint": endpoint, "keys": {"p256dh": "x", "auth": "y"}},
            "role": "owner",
        }
        try:
            r = requests.post(f"{BASE_URL}/api/push/subscribe", json=payload, timeout=15)
            assert r.status_code == 200
            doc = _db.push_subscriptions.find_one({"endpoint": endpoint})
            assert doc is not None
            assert doc.get("user_id") is None
        finally:
            _db.push_subscriptions.delete_many({"endpoint": endpoint})

    def test_subscribe_upsert_updates_user_id(self, users):
        endpoint = f"https://fcm.googleapis.com/fcm/send/TEST_{uuid.uuid4().hex[:12]}"
        try:
            # First subscribe without user_id
            r = requests.post(f"{BASE_URL}/api/push/subscribe", json={
                "subscription": {"endpoint": endpoint, "keys": {"p256dh": "x", "auth": "y"}},
                "role": "passenger",
            }, timeout=15)
            assert r.status_code == 200

            # Now re-subscribe with user_id — should upsert
            r2 = requests.post(f"{BASE_URL}/api/push/subscribe", json={
                "subscription": {"endpoint": endpoint, "keys": {"p256dh": "x", "auth": "y"}},
                "role": "passenger",
                "user_id": users["pass_id"],
            }, timeout=15)
            assert r2.status_code == 200

            docs = list(_db.push_subscriptions.find({"endpoint": endpoint}))
            assert len(docs) == 1  # upsert, not duplicate
            assert docs[0].get("user_id") == users["pass_id"]
        finally:
            _db.push_subscriptions.delete_many({"endpoint": endpoint})

    def test_subscribe_missing_endpoint_400(self):
        r = requests.post(f"{BASE_URL}/api/push/subscribe", json={
            "subscription": {"keys": {"p256dh": "x", "auth": "y"}},
        }, timeout=15)
        assert r.status_code == 400
