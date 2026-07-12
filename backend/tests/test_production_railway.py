"""Production Railway deployment verification tests.

Verifies backend deployment on Railway after:
  1. Fixing bloated requirements.txt (128 -> 13 packages)
  2. Setting RESEND_API_KEY, RESEND_FROM, RESEND_REPLY_TO, RESEND_OWNER_CC, ADMIN_PASSCODE env vars
  3. Fixing RESEND_FROM duplicate/leading-space bug (user edited via Raw Editor)

Production URL: https://taxigo-production.up.railway.app

7 tests:
  T1: GET /api/ -> 200
  T2: POST /api/rides/reservations (email=pkukla35@gmail.com owner) -> owner_notified=true, passenger_confirmed=false
  T3: POST /api/rides/reservations (email=test@example.com other) -> owner_notified=true
  T4: GET /api/rides/reservations w/ X-Admin-Passcode: taxigo2025 -> 200 list containing T2 & T3
  T5: GET /api/rides/reservations w/ wrong passcode -> 401
  T6: GET /api/rides/reservations w/ no auth -> 401
  T7: GET /api/drivers/online -> 200 (regression)
"""
import pytest
import requests

BASE_URL = "https://taxigo-production.up.railway.app"
ADMIN_PIN = "taxigo2025"
OWNER_EMAIL = "pkukla35@gmail.com"

_created = {}


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _payload(email: str, name: str, notes: str):
    return {
        "pickup": {"name": "Krakow Central", "lat": 50.067, "lng": 19.947},
        "dest": {"name": "Zakopane", "lat": 49.299, "lng": 19.951},
        "distance_km": 105.5,
        "price_pln": 321.50,
        "date": "2026-09-15",
        "time": "10:00",
        "name": name,
        "phone": "+48 500 100 200",
        "email": email,
        "notes": notes,
        "lang": "pl",
    }


# ============ T1: Health ============
class TestT1Health:
    def test_root_endpoint(self, api):
        r = api.get(f"{BASE_URL}/api/", timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "message" in data
        assert "TAXIGO" in data["message"], f"Expected 'TAXIGO' in message, got: {data}"


# ============ T2: Create reservation w/ OWNER email ============
class TestT2CreateReservationOwnerEmail:
    def test_create_owner_email(self, api):
        payload = _payload(
            email=OWNER_EMAIL,
            name="Prod Final Test Owner",
            notes="Final verification - owner email = passenger email; passenger_confirmed should be false",
        )
        r = api.post(f"{BASE_URL}/api/rides/reservations", json=payload, timeout=60)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        print(f"\n[T2 RESPONSE] {data}")

        assert data.get("ok") is True, f"ok should be True: {data}"
        assert "reservation_id" in data, f"reservation_id missing: {data}"
        assert data["reservation_id"].startswith("rsv_"), f"Bad id fmt: {data}"
        _created["t2_id"] = data["reservation_id"]

        # MOST IMPORTANT ASSERTION - proves Resend integration works on production
        assert data.get("owner_notified") is True, (
            f"owner_notified MUST be true on production (proves Resend works). Got: {data}"
        )
        # email_sent alias field
        assert data.get("email_sent") is True, f"email_sent alias should be true: {data}"
        # Same email as owner -> passenger email skipped to avoid duplicate
        assert data.get("passenger_confirmed") is False, (
            f"passenger_confirmed should be False when passenger email == owner email: {data}"
        )


# ============ T3: Create reservation w/ DIFFERENT passenger email ============
class TestT3CreateReservationOtherEmail:
    def test_create_other_email(self, api):
        payload = _payload(
            email="test@example.com",
            name="Prod Final Test Passenger",
            notes="Final verification - different passenger email",
        )
        r = api.post(f"{BASE_URL}/api/rides/reservations", json=payload, timeout=60)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        print(f"\n[T3 RESPONSE] {data}")

        assert data.get("ok") is True
        assert data["reservation_id"].startswith("rsv_")
        _created["t3_id"] = data["reservation_id"]

        # Owner email should always fire (verified sender domain in Resend)
        assert data.get("owner_notified") is True, (
            f"owner_notified MUST be true (Resend from onboarding@resend.dev is verified). Got: {data}"
        )
        # Passenger email to test@example.com will likely fail because Resend requires
        # verified domain to send TO arbitrary addresses (until wycieczki-z-krakowa.pl verified).
        # Just log — don't fail either way; the spec says "expected false until domain verified".
        print(f"[T3 INFO] passenger_confirmed={data.get('passenger_confirmed')} (expected false until domain verified)")


# ============ T4: Admin list ============
class TestT4AdminList:
    def test_admin_list_correct_passcode(self, api):
        r = api.get(
            f"{BASE_URL}/api/rides/reservations",
            headers={"X-Admin-Passcode": ADMIN_PIN},
            timeout=30,
        )
        assert r.status_code == 200, f"Admin listing failed: {r.status_code}: {r.text}"
        items = r.json()
        assert isinstance(items, list), f"Expected list, got: {type(items)}"
        ids = [it.get("reservation_id") for it in items]

        # Reservations from T2 and T3 must be present
        if _created.get("t2_id"):
            assert _created["t2_id"] in ids, (
                f"T2 reservation {_created['t2_id']} missing from admin listing. Got {len(ids)} items."
            )
        if _created.get("t3_id"):
            assert _created["t3_id"] in ids, (
                f"T3 reservation {_created['t3_id']} missing from admin listing. Got {len(ids)} items."
            )

        # No MongoDB _id leakage
        for it in items:
            assert "_id" not in it, f"MongoDB _id should be excluded: {it}"
        print(f"\n[T4 INFO] Admin listing returned {len(items)} reservations; T2/T3 both present.")


# ============ T5: Admin wrong passcode ============
class TestT5AdminWrongPasscode:
    def test_admin_wrong_passcode(self, api):
        r = api.get(
            f"{BASE_URL}/api/rides/reservations",
            headers={"X-Admin-Passcode": "wrong"},
            timeout=30,
        )
        assert r.status_code == 401, f"Expected 401 for wrong passcode, got {r.status_code}: {r.text}"


# ============ T6: No auth ============
class TestT6NoAuth:
    def test_no_auth_no_passcode(self, api):
        r = api.get(f"{BASE_URL}/api/rides/reservations", timeout=30)
        # Falls through to driver path -> get_current_user rejects
        assert r.status_code == 401, f"Expected 401 with no auth, got {r.status_code}: {r.text}"


# ============ T7: Regression - old endpoint still works ============
class TestT7Regression:
    def test_drivers_online(self, api):
        r = api.get(f"{BASE_URL}/api/drivers/online", timeout=30)
        assert r.status_code == 200, f"drivers/online broken: {r.status_code}: {r.text}"
        data = r.json()
        assert isinstance(data, list), f"Expected list, got: {type(data)}"
