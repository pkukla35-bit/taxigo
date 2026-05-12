# TAXIGO – PRD

## Overview
TAXIGO is an Expo (React Native) mobile application connecting passengers with drivers. The app has two distinct flows accessed from a role-selection startup screen:
- **Passenger** (light theme): order rides, see drivers on map, track ride, view history, rate driver.
- **Driver** (dark "Performance Pro" theme): toggle online/offline, browse pending requests, accept/start/complete rides, view earnings history.

## Tech Stack
- **Frontend:** Expo SDK 54, expo-router, react-native, react-native-webview + Leaflet/OpenStreetMap map, react-native-qrcode-svg, @expo/vector-icons.
- **Backend:** FastAPI, MongoDB (motor), httpx.
- **Auth:** Emergent-managed Google OAuth (session_token, 7-day expiry).

## Key MVP Features
- Role selection (Pasażer / Kierowca) at startup.
- Google sign-in (role-aware account creation).
- Passenger: address picker (Warsaw POIs), distance/price calc, ride ordering, real-time ride tracking, driver info card, cancel, 1–5 star rating + comment.
- Driver: vehicle setup (car model + plate), online/offline switch, list of pending rides with passenger/route/price, accept → start → complete flow, history with earnings & rating stats.
- Shared QR-code page (`/share`) for inviting friends to install the app.

## Backend API (prefix `/api`)
- `POST /auth/session`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/role`
- `POST /driver/online`, `GET /drivers/online`
- `POST /rides`, `GET /rides/pending`, `GET /rides/mine`, `GET /rides/active`
- `POST /rides/{id}/accept|start|complete|cancel|rate`

## Notes
- Map is rendered via WebView+Leaflet (OpenStreetMap tiles) for cross-platform support including web preview.
- Payments: NOT in MVP – `price_pln` calculated client-side; cash flow assumed. Stripe will be added later.
- Polish UI throughout.
