"""Web Push notifications helper for TAXIGO PWA."""
import os
import json
import base64
import logging
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

logger = logging.getLogger(__name__)

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
_PRIV_B64 = os.environ.get("VAPID_PRIVATE_KEY_B64", "")
try:
    VAPID_PRIVATE_KEY = base64.b64decode(_PRIV_B64).decode() if _PRIV_B64 else ""
except Exception:
    VAPID_PRIVATE_KEY = ""
VAPID_CONTACT = os.environ.get("VAPID_CONTACT_EMAIL", "mailto:admin@example.com")

try:
    from pywebpush import webpush, WebPushException
    _READY = bool(VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)
except Exception as e:
    logger.warning(f"pywebpush not available: {e}")
    _READY = False
    webpush = None


def is_configured() -> bool:
    return _READY


def get_public_key() -> str:
    return VAPID_PUBLIC_KEY


def send_push(subscription: dict, title: str, body: str, url: str = "/", tag: str = "taxigo") -> bool:
    """Send a web push notification to a single subscription. Returns True on success."""
    if not _READY:
        logger.warning("Web push not configured")
        return False
    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "tag": tag,
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
    })
    try:
        webpush(
            subscription_info=subscription,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CONTACT},
        )
        return True
    except WebPushException as e:
        # 410 = subscription expired, should be deleted
        status = getattr(e.response, "status_code", 0) if e.response else 0
        logger.warning(f"WebPush failed ({status}): {e}")
        if status in (404, 410):
            return "expired"
        return False
    except Exception as e:
        logger.error(f"WebPush unknown error: {e}")
        return False


async def broadcast_push(db, filter_query: dict, title: str, body: str, url: str = "/", tag: str = "taxigo") -> dict:
    """Send push to all subscriptions matching filter. Cleans up expired subscriptions.
    Returns {'sent': int, 'failed': int, 'expired_removed': int}."""
    if not _READY:
        return {"sent": 0, "failed": 0, "expired_removed": 0, "note": "not_configured"}
    sent, failed, removed = 0, 0, 0
    async for sub in db.push_subscriptions.find(filter_query):
        result = send_push(sub.get("subscription"), title, body, url, tag)
        if result == "expired":
            await db.push_subscriptions.delete_one({"_id": sub["_id"]})
            removed += 1
        elif result:
            sent += 1
        else:
            failed += 1
    logger.info(f"📢 Push broadcast: sent={sent} failed={failed} removed={removed}")
    return {"sent": sent, "failed": failed, "expired_removed": removed}
