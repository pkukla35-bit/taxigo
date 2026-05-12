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


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
