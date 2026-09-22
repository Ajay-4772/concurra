# ORDERFLOW – Engineering Session Log

## Session 001 — Project Kickoff & Knowledge Foundation
- **Date**: 2026-09-22
- **Phase**: PHASE 0 — PROJECT KNOWLEDGE FOUNDATION
- **Goal**: Establish engineering memory, architectural context, project rules, and ADRs before writing application code.
- **Milestones**: Verified local toolchain; created `.project-memory/PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `SESSION_LOG.md`, and `.agent/PROJECT_RULES.md`.

---

## Session 002 — Phase 1: Application Foundation & Operations Redesign
- **Date**: 2026-09-22
- **Phase**: PHASE 1 — APPLICATION FOUNDATION
- **Goal**: Scaffold Spring Boot 3 backend, React Vite frontend, Docker Compose orchestration, diagnose Docker build bottlenecks, and establish the application foundation.
- **Milestones**: Diagnosed Docker Hub image download rate throttling; switched to host-built runtime containers and cached Postgres 16; verified all 4 containers healthy (`orderflow-backend`, `orderflow-frontend`, `orderflow-postgres`, `orderflow-redis`); verified `GET /api/health` returning `{"status":"UP","service":"OrderFlow"}`.

---

## Session 003 — Phase 1: ChatGPT-Inspired Frontend UX Redesign
- **Date**: 2026-09-22
- **Phase**: PHASE 1 — APPLICATION FOUNDATION (UX REDESIGN)
- **Goal**: Redesign the frontend from a generic SaaS dashboard to an engineering-focused, minimal, information-first workspace inspired by the UX philosophy of ChatGPT.

### Activities & Milestones

1. **UX Direction & Design System**:
   - Adopted neutral dark/light surfaces (`#0f0f0f` / `#141414` dark, `#ffffff` / `#f7f7f7` light) with subtle borders (`#262626` / `#e5e5e5`).
   - Removed all neon glowing elements, oversized cards, and marketing-style copy.
   - Built compact ChatGPT-style status badges with dot prefixes (`● COMPLETED`, `● PROCESSING`, `● RETRYING`, `● OUT_OF_STOCK`, `● FAILED`, `● DEAD_LETTERED`).

2. **Application Shell & Navigation**:
   - Created collapsible sidebar (~240px desktop to ~64px collapsed) with `+ New Order` trigger, clean line navigation items, compact system status indicators, and settings trigger.
   - Built a compact top bar with current view title, live connection status (`● Live` / `Awaiting connection`), probe refresh button, and Dark/Light theme toggle.

3. **Workspace Views**:
   - **DashboardView**: Compact horizontal metric counters, split layout with Live Orders table and chronological Live Activity console (engineering terminal style), minimal Recharts status chart, and PostgreSQL inventory table.
   - **OrdersView**: Filterable/searchable registry with search input, status dropdown, pagination, and a **right-side sliding order inspection drawer** with execution lifecycle timeline.
   - **InventoryView**: Clean stock table with stock percentages and right-side product allocation drawer highlighting the atomic conditional SQL update clause.
   - **DlqView**: Engineering diagnostics table with failure reasons and interactive confirmation dialogs for Retry/Resolve actions.
   - **SimulatorView**: Engineering test console with configuration inputs (`10` / `100` / `1`), visual process pipeline flow, telemetry counters, and the **INVENTORY SAFETY** panel emphasizing `Negative Inventory Events: 0` with a collapsible SQL implementation code block.
   - **Modals**: Created `NewOrderModal.tsx` and `SettingsModal.tsx`.

4. **Build Verification**:
   - Executed `npm run build` in `frontend/`: Compiled 2,431 modules with **zero TypeScript errors** in 16.50s.
   - Rebuilt and started the `orderflow-frontend` container in Docker Compose in 1.2s.
   - Verified HTTP 200 OK on `http://localhost:3000` and API reverse proxy on `http://localhost:3000/api/health`.

5. **Current Limitations**:
   - Pure UI/UX redesign; backend domain logic, database tables, and real-time SSE listener will be connected in Phase 2+.

6. **Next Development Phase**:
   - **PHASE 2 — DOMAIN ENTITIES, DATABASE SCHEMA & FLYWAY MIGRATIONS**

---

## Session 004 — Phase 2 Step 1: Domain Entities, Database Schema & Flyway Migration
- **Date**: 2026-09-22
- **Phase**: PHASE 2 — DOMAIN ENTITIES, DATABASE SCHEMA & FLYWAY MIGRATIONS (STEP 1)
- **Goal**: Implement and verify the domain foundation: Flyway migration V2, 6 JPA entities (`Product`, `Inventory`, `Order`, `OrderItem`, `OrderEvent`, `DeadLetterQueue`), `OrderStatus` enum, Spring Data JPA repositories, and deterministic seed data, strictly adhering to the decoupled `Inventory.productId` requirement.

### Activities & Milestones

1. **Flyway Migration V2 (`V2__schema.sql`)**:
   - Created PostgreSQL tables: `products`, `inventory`, `orders`, `order_items`, `order_events`, `dead_letter_queue`.
   - Enforced storage-level database constraints: `CHECK (available_quantity >= 0)` and `CHECK (reserved_quantity >= 0)` on `inventory`.
   - Seeded 5 demo products, including `Laptop` with exactly 10 units of initial inventory for the 10-stock vs 100-order hackathon benchmark.
   - Verified relational foreign-key cascade: `inventory.product_id REFERENCES products(id) ON DELETE CASCADE`.

2. **JPA Domain Entities**:
   - Created `OrderStatus` enum: `PENDING`, `PROCESSING`, `COMPLETED`, `OUT_OF_STOCK`, `RETRYING`, `FAILED`, `DEAD_LETTERED`.
   - Created `Product.java` with SKU, name, price, and timestamp auditing.
   - Created `Inventory.java` with **decoupled scalar foreign key** `private Long productId;` (`@Column(name = "product_id", nullable = false, unique = true)`) without JPA `@OneToOne Product` mapping, keeping the entity lean for atomic concurrent updates.
   - Created `Order.java`, `OrderItem.java`, `OrderEvent.java`, and `DeadLetterQueue.java`.

3. **Spring Data JPA Repositories**:
   - Created `ProductRepository`, `InventoryRepository`, `OrderRepository`, `OrderItemRepository`, `OrderEventRepository`, `DeadLetterQueueRepository`.
   - Implemented conditional atomic stock decrement method in `InventoryRepository` for zero-overselling guarantees.

4. **Build & Container Verification**:
   - **Host Compilation**: `mvn clean package` succeeded in 21.3s with 0 test failures.
   - **Docker Rebuild**: `docker compose up -d --build backend` rebuilt and started in 4.9s.
   - **Flyway Execution**: Verified via container logs and `flyway_schema_history` table: version `2 - schema` applied cleanly.
   - **PostgreSQL Inspection**: Verified all 6 tables present via `psql -c "\dt"`. Verified `\d inventory` contains foreign key to `products(id)` and `CHECK (available_quantity >= 0)`.
   - **Seed Data Verification**: Verified `Laptop` (10 units), `Keyboard` (25), `Mouse` (30), `Monitor` (15), `Headphones` (20).
   - **Health Endpoint**: `GET http://localhost:8080/api/health` returned HTTP 200 `{"status":"UP","service":"OrderFlow"}`.

5. **Scope Invariant Compliance**:
   - No order processing logic, concurrency ThreadPool, Redis Streams, retry logic, DLQ processing, SSE, or frontend changes were implemented.
   - Stopped strictly at Phase 2 Step 1 completion.

6. **Next Development Phase**:
   - **PHASE 2 STEP 2 / PHASE 3 — ORDER CREATION & CONCURRENT INVENTORY ENGINE**

---

## Session 005 — CONCURRA Full MVP Implementation & Live Concurrency Verification
- **Date**: 2026-09-22
- **Phase**: MVP COMPLETION & BENCHMARK VERIFICATION
- **Goal**: Rapidly complete the working hackathon MVP for CONCURRA end-to-end: ThreadPoolTaskExecutor, atomic PostgreSQL updates, real concurrent simulator, SSE telemetry, Redis streams, idempotency, retry/DLQ, full frontend integration, and zero-overselling verification.

### Activities & Milestones

1. **Branding & Repository Connection**:
   - Updated project name to **CONCURRA** and title to **Real-Time Concurrent Order & Inventory Processing Engine**.
   - Connected remote repository `origin` to `https://github.com/Ajay-4772/concurra.git` on branch `main`.

2. **Backend Concurrency & Domain Engine**:
   - `AsyncConfig`: Initialized `ThreadPoolTaskExecutor` (`corePoolSize = 5`, `maxPoolSize = 10`, `queueCapacity = 100`, prefix `concurra-order-`).
   - `InventoryService` & `InventoryRepository`: Implemented atomic conditional update query:
     `UPDATE Inventory i SET i.availableQuantity = i.availableQuantity - :quantity WHERE i.productId = :productId AND i.availableQuantity >= :quantity`.
   - `OrderProcessor`: Implemented concurrent state machine with transaction synchronization (`TransactionSynchronizationManager.afterCommit`), bounded retry (max 3), terminal `OUT_OF_STOCK` handling, and DLQ routing.
   - `OrderService`: Implemented validated order creation, idempotency via Redis, audit event generation, and thread pool submission.
   - `SimulationService`: Real concurrent load generator creating 100 simultaneous orders and tracking PostgreSQL stock observations.
   - `DlqService`: Full retry and resolve support.
   - `SseService`: Server-Sent Events real-time event broadcasting.
   - `RedisStreamPublisher`: Streaming events to Redis stream `concurra:events`.

3. **Frontend Integration**:
   - Resolved TypeScript configuration and type definitions for Node and Axios.
   - Fully connected `SimulatorView`, `DashboardView`, `OrdersView`, `InventoryView`, `DlqView`, `NewOrderModal`, and `SettingsModal` to real backend endpoints and SSE stream.

4. **Automated & Runtime Verification**:
   - **Integration Tests**: 6 of 6 passed in `mvn test` (including 100-order stress test, 20-order test, atomic decrement, and idempotency).
   - **Main 100-Order Concurrency Benchmark**:
     - Submitted: 100
     - Completed: 10
     - Out of Stock: 90
     - Failed: 0
     - Dead Lettered: 0
     - Final Stock in PostgreSQL: 0
     - Minimum Stock Observed: 0
     - Negative Inventory Events: 0
     - Elapsed Execution Time: 5,526 ms
   - **Docker Containers**: All 4 containers healthy (`orderflow-backend`, `orderflow-frontend`, `orderflow-postgres`, `orderflow-redis`).


