# LEZIVA — Architecture Document 10: Velocity Shipping Integration Plan

## 1. Velocity Shipping Overview
LEZIVA partners with **Velocity Shipping** as its logistics backbone across India. Velocity Shipping provides programmatic courier aggregation (Delhivery, BlueDart, DTDC, XpressBees, Smartr) via a unified API.

All logistics integration code is isolated behind a dedicated adapter interface in `src/server/integrations/velocity/`.

---

## 2. Core API Integration Endpoints

All requests communicate over HTTPS with `Authorization: Bearer <VELOCITY_API_KEY>` and `Content-Type: application/json`.

| Operation | Method | Velocity Endpoint Path | Business Usage |
| :--- | :--- | :--- | :--- |
| **Serviceability Check** | `POST` | `/v1/serviceability/check` | Real-time PIN code lookup on PDP & Checkout |
| **Rate Calculator** | `POST` | `/v1/rates/calculate` | Compute live shipping fees by weight & zone |
| **Manifest Shipment** | `POST` | `/v1/shipments/create` | Generated upon admin packing; returns AWB |
| **Generate Shipping Label** | `GET` | `/v1/shipments/{awb}/label` | Downloads thermal 4x6 / A4 barcode label PDF |
| **Live Tracking** | `GET` | `/v1/tracking/{awb}` | Polls real-time transit milestones |
| **Cancel Shipment** | `POST` | `/v1/shipments/{awb}/cancel` | Used before courier pickup if order cancelled |
| **Reverse Return Pickup** | `POST` | `/v1/returns/create` | Triggers customer doorstep reverse pickup |

---

## 3. Detailed Data Contracts

### 3.1 PIN Code Serviceability Request & Response
```typescript
export interface VelocityServiceabilityRequest {
  pickupPincode: string;    // e.g. "395006" (Surat Atelier Warehouse)
  deliveryPincode: string;  // Customer entered 6-digit PIN
  paymentMode: "PREPAID" | "COD";
  weightGrams: number;
}

export interface VelocityServiceabilityResponse {
  isServiceable: boolean;
  estimatedDeliveryDays: number;
  availableCouriers: Array<{
    courierName: string;
    courierCode: string;
    estimatedDate: string;
    rateInr: number;
  }>;
}
```

### 3.2 Shipment Manifesting & Label Generation
When an order moves from `PROCESSING` to `PACKED` in the admin dashboard:
1. LEZIVA dispatches the manifest payload including warehouse pickup address, customer destination, volumetric dimensions (`length`, `width`, `height`), and insured invoice value.
2. Velocity assigns an **Air Waybill (AWB)** number (e.g. `VEL-9821482194`).
3. The generated label PDF URL is saved to `Shipment.labelUrl` for 1-click thermal printing by atelier warehouse staff.

---

## 4. Resilience & Circuit Breaker Architecture
To ensure the customer shopping experience is never blocked if Velocity Shipping experiences external API downtime:
1. **Pincode Caching**: Successful pincode serviceability checks are cached in Redis with a 24-hour TTL.
2. **Fallback Mode**: If the Velocity API is temporarily unresponsive, the checkout falls back to an offline serviceability matrix of all major Indian postal circles, allowing the shopper to place the order without failure.
3. **Queue-Backed Manifesting**: Shipment creation jobs run asynchronously in BullMQ with exponential backoff (retries: 3, delay: 5s).
