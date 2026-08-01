"""Backend tests for /api/translate — PL↔EN voice translator (Claude via Emergent LLM Key)."""
import os
import pytest
import requests

# Use local backend (Kubernetes ingress via EXPO_BACKEND_URL is external — but per request use local)
BASE_URL = "http://localhost:8001/api"
ADMIN_PASSCODE = "taxigo2025"

DRIVER_EMAIL = "kierowca1@taxigo.pl"
DRIVER_PASSWORD = "MocneHaslo123"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def driver_token(api):
    """Ensure driver exists and log in — return session token."""
    # Try login first
    r = api.post(f"{BASE_URL}/auth/driver-login", json={"email": DRIVER_EMAIL, "password": DRIVER_PASSWORD})
    if r.status_code != 200:
        # Create/upgrade driver via admin
        api.post(
            f"{BASE_URL}/admin/drivers",
            json={
                "email": DRIVER_EMAIL,
                "password": DRIVER_PASSWORD,
                "name": "Kierowca Testowy",
                "phone": "+48500100200",
                "car_model": "Toyota Camry",
                "plate": "KR12345",
            },
            headers={"X-Admin-Passcode": ADMIN_PASSCODE},
        )
        r = api.post(f"{BASE_URL}/auth/driver-login", json={"email": DRIVER_EMAIL, "password": DRIVER_PASSWORD})
    assert r.status_code == 200, f"driver-login failed: {r.status_code} {r.text}"
    return r.json()["session_token"]


# ============ AUTH TESTS ============
class TestTranslateAuth:
    def test_no_auth_returns_401(self, api):
        r = api.post(f"{BASE_URL}/translate", json={"text": "hi", "source_lang": "en", "target_lang": "pl"})
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"

    def test_guest_token_accepted(self, api):
        """Guest token should NOT return 401 (may return 200 or 500 based on LLM)."""
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "Testowy", "source_lang": "pl", "target_lang": "pl"},  # same-lang → no LLM call
            headers={"Authorization": "Bearer guest:test_translate_guest_001"},
        )
        assert r.status_code != 401, f"guest token rejected: {r.status_code} {r.text}"
        assert r.status_code == 200
        assert r.json()["translated"] == "Testowy"

    def test_driver_session_accepted(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "abc", "source_lang": "en", "target_lang": "en"},
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        assert r.status_code == 200, f"driver token rejected: {r.status_code} {r.text}"
        assert r.json()["translated"] == "abc"


# ============ VALIDATION TESTS ============
class TestTranslateValidation:
    def _hdr(self, token):
        return {"Authorization": f"Bearer {token}"}

    def test_missing_text(self, api, driver_token):
        r = api.post(f"{BASE_URL}/translate", json={"source_lang": "pl", "target_lang": "en"}, headers=self._hdr(driver_token))
        assert r.status_code == 422

    def test_empty_text(self, api, driver_token):
        r = api.post(f"{BASE_URL}/translate", json={"text": "", "source_lang": "pl", "target_lang": "en"}, headers=self._hdr(driver_token))
        assert r.status_code == 422

    def test_text_too_long(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "a" * 2001, "source_lang": "pl", "target_lang": "en"},
            headers=self._hdr(driver_token),
        )
        assert r.status_code == 422

    def test_invalid_source_lang(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "hallo", "source_lang": "de", "target_lang": "en"},
            headers=self._hdr(driver_token),
        )
        assert r.status_code == 422

    def test_invalid_target_lang(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "hallo", "source_lang": "pl", "target_lang": "de"},
            headers=self._hdr(driver_token),
        )
        assert r.status_code == 422


# ============ SAME-LANG SHORTCUT (no LLM) ============
class TestSameLanguage:
    def test_same_lang_pl(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "Testowy", "source_lang": "pl", "target_lang": "pl"},
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["translated"] == "Testowy"
        assert data["source_lang"] == "pl"
        assert data["target_lang"] == "pl"


# ============ REAL LLM TRANSLATION TESTS (cost ~0.01 USD each; keep minimal) ============
class TestLLMTranslation:
    def test_pl_to_en(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "Cześć, jestem kierowcą", "source_lang": "pl", "target_lang": "en"},
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        data = r.json()
        assert data["source_lang"] == "pl"
        assert data["target_lang"] == "en"
        translated = data["translated"].strip()
        assert len(translated) > 0
        # Expect English output — heuristic: contains "driver" or "I'm" or "am"
        lowered = translated.lower()
        assert any(w in lowered for w in ["driver", "hello", "hi", "i'm", " am ", "i am"]), f"Not English-ish: {translated}"
        print(f"PL→EN result: {translated}")

    def test_en_to_pl(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={"text": "Hello, I need a taxi", "source_lang": "en", "target_lang": "pl"},
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        data = r.json()
        assert data["source_lang"] == "en"
        assert data["target_lang"] == "pl"
        translated = data["translated"].strip()
        assert len(translated) > 0
        # Heuristic: expect a Polish word for taxi
        lowered = translated.lower()
        assert any(w in lowered for w in ["taks", "taxi", "potrzeb", "witam", "cześć", "dzień"]), f"Not Polish-ish: {translated}"
        print(f"EN→PL result: {translated}")

    def test_preserves_proper_nouns_and_numbers(self, api, driver_token):
        r = api.post(
            f"{BASE_URL}/translate",
            json={
                "text": "Zawieź mnie na ulicę Floriańską 25 w Krakowie",
                "source_lang": "pl",
                "target_lang": "en",
            },
            headers={"Authorization": f"Bearer {driver_token}"},
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text}"
        translated = r.json()["translated"]
        assert "25" in translated, f"Number '25' missing: {translated}"
        # Accept either ASCII "Florian" or Polish "Floriań" — LLM correctly keeps Polish diacritics
        assert ("Florian" in translated) or ("Floriań" in translated), f"Proper noun 'Florian' missing: {translated}"
        # Krakow / Cracow / Kraków — any variant should appear
        assert any(v in translated for v in ["Krak", "Krak", "Cracow"]), f"City missing: {translated}"
        print(f"Special chars result: {translated}")


# ============ SMOKE — ensure other endpoints still work ============
class TestSmokeExistingEndpoints:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("message") == "TAXIGO API"

    def test_driver_login_bad_credentials_still_returns_401(self, api):
        r = api.post(f"{BASE_URL}/auth/driver-login", json={"email": "nobody@x.y", "password": "wrongpass1"})
        assert r.status_code == 401

    def test_driver_login_success(self, api):
        r = api.post(f"{BASE_URL}/auth/driver-login", json={"email": DRIVER_EMAIL, "password": DRIVER_PASSWORD})
        assert r.status_code == 200
        assert "session_token" in r.json()
