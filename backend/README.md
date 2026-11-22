# TheCreateStudio Backend (Java 21 · Spring Boot 4 · PostgreSQL)

Proposals with **e-signatures from both parties**, **signed PDF agreements** with an audit
certificate, and **Razorpay** advance payments. The Angular app (repo root) uses it at `/api`.

## What it does

```
Admin creates proposal (DRAFT) ──► Admin signs ──► Send (content locked, email/link)
      ──► Client opens link (VIEWED) ──► Client accepts T&C + signs (SIGNED, sealed PDF)
      ──► Client pays advance via Razorpay (PAID)  — or admin marks paid manually
```

- **Integrity:** when you sign, a SHA-256 fingerprint of the content is stored. The client can only
  sign if the content still matches. The final PDF includes both signatures, a Signature
  Certificate page (names, emails, times, IPs, device) and the full audit trail. Its SHA-256 hash is stored.
- **Payments:** the amount always comes from the database, never from the browser. A payment is
  only marked paid after Razorpay signature verification (checkout callback) or a verified webhook.
- **Security:** admin APIs need a JWT (login with rate limiting, BCrypt passwords). Client pages are
  reached only through an unguessable 256-bit link; drafts and cancelled proposals return 404.
- **No fake success:** without SMTP, emails are skipped and the admin is told to share the link.
  Without Razorpay keys, the payment button explains that online payment isn't available.

## API overview

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | admin |
| GET/POST | `/api/admin/proposals` | admin: list (filter `?status=`) / create |
| GET/PUT | `/api/admin/proposals/{id}` | admin: view / edit (DRAFT only) |
| POST | `/api/admin/proposals/{id}/sign` · `/send` · `/cancel` · `/mark-paid` | admin |
| GET | `/api/admin/proposals/{id}/pdf` | admin |
| POST | `/api/admin/proposals/{id}/resend-email` | admin: email the signing link again, or the signed PDF once signed (needs SMTP) |
| POST | `/api/admin/proposals/{id}/share` | admin: log a WhatsApp / email-app / copy share in the audit trail |
| GET | `/api/admin/integrations` | admin: whether email and Razorpay are configured |
| GET | `/api/public/proposals/{token}` · `/pdf` | client |
| POST | `/api/public/proposals/{token}/sign` | client |
| GET/POST | `/api/public/proposals/{token}/payment/status` · `/order` · `/verify` | client |
| POST | `/api/webhooks/razorpay` | Razorpay (HMAC-verified) |
| GET | `/actuator/health` | health check |

Errors use RFC 9457 problem JSON: `{ "detail": "message", "errors": { "field": "..." } }`.

## Run locally (Windows)

1. Create the database user once (you'll be asked for your `postgres` password):
   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -f scripts\create-local-db.sql
   ```
   (`scripts/create-local-db.sql` is gitignored and holds the local test password.)
2. Local settings live in `backend/src/main/resources/application-local.yml` (gitignored).
   Start from `application-local.yml.example` if it's missing.
3. Start the backend (port 8080):
   ```bash
   cd backend
   set SPRING_PROFILES_ACTIVE=local
   mvnw.cmd spring-boot:run
   ```
4. In another terminal, start the website (proxies `/api` to 8080): `npm start`
5. Open http://localhost:4200/admin and log in with the admin email/password from `application-local.yml`.

Run tests: `mvnw.cmd test`. Flyway creates and upgrades the tables automatically on startup.

## Configuration (environment variables)

See [`deploy/backend.env.example`](../deploy/backend.env.example): DB, `JWT_SECRET`, first
`ADMIN_EMAIL`/`ADMIN_PASSWORD`, Razorpay keys and webhook secret, optional SMTP, and `APP_PUBLIC_BASE_URL`.

## Razorpay setup

1. Razorpay Dashboard → **Account & Settings → API Keys** → generate **Test** keys (`rzp_test_…`).
2. Put them in `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` and restart.
3. Dashboard → **Webhooks → Add**: URL `https://<your-domain>/api/webhooks/razorpay`, events
   `payment.captured`, `order.paid`, `payment.failed`, and a secret → `RAZORPAY_WEBHOOK_SECRET`.
   Razorpay requires a public HTTPS URL for webhooks, so set this up once you have a domain. Until
   then, payments are still confirmed through the checkout signature check.
4. Test a payment with Razorpay's test cards/UPI, then switch to **Live** keys after KYC.

## Production server setup (one time, in PuTTY as root)

```bash
# 1. Java 21
apt update && apt install -y openjdk-21-jdk-headless
# 2. PostgreSQL (skip if already installed) + database and user
apt install -y postgresql
sudo -u postgres psql -c "CREATE ROLE tcs_app LOGIN PASSWORD 'CHOOSE-A-STRONG-PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE the_create_studio OWNER tcs_app;"
# 3. Service user, folders, secrets
useradd --system --no-create-home --shell /usr/sbin/nologin tcs
mkdir -p /opt/thecreatestudio-backend /etc/thecreatestudio
chown tcs:tcs /opt/thecreatestudio-backend
cp /opt/thecreatestudio/deploy/backend.env.example /etc/thecreatestudio/backend.env
chmod 600 /etc/thecreatestudio/backend.env
nano /etc/thecreatestudio/backend.env     # fill in DB_PASSWORD, JWT_SECRET, ADMIN_*, etc.
# 4. systemd service + updated nginx config
cp /opt/thecreatestudio/deploy/thecreatestudio-backend.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable thecreatestudio-backend
cp /opt/thecreatestudio/deploy/nginx.conf /etc/nginx/sites-available/thecreatestudio
nginx -t && systemctl reload nginx
```

After that, every push to `master` builds and tests the backend, restarts it, checks
`/actuator/health`, and only then publishes the new website. If anything fails, the live site stays as it was.
Logs: `journalctl -u thecreatestudio-backend -f`.
