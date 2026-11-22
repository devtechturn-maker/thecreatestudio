# TheCreateStudio Backend (Java 21 · Spring Boot 4 · PostgreSQL)

Proposals with **e-signatures from both parties**, **signed PDF agreements** with an audit
certificate, and **manual payment tracking**. The Angular app (repo root) uses it at `/api`.

## What it does

```
Admin creates proposal (DRAFT) ──► Admin signs ──► Send (content locked, email/link)
      ──► Client opens link (VIEWED) ──► Client accepts T&C + signs (SIGNED, sealed PDF)
      ──► Admin records each payment received (PAID once the whole fee is in)
```

- **Integrity:** when you sign, a SHA-256 fingerprint of the content is stored. The client can only
  sign if the content still matches. The final PDF includes both signatures, a Signature
  Certificate page (names, emails, times, IPs, device) and the full audit trail. Its SHA-256 hash is stored.
- **Payments:** the admin records every payment by hand (cash, UPI, bank transfer, online, cheque, other)
  and sets the amount due. The client sees the balance and history; there is no online checkout.
- **Security:** admin APIs need a JWT (login with rate limiting, BCrypt passwords). Client pages are
  reached only through an unguessable 256-bit link; drafts and cancelled proposals return 404.
- **No fake success:** without SMTP, emails are skipped and the admin is told to share the link.


## API overview

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | admin |
| GET/POST | `/api/admin/proposals` | admin: list (filter `?status=`) / create |
| GET/PUT | `/api/admin/proposals/{id}` | admin: view / edit (DRAFT only) |
| POST | `/api/admin/proposals/{id}/sign` · `/send` · `/cancel` | admin |
| GET | `/api/admin/proposals/{id}/pdf` | admin |
| POST | `/api/admin/proposals/{id}/resend-email` | admin: email the signing link again, or the signed PDF once signed (needs SMTP) |
| POST | `/api/admin/proposals/{id}/share` | admin: log a WhatsApp / email-app / copy share in the audit trail |
| GET | `/api/admin/payments` | admin: every client's received, balance and due |
| GET | `/api/admin/proposals/{id}/account` | admin: balance and payment history |
| POST | `/api/admin/proposals/{id}/payments` | admin: record cash, UPI, bank, cheque or other |
| POST | `/api/admin/proposals/{id}/payments/{entryId}/cancel` | admin: cancel an entry, with a reason |
| PUT | `/api/admin/proposals/{id}/due` | admin: set the amount due now and its date |
| POST | `/api/admin/proposals/{id}/payment-update` | admin: email the client a payment summary |
| GET | `/api/public/proposals/{token}/account` | client: paid, balance, due and history |
| GET | `/api/admin/integrations` | admin: whether email is configured |
| GET | `/api/public/proposals/{token}` · `/pdf` | client |
| POST | `/api/public/proposals/{token}/sign` | client |
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
`ADMIN_EMAIL`/`ADMIN_PASSWORD`, optional SMTP, and `APP_PUBLIC_BASE_URL`.

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
