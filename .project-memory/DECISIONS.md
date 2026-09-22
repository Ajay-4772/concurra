# ORDERFLOW – Architecture Decision Records (ADRs)

---

### ADR-001: Architecture Style — Clean Modular Monolith
- **Status**: Accepted
- **Context**: Hackathon projects often fail due to premature distributed systems overhead (microservices, distributed transactions, network latency, multiple deployment targets).
- **Decision**: Build OrderFlow as a clean modular monolith using Spring Boot 3 and Java 17. Organize code into well-defined domain packages (order, inventory, event, simulation, dlq).
- **Consequences**:
  - Eliminates network serialization overhead and dual-write distributed transaction bugs.
  - Keeps deployment straightforward via Docker Compose.
  - Zero Kafka, Kubernetes, or RabbitMQ operational burden.

---

### ADR-002: PostgreSQL as the Authoritative Source of Truth for Inventory
- **Status**: Accepted
- **Context**: Inventory overselling during high concurrent bursts is the central failure mode of naive e-commerce architectures.
- **Decision**: PostgreSQL is the single source of truth for inventory state. Inventory reservations MUST be executed using atomic conditional SQL updates:
  ```sql
  UPDATE inventory
  SET available_quantity = available_quantity - :quantity
  WHERE product_id = :productId
    AND available_quantity >= :quantity;
  ```
- **Consequences**:
  - Leverages database row-level locking natively without requiring long-lived locks or distributed transactions.
  - If rows updated == 1, reservation is guaranteed. If rows updated == 0, stock is exhausted.
  - Inventory can mathematically never drop below zero under any concurrency load.

---

### ADR-003: Demarcation of Redis Responsibilities
- **Status**: Accepted
- **Context**: Redis is frequently misused as an unbacked cache or fragile primary store for inventory, leading to data loss or desynchronization upon crashes.
- **Decision**: Redis will strictly handle:
  1. Idempotency token storage to avoid duplicate processing.
  2. Distributed coordination/locking for simulation boundaries.
  3. Redis Streams for decoupled asynchronous event consumption.
  4. Caching aggregate dashboard metrics.
  *Redis must NEVER be the authoritative or permanent source of truth for inventory.*
- **Consequences**:
  - Inventory data remains durable in ACID PostgreSQL.
  - High read throughput for live metrics without hammering the relational database.

---

### ADR-004: Concurrency Engine via Spring `ThreadPoolTaskExecutor`
- **Status**: Accepted
- **Context**: The backend must demonstrate genuine multi-threaded concurrent order execution rather than simulated or serialized single-threaded loop execution.
- **Decision**: Use a dedicated Spring `ThreadPoolTaskExecutor` bean with initial parameters:
  - `corePoolSize`: 5
  - `maxPoolSize`: 10
  - `queueCapacity`: 100
- **Consequences**:
  - Genuine thread concurrency on the JVM.
  - Realistic queueing, thread contention, and backpressure testing.
  - Provides clear visibility into worker thread behavior for the operations dashboard.

---

### ADR-005: Real-Time Telemetry via Server-Sent Events (SSE)
- **Status**: Accepted
- **Context**: The operations dashboard requires instant, live updates as orders transition across statuses (e.g. `PENDING` -> `PROCESSING` -> `COMPLETED`/`OUT_OF_STOCK`).
- **Decision**: Implement Server-Sent Events (SSE) via Spring Web `SseEmitter` instead of WebSockets.
- **Consequences**:
  - Standard HTTP/1.1 and HTTP/2 transport; zero protocol handshake negotiation overhead.
  - Lightweight, unidirectional server-to-client event streaming perfect for live dashboards.
  - Built-in browser reconnection handling.

---

### ADR-006: Retry Invariants and Dead Letter Queue (DLQ)
- **Status**: Accepted
- **Context**: Handling unexpected processing errors while avoiding infinite loops on deterministic business rejections.
- **Decision**:
  - Maximum of 3 retries with exponential backoff for transient system failures (e.g. DB connection timeouts, transient network faults).
  - Deterministic business rejections (`OUT_OF_STOCK`) are terminal and **MUST NEVER BE RETRIED**.
  - Orders failing after 3 attempts transition to status `DEAD_LETTERED` and are logged in the `dead_letter_queue` table with diagnostic payloads.
- **Consequences**:
  - Prevents worker thread starvation and thread pool exhaustion from repeating futile requests.
  - Guarantees complete post-mortem auditability for failed transactions.

---

### ADR-007: Authentic Metrics and Simulation Truth
- **Status**: Accepted
- **Context**: High-concurrency simulations in hackathon demos are often faked or calculated locally in frontend code.
- **Decision**:
  - All simulation results must be driven by backend execution of actual orders hitting PostgreSQL and Redis.
  - The frontend React dashboard must strictly render data received via backend APIs and SSE streams.
- **Consequences**:
  - The demo reliably proves true concurrency and database consistency.
  - 100 orders vs 10 inventory items will produce exactly 10 COMPLETED and 90 OUT_OF_STOCK verified by database queries.

---

### ADR-008: Decoupled Entity Design for Inventory
- **Status**: Accepted
- **Context**: During high-concurrency order placement bursts (e.g. 100 concurrent requests contending for limited stock), JPA entity graph fetching, lazy/eager joins, and bidirectional object state synchronization introduce serialization lockups, query overhead, and risk of accidental entity mutation.
- **Decision**: In the database schema, preserve the strict relational foreign key constraint (`inventory.product_id` -> `products.id` ON DELETE CASCADE). In the Java JPA entity `Inventory`, store `productId` as a decoupled `private Long productId;` scalar foreign key rather than maintaining a `@OneToOne Product` relationship.
- **Consequences**:
  - Eliminates overhead of loading product entity graphs when reserving stock.
  - Allows direct atomic conditional updates via JPQL/SQL: `UPDATE Inventory i SET i.availableQuantity = i.availableQuantity - :quantity WHERE i.productId = :productId AND i.availableQuantity >= :quantity`.
  - Avoids JPA circular serialization issues and keeps the high-throughput inventory reservation path as lightweight and memory-efficient as possible.
