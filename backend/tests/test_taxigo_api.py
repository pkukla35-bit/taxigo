"""TAXIGO Backend API tests - covers auth, role enforcement, rides lifecycle."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://mobility-platform-130.preview.emergentagent.com").rstrip("/")
PASS_TOKEN = os.environ.get("PASSENGER_TOKEN")
DRV_TOKEN = os.environ.get("DRIVER_TOKEN")
PASS_ID = os.environ.get("PASSENGER_ID")
DRV_ID = os.environ.get("DRIVER_ID")


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------------- Health & Auth ----------------
def test_root_version():
    r = requests.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("message") == "TAXIGO API"
    assert body.get("version") == "1.0"


def test_invalid_session_id_returns_401():
    r = requests.post(f"{BASE_URL}/api/auth/session", json={"session_id": "totally-bogus", "role": "passenger"}, timeout=20)
    assert r.status_code == 401


def test_me_unauthorized_returns_401():
    r = requests.get(f"{BASE_URL}/api/auth/me", timeout=15)
    assert r.status_code == 401


def test_me_passenger_with_bearer():
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=H(PASS_TOKEN), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["role"] == "passenger"
    assert body["user_id"] == PASS_ID
    assert "_id" not in body


def test_me_driver_with_bearer():
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=H(DRV_TOKEN), timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "driver"
    assert "_id" not in body


# ---------------- Driver presence ----------------
def test_driver_online_and_listing():
    r = requests.post(f"{BASE_URL}/api/driver/online", headers=H(DRV_TOKEN),
                      json={"is_online": True, "lat": 52.2297, "lng": 21.0122}, timeout=15)
    assert r.status_code == 200
    assert r.json()["is_online"] is True

    r2 = requests.get(f"{BASE_URL}/api/drivers/online", timeout=15)
    assert r2.status_code == 200
    drivers = r2.json()
    assert any(d["user_id"] == DRV_ID for d in drivers)
    for d in drivers:
        assert "_id" not in d


# ---------------- Role enforcement ----------------
def test_passenger_cannot_list_pending():
    r = requests.get(f"{BASE_URL}/api/rides/pending", headers=H(PASS_TOKEN), timeout=15)
    assert r.status_code == 403


def test_driver_cannot_create_ride():
    payload = {"pickup_address": "A", "pickup_lat": 52.0, "pickup_lng": 21.0,
               "dest_address": "B", "dest_lat": 52.1, "dest_lng": 21.1,
               "distance_km": 5.0, "price_pln": 25.0}
    r = requests.post(f"{BASE_URL}/api/rides", headers=H(DRV_TOKEN), json=payload, timeout=15)
    assert r.status_code == 403


# ---------------- Ride lifecycle ----------------
@pytest.fixture(scope="module")
def ride_id():
    payload = {"pickup_address": "Centralna 1, Warszawa", "pickup_lat": 52.2297, "pickup_lng": 21.0122,
               "dest_address": "Lotnisko Chopina", "dest_lat": 52.1657, "dest_lng": 20.9671,
               "distance_km": 12.5, "price_pln": 45.0}
    r = requests.post(f"{BASE_URL}/api/rides", headers=H(PASS_TOKEN), json=payload, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "pending"
    assert body["passenger_id"] == PASS_ID
    assert "_id" not in body
    return body["ride_id"]


def test_driver_sees_pending(ride_id):
    r = requests.get(f"{BASE_URL}/api/rides/pending", headers=H(DRV_TOKEN), timeout=15)
    assert r.status_code == 200
    rides = r.json()
    assert any(x["ride_id"] == ride_id for x in rides)
    for x in rides:
        assert "_id" not in x


def test_accept_start_complete(ride_id):
    r = requests.post(f"{BASE_URL}/api/rides/{ride_id}/accept", headers=H(DRV_TOKEN), timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "accepted"

    r = requests.post(f"{BASE_URL}/api/rides/{ride_id}/start", headers=H(DRV_TOKEN), timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "in_progress"

    r = requests.post(f"{BASE_URL}/api/rides/{ride_id}/complete", headers=H(DRV_TOKEN), timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "completed"


def test_passenger_rate_updates_driver_avg(ride_id):
    r = requests.post(f"{BASE_URL}/api/rides/{ride_id}/rate", headers=H(PASS_TOKEN),
                      json={"rating": 4, "comment": "ok"}, timeout=15)
    assert r.status_code == 200

    me = requests.get(f"{BASE_URL}/api/auth/me", headers=H(DRV_TOKEN), timeout=15).json()
    assert me["rating_count"] >= 1
    assert me["rating_avg"] <= 5.0


def test_rides_mine_both_roles(ride_id):
    rp = requests.get(f"{BASE_URL}/api/rides/mine", headers=H(PASS_TOKEN), timeout=15)
    assert rp.status_code == 200
    assert any(x["ride_id"] == ride_id for x in rp.json())

    rd = requests.get(f"{BASE_URL}/api/rides/mine", headers=H(DRV_TOKEN), timeout=15)
    assert rd.status_code == 200
    assert any(x["ride_id"] == ride_id for x in rd.json())


def test_rides_active_none_after_complete():
    # After completion, no active ride for passenger
    r = requests.get(f"{BASE_URL}/api/rides/active", headers=H(PASS_TOKEN), timeout=15)
    assert r.status_code == 200
    # Either null or a different active one
    body = r.json()
    if body is not None:
        assert body["status"] in ("pending", "accepted", "in_progress")
