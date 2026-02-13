# wasabi-sayt

## Eskiz SMS integration

Client order confirmation SMS can be sent through Eskiz (`notify.eskiz.uz`).

Required environment variables:

```env
ESKIZ_ENABLED=1
ESKIZ_EMAIL=your_eskiz_email
ESKIZ_PASSWORD=your_eskiz_secret_code
ESKIZ_FROM=4546
```

Optional:

```env
ESKIZ_BASE_URL=https://notify.eskiz.uz
ESKIZ_CALLBACK_URL=https://your-domain.com/api/eskiz/callback
```

Behavior:
- On order creation, the app sends an SMS confirmation to the customer.
- Token is cached in memory, refreshed on `401` via `/api/auth/refresh`, and relogin is used as fallback.
- If Eskiz is not configured, order flow continues without SMS.
