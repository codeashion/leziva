# LEZIVA — Architecture Document 12: Security & Privacy Controls

## 1. Security Core Principles
LEZIVA handles sensitive customer addresses, phone numbers, and luxury payment flows. Security is built into the architecture from the foundational level.

---

## 2. Threat Vector Mitigations

| Threat Vector | Mitigation Strategy | Implementation |
| :--- | :--- | :--- |
| **SQL Injection** | Parameterized queries | Prisma ORM guarantees 100% prepared statements; raw SQL is prohibited. |
| **Cross-Site Scripting (XSS)** | Auto-escaping & CSP | React 19 JSX auto-escapes output; strict Content-Security-Policy headers enforce trusted script origins. |
| **CSRF Attacks** | SameSite Cookies + Origin validation | All authentication cookies use `SameSite=Lax` and `HttpOnly`; API routes validate `Origin` and `Referer` headers. |
| **Timing Attacks** | Constant-time comparisons | Razorpay HMAC signatures verified using `crypto.timingSafeEqual()`. |
| **Brute Force / DDoS** | Rate limiting | Redis-backed sliding window rate limiters on checkout and authentication routes. |
| **Secret Leakage** | Zod validation & client isolation | All secrets validated via `serverEnvSchema`. Client code has access only to `NEXT_PUBLIC_*` variables. |

---

## 3. HTTP Security Headers Configuration
The following production headers are enforced in `next.config.ts`:

- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (forces HTTPS).
- `X-Frame-Options`: `DENY` (prevents clickjacking).
- `X-Content-Type-Options`: `nosniff` (prevents MIME sniffing).
- `Referrer-Policy`: `strict-origin-when-cross-origin`.
- `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`.

---

## 4. Privacy & Compliance (DPDP Act & GDPR Alignment)
1. **PII Minimization**: Only contact and shipping information necessary to fulfill apparel delivery is requested.
2. **Payment Card Industry (PCI-DSS)**: LEZIVA servers **never** touch, receive, or store raw credit/debit card numbers or CVVs. All card processing is handled within Razorpay's PCI-DSS Level 1 compliant secure vault.
3. **Data Erasure & Anonymization**: Customer accounts can be closed and their personal details anonymized upon request while preserving financial invoice records for mandatory statutory tax audits.
