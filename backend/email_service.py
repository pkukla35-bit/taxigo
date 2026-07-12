"""Resend email helper for TAXIGO ride reservations & notifications."""
import os
import logging
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

logger = logging.getLogger(__name__)

try:
    import resend
    resend.api_key = os.environ.get("RESEND_API_KEY", "")
    _RESEND_READY = bool(resend.api_key)
except Exception as e:
    logger.warning(f"Resend not available: {e}")
    _RESEND_READY = False
    resend = None

FROM_RAW = os.environ.get("RESEND_FROM", "onboarding@resend.dev").strip()
# Accept either "Name <email>" format or just "email" — auto-wrap plain email
if "<" in FROM_RAW and ">" in FROM_RAW:
    FROM = FROM_RAW
elif "@" in FROM_RAW:
    FROM = f"TAXIGO Wycieczki <{FROM_RAW}>"
else:
    FROM = f"TAXIGO Wycieczki <onboarding@resend.dev>"
REPLY_TO = os.environ.get("RESEND_REPLY_TO", "pkukla35@gmail.com")
OWNER_CC = os.environ.get("RESEND_OWNER_CC", "pkukla35@gmail.com")


def _send(to: str, subject: str, html: str, reply_to: Optional[str] = None) -> bool:
    """Send an email via Resend. Returns True on success."""
    if not _RESEND_READY or not resend:
        logger.warning("Resend API key not configured — skipping email")
        return False
    if not to:
        return False
    try:
        params = {
            "from": FROM,
            "to": [to],
            "subject": subject,
            "html": html,
            "reply_to": reply_to or REPLY_TO,
        }
        result = resend.Emails.send(params)
        logger.info(f"📧 Email sent to {to}: {subject} → {result.get('id') if isinstance(result, dict) else result}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to}: {e}")
        return False


def _html_reservation(resv: dict, lang: str = "pl", passenger_view: bool = True) -> str:
    """Build the HTML email body."""
    is_pl = lang == "pl"
    title = "📅 Potwierdzenie rezerwacji przejazdu" if is_pl else "📅 Ride reservation confirmation"
    if not passenger_view:
        title = "📥 Nowa rezerwacja przejazdu — TAXIGO" if is_pl else "📥 New ride reservation — TAXIGO"

    L = {
        "greeting": "Cześć" if is_pl else "Hi",
        "confirmed": "Twoja rezerwacja została zapisana." if is_pl else "Your reservation has been saved.",
        "owner_intro": "Otrzymano nową rezerwację przejazdu:" if is_pl else "New ride reservation received:",
        "when": "Data i godzina" if is_pl else "Date & time",
        "pickup": "Odbiór" if is_pl else "Pickup",
        "dest": "Cel" if is_pl else "Destination",
        "distance": "Dystans" if is_pl else "Distance",
        "price": "Cena" if is_pl else "Price",
        "name": "Imię" if is_pl else "Name",
        "phone": "Telefon" if is_pl else "Phone",
        "email": "Email" if is_pl else "Email",
        "notes": "Uwagi" if is_pl else "Notes",
        "footer": "Kierowca zadzwoni w celu potwierdzenia przed przejazdem." if is_pl else "The driver will call you to confirm before the ride.",
        "brand_sub": "Taksówki i wycieczki premium w Krakowie" if is_pl else "Premium taxi & tours in Krakow",
        "site": "wycieczki-z-krakowa.pl",
    }

    return f"""
<!doctype html>
<html>
<head><meta charset="utf-8"><title>{title}</title></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F0F0F;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;">
    <div style="background:#FFD600;padding:24px;text-align:center;">
      <div style="font-size:28px;font-weight:900;letter-spacing:1px;color:#0F0F0F;">TAXIGO</div>
      <div style="font-size:12px;color:#0F0F0F;font-weight:600;margin-top:4px;">{L['brand_sub']}</div>
    </div>
    <div style="padding:28px 24px;">
      <h2 style="margin:0 0 8px;font-size:22px;color:#0F0F0F;">{title}</h2>
      <p style="color:#525252;font-size:14px;margin:0 0 20px;">
        {L['greeting']} {resv.get('name','')}, {L['confirmed'] if passenger_view else L['owner_intro']}
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#525252;width:40%;">📅 {L['when']}</td><td style="padding:8px 0;font-weight:700;">{resv.get('date','')} • {resv.get('time','')}</td></tr>
        <tr><td style="padding:8px 0;color:#525252;">📍 {L['pickup']}</td><td style="padding:8px 0;font-weight:700;">{resv.get('pickup',{}).get('name','')}</td></tr>
        <tr><td style="padding:8px 0;color:#525252;">➡️ {L['dest']}</td><td style="padding:8px 0;font-weight:700;">{resv.get('dest',{}).get('name','')}</td></tr>
        <tr><td style="padding:8px 0;color:#525252;">🚗 {L['distance']}</td><td style="padding:8px 0;font-weight:700;">{resv.get('distance_km',0):.1f} km</td></tr>
        <tr><td style="padding:8px 0;color:#525252;">💰 {L['price']}</td><td style="padding:8px 0;font-weight:900;font-size:16px;">{resv.get('price_pln',0):.2f} PLN</td></tr>
      </table>

      <div style="border-top:1px dashed #D4D4D4;margin:20px 0;"></div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#525252;width:40%;">👤 {L['name']}</td><td style="padding:6px 0;">{resv.get('name','—')}</td></tr>
        <tr><td style="padding:6px 0;color:#525252;">📞 {L['phone']}</td><td style="padding:6px 0;"><a href="tel:{resv.get('phone','')}" style="color:#0F0F0F;font-weight:700;text-decoration:none;">{resv.get('phone','—')}</a></td></tr>
        <tr><td style="padding:6px 0;color:#525252;">📧 {L['email']}</td><td style="padding:6px 0;">{resv.get('email','—')}</td></tr>
        {f'<tr><td style="padding:6px 0;color:#525252;vertical-align:top;">📝 {L["notes"]}</td><td style="padding:6px 0;">{resv.get("notes","")}</td></tr>' if resv.get('notes') else ''}
      </table>

      <div style="margin-top:24px;padding:14px;background:#FAFAFA;border-radius:10px;font-size:13px;color:#525252;">
        {L['footer']}
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="https://{L['site']}" style="display:inline-block;background:#0F0F0F;color:#FFD600;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:900;">
          {L['site']}
        </a>
      </div>
    </div>
    <div style="background:#0F0F0F;color:#A3A3A3;padding:16px;text-align:center;font-size:11px;">
      TAXIGO Kraków • {L['brand_sub']}<br>
      wycieczki-z-krakowa.pl
    </div>
  </div>
</body>
</html>
"""


def send_ride_reservation_emails(resv: dict, lang: str = "pl") -> dict:
    """
    Send:
      1) Confirmation to passenger (if email provided) — may fail without verified domain
      2) Notification to owner (always to OWNER_CC)
    Returns: {"passenger_sent": bool, "owner_sent": bool}
    """
    passenger_sent = False
    owner_sent = False

    # 1) Owner notification (always)
    try:
        owner_html = _html_reservation(resv, lang="pl", passenger_view=False)
        owner_subject = f"📥 Nowa rezerwacja przejazdu {resv.get('date','')} {resv.get('time','')} — {resv.get('name','')}"
        owner_sent = _send(OWNER_CC, owner_subject, owner_html, reply_to=resv.get("email") or REPLY_TO)
    except Exception as e:
        logger.error(f"Owner email failed: {e}")

    # 2) Passenger confirmation (if email provided AND != owner's)
    passenger_email = (resv.get("email") or "").strip().lower()
    if passenger_email and passenger_email != OWNER_CC.lower():
        try:
            pass_html = _html_reservation(resv, lang=lang, passenger_view=True)
            pass_subject = ("📅 TAXIGO — Potwierdzenie rezerwacji przejazdu" if lang == "pl"
                            else "📅 TAXIGO — Ride reservation confirmed")
            passenger_sent = _send(passenger_email, pass_subject, pass_html)
        except Exception as e:
            logger.error(f"Passenger email failed: {e}")

    return {"passenger_sent": passenger_sent, "owner_sent": owner_sent}
