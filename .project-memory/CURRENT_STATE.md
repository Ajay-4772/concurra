# ORDERFLOW – Current State

## 1. Current Phase
**PHASE 2 — DOMAIN ENTITIES, DATABASE SCHEMA & FLYWAY MIGRATIONS (STEP 1 COMPLETE & VERIFIED)**

The authoritative relational database foundation, Flyway migration version 2, decoupled JPA entities, Spring Data repositories, and deterministic seed data are fully established and verified against PostgreSQL.

---

## 2. Infrastructure & Container Status

| Service | Container Name | Image | Port | Status | Verified Health |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | `orderflow-postgres` | `postgres:16` | 5432 | `Up (healthy)` | Flyway applied `V1__init.sql` and `V2__schema.sql` cleanly |
| **Redis** | `orderflow-redis` | `redis:7-alpine` | 6379 | `Up (healthy)` | `redis-cli ping` passing |
| **Backend** | `orderflow-backend` | Spring Boot 3 / Temurin 17 JRE | 8080 | `Up (healthy)` | All 6 entities and repositories mapped; `GET /api/health` passing |
| **Frontend** | `orderflow-frontend` | Nginx Alpine (React 18 SPA) | 3000 | `Up` | HTTP 200 OK |

---

## 3. Database Schema & Tables Established (`V2__schema.sql`)

All relations reside in PostgreSQL as the authoritative source of truth:

1. **`products`**:
   - Columns: `id` (PK, BIGSERIAL), `sku` (UNIQUE), `name`, `price`, `created_at`.
2. **`inventory`**:
   - Columns: `id` (PK, BIGSERIAL), `product_id` (FK to `products.id`, UNIQUE), `available_quantity`, `reserved_quantity`, `version`, `updated_at`.
   - Constraints: Database-level `CHECK (available_quantity >= 0)` and `CHECK (reserved_quantity >= 0)` to guarantee zero overselling at the storage engine level.
3. **`orders`**:
   - Columns: `id` (PK, BIGSERIAL), `order_number` (UNIQUE), `customer_id`, `status`, `total_amount`, `retry_count`, `created_at`, `updated_at`.
   - Indexes on `status` and `created_at`.
4. **`order_items`**:
   - Columns: `id` (PK, BIGSERIAL), `order_id` (FK to `orders.id` CASCADE), `product_id` (FK to `products.id`), `quantity` (CHECK > 0), `unit_price`.
   - Index on `order_id`.
5. **`order_events`**:
   - Columns: `id` (PK, BIGSERIAL), `order_id`, `order_number`, `event_type`, `payload`, `created_at`.
   - Indexes on `order_id` and `created_at`.
6. **`dead_letter_queue`**:
   - Columns: `id` (PK, BIGSERIAL), `order_id`, `order_number`, `reason`, `payload`, `retry_count`, `failed_at`.
   - Indexes on `order_number` and `failed_at`.

---

## 4. JPA Domain Entities & Repositories

- **`OrderStatus`**: Enum supporting `PENDING`, `PROCESSING`, `COMPLETED`, `OUT_OF_STOCK`, `RETRYING`, `FAILED`, `DEAD_LETTERED`.
- **`Product`**: Maps `products` table with timestamp lifecycle callbacks.
- **`Inventory`**: Maps `inventory` table. **Decoupled design**: Stores `private Long productId;` as a direct foreign-key scalar rather than maintaining a `@OneToOne Product` mapping. This prevents unnecessary joins/entity loading during high-throughput order concurrency.
- **`Order`**: Maps `orders` table with `OrderStatus` enum representation and timestamp auditing.
- **`OrderItem`**: Maps `order_items` table with decoupled `orderId` and `productId` references.
- **`OrderEvent`**: Maps `order_events` table for transaction lifecycle audit logging.
- **`DeadLetterQueue`**: Maps `dead_letter_queue` table for unrecoverable failure inspection.
- **Repositories**:
  - `ProductRepository`: By SKU and ID.
  - `InventoryRepository`: Includes atomic conditional update method `decrementAvailableStock(productId, quantity)`.
  - `OrderRepository`: By orderNumber, status, and creation order.
  - `OrderItemRepository`: By orderId.
  - `OrderEventRepository`: By orderId and recent activity logs.
  - `DeadLetterQueueRepository`: By orderNumber and recent failures.

---

## 5. Verified Demo Seed Data

| Product ID | SKU | Name | Price | Initial Available | Initial Reserved | Benchmark Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `PROD-LAPTOP` | Laptop | $1200.00 | **10** | 0 | Hackathon benchmark target (10 initial stock vs 100 concurrent orders) |
| 2 | `PROD-KEYBOARD` | Keyboard | $80.00 | **25** | 0 | Standard catalog item |
| 3 | `PROD-MOUSE` | Mouse | $40.00 | **30** | 0 | Standard catalog item |
| 4 | `PROD-MONITOR` | Monitor | $300.00 | **15** | 0 | Standard catalog item |
| 5 | `PROD-HEADPHONES` | Headphones | $150.00 | **20** | 0 | Standard catalog item |

---

## 6. Current Limitations
- **No Order Processing Logic**: Order creation workflows, ThreadPool execution, Redis Streams event publication, retry logic, DLQ processing, and SSE streaming are not yet implemented.
- **Phase 2 Step 1 Guard**: Only the database schema, Flyway migrations, JPA entities, and repositories are established.

---

## 7. Next Development Phase
**PHASE 2 STEP 2 / PHASE 3 — ORDER CREATION & CONCURRENT INVENTORY ENGINE**
- Implement Order creation DTOs and REST controllers.
- Implement Order service and safe inventory reservation using the atomic conditional update.
- Spring `ThreadPoolTaskExecutor` concurrency worker pool configuration.
