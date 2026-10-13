# LEZIVA — Architecture Document 15: Environment Variable Reference

## 1. Environment Variable Architecture
All environment variables are declared in `.env` and strictly validated at application startup using **Zod** (`src/shared/validations/env.ts`).

---

## 2. Server-Side Variables (Never Exposed to Client)

| Variable Name | Type | Required | Default / Placeholder | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Enum | Yes | `development` | Runtime environment (`development`, `test`, `production`). |
| `PORT` | Number | No | `3000` | Local server port. |
| `DATABASE_URL` | URL | Yes | `postgresql://...` | Primary PostgreSQL pooled connection string. |
| `DIRECT_URL` | URL | Optional | `postgresql://...` | Direct non-pooled PostgreSQL URL for Prisma migrations. |
| `REDIS_URL` | URL | Yes | `redis://localhost:6379` | Redis connection URL for caching, sessions, and queues. |
| `AUTH_SECRET` | String | Yes | `[32-char hex string]` | Secret key used to encrypt sessions and sign JWTs. |
| `RAZORPAY_KEY_ID` | String | Yes | `rzp_test_...` | Razorpay public API key. |
| `RAZORPAY_KEY_SECRET` | String | Yes | `rzp_secret_...` | Razorpay private secret (HMAC verification). |
| `RAZORPAY_WEBHOOK_SECRET` | String | Yes | `webhook_secret_...` | Webhook verification secret for payment callbacks. |
| `VELOCITY_API_KEY` | String | Yes | `velocity_key_...` | Velocity Shipping API authentication token. |
| `VELOCITY_API_URL` | URL | Yes | `https://api.velocityshipping.com/v1` | Velocity Shipping API base endpoint. |
| `VELOCITY_WAREHOUSE_PINCODE` | String | Yes | `395006` | Origin warehouse pincode (Surat Atelier). |
| `S3_BUCKET_NAME` | String | Yes | `leziva-fashion-media` | AWS S3 or Cloudflare R2 bucket name. |
| `S3_REGION` | String | Yes | `ap-south-1` | AWS S3 region (Mumbai). |
| `S3_ACCESS_KEY_ID` | String | Yes | `s3_access_...` | Cloud object storage access key. |
| `S3_SECRET_ACCESS_KEY` | String | Yes | `s3_secret_...` | Cloud object storage secret key. |
| `SMTP_HOST` | String | Yes | `smtp.mailtrap.io` | Outbound email SMTP server. |
| `SMTP_PORT` | Number | Yes | `587` | Outbound email port. |
| `SMTP_USER` | String | Yes | `smtp_user_...` | Outbound email username. |
| `SMTP_PASS` | String | Yes | `smtp_pass_...` | Outbound email password. |
| `EMAIL_FROM` | String | Yes | `concierge@leziva.com` | Verified outbound sender address. |

---

## 3. Client-Side Variables (Exposed via `NEXT_PUBLIC_*`)

| Variable Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL | Yes | `http://localhost:3000` | Canonical platform URL. |
| `NEXT_PUBLIC_BRAND_NAME` | String | Yes | `LEZIVA` | Brand display title. |
| `NEXT_PUBLIC_CDN_DOMAIN` | URL | No | `https://cdn.leziva.com` | CDN domain for high-speed imagery. |
