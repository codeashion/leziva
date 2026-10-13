# LEZIVA — Architecture Document 02: Technology Stack & Rationale

## 1. Selected Technology Stack

| Layer | Technology | Version | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 16.4.0 | SSR, static generation, partial prefetching, image optimization |
| **UI Library** | React | 19.3.0 | Modern concurrent UI rendering, Transitions, Suspense |
| **Language** | TypeScript | 5.9.3 | End-to-end type safety, strict compile checks, shared domain models |
| **Styling** | Tailwind CSS + CSS Tokens | 4.x | Modular design system, performance-optimized compiled styles |
| **Iconography** | Lucide React | 1.55.x | Consistent, lightweight SVG micro-icons |
| **Database** | PostgreSQL | 16.x | ACID-compliant relational persistence, transactions, JSONB indexing |
| **ORM** | Prisma ORM | 7.10.x | Type-safe migrations, auto-generated TypeScript query client |
| **Cache & Ephemeral** | Redis | 7.x | High-throughput session storage, cart caching, rate limiting |
| **Background Queues** | BullMQ | 5.x | Asynchronous background processing (webhooks, email, shipping sync) |
| **Payment Gateway** | Razorpay Node SDK | 2.9.x | Cards, UPI, Netbanking, COD validation, signature verification |
| **Shipping & Logistics** | Velocity Shipping Custom API | v1 | Warehouse manifestation, AWB generation, live tracking |
| **Object Storage** | AWS S3 / Cloudflare R2 | S3 API | High-resolution editorial fashion lookbooks, CDN delivery |
| **Validation** | Zod | 4.x | Schema-based runtime validation for inputs, webhooks & env |
| **Testing** | Node 24 Native Test Runner | v24.12 | Ultra-fast execution, zero peer-dependency drag, native TypeScript |

---

## 2. Architectural Framework Rationale: Unified Modular Architecture

### 2.1 The Decision: Modular Next.js API Layer vs Duplicate Microservices
The prompt specifies:
> *"Choose one backend framework and use it consistently. Do not build unnecessary duplicate backends. If a repository already uses a suitable stack, inspect it and propose the least disruptive compatible architecture before replacing anything."*

After inspecting the repository, the application uses **Next.js 16.4.0 App Router with TypeScript and React 19**. 

Rather than introducing an independent, disconnected NestJS/Express server running on a separate port with duplicated models and network hops, LEZIVA adopts a **Unified Modular Backend Architecture**:

1. **Dedicated Server Domain Boundary (`src/server/`)**:
   - All backend business logic is strictly encapsulated inside `src/server/` (Services, Repositories, DB access, Integrations, and Queues).
   - Route Handlers in `src/app/api/...` serve strictly as HTTP entry points (Controllers) that validate payloads with Zod and delegate directly to `src/server/services/`.
   - UI components are strictly forbidden from directly importing Prisma or backend service layers.
2. **Zero-Latency In-Memory Invocations**:
   - Server-side rendering (RSC) and API routes communicate with database repositories directly via Prisma without network latency overhead.
3. **End-to-End TypeScript Type Sharing**:
   - DTOs, domain models, and validation schemas in `src/shared/` are shared effortlessly between client and server without code generation steps.
4. **Decoupling Feasibility**:
   - Because all business logic lives inside `src/server/services/`, the entire backend can be extracted into a standalone NestJS or Fastify service at any point in the future if organizational scaling requires separate microservice deployments.

---

## 3. Database Rationale: PostgreSQL & Prisma 7.x

1. **Relational Integrity for E-Commerce**: E-commerce requires strict relational constraints between Users, Addresses, Orders, OrderItems, Shipments, and Payments. PostgreSQL guarantees ACID compliance.
2. **Decimal Handling**: Prices, shipping rates, and discounts are stored using PostgreSQL `DECIMAL(10, 2)` to eliminate floating-point arithmetic errors.
3. **Optimistic Locking**: Prevents simultaneous race conditions when the last piece of a limited bridal saree is purchased by multiple shoppers simultaneously.
4. **Prisma 7.10**: Delivers compiled schema generation, zero-boilerplate queries, and automated migration versioning.

---

## 4. Cache & Queue Rationale: Redis & BullMQ

1. **Redis**:
   - Ephemeral guest carts.
   - Pincode serviceability cache (caching Velocity Shipping responses for 24 hours to prevent repeated external API roundtrips).
   - API rate limiting (protecting checkout and authentication endpoints from brute force).
2. **BullMQ**:
   - Long-running or retryable tasks: asynchronous order confirmation emails, Velocity Shipping status polling, and payment webhook reconciliation jobs run out-of-band without stalling user HTTP requests.
