"""
Backend smoke test for the NEW Stripe payment endpoints for trip reservations:
  - POST /api/trips/payment/blik
  - POST /api/trips/payment/checkout
  - GET  /api/trips/payment/{reservation_id}/status

Uses production URL (https://mobility-platform-130.preview.emergentagent.com/api).
Real Stripe test key is configured in backend/.env.
"""
import sys
import requests

BASE_URL = "https://mobility-platform-130.preview.emergentagent.com/api"
ADMIN_PASSCODE = "taxigo2025"

PASS = "✅"
FAIL = "❌"
results = []  # list of (name, ok, info)


def record(name, ok, info=""):
    results.append((name, ok, info))
    sym = PASS if ok else FAIL
    print(f"{sym} {name}" + (f" — {info}" if info else ""))


def make_future_date(days_ahead=120):
    from datetime import datetime, timedelta, timezone
    return (datetime.now(timezone.utc) + timedelta(days=days_ahead)).date().isoformat()


def create_reservation(date_str, name_suffix=""):
    payload = {
        "trip_slug": "pieniny",
        "trip_name": "Pieniny test",
        "date": date_str,
        "people": 1,
        "name": f"BlikTest{name_suffix}",
        "phone": "+48600111222",
        "email": "blik@test.pl",
        "pickup_address": "Krakow, Rynek Główny 1",
        "price_per_person": 300,
        "total_price": 300,
        "payment_method": "blik",
    }
    r = requests.post(f"{BASE_URL}/trips/reservations", json=payload, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"Failed to create reservation: {r.status_code} {r.text}")
    return r.json()["reservation_id"]


def cleanup_reservation(reservation_id):
    try:
        r = requests.delete(
            f"{BASE_URL}/trips/reservations/{reservation_id}",
            headers={"X-Admin-Passcode": ADMIN_PASSCODE},
            timeout=15,
        )
        print(f"   🧹 cleanup {reservation_id}: HTTP {r.status_code}")
    except Exception as e:
        print(f"   ⚠ cleanup failed for {reservation_id}: {e}")


def test_blik_endpoint():
    print("\n=== Test 1: POST /api/trips/payment/blik ===")
    date_str = make_future_date(120)
    res_id = create_reservation(date_str, name_suffix="A")
    print(f"   created reservation_id = {res_id}")
    created_ids = [res_id]

    # 1a) Happy path
    r = requests.post(
        f"{BASE_URL}/trips/payment/blik",
        json={"reservation_id": res_id, "blik_code": "777777"},
        timeout=60,
    )
    ok = r.status_code == 200
    info = f"HTTP {r.status_code}"
    body = None
    if ok:
        try:
            body = r.json()
            info += f" status={body.get('status')!r} intent_id={body.get('intent_id')!r}"
            if not (isinstance(body.get("intent_id"), str) and body["intent_id"].startswith("pi_")):
                ok = False
                info += " | intent_id does not start with 'pi_'"
            if "status" not in body:
                ok = False
                info += " | missing 'status'"
        except Exception as e:
            ok = False
            info += f" | json parse error: {e}"
    else:
        info += f" body={r.text[:200]}"
    record("BLIK happy path → 200 with pi_* intent_id (real Stripe)", ok, info)

    # 1b) blik_code shorter than 6 digits → 422
    r = requests.post(
        f"{BASE_URL}/trips/payment/blik",
        json={"reservation_id": res_id, "blik_code": "12345"},
        timeout=30,
    )
    record("BLIK code shorter than 6 → 422", r.status_code == 422, f"HTTP {r.status_code}")

    # 1c) blik_code empty → 422
    r = requests.post(
        f"{BASE_URL}/trips/payment/blik",
        json={"reservation_id": res_id, "blik_code": ""},
        timeout=30,
    )
    record("BLIK code empty → 422", r.status_code == 422, f"HTTP {r.status_code}")

    # 1d) blik_code "abcdef" (non-digit, length 6) - accepts 422 (if pydantic pattern) OR 400 (Stripe rejects)
    r = requests.post(
        f"{BASE_URL}/trips/payment/blik",
        json={"reservation_id": res_id, "blik_code": "abcdef"},
        timeout=60,
    )
    ok = r.status_code in (400, 422)
    record(
        "BLIK code 'abcdef' (non-digit) → 422 or 400 from Stripe",
        ok,
        f"HTTP {r.status_code} body={r.text[:160]}",
    )

    # 1e) Invalid reservation_id → 404
    r = requests.post(
        f"{BASE_URL}/trips/payment/blik",
        json={"reservation_id": "res_doesnotexist", "blik_code": "777777"},
        timeout=30,
    )
    record("BLIK invalid reservation_id → 404", r.status_code == 404, f"HTTP {r.status_code}")

    return created_ids, body


def test_checkout_endpoint():
    print("\n=== Test 2: POST /api/trips/payment/checkout ===")
    date_str = make_future_date(125)
    res_id = create_reservation(date_str, name_suffix="B")
    print(f"   created reservation_id = {res_id}")
    created_ids = [res_id]

    # 2a) Happy path
    r = requests.post(
        f"{BASE_URL}/trips/payment/checkout",
        json={
            "reservation_id": res_id,
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
        },
        timeout=60,
    )
    ok = r.status_code == 200
    info = f"HTTP {r.status_code}"
    if ok:
        try:
            body = r.json()
            url = body.get("url", "")
            sid = body.get("session_id", "")
            info += f" url_prefix={url[:35]!r} session_id_prefix={sid[:15]!r}"
            if not url.startswith("https://checkout.stripe.com/"):
                ok = False
                info += " | url does not start with https://checkout.stripe.com/"
            if not sid.startswith("cs_test_"):
                ok = False
                info += " | session_id does not start with cs_test_"
        except Exception as e:
            ok = False
            info += f" | json parse error: {e}"
    else:
        info += f" body={r.text[:200]}"
    record("Checkout happy path → 200 with checkout.stripe.com URL & cs_test_ session_id", ok, info)

    # 2b) Invalid reservation_id → 404
    r = requests.post(
        f"{BASE_URL}/trips/payment/checkout",
        json={
            "reservation_id": "res_doesnotexist",
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
        },
        timeout=30,
    )
    record("Checkout invalid reservation_id → 404", r.status_code == 404, f"HTTP {r.status_code}")

    # 2c) Missing success_url → 422
    r = requests.post(
        f"{BASE_URL}/trips/payment/checkout",
        json={
            "reservation_id": res_id,
            "cancel_url": "https://example.com/cancel",
        },
        timeout=30,
    )
    record("Checkout missing success_url → 422", r.status_code == 422, f"HTTP {r.status_code}")

    return created_ids


def test_status_endpoint(blik_reservation_id):
    print("\n=== Test 3: GET /api/trips/payment/{reservation_id}/status ===")

    r = requests.get(f"{BASE_URL}/trips/payment/{blik_reservation_id}/status", timeout=30)
    ok = r.status_code == 200
    info = f"HTTP {r.status_code}"
    body = None
    if ok:
        try:
            body = r.json()
            info += f" payment_status={body.get('payment_status')!r} reservation_status={body.get('reservation_status')!r}"
            if "payment_status" not in body or "reservation_status" not in body:
                ok = False
                info += " | missing required fields"
        except Exception as e:
            ok = False
            info += f" | json parse error: {e}"
    else:
        info += f" body={r.text[:200]}"
    record("Status endpoint → 200 with payment_status & reservation_status", ok, info)

    if ok and body:
        ps = body.get("payment_status")
        acceptable = {
            "requires_action",
            "requires_payment_method",
            "requires_confirmation",
            "processing",
            "succeeded",
        }
        record(
            f"BLIK payment_status is a valid Stripe state (got {ps!r})",
            ps in acceptable,
            "",
        )

    # Non-existing id → 404
    r = requests.get(f"{BASE_URL}/trips/payment/res_doesnotexist/status", timeout=15)
    record("Status non-existing reservation → 404", r.status_code == 404, f"HTTP {r.status_code}")


def main():
    print(f"Backend BASE_URL = {BASE_URL}")
    all_created = []
    blik_res_id = None
    try:
        ids, _ = test_blik_endpoint()
        all_created.extend(ids)
        blik_res_id = ids[0]

        ids = test_checkout_endpoint()
        all_created.extend(ids)

        if blik_res_id:
            test_status_endpoint(blik_res_id)
    finally:
        print("\n=== CLEANUP ===")
        for rid in all_created:
            cleanup_reservation(rid)

    print("\n========== SUMMARY ==========")
    total = len(results)
    passed = sum(1 for _, ok, _ in results if ok)
    failed = total - passed
    for name, ok, info in results:
        sym = PASS if ok else FAIL
        print(f"  {sym} {name}" + (f" — {info}" if info else ""))
    print(f"\nPASSED: {passed}/{total}    FAILED: {failed}/{total}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
