# ORDERFLOW – Project Engineering Rules & Operating Principles

---

## 1. Core Engineering Invariants
These rules are non-negotiable for all developers, agents, and contributors working on OrderFlow:

1. **Correctness before feature count**: An inventory race condition invalidates the entire project, regardless of how many bells and whistles exist.
2. **Do not fake concurrency**: Order concurrency must be genuinely executed across backend worker threads and real database connections.
3. **Do not fake dashboard numbers**: Every metric displayed on the operations dashboard must derive from actual database or Redis counters.
4. **Do not calculate simulation results in the frontend**: The frontend only renders what the backend computes and streams.
5. **PostgreSQL remains the inventory source of truth**: Inventory state resides authoritatively in PostgreSQL. Redis must **NOT** become the permanent source of truth for inventory.
6. **Use transactions correctly**: Keep database transaction scopes as tight as possible. Do not wrap long-running network calls or sleep statements in database transactions.
7. **Use atomic inventory updates**: All inventory reservations MUST execute via atomic conditional updates:
   ```sql
   UPDATE inventory
   SET available_quantity = available_quantity - :quantity
   WHERE product_id = :productId
     AND available_quantity >= :quantity;
   ```
8. **Keep the system a clean modular monolith**: Avoid unnecessary microservices.
9. **Do NOT introduce Kafka**: Event streaming is handled by Redis Streams.
10. **Do NOT introduce Kubernetes**: Container orchestration is managed via Docker Compose.
11. **Do NOT introduce RabbitMQ**: Avoid adding external message brokers beyond Redis.
12. **Do not over-engineer**: Focus on rock-solid concurrency, safety guarantees, and clean observable operations.
13. **Do not claim a feature works unless it has actually been tested**: Never assume or hypothesize correctness under load without automated test proof.
14. **Do not invent test results**: Benchmark numbers and concurrency outputs must come directly from test runs.

---

## 2. Order Lifecycle & Retry Rules
- **Status Progression**:
  - Valid transitions:
    - `PENDING` -> `PROCESSING`
    - `PROCESSING` -> `COMPLETED`
    - `PROCESSING` -> `OUT_OF_STOCK` (Terminal)
    - `PROCESSING` -> `RETRYING` (Transient system failures only)
    - `RETRYING` -> `PROCESSING`
    - `RETRYING` -> `FAILED`
    - `FAILED` -> `DEAD_LETTERED` (After 3 attempts exhausted)
- **Zero-Retry Rule for Out-Of-Stock**:
  - `OUT_OF_STOCK` represents deterministic business logic rejection.
  - **`OUT_OF_STOCK` MUST NEVER BE RETRIED.**
- **Retry Bounds**:
  - Maximum retries = 3.
  - Transient failures must use exponential backoff.
  - After 3 failed attempts, the order must be routed to `dead_letter_queue` with status `DEAD_LETTERED`.

---

## 3. Concurrency Rules
- Use Spring's `ThreadPoolTaskExecutor`:
  - `corePoolSize = 5`
  - `maxPoolSize = 10`
  - `queueCapacity = 100`
- Thread workers must execute independently and handle inventory isolation at the SQL level.

---

## 4. Documentation & Memory Maintenance
- **Repository documentation is the project's source of truth**:
  - Whenever a significant implementation or architectural decision is made, update `.project-memory/DECISIONS.md`.
  - When development phases advance or milestones are met, update `.project-memory/CURRENT_STATE.md`.
  - After meaningful working sessions, append notes to `.project-memory/SESSION_LOG.md`.
