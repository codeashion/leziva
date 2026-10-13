# LEZIVA — Haute Couture & Contemporary Ethnic Atelier

LEZIVA is a premium, original, production-oriented fashion e-commerce platform for bespoke sarees, lehengas, fusion dresses, kurtis, and designer contemporary women's fashion.

---

## 🎨 Official Brand Identity
- **Warm Ivory**: `#EAE6DE`
- **Deep Editorial Blue**: `#226192`
- **Coral Orange**: `#EF8557`
- **Official Assets**: `public/brand/leziva_logo.webp`, `public/favicon.png`

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 20 (v24 recommended)
- PostgreSQL 16
- Redis 7 (or Docker)

### 2. Environment Setup
Copy the example environment file and configure your local or hosted database:
```bash
cp .env.example .env
```

### 3. Local Infrastructure with Docker (Optional)
To start PostgreSQL 16 and Redis 7 with persistent storage and health checks:
```bash
docker compose up -d
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Database Schema & Migration Workflow (Prisma 7)
Validate schema, generate client with `@prisma/adapter-pg`, and apply migrations:
```bash
npm run db:validate
npm run db:generate

# In development against live PostgreSQL:
npx prisma migrate dev --name init_phase1

# In production / CI:
npx prisma migrate deploy

# Seed system roles & initial atelier categories:
npm run db:seed
```

### 6. Secure Administrator Provisioning
Create the initial `SUPER_ADMIN` account safely via the one-time bootstrap script (never hardcoded in seeds):
```bash
ADMIN_BOOTSTRAP_EMAIL="admin@leziva.com" ADMIN_BOOTSTRAP_PASSWORD="YourSecurePassword123!" npm run auth:bootstrap-admin
```

### 7. Run Automated Tests
Execute the 29 unit and integration test assertions:
```bash
npm test
```

### 8. Start Development Server
```bash
npm run dev
```

- Storefront: [http://localhost:3000](http://localhost:3000)
- Liveness Probe: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Readiness Probe (PostgreSQL & Redis): [http://localhost:3000/api/ready](http://localhost:3000/api/ready)
- OpenAPI Specification: [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)

---

## 🔑 Authentication Endpoints (REST API v1)

| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register customer account (Restricted to `CUSTOMER` role) | 5 / 10m |
| `POST` | `/api/v1/auth/login` | Authenticate credentials & issue HttpOnly session | 5 / 5m |
| `POST` | `/api/v1/auth/logout` | Revoke session in DB & clear cookie | None |
| `GET` | `/api/v1/auth/me` | Fetch authenticated profile & roles (Guarded) | None |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token (Opaque response) | 3 / 10m |
| `POST` | `/api/v1/auth/reset-password` | Reset password & invalidate all active sessions | 5 / 10m |
| `POST` | `/api/v1/auth/sessions/revoke` | Invalidate current or all sessions across devices | Guarded |

---

## 📚 Core Architecture Documents
Complete architectural documentation is maintained under the `/docs` directory:

1. [01 - Project Overview](docs/01-project-overview.md)
2. [02 - Technology Stack & Rationale](docs/02-technology-stack-and-rationale.md)
3. [03 - Folder Structure](docs/03-folder-structure.md)
4. [04 - Database Architecture Plan](docs/04-database-architecture-plan.md)
5. [05 - API Architecture Plan](docs/05-api-architecture-plan.md)
6. [06 - Authentication & Authorization Plan](docs/06-authentication-and-authorization-plan.md)
7. [07 - Product & Inventory Data Model](docs/07-product-and-inventory-data-model.md)
8. [08 - Checkout & Order Lifecycle](docs/08-checkout-and-order-lifecycle.md)
9. [09 - Payment Integration Plan](docs/09-payment-integration-plan.md)
10. [10 - Velocity Shipping Integration Plan](docs/10-velocity-shipping-integration-plan.md)
11. [11 - Redis Caching & Background Jobs](docs/11-redis-caching-and-background-jobs.md)
12. [12 - Security & Privacy Controls](docs/12-security-and-privacy-controls.md)
13. [13 - Testing Strategy](docs/13-testing-strategy.md)
14. [14 - Deployment Architecture](docs/14-deployment-architecture.md)
15. [15 - Environment Variable Reference](docs/15-environment-variable-reference.md)
16. [16 - Phase-Wise Implementation Checklist](docs/16-phase-wise-implementation-checklist.md)
17. [OpenAPI 3.1 Specification](docs/openapi.yaml)

---

## 🏆 Implementation Milestones
- **Phase 0 — Project Foundation & Architecture**: **COMPLETED ✅**
- **Phase 1 — Backend Infrastructure & Authentication**: **COMPLETED ✅**
- **Phase 2 — Premium UI & Storefront**: **READY TO COMMENCE ⏳**
