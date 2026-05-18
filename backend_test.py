"""
Backend tests for Trip Reservations module.
Focused ONLY on new /api/trips/* endpoints.
"""
import os
import sys
import requests
from datetime import datetime, timedelta, timezone

BASE_URL = "https://mobility-platform-130.preview.emergentagent.com/api"
ADMIN_PASSCODE = "taxigo2025"
ADMIN_HEADER = {"X-Admin-Passcode": ADMIN_PASSCODE}
WRONG_HEADER = {"X-Admin-Passcode": "wrong"}

TRIP_SLUG = "pieniny"
FUTURE_DATE = (datetime.now(timezone.utc) + timedelta(days=180)).strftime("%Y-%m-%d")  # ~6 months out
BLOCKED_DATE = (datetime.now(timezone.utc) + timedelta(days=200)).strftime("%Y-%m-%d")
ALL_BLOCKED_DATE = (datetime.now(timezone.utc) + timedelta(days=220)).strftime("%Y-%m-%d")
PAST_DATE = "2020-01-01"

results = []
created_reservations = []
created_blocked_dates = []  # list of (trip_slug, date)


def log(name, ok, info=""):
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}  {info}")
    results.append((name, ok, info))


def test_health():
    r = requests.get(f"{BASE_URL}/")
    log("GET /api/ (health)", r.status_code == 200, f"status={r.status_code} body={r.text[:120]}")


# ---------- 8. POST /api/trips/admin/verify ----------
def test_admin_verify():
    r = requests.post(f"{BASE_URL}/trips/admin/verify", json={"passcode": ADMIN_PASSCODE})
    log("POST /trips/admin/verify (correct passcode)",
        r.status_code == 200 and r.json().get("ok") is True,
        f"status={r.status_code} body={r.text[:120]}")

    r2 = requests.post(f"{BASE_URL}/trips/admin/verify", json={"passcode": "wrong"})
    log("POST /trips/admin/verify (wrong passcode)",
        r2.status_code == 401, f"status={r2.status_code}")

    r3 = requests.post(f"{BASE_URL}/trips/admin/verify", json={})
    log("POST /trips/admin/verify (no passcode)",
        r3.status_code == 401, f"status={r3.status_code}")


# ---------- 5. GET /api/trips/blocked-dates/{slug} (public) ----------
def test_blocked_dates_public_initial():
    r = requests.get(f"{BASE_URL}/trips/blocked-dates/{TRIP_SLUG}")
    ok = r.status_code == 200 and isinstance(r.json(), list)
    log("GET /trips/blocked-dates/{slug} (public)", ok, f"status={r.status_code} count={len(r.json()) if ok else 'n/a'}")


# ---------- 6. POST /api/trips/blocked-dates ----------
def test_block_date_no_auth():
    r = requests.post(f"{BASE_URL}/trips/blocked-dates",
                      json={"trip_slug": TRIP_SLUG, "date": BLOCKED_DATE, "reason": "święto"})
    log("POST /trips/blocked-dates (no admin header)", r.status_code == 401, f"status={r.status_code}")


def test_block_date_wrong_pin():
    r = requests.post(f"{BASE_URL}/trips/blocked-dates",
                      headers=WRONG_HEADER,
                      json={"trip_slug": TRIP_SLUG, "date": BLOCKED_DATE, "reason": "święto"})
    log("POST /trips/blocked-dates (wrong admin)", r.status_code == 401, f"status={r.status_code}")


def test_block_date_invalid_date():
    r = requests.post(f"{BASE_URL}/trips/blocked-dates",
                      headers=ADMIN_HEADER,
                      json={"trip_slug": TRIP_SLUG, "date": "not-a-date", "reason": ""})
    log("POST /trips/blocked-dates (invalid date format)", r.status_code == 400, f"status={r.status_code} body={r.text[:120]}")


def test_block_date_ok():
    r = requests.post(f"{BASE_URL}/trips/blocked-dates",
                      headers=ADMIN_HEADER,
                      json={"trip_slug": TRIP_SLUG, "date": BLOCKED_DATE, "reason": "święto"})
    ok = r.status_code == 200 and r.json().get("ok") is True
    log("POST /trips/blocked-dates (correct admin)", ok, f"status={r.status_code} body={r.text[:120]}")
    if ok:
        created_blocked_dates.append((TRIP_SLUG, BLOCKED_DATE))


def test_block_date_all_slug():
    r = requests.post(f"{BASE_URL}/trips/blocked-dates",
                      headers=ADMIN_HEADER,
                      json={"trip_slug": "all", "date": ALL_BLOCKED_DATE, "reason": "global"})
    ok = r.status_code == 200 and r.json().get("ok") is True
    log("POST /trips/blocked-dates (slug='all')", ok, f"status={r.status_code}")
    if ok:
        created_blocked_dates.append(("all", ALL_BLOCKED_DATE))


def test_blocked_dates_includes_all():
    """Public GET for a specific slug should also include 'all' blocks."""
    r = requests.get(f"{BASE_URL}/trips/blocked-dates/{TRIP_SLUG}")
    if r.status_code != 200:
        log("GET /trips/blocked-dates/{slug} includes 'all' blocks", False, f"status={r.status_code}")
        return
    dates = [item.get("date") for item in r.json()]
    slugs = [item.get("trip_slug") for item in r.json()]
    ok = ALL_BLOCKED_DATE in dates and BLOCKED_DATE in dates and "all" in slugs
    log("GET /trips/blocked-dates/{slug} returns slug-specific + 'all' blocks",
        ok, f"dates_returned={dates}")


# ---------- 1. POST /api/trips/reservations ----------
def _payload(date=None, **overrides):
    base = {
        "trip_slug": TRIP_SLUG,
        "trip_name": "Pieniny - spływ Dunajcem",
        "date": date or FUTURE_DATE,
        "people": 2,
        "name": "Jan Kowalski",
        "phone": "+48600111222",
        "email": "jan.kowalski@example.pl",
        "pickup_address": "Kraków, Rynek Główny 1",
        "price_per_person": 350,
        "total_price": 700,
        "notes": "Prosimy o kontakt SMS-em.",
    }
    base.update(overrides)
    return base


def test_create_reservation_happy_path():
    r = requests.post(f"{BASE_URL}/trips/reservations", json=_payload())
    ok = r.status_code == 200
    body = {}
    if ok:
        body = r.json()
        ok = body.get("status") == "pending" and body.get("reservation_id", "").startswith("res_")
        if ok:
            created_reservations.append(body["reservation_id"])
    log("POST /trips/reservations (happy path)", ok,
        f"status={r.status_code} body={str(body)[:200] if body else r.text[:200]}")
    return body.get("reservation_id") if ok else None


def test_create_reservation_past_date():
    r = requests.post(f"{BASE_URL}/trips/reservations", json=_payload(date=PAST_DATE))
    ok = r.status_code == 400 and "przeszło" in r.text.lower()
    log("POST /trips/reservations (past date -> 400)", ok, f"status={r.status_code} body={r.text[:200]}")


def test_create_reservation_invalid_date():
    r = requests.post(f"{BASE_URL}/trips/reservations", json=_payload(date="abc"))
    ok = r.status_code in (400, 422)
    log("POST /trips/reservations (invalid date format -> 400/422)", ok, f"status={r.status_code} body={r.text[:200]}")


def test_create_reservation_missing_fields():
    p = _payload()
    p.pop("name")
    p.pop("phone")
    r = requests.post(f"{BASE_URL}/trips/reservations", json=p)
    log("POST /trips/reservations (missing required fields -> 422)", r.status_code == 422,
        f"status={r.status_code}")


def test_create_reservation_people_out_of_range():
    r1 = requests.post(f"{BASE_URL}/trips/reservations", json=_payload(people=0))
    log("POST /trips/reservations (people=0 -> 422)", r1.status_code == 422, f"status={r1.status_code}")
    r2 = requests.post(f"{BASE_URL}/trips/reservations", json=_payload(people=21))
    log("POST /trips/reservations (people=21 -> 422)", r2.status_code == 422, f"status={r2.status_code}")


def test_create_reservation_blocked_date():
    """Should be 400 because BLOCKED_DATE has been blocked above."""
    r = requests.post(f"{BASE_URL}/trips/reservations", json=_payload(date=BLOCKED_DATE))
    ok = r.status_code == 400 and "niedostępn" in r.text.lower()
    log("POST /trips/reservations (slug-blocked date -> 400)", ok, f"status={r.status_code} body={r.text[:200]}")


def test_create_reservation_all_blocked_date():
    """Even though slug='pieniny', 'all' block for ALL_BLOCKED_DATE must apply."""
    r = requests.post(f"{BASE_URL}/trips/reservations", json=_payload(date=ALL_BLOCKED_DATE))
    ok = r.status_code == 400 and "niedostępn" in r.text.lower()
    log("POST /trips/reservations ('all'-blocked date -> 400)", ok, f"status={r.status_code} body={r.text[:200]}")


# ---------- 2. GET /api/trips/reservations (admin) ----------
def test_list_reservations_no_auth():
    r = requests.get(f"{BASE_URL}/trips/reservations")
    log("GET /trips/reservations (no header -> 401)", r.status_code == 401, f"status={r.status_code}")


def test_list_reservations_wrong_pin():
    r = requests.get(f"{BASE_URL}/trips/reservations", headers=WRONG_HEADER)
    log("GET /trips/reservations (wrong pin -> 401)", r.status_code == 401, f"status={r.status_code}")


def test_list_reservations_admin():
    r = requests.get(f"{BASE_URL}/trips/reservations", headers=ADMIN_HEADER)
    ok = r.status_code == 200 and isinstance(r.json(), list)
    found = False
    if ok and created_reservations:
        ids = [it.get("reservation_id") for it in r.json()]
        found = created_reservations[0] in ids
    log("GET /trips/reservations (admin)", ok, f"status={r.status_code} count={len(r.json()) if ok else 'n/a'} found_test_res={found}")


# ---------- 3. PATCH /api/trips/reservations/{id} ----------
def test_patch_reservation_no_auth(res_id):
    if not res_id:
        log("PATCH /trips/reservations/{id} (no auth)", False, "no res_id available")
        return
    r = requests.patch(f"{BASE_URL}/trips/reservations/{res_id}", json={"status": "confirmed"})
    log("PATCH /trips/reservations/{id} (no header -> 401)", r.status_code == 401, f"status={r.status_code}")


def test_patch_reservation_admin(res_id):
    if not res_id:
        log("PATCH /trips/reservations/{id} (admin)", False, "no res_id available")
        return
    r = requests.patch(f"{BASE_URL}/trips/reservations/{res_id}",
                       headers=ADMIN_HEADER, json={"status": "confirmed"})
    ok = r.status_code == 200 and r.json().get("status") == "confirmed"
    log("PATCH /trips/reservations/{id} (admin, status=confirmed)", ok, f"status={r.status_code} body={r.text[:200]}")


def test_patch_reservation_404():
    r = requests.patch(f"{BASE_URL}/trips/reservations/res_nonexistent_xyz",
                       headers=ADMIN_HEADER, json={"status": "confirmed"})
    log("PATCH /trips/reservations/{id} (non-existent -> 404)", r.status_code == 404, f"status={r.status_code}")


def test_patch_reservation_invalid_status(res_id):
    if not res_id:
        log("PATCH /trips/reservations/{id} (invalid status)", False, "no res_id")
        return
    r = requests.patch(f"{BASE_URL}/trips/reservations/{res_id}",
                       headers=ADMIN_HEADER, json={"status": "weird"})
    log("PATCH /trips/reservations/{id} (invalid status -> 422)", r.status_code == 422, f"status={r.status_code}")


# ---------- 4. DELETE /api/trips/reservations/{id} ----------
def test_delete_reservation_no_auth(res_id):
    if not res_id:
        log("DELETE /trips/reservations/{id} (no auth)", False, "no res_id")
        return
    r = requests.delete(f"{BASE_URL}/trips/reservations/{res_id}")
    log("DELETE /trips/reservations/{id} (no header -> 401)", r.status_code == 401, f"status={r.status_code}")


def test_delete_reservation_admin(res_id):
    if not res_id:
        log("DELETE /trips/reservations/{id} (admin)", False, "no res_id")
        return
    r = requests.delete(f"{BASE_URL}/trips/reservations/{res_id}", headers=ADMIN_HEADER)
    ok = r.status_code == 200 and r.json().get("ok") is True
    log("DELETE /trips/reservations/{id} (admin)", ok, f"status={r.status_code} body={r.text[:200]}")
    if ok and res_id in created_reservations:
        created_reservations.remove(res_id)


def test_delete_reservation_404():
    r = requests.delete(f"{BASE_URL}/trips/reservations/res_nonexistent_xyz",
                        headers=ADMIN_HEADER)
    log("DELETE /trips/reservations/{id} (non-existent -> 404)", r.status_code == 404, f"status={r.status_code}")


# ---------- 7. DELETE /api/trips/blocked-dates/{slug}/{date} ----------
def test_delete_blocked_date_no_auth():
    r = requests.delete(f"{BASE_URL}/trips/blocked-dates/{TRIP_SLUG}/{BLOCKED_DATE}")
    log("DELETE /trips/blocked-dates (no header -> 401)", r.status_code == 401, f"status={r.status_code}")


def test_delete_blocked_date_admin():
    r = requests.delete(f"{BASE_URL}/trips/blocked-dates/{TRIP_SLUG}/{BLOCKED_DATE}",
                        headers=ADMIN_HEADER)
    ok = r.status_code == 200 and r.json().get("ok") is True
    log("DELETE /trips/blocked-dates (admin)", ok, f"status={r.status_code} body={r.text[:200]}")
    if ok:
        try:
            created_blocked_dates.remove((TRIP_SLUG, BLOCKED_DATE))
        except ValueError:
            pass


# ---------- CLEANUP ----------
def cleanup():
    print("\n--- Cleanup ---")
    for rid in list(created_reservations):
        try:
            r = requests.delete(f"{BASE_URL}/trips/reservations/{rid}", headers=ADMIN_HEADER)
            print(f"  delete reservation {rid}: {r.status_code}")
        except Exception as e:
            print(f"  delete reservation {rid} error: {e}")

    for slug, date in list(created_blocked_dates):
        try:
            r = requests.delete(f"{BASE_URL}/trips/blocked-dates/{slug}/{date}",
                                headers=ADMIN_HEADER)
            print(f"  delete blocked {slug}/{date}: {r.status_code}")
        except Exception as e:
            print(f"  delete blocked {slug}/{date} error: {e}")


def main():
    print(f"Base URL: {BASE_URL}")
    print(f"Future date: {FUTURE_DATE} | Blocked date: {BLOCKED_DATE} | All-blocked: {ALL_BLOCKED_DATE}\n")

    test_health()

    # Admin verify
    test_admin_verify()

    # Blocked dates - public initial
    test_blocked_dates_public_initial()

    # Block dates (need to be set before reservation-blocking tests)
    test_block_date_no_auth()
    test_block_date_wrong_pin()
    test_block_date_invalid_date()
    test_block_date_ok()
    test_block_date_all_slug()
    test_blocked_dates_includes_all()

    # Reservations
    res_id = test_create_reservation_happy_path()
    test_create_reservation_past_date()
    test_create_reservation_invalid_date()
    test_create_reservation_missing_fields()
    test_create_reservation_people_out_of_range()
    test_create_reservation_blocked_date()
    test_create_reservation_all_blocked_date()

    # List reservations
    test_list_reservations_no_auth()
    test_list_reservations_wrong_pin()
    test_list_reservations_admin()

    # PATCH
    test_patch_reservation_no_auth(res_id)
    test_patch_reservation_admin(res_id)
    test_patch_reservation_invalid_status(res_id)
    test_patch_reservation_404()

    # DELETE reservation
    test_delete_reservation_no_auth(res_id)
    test_delete_reservation_admin(res_id)
    test_delete_reservation_404()

    # DELETE blocked date
    test_delete_blocked_date_no_auth()
    test_delete_blocked_date_admin()

    # Cleanup any leftovers
    cleanup()

    # Summary
    passed = sum(1 for _, ok, _ in results if ok)
    failed = sum(1 for _, ok, _ in results if not ok)
    print(f"\n{'='*60}\nTotal: {len(results)} | Passed: {passed} | Failed: {failed}\n{'='*60}")
    if failed:
        print("\nFailed cases:")
        for name, ok, info in results:
            if not ok:
                print(f"  - {name}  {info}")
        sys.exit(1)


if __name__ == "__main__":
    main()
