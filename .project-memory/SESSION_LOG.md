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

