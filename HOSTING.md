# 🚀 TAXIGO – Wdrożenie produkcyjne na Vercel + Railway + MongoDB Atlas

Pełna instrukcja krok po kroku, żeby Twoja aplikacja działała 24/7 ze stabilnym URL.

---

## ETAP 0: Pobierz kod z Emergent (2 min)

1. W Emergent kliknij **„Code"** w prawym górnym rogu
2. Wybierz **„Save to GitHub"** lub **„Download ZIP"**
3. Jeśli GitHub:
   - Zaloguj się przez GitHub (utwórz konto na github.com jeśli nie masz)
   - Emergent automatycznie utworzy repo np. `pawlo74/taxigo`
4. Jeśli ZIP:
   - Rozpakuj na komputerze
   - Załóż konto GitHub i wgraj kod ręcznie (lub poproś mnie o pomoc)

---

## ETAP 1: MongoDB Atlas – darmowa baza danych (5 min)

### 1.1 Załóż konto
1. Wejdź na **https://www.mongodb.com/cloud/atlas/register**
2. Zaloguj się przez Google
3. Wybierz **„M0 Free"** (512MB, wystarczy na ~50 000 kursów)
4. Region: **Frankfurt (eu-central-1)** – najbliższy Polsce
5. Kliknij **„Create"**

### 1.2 Skonfiguruj dostęp
1. Database Access → **„Add New Database User"**
   - Username: `taxigo`
   - Password: wygeneruj silne (zapisz!) – np. `Tg7$mK9pQ2vR`
   - Database User Privileges: **Read and write to any database**
2. Network Access → **„Add IP Address"** → **„Allow Access from Anywhere"** (`0.0.0.0/0`)

### 1.3 Skopiuj connection string
1. Database → **„Connect"** → **„Drivers"**
2. Skopiuj URL typu:
```
mongodb+srv://taxigo:<PASSWORD>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
3. **Podstaw `<PASSWORD>`** swoim hasłem
4. Dodaj nazwę bazy na końcu: `/taxigo_prod`
5. Końcowy URL:
```
mongodb+srv://taxigo:Tg7$mK9pQ2vR@cluster0.xxxxx.mongodb.net/taxigo_prod?retryWrites=true&w=majority
```

**ZAPISZ TEN URL** – wkleisz go za chwilę.

---

## ETAP 2: Railway – backend FastAPI (10 min)

### 2.1 Załóż konto
1. Wejdź na **https://railway.com/**
2. **Sign up with GitHub** (użyj tego samego konta GitHub co w Etapie 0)
3. Otrzymasz $5 darmowych kredytów/mies. – wystarczy dla TAXIGO

### 2.2 Wdróż backend
1. Kliknij **„New Project"** → **„Deploy from GitHub repo"**
2. Wybierz repo `pawlo74/taxigo`
3. Railway wykryje strukturę i zapyta o **Root Directory** – wpisz: **`backend`**
4. Klikni **„Deploy"** – Railway zacznie budować

### 2.3 Dodaj zmienne środowiskowe
W Railway przejdź do projektu → **Variables** → dodaj:

| Klucz | Wartość |
|---|---|
| `MONGO_URL` | (wklej URL z MongoDB Atlas z Etapu 1.3) |
| `DB_NAME` | `taxigo_prod` |
| `STRIPE_API_KEY` | (z dashboardu Stripe lub zostaw `sk_test_emergent` dla trybu demo) |
| `PORT` | `8001` |

### 2.4 Skopiuj URL backendu
1. Settings → **Networking** → **Generate Domain**
2. Otrzymasz URL typu: `https://taxigo-api-production.up.railway.app`
3. **ZAPISZ TEN URL**

### 2.5 Sprawdź czy działa
W przeglądarce otwórz: `https://taxigo-api-production.up.railway.app/api/`
Powinno wyświetlić: `{"message":"TAXIGO API","version":"1.1"}`

---

## ETAP 3: Vercel – frontend Expo Web (8 min)

### 3.1 Załóż konto
1. Wejdź na **https://vercel.com/signup**
2. **Continue with GitHub**

### 3.2 Wdróż frontend
1. **„Add New… → Project"**
2. Wybierz repo `pawlo74/taxigo`
3. **Root Directory:** `frontend`
4. **Framework Preset:** Other (lub zostaw auto-detect)
5. **Environment Variables** – dodaj:

| Klucz | Wartość |
|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | URL z Etapu 2.4 (Railway) |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ1IjoicGF3bG83NCIs...` (Twój Mapbox token) |

6. Kliknij **„Deploy"** – Vercel zbuduje (~5 min)

### 3.3 Skopiuj produkcyjny URL
Otrzymasz np.: `https://taxigo-pawlo74.vercel.app` – **TO JEST TWÓJ FINALNY URL DLA PASAŻERÓW!**

### 3.4 Zaktualizuj vercel.json
W repo edytuj `frontend/vercel.json`:
- Zmień `YOUR-RAILWAY-BACKEND` na właściwą subdomenę z Railway (Etap 2.4)
- Commit + push → Vercel automatycznie zaktualizuje

---

## ETAP 4: Aktualizacja Google OAuth (3 min)

Google logowanie musi znać nową domenę:

1. Wejdź na **https://console.cloud.google.com**
2. W panelu Emergent Google Auth (jeśli używasz go) – API redirect uri musi zawierać Twój vercel URL
3. **LUB** kontynuuj z Emergent Google Auth – działa pod każdą domeną

---

## ETAP 5: Aktualizacja Mapbox (2 min)

Zabezpiecz token przed kradzieżą:

1. Wejdź na **https://account.mapbox.com/access-tokens/**
2. Wybierz swój token → **URL Restrictions**
3. Dodaj: `https://taxigo-pawlo74.vercel.app/*` (Twój Vercel URL)

---

## ✅ GOTOWE!

Twoja aplikacja działa pod **stabilnym URL 24/7**:
- 🌐 Frontend: `https://taxigo-pawlo74.vercel.app`
- 🔌 Backend: `https://taxigo-api-production.up.railway.app`
- 💾 Baza: MongoDB Atlas Frankfurt

**To jest URL który dajesz pasażerom!**

---

## 🛠️ Aktualizacje aplikacji w przyszłości

Kiedy chcesz coś zmienić:
1. Wprowadź zmiany w Emergent
2. Kliknij **„Code → Push to GitHub"**
3. Vercel i Railway **automatycznie zaktualizują się** w 5 minut

---

## 💸 Koszty

| Usługa | Plan | Miesięczny limit darmowy | Kiedy zaczniesz płacić |
|---|---|---|---|
| MongoDB Atlas | M0 | 512 MB danych | Powyżej 512 MB (∼50k kursów) |
| Railway | Hobby | $5 kredytów | Powyżej $5 ruchu (~100k requestów) |
| Vercel | Hobby | 100 GB transferu | Powyżej 100 GB (∼100k wizyt) |
| Mapbox | Free | 50k wyświetleń mapy | Powyżej 50k |

**Łącznie: 0 zł/mies. do ~50 000 użytkowników aktywnych.**
