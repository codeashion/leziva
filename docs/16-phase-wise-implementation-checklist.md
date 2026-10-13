# LEZIVA — Architecture Document 16: Phase-Wise Implementation Checklist

This checklist defines the complete, rigorous implementation roadmap across all 10 development phases.

---

## Phase 0 — Project Foundation & Architecture (CURRENT — COMPLETED)
- [x] Inspect existing Next.js 16 / React 19 repository.
- [x] Establish official brand identity, typography, and palette (Warm Ivory `#EAE6DE`, Deep Editorial Blue `#226192`, Coral Orange `#EF8557`).
- [x] Create vector logo and monogram assets (`public/brand/leziva-logo.svg`, `public/brand/leziva-symbol.svg`, `public/favicon.svg`).
- [x] Create design tokens in `src/styles/tokens.css` and configure Tailwind CSS v4.
- [x] Build core UI primitives (`Button`, `Badge`, `Input`, `Card`, `Logo`).
- [x] Define comprehensive PostgreSQL Prisma schema with all e-commerce models and indices.
- [x] Implement database seed template (`prisma/seed.ts`).
- [x] Configure environment variable validation schema with Zod (`src/shared/validations/env.ts`).
- [x] Build standardized error hierarchy (`src/utils/errors.ts`) and API response envelope (`src/utils/api-response.ts`).
- [x] Implement structured logger (`src/utils/logger.ts`).
- [x] Implement `/api/health` system monitoring route.
- [x] Set up automated test runner (`npm test`) with 100% passing tests.
- [x] Generate 16 core architecture specification documents in `docs/`.
- [x] Verify project builds cleanly via Next.js Turbopack (`npm run build`).

---

## Phase 1 — Backend & Database (COMPLETED ✅)
- [x] Establish PostgreSQL database connection configuration with Prisma 7 and `@prisma/adapter-pg`.
- [x] Configure `prisma.config.ts` for database migrations.
- [x] Implement robust Redis connection service with exponential retry, ping probe, namespacing, and rate limiting (`src/server/redis/client.ts`).
- [x] Implement database models: Users, Roles, UserRoles, Sessions, Tokens, AuditLogs, and DataDeletionRequests.
- [x] Configure indices on normalizedEmail, status, sessionToken, and audit timestamps.
- [x] Implement password hashing and verification using bcrypt (`src/server/auth/password.ts`).
- [x] Implement token hashing (SHA-256) and email normalization (`src/server/auth/tokens.ts`).
- [x] Build User, Session, and Audit repositories with zero secret leakage.
- [x] Implement AuthService handling registration (restricted to CUSTOMER), login, logout, password reset, and session invalidation.
- [x] Implement authentication and RBAC guards (`requireAuth`, `requireRoles`) with secure HttpOnly cookies.
- [x] Implement REST API endpoints:
  - `POST /api/v1/auth/register` (Rate limited: 5/10m)
  - `POST /api/v1/auth/login` (Rate limited: 5/5m)
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/forgot-password` (Rate limited: 3/10m)
  - `POST /api/v1/auth/reset-password` (Rate limited: 5/10m)
  - `POST /api/v1/auth/sessions/revoke`
- [x] Implement Liveness (`/api/health`) and Readiness (`/api/ready`) probes.
- [x] Generate OpenAPI 3.1 specification at `docs/openapi.yaml` and programmatic endpoint `/api/v1/docs`.
- [x] Implement secure admin bootstrap script (`npm run auth:bootstrap-admin`).
- [x] Write and pass 29 automated tests covering security, password hashing, tokens, RBAC, Redis, and input validation.
- [x] Verify Turbopack production compilation (`npm run build`).

---

## Phase 2 — Premium UI & Storefront
- [ ] Build responsive luxury navigation header with mega-menu category dropdowns and mobile drawer.
- [ ] Build editorial hero banner with video/high-res lookbook carousel.
- [ ] Implement "Curated Collections" showcase (Sarees, Lehengas, Fusion Wear, Kurtis).
- [ ] Build luxury product card with quick-view, image swipe, and hover micro-animations.
- [ ] Implement "Artisan Heritage" editorial storytelling section.
- [ ] Build comprehensive footer with brand ethos, newsletter, and trust badges.
- [ ] Validate responsive layout on iPhone, iPad, and desktop viewports.

---

## Phase 3 — Products, Search, Cart & Wishlist
- [ ] Build Product Listing Page (PLP) with multi-facet filters (Size, Color, Fabric, Price range, Occasion).
- [ ] Build Product Detail Page (PDP) with high-res zoom, size selector, fabric drape guide.
- [ ] Implement Redis-backed persistent shopping cart (Guest and User sync).
- [ ] Implement slide-over mini cart drawer with live subtotal and free shipping progress meter.
- [ ] Build customer wishlist with heart toggle and local storage sync.
- [ ] Implement live search with debounce and instant autocomplete suggestions.

---

## Phase 4 — Checkout & Payments
- [ ] Build multi-step / 1-page luxury checkout (Shipping Address, Delivery Method, Payment Selection).
- [ ] Implement Razorpay payment modal with UPI, Cards, Netbanking support.
- [ ] Implement Razorpay HMAC SHA256 signature verification in API route.
- [ ] Implement Cash on Delivery (COD) flow with OTP confirmation.
- [ ] Implement promotional coupon validation engine (Flat amount, Percentage with max cap).
- [ ] Build order confirmation page with print invoice action.

---

## Phase 5 — Velocity Shipping Integration
- [ ] Implement Velocity Shipping client in `src/server/integrations/velocity/`.
- [ ] Connect real-time PIN code serviceability check on PDP and checkout.
- [ ] Implement automated shipment manifesting and AWB generation when order is marked packed.
- [ ] Implement PDF shipping label generation and download route.
- [ ] Implement Velocity tracking webhook listener and automated timeline updates.
- [ ] Build customer-facing live order tracking page.

---

## Phase 6 — Complete Admin Dashboard
- [ ] Build secure `/admin` portal with role-based authentication (`Role: ADMIN`).
- [ ] Implement metrics overview (Gross revenue, orders count, pending shipments, low stock SKUs).
- [ ] Build Product & Variant CRUD with image upload to S3/CDN.
- [ ] Build Inventory management table with quick stock adjustments.
- [ ] Build Order management module with status transitions and 1-click dispatch.
- [ ] Build Coupon management and customer audit screens.

---

## Phase 7 — Security, Policies & Privacy
- [ ] Publish legal policies: Privacy Policy, Terms of Service, Return & Exchange Policy, Shipping Policy.
- [ ] Implement GDPR / DPDP cookie consent banner.
- [ ] Audit and enforce security headers (HSTS, CSP, X-Frame-Options).
- [ ] Implement customer account data export and deletion workflows.
- [ ] Conduct vulnerability audit (`npm audit`) and resolve dependencies.

---

## Phase 8 — SEO, QA & Performance
- [ ] Implement dynamic Open Graph (OG) cards, Twitter cards, and JSON-LD structured data (Product, Breadcrumb).
- [ ] Implement dynamic `sitemap.xml` and `robots.txt`.
- [ ] Conduct image optimization audit ensuring WebP/AVIF compression.
- [ ] Run automated end-to-end checkout simulation tests.
- [ ] Conduct Lighthouse performance and accessibility audits targeting 95+ scores.

---

## Phase 9 — Production Deployment
- [ ] Configure production environment variables in hosting provider.
- [ ] Apply production database migrations (`prisma migrate deploy`).
- [ ] Configure custom domain with HTTPS and Cloudflare edge rules.
- [ ] Set up automated database daily backup workflows.
- [ ] Configure uptime monitoring and error tracking (Sentry / Datadog).
- [ ] Conduct end-to-end production verification checklist.
