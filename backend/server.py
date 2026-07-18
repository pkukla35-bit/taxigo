from fastapi import FastAPI, APIRouter, HTTPException, Header, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
import stripe
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

stripe.api_key = os.environ.get('STRIPE_API_KEY', '')
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

app = FastAPI(title="TAXIGO API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============== MODELS ==============
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: Optional[Literal["passenger", "driver"]] = None
    car_model: Optional[str] = None
    plate: Optional[str] = None
    rating_avg: float = 5.0
    rating_count: int = 0
    is_online: bool = False
    created_at: datetime

class SessionAuthPayload(BaseModel):
    session_id: str
    role: Literal["passenger", "driver"]

class SetRolePayload(BaseModel):
    role: Literal["passenger", "driver"]
    car_model: Optional[str] = None
    plate: Optional[str] = None

class RideCreate(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dest_address: str
    dest_lat: float
    dest_lng: float
    distance_km: float
    price_pln: float

class Ride(BaseModel):
    ride_id: str
    passenger_id: str
    passenger_name: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    driver_car: Optional[str] = None
    driver_plate: Optional[str] = None
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dest_address: str
    dest_lat: float
    dest_lng: float
    distance_km: float
    price_pln: float
    status: Literal["pending", "accepted", "in_progress", "completed", "cancelled"]
    rating: Optional[int] = None
    rating_comment: Optional[str] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class OnlinePayload(BaseModel):
    is_online: bool
    lat: Optional[float] = None
    lng: Optional[float] = None

class RatePayload(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = ""


class PushTokenPayload(BaseModel):
    push_token: str
    platform: str = "unknown"


class BlikPayPayload(BaseModel):
    ride_id: str
    blik_code: str = Field(min_length=6, max_length=6)


# ============== TRIP RESERVATIONS MODELS ==============
class TripReservationCreate(BaseModel):
    trip_slug: str
    trip_name: str
    date: str  # YYYY-MM-DD
    people: int = Field(ge=1, le=20)
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=30)
    email: str = Field(min_length=5, max_length=100)
    pickup_address: str = Field(min_length=2, max_length=300)
    price_per_person: float = Field(ge=0)
    total_price: float = Field(ge=0)
    notes: Optional[str] = Field(default="", max_length=500)
    payment_method: Literal["cash", "negotiate", "blik", "card_on_arrival", "blik_phone"] = "cash"
    proposed_price: Optional[float] = Field(default=None, ge=0)
    negotiation_note: Optional[str] = Field(default="", max_length=500)


class TripReservationUpdate(BaseModel):
    status: Literal["pending", "confirmed", "cancelled", "completed"]


class BlockedDatePayload(BaseModel):
    trip_slug: str  # "all" lub konkretny slug
    date: str  # YYYY-MM-DD
    reason: Optional[str] = ""


class TripBlikPayload(BaseModel):
    reservation_id: str
    blik_code: str = Field(min_length=6, max_length=6)


class TripCheckoutPayload(BaseModel):
    reservation_id: str
    success_url: str
    cancel_url: str


def check_admin(passcode: Optional[str]) -> None:
    expected = os.environ.get("ADMIN_PASSCODE", "")
    if not expected or not passcode or passcode != expected:
        raise HTTPException(status_code=401, detail="Nieprawidłowy kod admina")


# ============== PUSH NOTIFICATIONS ==============
async def send_push(tokens: List[str], title: str, body: str, data: dict = None):
    """Send a push notification via Expo Push API to a list of tokens."""
    valid = [t for t in tokens if t and t.startswith("ExponentPushToken")]
    if not valid:
        return
    messages = [{"to": t, "sound": "default", "title": title, "body": body, "data": data or {}} for t in valid]
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            await http.post(EXPO_PUSH_URL, json=messages, headers={"Content-Type": "application/json"})
    except Exception as e:
        logger.warning(f"Push send failed: {e}")


async def get_user_push_tokens(user_id: str) -> List[str]:
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "push_tokens": 1})
    return (user or {}).get("push_tokens", []) or []


# ============== AUTH HELPERS ==============
async def get_user_from_token(session_token: Optional[str]) -> Optional[User]:
    if not session_token:
        return None
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        return None
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    return User(**user_doc)

async def get_current_user(request: Request) -> User:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
    user = await get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# ============== AUTH ENDPOINTS ==============
@api_router.post("/auth/session")
async def create_session(payload: SessionAuthPayload, response: Response):
    """Exchange Emergent session_id for our session_token and create/update user."""
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        # Always update role to match the selected one (allows switching between passenger/driver)
        await db.users.update_one({"user_id": user_id}, {"$set": {"role": payload.role}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", "User"),
            "picture": data.get("picture"),
            "role": payload.role,
            "rating_avg": 5.0,
            "rating_count": 0,
            "is_online": False,
            "created_at": datetime.now(timezone.utc),
        })
    token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": token},
        {"$set": {"user_id": user_id, "session_token": token, "expires_at": expires_at, "created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*3600)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": token}

@api_router.get("/auth/me")
async def me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token") or (request.headers.get("Authorization", "").replace("Bearer ", "") if request.headers.get("Authorization") else None)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

@api_router.post("/auth/role")
async def set_role(payload: SetRolePayload, request: Request):
    user = await get_current_user(request)
    update = {"role": payload.role}
    if payload.car_model is not None:
        update["car_model"] = payload.car_model
    if payload.plate is not None:
        update["plate"] = payload.plate
    await db.users.update_one({"user_id": user.user_id}, {"$set": update})
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc


# ============== DRIVER PRESENCE ==============
@api_router.post("/driver/online")
async def driver_online(payload: OnlinePayload, request: Request):
    user = await get_current_user(request)
    update = {"is_online": payload.is_online}
    if payload.lat is not None:
        update["last_lat"] = payload.lat
    if payload.lng is not None:
        update["last_lng"] = payload.lng
    update["last_seen"] = datetime.now(timezone.utc)
    await db.users.update_one({"user_id": user.user_id}, {"$set": update})
    return {"ok": True, "is_online": payload.is_online}

@api_router.get("/drivers/online")
async def online_drivers():
    cursor = db.users.find({"role": "driver", "is_online": True}, {"_id": 0, "user_id": 1, "name": 1, "last_lat": 1, "last_lng": 1, "rating_avg": 1, "car_model": 1, "plate": 1})
    drivers = await cursor.to_list(100)
    return drivers


# ============== RIDES ==============
@api_router.post("/rides")
async def create_ride(payload: RideCreate, request: Request):
    user = await get_current_user(request)
    if user.role != "passenger":
        raise HTTPException(status_code=403, detail="Only passengers can request rides")
    ride_id = f"ride_{uuid.uuid4().hex[:12]}"
    ride = {
        "ride_id": ride_id,
        "passenger_id": user.user_id,
        "passenger_name": user.name,
        "driver_id": None,
        "driver_name": None,
        "driver_car": None,
        "driver_plate": None,
        **payload.dict(),
        "status": "pending",
        "rating": None,
        "rating_comment": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.rides.insert_one(ride.copy())
    ride.pop("_id", None)
    # Notify all online drivers about new ride request
    online_drivers = await db.users.find({"role": "driver", "is_online": True}, {"_id": 0, "push_tokens": 1}).to_list(50)
    tokens = []
    for d in online_drivers:
        tokens.extend(d.get("push_tokens") or [])
    if tokens:
        await send_push(tokens, "🚖 Nowe zlecenie", f"{payload.pickup_address} → {payload.dest_address} • {payload.price_pln:.2f} zł",
                        {"type": "new_ride_request", "ride_id": ride_id})
    return ride

@api_router.get("/rides/pending")
async def list_pending_rides(request: Request):
    user = await get_current_user(request)
    if user.role != "driver":
        raise HTTPException(status_code=403, detail="Drivers only")
    rides = await db.rides.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return rides

@api_router.get("/rides/mine")
async def my_rides(request: Request):
    user = await get_current_user(request)
    q = {"passenger_id": user.user_id} if user.role == "passenger" else {"driver_id": user.user_id}
    rides = await db.rides.find(q, {"_id": 0}).sort("created_at", -1).to_list(100)
    return rides

@api_router.get("/rides/active")
async def active_ride(request: Request):
    user = await get_current_user(request)
    q_status = {"$in": ["pending", "accepted", "in_progress"]}
    q = {"passenger_id": user.user_id, "status": q_status} if user.role == "passenger" else {"driver_id": user.user_id, "status": q_status}
    ride = await db.rides.find_one(q, {"_id": 0}, sort=[("created_at", -1)])
    if ride and ride.get("driver_id"):
        # attach live driver location
        d = await db.users.find_one({"user_id": ride["driver_id"]}, {"_id": 0, "last_lat": 1, "last_lng": 1, "last_seen": 1})
        if d:
            ride["driver_lat"] = d.get("last_lat")
            ride["driver_lng"] = d.get("last_lng")
    return ride

@api_router.post("/rides/{ride_id}/accept")
async def accept_ride(ride_id: str, request: Request):
    user = await get_current_user(request)
    if user.role != "driver":
        raise HTTPException(status_code=403, detail="Drivers only")
    ride = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride["status"] != "pending":
        raise HTTPException(status_code=400, detail="Ride not pending")
    await db.rides.update_one(
        {"ride_id": ride_id, "status": "pending"},
        {"$set": {
            "driver_id": user.user_id,
            "driver_name": user.name,
            "driver_car": user.car_model,
            "driver_plate": user.plate,
            "status": "accepted",
            "accepted_at": datetime.now(timezone.utc),
        }},
    )
    updated = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
    # Notify passenger that driver accepted
    pt = await get_user_push_tokens(updated["passenger_id"])
    if pt:
        await send_push(pt, "✅ Kierowca w drodze!", f"{user.name} • {user.car_model or ''} • {user.plate or ''}",
                        {"type": "ride_accepted", "ride_id": ride_id})
    return updated

@api_router.post("/rides/{ride_id}/start")
async def start_ride(ride_id: str, request: Request):
    user = await get_current_user(request)
    ride = await db.rides.find_one({"ride_id": ride_id, "driver_id": user.user_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    await db.rides.update_one({"ride_id": ride_id}, {"$set": {"status": "in_progress"}})
    return await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})

@api_router.post("/rides/{ride_id}/complete")
async def complete_ride(ride_id: str, request: Request):
    user = await get_current_user(request)
    ride = await db.rides.find_one({"ride_id": ride_id, "driver_id": user.user_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    await db.rides.update_one({"ride_id": ride_id}, {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc)}})
    updated = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
    pt = await get_user_push_tokens(updated["passenger_id"])
    if pt:
        await send_push(pt, "🏁 Przejazd zakończony", f"Do zapłaty: {updated['price_pln']:.2f} zł",
                        {"type": "ride_completed", "ride_id": ride_id})
    return updated

@api_router.post("/rides/{ride_id}/cancel")
async def cancel_ride(ride_id: str, request: Request):
    user = await get_current_user(request)
    ride = await db.rides.find_one({"ride_id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride["passenger_id"] != user.user_id and ride.get("driver_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.rides.update_one({"ride_id": ride_id}, {"$set": {"status": "cancelled"}})
    return {"ok": True}

@api_router.post("/rides/{ride_id}/rate")
async def rate_ride(ride_id: str, payload: RatePayload, request: Request):
    user = await get_current_user(request)
    ride = await db.rides.find_one({"ride_id": ride_id, "passenger_id": user.user_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride["status"] != "completed":
        raise HTTPException(status_code=400, detail="Ride not completed")
    await db.rides.update_one({"ride_id": ride_id}, {"$set": {"rating": payload.rating, "rating_comment": payload.comment}})
    # update driver avg rating
    if ride.get("driver_id"):
        driver = await db.users.find_one({"user_id": ride["driver_id"]}, {"_id": 0})
        if driver:
            count = driver.get("rating_count", 0)
            avg = driver.get("rating_avg", 5.0)
            new_count = count + 1
            new_avg = ((avg * count) + payload.rating) / new_count
            await db.users.update_one({"user_id": ride["driver_id"]}, {"$set": {"rating_avg": round(new_avg, 2), "rating_count": new_count}})
    return {"ok": True}


# ============== HEALTH ==============
@api_router.get("/")
async def root():
    return {"message": "TAXIGO API", "version": "1.1"}


# ============== PUSH TOKEN REGISTRATION ==============
@api_router.post("/auth/push-token")
async def register_push_token(payload: PushTokenPayload, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$addToSet": {"push_tokens": payload.push_token}, "$set": {"push_platform": payload.platform}}
    )
    return {"ok": True}


# ============== STRIPE BLIK PAYMENTS ==============
@api_router.post("/payments/blik/create")
async def create_blik_payment(payload: BlikPayPayload, request: Request):
    user = await get_current_user(request)
    ride = await db.rides.find_one({"ride_id": payload.ride_id, "passenger_id": user.user_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride.get("payment_status") == "succeeded":
        raise HTTPException(status_code=400, detail="Already paid")
    amount_grosze = int(round(ride["price_pln"] * 100))

    # DEMO MODE: If no real Stripe key, simulate successful payment
    if not stripe.api_key or stripe.api_key in ("", "sk_test_emergent"):
        await db.rides.update_one(
            {"ride_id": payload.ride_id},
            {"$set": {"payment_status": "succeeded", "payment_method": "blik", "demo_payment": True}},
        )
        return {"status": "succeeded", "intent_id": f"demo_{uuid.uuid4().hex[:10]}", "demo": True}

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_grosze,
            currency="pln",
            payment_method_types=["blik"],
            description=f"TAXIGO przejazd {payload.ride_id}",
            metadata={"ride_id": payload.ride_id, "passenger_id": user.user_id},
        )
        intent = stripe.PaymentIntent.confirm(
            intent.id,
            payment_method_data={"type": "blik"},
            payment_method_options={"blik": {"code": payload.blik_code}},
        )
        await db.rides.update_one(
            {"ride_id": payload.ride_id},
            {"$set": {"payment_status": intent.status, "stripe_intent_id": intent.id, "payment_method": "blik"}},
        )
        return {"status": intent.status, "intent_id": intent.id}
    except stripe.error.StripeError as e:
        msg = str(getattr(e, "user_message", None) or e)
        raise HTTPException(status_code=400, detail=msg)


@api_router.get("/payments/{ride_id}/status")
async def payment_status(ride_id: str, request: Request):
    user = await get_current_user(request)
    ride = await db.rides.find_one({"ride_id": ride_id, "passenger_id": user.user_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    intent_id = ride.get("stripe_intent_id")
    if intent_id:
        try:
            intent = stripe.PaymentIntent.retrieve(intent_id)
            if intent.status != ride.get("payment_status"):
                await db.rides.update_one({"ride_id": ride_id}, {"$set": {"payment_status": intent.status}})
            return {"status": intent.status, "payment_status": intent.status}
        except Exception:
            pass
    return {"status": ride.get("payment_status", "unpaid"), "payment_status": ride.get("payment_status", "unpaid")}


# ============== TRIP RESERVATIONS ENDPOINTS ==============
@api_router.post("/trips/reservations")
async def create_trip_reservation(payload: TripReservationCreate):
    """Tworzy rezerwację wycieczki (publiczna, bez logowania)."""
    # sprawdź czy data nie jest zablokowana
    blocked = await db.trip_blocked_dates.find_one({
        "$or": [
            {"trip_slug": payload.trip_slug, "date": payload.date},
            {"trip_slug": "all", "date": payload.date},
        ]
    })
    if blocked:
        raise HTTPException(status_code=400, detail="Wybrana data jest niedostępna")
    # sprawdź czy data jest w przyszłości
    try:
        chosen = datetime.strptime(payload.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Nieprawidłowy format daty")
    today = datetime.now(timezone.utc).date()
    if chosen < today:
        raise HTTPException(status_code=400, detail="Nie można rezerwować w przeszłości")

    reservation_id = f"res_{uuid.uuid4().hex[:10]}"
    doc = {
        "reservation_id": reservation_id,
        **payload.dict(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    await db.trip_reservations.insert_one(doc.copy())
    doc.pop("_id", None)
    logger.info(f"📅 Nowa rezerwacja {reservation_id}: {payload.trip_name} • {payload.date} • {payload.people} os • {payload.name}")
    return doc


@api_router.get("/trips/reservations")
async def list_trip_reservations(x_admin_passcode: Optional[str] = Header(default=None, alias="X-Admin-Passcode")):
    """Lista wszystkich rezerwacji (panel admina)."""
    check_admin(x_admin_passcode)
    cursor = db.trip_reservations.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(500)
    return items


@api_router.patch("/trips/reservations/{reservation_id}")
async def update_trip_reservation(reservation_id: str, payload: TripReservationUpdate, x_admin_passcode: Optional[str] = Header(default=None, alias="X-Admin-Passcode")):
    check_admin(x_admin_passcode)
    result = await db.trip_reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rezerwacja nie znaleziona")
    doc = await db.trip_reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    return doc


@api_router.delete("/trips/reservations/{reservation_id}")
async def delete_trip_reservation(reservation_id: str, x_admin_passcode: Optional[str] = Header(default=None, alias="X-Admin-Passcode")):
    check_admin(x_admin_passcode)
    result = await db.trip_reservations.delete_one({"reservation_id": reservation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rezerwacja nie znaleziona")
    return {"ok": True}


@api_router.get("/trips/blocked-dates/{trip_slug}")
async def list_blocked_dates(trip_slug: str):
    """Lista zablokowanych dat dla wycieczki (publiczna - dla kalendarza)."""
    cursor = db.trip_blocked_dates.find(
        {"$or": [{"trip_slug": trip_slug}, {"trip_slug": "all"}]},
        {"_id": 0}
    )
    items = await cursor.to_list(1000)
    return items


@api_router.post("/trips/blocked-dates")
async def block_date(payload: BlockedDatePayload, x_admin_passcode: Optional[str] = Header(default=None, alias="X-Admin-Passcode")):
    check_admin(x_admin_passcode)
    try:
        datetime.strptime(payload.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Nieprawidłowy format daty (YYYY-MM-DD)")
    await db.trip_blocked_dates.update_one(
        {"trip_slug": payload.trip_slug, "date": payload.date},
        {"$set": {
            "trip_slug": payload.trip_slug,
            "date": payload.date,
            "reason": payload.reason or "",
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"ok": True, "trip_slug": payload.trip_slug, "date": payload.date}


@api_router.delete("/trips/blocked-dates/{trip_slug}/{date}")
async def unblock_date(trip_slug: str, date: str, x_admin_passcode: Optional[str] = Header(default=None, alias="X-Admin-Passcode")):
    check_admin(x_admin_passcode)
    result = await db.trip_blocked_dates.delete_one({"trip_slug": trip_slug, "date": date})
    return {"ok": True, "deleted": result.deleted_count}


@api_router.post("/trips/admin/verify")
async def verify_admin(payload: dict):
    """Weryfikacja PIN-u admina (bez zwracania danych wrażliwych)."""
    passcode = (payload or {}).get("passcode")
    check_admin(passcode)
    return {"ok": True}


# ============== TRIP STRIPE PAYMENTS (BLIK + CARD) ==============
@api_router.post("/trips/payment/blik")
async def trip_blik_pay(payload: TripBlikPayload):
    """Tworzy i potwierdza Stripe Payment Intent BLIK dla rezerwacji wycieczki."""
    res = await db.trip_reservations.find_one({"reservation_id": payload.reservation_id}, {"_id": 0})
    if not res:
        raise HTTPException(status_code=404, detail="Rezerwacja nie znaleziona")
    if res.get("payment_status") == "succeeded":
        raise HTTPException(status_code=400, detail="Rezerwacja jest już opłacona")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe nie jest skonfigurowane")

    amount_grosze = int(round(float(res["total_price"]) * 100))
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_grosze,
            currency="pln",
            payment_method_types=["blik"],
            description=f"TAXIGO Wycieczka: {res['trip_name']} ({payload.reservation_id})",
            metadata={"reservation_id": payload.reservation_id, "trip_slug": res["trip_slug"], "type": "trip"},
        )
        intent = stripe.PaymentIntent.confirm(
            intent.id,
            payment_method_data={"type": "blik"},
            payment_method_options={"blik": {"code": payload.blik_code}},
        )
        await db.trip_reservations.update_one(
            {"reservation_id": payload.reservation_id},
            {"$set": {
                "payment_status": intent.status,
                "stripe_intent_id": intent.id,
                "payment_method": "blik",
                "status": "confirmed" if intent.status == "succeeded" else res.get("status", "pending"),
                "paid_at": datetime.now(timezone.utc) if intent.status == "succeeded" else None,
            }},
        )
        return {"status": intent.status, "intent_id": intent.id}
    except stripe.error.StripeError as e:
        msg = str(getattr(e, "user_message", None) or e)
        raise HTTPException(status_code=400, detail=msg)


@api_router.post("/trips/payment/checkout")
async def trip_card_checkout(payload: TripCheckoutPayload):
    """Tworzy Stripe Checkout Session (karta) dla rezerwacji - returns URL do przekierowania."""
    res = await db.trip_reservations.find_one({"reservation_id": payload.reservation_id}, {"_id": 0})
    if not res:
        raise HTTPException(status_code=404, detail="Rezerwacja nie znaleziona")
    if res.get("payment_status") == "succeeded":
        raise HTTPException(status_code=400, detail="Rezerwacja jest już opłacona")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe nie jest skonfigurowane")

    amount_grosze = int(round(float(res["total_price"]) * 100))
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card", "blik"],
            line_items=[{
                "price_data": {
                    "currency": "pln",
                    "product_data": {
                        "name": f"TAXIGO Wycieczka: {res['trip_name']}",
                        "description": f"Data: {res['date']} • {res['people']} os. • Odbiór: {res['pickup_address'][:80]}",
                    },
                    "unit_amount": amount_grosze,
                },
                "quantity": 1,
            }],
            success_url=payload.success_url + ("?" if "?" not in payload.success_url else "&") + "session_id={CHECKOUT_SESSION_ID}",
            cancel_url=payload.cancel_url,
            customer_email=res.get("email"),
            metadata={"reservation_id": payload.reservation_id, "trip_slug": res["trip_slug"], "type": "trip"},
        )
        await db.trip_reservations.update_one(
            {"reservation_id": payload.reservation_id},
            {"$set": {"stripe_session_id": session.id, "payment_method": "card", "payment_status": "pending"}},
        )
        return {"url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        msg = str(getattr(e, "user_message", None) or e)
        raise HTTPException(status_code=400, detail=msg)


@api_router.get("/trips/payment/{reservation_id}/status")
async def trip_payment_status(reservation_id: str):
    """Sprawdza status płatności rezerwacji (do polling po Checkout)."""
    res = await db.trip_reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    if not res:
        raise HTTPException(status_code=404, detail="Rezerwacja nie znaleziona")
    intent_id = res.get("stripe_intent_id")
    session_id = res.get("stripe_session_id")
    new_status = res.get("payment_status", "unpaid")
    if stripe.api_key and session_id and new_status != "succeeded":
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == "paid":
                new_status = "succeeded"
                await db.trip_reservations.update_one(
                    {"reservation_id": reservation_id},
                    {"$set": {
                        "payment_status": "succeeded",
                        "status": "confirmed",
                        "stripe_intent_id": session.payment_intent,
                        "paid_at": datetime.now(timezone.utc),
                    }},
                )
        except Exception as e:
            logger.warning(f"Stripe session check failed: {e}")
    if stripe.api_key and intent_id and new_status != "succeeded":
        try:
            intent = stripe.PaymentIntent.retrieve(intent_id)
            if intent.status != new_status:
                new_status = intent.status
                await db.trip_reservations.update_one(
                    {"reservation_id": reservation_id},
                    {"$set": {"payment_status": intent.status, "status": "confirmed" if intent.status == "succeeded" else res.get("status", "pending")}},
                )
        except Exception:
            pass
    return {"payment_status": new_status, "reservation_status": res.get("status", "pending")}


# ============== RIDE RESERVATIONS (passenger books for future date) ==============
class RideReservationPayload(BaseModel):
    id: Optional[str] = None
    pickup: dict
    dest: dict
    distance_km: float
    price_pln: float
    date: str
    time: str
    name: str
    phone: str
    email: Optional[str] = ""
    notes: Optional[str] = ""
    createdAt: Optional[str] = None
    lang: Optional[str] = "pl"

@api_router.post("/rides/reservations")
async def create_ride_reservation(payload: RideReservationPayload):
    """Zapisuje rezerwację przejazdu (dla przyszłej daty) i wysyła email potwierdzający."""
    from email_service import send_ride_reservation_emails

    reservation_id = payload.id or f"rsv_{uuid.uuid4().hex[:10]}"
    doc = {
        "reservation_id": reservation_id,
        "pickup": payload.pickup,
        "dest": payload.dest,
        "distance_km": payload.distance_km,
        "price_pln": payload.price_pln,
        "date": payload.date,
        "time": payload.time,
        "name": payload.name,
        "phone": payload.phone,
        "email": payload.email or "",
        "notes": payload.notes or "",
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    await db.ride_reservations.insert_one(doc.copy())
    logger.info(f"📅 Rezerwacja przejazdu {reservation_id}: {payload.date} {payload.time} • {payload.name} • {payload.phone}")

    # Send emails (owner always + passenger if email provided)
    email_status = send_ride_reservation_emails(doc, lang=payload.lang or "pl")
    logger.info(f"📧 Email status: {email_status}")

    # Send web push notifications to all subscribed drivers + owner
    try:
        from push_service import broadcast_push
        push_status = await broadcast_push(
            db,
            filter_query={"role": {"$in": ["driver", "owner"]}},
            title="🔔 Nowa rezerwacja!" if (payload.lang or "pl") == "pl" else "🔔 New reservation!",
            body=f"{payload.name} • {payload.date} {payload.time} • {payload.dest.get('name','')} • {payload.price_pln:.0f} zł",
            url="/driver/home",
            tag=f"resv-{reservation_id}",
        )
        logger.info(f"📢 Push notifications: {push_status}")
    except Exception as e:
        logger.error(f"Push notification failed: {e}")

    doc.pop("_id", None)
    doc["created_at"] = doc["created_at"].isoformat()
    return {
        "ok": True,
        "reservation_id": reservation_id,
        "email_sent": email_status.get("passenger_sent", False) or email_status.get("owner_sent", False),
        "owner_notified": email_status.get("owner_sent", False),
        "passenger_confirmed": email_status.get("passenger_sent", False),
    }


@api_router.get("/rides/reservations")
async def list_ride_reservations(request: Request, x_admin_passcode: Optional[str] = Header(default=None, alias="X-Admin-Passcode")):
    """Lista rezerwacji przejazdów: dla kierowcy (wszystkie pending) lub admina (wszystkie)."""
    # Admin path
    if x_admin_passcode:
        check_admin(x_admin_passcode)
        cursor = db.ride_reservations.find({}, {"_id": 0}).sort("created_at", -1)
        items = await cursor.to_list(500)
    else:
        # Driver path — auth required
        user = await get_current_user(request)
        if user.role != "driver":
            raise HTTPException(status_code=403, detail="Drivers only")
        # Drivers see all pending + their own confirmed/completed
        cursor = db.ride_reservations.find(
            {"$or": [
                {"status": "pending"},
                {"driver_id": user.user_id},
            ]},
            {"_id": 0},
        ).sort("created_at", -1)
        items = await cursor.to_list(200)

    for it in items:
        if isinstance(it.get("created_at"), datetime):
            it["created_at"] = it["created_at"].isoformat()
        if isinstance(it.get("confirmed_at"), datetime):
            it["confirmed_at"] = it["confirmed_at"].isoformat()
    return items


class ReservationActionPayload(BaseModel):
    lang: Optional[str] = "pl"


@api_router.post("/rides/reservations/{reservation_id}/confirm")
async def confirm_ride_reservation(reservation_id: str, payload: Optional[ReservationActionPayload] = None, request: Request = None):
    """Kierowca potwierdza rezerwację - status: confirmed, wysyła email."""
    from email_service import _send, _html_reservation, OWNER_CC

    user = await get_current_user(request)
    if user.role != "driver":
        raise HTTPException(status_code=403, detail="Drivers only")

    resv = await db.ride_reservations.find_one({"reservation_id": reservation_id})
    if not resv:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if resv.get("status") == "confirmed":
        raise HTTPException(status_code=400, detail="Already confirmed")
    if resv.get("status") == "rejected":
        raise HTTPException(status_code=400, detail="Reservation was rejected")

    lang = (payload.lang if payload else None) or "pl"

    await db.ride_reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {
            "status": "confirmed",
            "driver_id": user.user_id,
            "driver_name": user.name,
            "driver_car": user.car_model,
            "driver_plate": user.plate,
            "confirmed_at": datetime.now(timezone.utc),
        }},
    )

    # Send confirmation emails: owner (always) + passenger (if verified domain)
    updated = await db.ride_reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    try:
        driver_info = f"{user.name} • {user.car_model or ''} • {user.plate or ''}"
        subj_owner = f"✅ Rezerwacja POTWIERDZONA — {updated.get('name','')} {updated.get('date','')} {updated.get('time','')}"
        html = _html_reservation(updated, lang="pl", passenger_view=False)
        html = html.replace("📥 Nowa rezerwacja przejazdu — TAXIGO",
                            f"✅ POTWIERDZONA — kierowca: {driver_info}")
        _send(OWNER_CC, subj_owner, html)

        pass_email = (updated.get("email") or "").strip().lower()
        if pass_email and pass_email != OWNER_CC.lower():
            subj_pass = ("✅ TAXIGO — Twoja rezerwacja potwierdzona" if lang == "pl"
                         else "✅ TAXIGO — Your reservation is confirmed")
            html_pass = _html_reservation(updated, lang=lang, passenger_view=True)
            confirm_line = (f"<div style='margin-top:14px;padding:12px;background:#00E676;border-radius:10px;color:#0F0F0F;font-weight:900;text-align:center;'>"
                            f"{'✅ Potwierdzona przez kierowcę' if lang=='pl' else '✅ Confirmed by driver'}: {driver_info}"
                            f"</div>")
            html_pass = html_pass.replace("<div style=\"margin-top:24px;", confirm_line + "<div style=\"margin-top:24px;")
            _send(pass_email, subj_pass, html_pass)
    except Exception as e:
        logger.error(f"Confirm email failed: {e}")

    updated["confirmed_at"] = updated["confirmed_at"].isoformat() if isinstance(updated.get("confirmed_at"), datetime) else updated.get("confirmed_at")
    updated["created_at"] = updated["created_at"].isoformat() if isinstance(updated.get("created_at"), datetime) else updated.get("created_at")
    return {"ok": True, "reservation": updated}


@api_router.post("/rides/reservations/{reservation_id}/reject")
async def reject_ride_reservation(reservation_id: str, request: Request = None):
    """Kierowca odrzuca rezerwację (może zostawić dla innego kierowcy)."""
    user = await get_current_user(request)
    if user.role != "driver":
        raise HTTPException(status_code=403, detail="Drivers only")
    result = await db.ride_reservations.update_one(
        {"reservation_id": reservation_id},
        {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


app.include_router(api_router)


# ============== WEB PUSH ENDPOINTS ==============
class PushSubscribePayload(BaseModel):
    subscription: dict  # {endpoint, keys: {p256dh, auth}}
    role: Optional[str] = "owner"  # owner, driver, passenger
    label: Optional[str] = ""


@api_router.get("/push/vapid-public-key")
async def get_vapid_public_key():
    from push_service import get_public_key, is_configured
    return {"publicKey": get_public_key(), "configured": is_configured()}


@api_router.post("/push/subscribe")
async def push_subscribe(payload: PushSubscribePayload):
    sub = payload.subscription
    endpoint = sub.get("endpoint", "")
    if not endpoint:
        raise HTTPException(status_code=400, detail="Invalid subscription")
    # Upsert by endpoint
    await db.push_subscriptions.update_one(
        {"endpoint": endpoint},
        {"$set": {
            "endpoint": endpoint,
            "subscription": sub,
            "role": payload.role or "owner",
            "label": payload.label or "",
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"ok": True}


@api_router.post("/push/unsubscribe")
async def push_unsubscribe(payload: dict):
    endpoint = payload.get("endpoint", "")
    if endpoint:
        await db.push_subscriptions.delete_one({"endpoint": endpoint})
    return {"ok": True}


@api_router.post("/push/test")
async def push_test(payload: Optional[dict] = None, x_admin_passcode: Optional[str] = Header(default=None, alias="X-Admin-Passcode")):
    """Admin sends a test push to all subscribers."""
    check_admin(x_admin_passcode)
    from push_service import broadcast_push
    result = await broadcast_push(
        db,
        filter_query={},
        title="🎉 TAXIGO Test",
        body="Powiadomienia działają! To jest testowe powiadomienie.",
        url="/",
        tag="test",
    )
    return result


app.include_router(api_router)


@app.get("/")
async def health_root():
    return {"status": "ok", "service": "TAXIGO API"}

# CORS - czyta listę dozwolonych origins z env, fallback do "*"
cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    # Wildcard nie działa z credentials - regex pozwala każdemu HTTPS origin
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origin_regex=r"https?://.*",
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    allowed = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=allowed,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
