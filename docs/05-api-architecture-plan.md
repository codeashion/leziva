# LEZIVA — Architecture Document 05: API Architecture Plan

## 1. API Design Philosophy
All LEZIVA API endpoints adhere to strict RESTful conventions, returning deterministic, structured JSON payloads with uniform envelopes and predictable HTTP status codes.

---

## 2. Standard Envelope Specifications

### 2.1 Success Response (`apiSuccess<T>`)
```json
{
  "success": true,
  "data": {
    "id": "prod_cm4k92m",
    "title": "Royal Midnight Banarasi Silk Saree",
    "slug": "royal-midnight-banarasi-silk-saree"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  },
  "timestamp": "2026-10-12T10:15:30.123Z"
}
```

### 2.2 Error Response (`apiError`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Pincode is not serviceable for cash on delivery",
    "details": {
      "field": "pincode",
      "value": "110001",
      "codAvailable": false
    }
  },
  "timestamp": "2026-10-12T10:15:30.123Z"
}
```

---

## 3. Core Endpoint Catalog

### 3.1 Storefront & Public Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status & dependencies | None |
| `GET` | `/api/products` | Paginated product listing with filters | None |
| `GET` | `/api/products/[slug]` | Product details with variants & images | None |
| `GET` | `/api/categories` | Complete category hierarchy | None |
| `GET` | `/api/shipping/serviceability` | Verify pincode via Velocity Shipping | None |

### 3.2 Cart & Checkout Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Get current cart by session/user | Session Token |
| `POST` | `/api/cart/items` | Add item/variant to cart | Session Token |
| `PATCH` | `/api/cart/items/[id]` | Update item quantity | Session Token |
| `DELETE` | `/api/cart/items/[id]` | Remove item from cart | Session Token |
| `POST` | `/api/cart/coupon` | Apply promotional coupon code | Session Token |
| `POST` | `/api/checkout/orders` | Create draft order & calculate totals | Optional (Guest supported) |
| `POST` | `/api/checkout/razorpay/create-order` | Generate Razorpay order ID | Required |
| `POST` | `/api/checkout/razorpay/verify` | Verify payment signature | Required |

### 3.3 Customer Account Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/orders` | List user past orders | JWT / Session |
| `GET` | `/api/user/orders/[id]` | Order details and live tracking | JWT / Session |
| `GET` | `/api/user/addresses` | Get saved delivery addresses | JWT / Session |
| `POST` | `/api/user/addresses` | Save new delivery address | JWT / Session |

### 3.4 Webhook Ingestion Endpoints
| Method | Endpoint | Description | Security |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/webhooks/razorpay` | Payment capture & failure events | HMAC SHA256 Signature |
| `POST` | `/api/webhooks/velocity` | Shipment status update events | API Secret Header |

### 3.5 Admin Dashboard Endpoints (Role: `ADMIN`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/metrics` | Revenue, orders, pending shipments | Role: ADMIN |
| `POST` | `/api/admin/products` | Create new product & variants | Role: ADMIN |
| `PATCH` | `/api/admin/inventory` | Adjust variant stock levels | Role: ADMIN |
| `POST` | `/api/admin/orders/[id]/ship` | Trigger Velocity shipment manifest | Role: ADMIN |

---

## 4. Rate Limiting & Anti-Abuse
- Public API routes: 100 requests per minute per IP.
- Checkout & payment initiation: 10 requests per minute per IP.
- Rate limiting implemented using Redis token bucket algorithms with standard `429 Too Many Requests` responses.
