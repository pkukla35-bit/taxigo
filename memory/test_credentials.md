# Test Credentials

## Admin Panel (Wycieczki)
- URL: `wycieczki-z-krakowa.pl/wycieczki/admin`
- **PIN: `taxigo2025`**
- Header: `X-Admin-Passcode: taxigo2025`

## Reservation email
- Owner: pkukla35@gmail.com


## Driver test account (created via POST /api/admin/drivers)
- Email: `kierowca1@taxigo.pl`
- Password: `MocneHaslo123`
- Phone: `+48500100200`
- Car: Toyota Camry / plate KR12345
- Note: Only exists in local dev DB. Create fresh on production via admin panel.

## Driver password-login flow
- Endpoint: POST /api/auth/driver-login { email, password }
- Returns: { session_token, user } → identical shape to Google login
- Session tokens stored in same user_sessions collection (7-day expiry)
- Admin can create drivers via POST /api/admin/drivers with X-Admin-Passcode header
