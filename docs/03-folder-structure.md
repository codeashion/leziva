# LEZIVA — Architecture Document 03: Folder Structure

## 1. Directory Tree Overview

The LEZIVA project structure maintains strict separation between client presentation, backend domain logic, shared schemas, and external integrations.

```
leziva/
├── .env.example                     # Environment template (placeholders only)
├── .gitignore                       # Git ignore configuration
├── AGENTS.md                        # Project instructions and agent rules
├── package.json                     # Dependencies, scripts, and project metadata
├── tsconfig.json                    # Strict TypeScript compiler options
├── next.config.ts                   # Next.js 16 configuration
├── eslint.config.mjs                # ESLint 9 configuration
│
├── docs/                            # Architectural & Operational Documentation
│   ├── 01-project-overview.md
│   ├── 02-technology-stack-and-rationale.md
│   ├── 03-folder-structure.md
│   ├── 04-database-architecture-plan.md
│   ├── 05-api-architecture-plan.md
│   ├── 06-authentication-and-authorization-plan.md
│   ├── 07-product-and-inventory-data-model.md
│   ├── 08-checkout-and-order-lifecycle.md
│   ├── 09-payment-integration-plan.md
│   ├── 10-velocity-shipping-integration-plan.md
│   ├── 11-redis-caching-and-background-jobs.md
│   ├── 12-security-and-privacy-controls.md
│   ├── 13-testing-strategy.md
│   ├── 14-deployment-architecture.md
│   ├── 15-environment-variable-reference.md
│   └── 16-phase-wise-implementation-checklist.md
│
├── prisma/                          # Database Definition & Seed Layer
│   ├── schema.prisma                # PostgreSQL data models, relations, indices
│   └── seed.ts                      # Initial catalog seed (categories, tax, tags)
│
├── public/                          # Static Assets & Brand Media
│   ├── brand/
│   │   ├── leziva-logo.svg          # Official vector horizontal logo
│   │   └── leziva-symbol.svg        # Official vector monogram crest
│   ├── favicon.svg                  # High-DPI browser favicon
│   └── images/                      # Placeholder product & lifestyle assets
│
└── src/
    ├── app/                         # Next.js App Router (Storefront & API Endpoints)
    │   ├── api/                     # API Route Handlers (HTTP Controllers)
    │   │   ├── health/route.ts      # Health check endpoint
    │   │   ├── auth/                # Authentication endpoints
    │   │   ├── products/            # Catalog query endpoints
    │   │   ├── cart/                # Cart management endpoints
    │   │   ├── checkout/            # Checkout flow endpoints
    │   │   ├── webhooks/            # Inbound webhooks (Razorpay, Velocity)
    │   │   └── admin/               # Admin dashboard endpoints
    │   ├── globals.css              # Global styles & Tailwind entry
    │   ├── layout.tsx               # Root layout, Google fonts & metadata
    │   └── page.tsx                 # Atelier flagship home page
    │
    ├── components/                  # Reusable UI Primitives & Brand Elements
    │   ├── brand/                   # Brand logo & crest components
    │   │   └── logo.tsx
    │   ├── ui/                      # Atomic accessible components
    │   │   ├── button.tsx
    │   │   ├── badge.tsx
    │   │   ├── input.tsx
    │   │   └── card.tsx
    │   ├── storefront/              # Storefront compound components (Phases 2-4)
    │   └── admin/                   # Admin dashboard components (Phase 6)
    │
    ├── config/                      # Application Configurations
    │   ├── brand.ts                 # Brand constants, colors, typography
    │   └── site.ts                  # Site navigation, metadata & links
    │
    ├── server/                      # Dedicated Server-Side Domain Core
    │   ├── db/                      # Database connection singleton
    │   │   └── prisma.ts
    │   ├── redis/                   # Redis connection & cache client
    │   │   └── client.ts
    │   ├── repositories/            # Data access layer (User, Product, Order)
    │   ├── services/                # Business logic (OrderService, CartService)
    │   ├── integrations/            # Third-Party API Providers
    │   │   ├── razorpay/            # Payment gateway client & signature verification
    │   │   └── velocity/            # Velocity Shipping courier API wrapper
    │   └── queues/                  # BullMQ job queues and workers
    │
    ├── shared/                      # Code Shared Between Client & Server
    │   ├── constants/               # Status codes, shipping constants
    │   ├── types/                   # TypeScript interfaces, domain models
    │   │   └── index.ts
    │   └── validations/             # Zod input validation schemas
    │       └── env.ts
    │
    ├── styles/                      # Design System Tokens
    │   └── tokens.css               # CSS custom properties (colors, typography)
    │
    ├── tests/                       # Automated Test Suites
    │   ├── env.test.ts              # Environment validation tests
    │   └── errors.test.ts           # Error handling tests
    │
    └── utils/                       # Shared Helper Utilities
        ├── api-response.ts          # Unified JSON response helper
        ├── errors.ts                # Application error classes
        └── logger.ts                # Structured application logger
```

---

## 2. Layer Responsibilities & Isolation Rules

1. **`src/components/ui/`**: Pure presentational primitives. Zero database or API fetching code allowed.
2. **`src/app/api/`**: Thin controllers. Parses HTTP inputs, validates against Zod schemas in `src/shared/validations`, invokes `src/server/services/`, and returns standardized responses using `apiSuccess` / `apiError`.
3. **`src/server/services/`**: The brain of the platform. Contains transaction logic, inventory deduction, coupon rules, and order lifecycle state transitions.
4. **`src/server/integrations/`**: Fully isolated client wrappers for Razorpay and Velocity Shipping. Any breaking changes in third-party vendor APIs affect only these modules.
