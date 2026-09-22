# ORDERFLOW – Real-Time Concurrent Order Processing & Inventory System

## 1. Project Overview
**OrderFlow** is a resilient, high-throughput order processing system built to handle high-concurrency order spikes while providing an absolute guarantee that inventory never drops below zero.

### The Hackathon Demonstration Benchmark
The core benchmark to prove genuine concurrency and zero overselling:
- **Initial Inventory**: 10
- **Concurrent Orders**: 100
- **Quantity Per Order**: 1
- **Expected Results**:
  - **Completed Orders**: 10
  - **Out of Stock Orders**: 90
  - **Failed Orders**: 0
  - **Final Inventory**: 0
- Orders must be genuinely executed concurrently across backend worker threads, with real-time feedback streamed to the frontend dashboard.

---

## 2. Core Architecture & Tech Stack

### Architecture Style
- **Clean Modular Monolith**: High performance, single deployment unit, clear module boundaries. No premature microservices, no unnecessary operational overhead.

### Technology Stack
- **Backend**:
  - Java 17
  - Spring Boot 3
  - Spring Data JPA
  - Spring Web
  - Spring Validation
  - Maven
- **Database**:
  - PostgreSQL (Permanent, authoritative source of truth for inventory and orders)
- **Redis & In-Memory Coordination**:
  - Redis
  - Redis Streams (event ingestion and worker distribution)
  - Redis Caching (fast dashboard aggregate metric retrieval)
  - Redis Coordination / Locking (distributed locks and idempotency keys)
  - *Note: Redis must NOT become the permanent source of truth for inventory.*
- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - Axios
  - Recharts (real-time telemetry and metrics visualization)
- **Real-Time Communication**:
  - Server-Sent Events (SSE) for unidirectional, persistent live feeds
- **Infrastructure**:
  - Docker & Docker Compose (orchestrating PostgreSQL, Redis, backend, and frontend)

---

## 3. Inventory Safety Mechanism
Inventory overselling is prevented at the database layer using atomic conditional SQL updates in PostgreSQL:

```sql
UPDATE inventory
SET available_quantity = available_quantity - :quantity
WHERE product_id = :productId
  AND available_quantity >= :quantity;
```

- If affected rows == 1: Reservation succeeded; proceed to order completion.
- If affected rows == 0: Insufficient stock; order immediately marked `OUT_OF_STOCK`.
- Transactions must be tightly scoped to avoid long-running locks.

---

## 4. Concurrency & Asynchronous Processing
- **Execution Engine**: Spring `ThreadPoolTaskExecutor`
- **Initial Thread Pool Configuration**:
  - `corePoolSize`: 5
  - `maxPoolSize`: 10
  - `queueCapacity`: 100
- **Event Pipeline**: Redis Streams ingest incoming order requests and dispatch to executor threads.

---

## 5. Order Lifecycle & Statuses

```
[PENDING] ---> [PROCESSING] ---> [COMPLETED]
                     |
                     +---------> [OUT_OF_STOCK] (Terminal, never retried)
                     |
                     +---------> [RETRYING] (Transient errors only, max 3 attempts)
                                     |
                                     +---> [PROCESSING] ...
                                     |
                                     +---> [FAILED] ---> [DEAD_LETTERED]
```

### Full Status Set
1. `PENDING`: Order received and persisted.
2. `PROCESSING`: Order dequeued by a worker thread; inventory reservation attempted.
3. `COMPLETED`: Inventory successfully reserved; order confirmed.
4. `OUT_OF_STOCK`: Insufficient inventory. Terminal status. **Must NOT be retried.**
5. `RETRYING`: Transient system error occurred. Scheduled for retry with exponential backoff.
6. `FAILED`: Processing failed before terminal dead-lettering.
7. `DEAD_LETTERED`: Exceeded maximum retry count (3 attempts). Archived in dead letter store.

---

## 6. Retry Policy & Dead Letter Queue (DLQ)
- **Maximum Retries**: 3 attempts.
- **Backoff**: Exponential backoff for transient failures (network, transient DB timeouts).
- **Invariants**:
  - `OUT_OF_STOCK` is business logic rejection, NOT a transient failure. Never retry `OUT_OF_STOCK`.
  - Once retry count reaches 3, transition status to `DEAD_LETTERED` and insert record into `dead_letter_queue` table with diagnostic payload.

---

## 7. Redis Responsibilities
1. **Idempotency**: Prevent duplicate order submissions using unique client request IDs / idempotency tokens.
2. **Coordination & Locking**: Distributed coordination where appropriate (e.g. simulation locks, rate limiting).
3. **Redis Streams**: Reliable asynchronous message stream between ingest and processing workers.
4. **Dashboard Metric Caching**: Low-latency cache for real-time order counters and inventory status.

---

## 8. Real-Time Events (Server-Sent Events)
The system publishes domain events via SSE to all connected clients:
- `ORDER_CREATED`
- `ORDER_PROCESSING`
- `ORDER_COMPLETED`
- `ORDER_OUT_OF_STOCK`
- `ORDER_RETRYING`
- `ORDER_FAILED`
- `ORDER_DEAD_LETTERED`
- `INVENTORY_UPDATED`

---

## 9. Database Schema (PostgreSQL Tables)
1. `products`: Catalog items (ID, SKU, name, price, created_at).
2. `inventory`: Stock levels (`product_id`, `available_quantity`, `reserved_quantity`, `version`).
3. `orders`: Orders header (`id`, `order_number`, `customer_id`, `status`, `total_amount`, `created_at`, `updated_at`).
4. `order_items`: Order line items (`id`, `order_id`, `product_id`, `quantity`, `unit_price`).
5. `dead_letter_queue`: Exhausted failure records (`id`, `order_id`, `reason`, `payload`, `retry_count`, `failed_at`).
6. `order_events`: Audit log of lifecycle transitions (`id`, `order_id`, `event_type`, `payload`, `created_at`).

---

## 10. Core Feature List
1. **Order Creation and Management**: Full REST API for single and batch order creation.
2. **Concurrent Order Processing**: Multi-threaded asynchronous order execution engine.
3. **Safe Inventory Reservation**: PostgreSQL atomic conditional updates guaranteeing non-negative stock.
4. **Idempotency**: Strict duplicate request filtering using Redis keys.
5. **Redis Streams**: Durable message ingestion pipeline.
6. **Retry with Exponential Backoff**: Up to 3 retries for transient system issues.
7. **Dead Letter Queue (DLQ)**: Diagnostic isolation for repeatedly failing orders.
8. **Real-time SSE Updates**: Zero-polling dashboard live updates.
9. **Operations Dashboard**: Live visualization of system throughput, queue depth, inventory, and status breakdown.
10. **Concurrency Simulator**: Built-in trigger to fire 100 concurrent requests against 10 inventory units.
11. **Demo Reset**: Single-click database and Redis wipe/seed to return to pristine baseline state.
12. **Automated Concurrency Tests**: JUnit / integration test suite asserting zero overselling under multi-threaded load.
