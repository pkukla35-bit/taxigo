# Test Credentials – TAXIGO

Authentication is **Emergent-managed Google OAuth**. There are no app-managed passwords.

## Testing approach (per Emergent Auth playbook)
For automated tests, create a test user and session directly in MongoDB and use the session token as a Bearer header.

```
mongosh --eval "
use('test_database');
var pid = 'user_' + Date.now();
var ptok = 'test_pass_' + Date.now();
db.users.insertOne({user_id: pid, email: 'pass.'+Date.now()+'@example.com', name: 'Test Pasażer', role: 'passenger', rating_avg: 5.0, rating_count: 0, is_online: false, created_at: new Date()});
db.user_sessions.insertOne({user_id: pid, session_token: ptok, expires_at: new Date(Date.now()+7*86400000), created_at: new Date()});

var did = 'user_' + (Date.now()+1);
var dtok = 'test_driver_' + Date.now();
db.users.insertOne({user_id: did, email: 'drv.'+Date.now()+'@example.com', name: 'Test Kierowca', role: 'driver', car_model: 'Toyota Corolla', plate: 'WA 12345', rating_avg: 5.0, rating_count: 0, is_online: false, created_at: new Date()});
db.user_sessions.insertOne({user_id: did, session_token: dtok, expires_at: new Date(Date.now()+7*86400000), created_at: new Date()});

print('PASSENGER_TOKEN=' + ptok);
print('DRIVER_TOKEN=' + dtok);
"
```

Use the printed tokens as `Authorization: Bearer <token>` in API calls.

## Roles
- `passenger` – can create rides, view own rides, cancel, rate.
- `driver` – can toggle online, list/accept pending rides, start/complete/cancel, get earnings stats.

No allowlist or domain restriction.
