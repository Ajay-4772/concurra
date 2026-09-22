# CONCURRA
### Real-Time Concurrent Order & Inventory Processing Engine

CONCURRA is a high-throughput order processing and inventory management engine designed to guarantee **zero-overselling inventory safety** under extreme concurrent burst loads. It utilizes atomic conditional PostgreSQL update mechanics and an asynchronous JVM worker thread pool to ensure that inventory mathematically never drops below zero while processing hundreds of simultaneous orders.

---

## The Core Challenge & The Hackathon Benchmark

In naive e-commerce and order processing systems, high concurrent request bursts cause race conditions (read-modify-write conflicts) that result in negative inventory and oversold stock.

**The Benchmark Test:**
- **Initial Inventory**: 10 units (e.g. `Laptop`)
- **Concurrent Orders**: 100 simultaneous requests
- **Quantity Per Order**: 1 unit
- **Verified Invariant**:
  - **10 Orders COMPLETED**
  - **90 Orders OUT_OF_STOCK**
  - **0 Orders FAILED**
  - **Final Inventory = 0**
  - **Negative Inventory Events = 0**

---

## Architectural Highlights

1. **Clean Modular Monolith**: Avoids distributed transaction overhead, dual-write failure modes, and microservice networking latency.
2. **PostgreSQL Row-Level Concurrency & Integrity**:
   - Single source of truth for stock allocation.
   - Atomic conditional decrement:
     ```sql
     UPDATE inventory
     SET available_quantity = available_quantity - :quantity,
         updated_at = CURRENT_TIMESTAMP
     WHERE product_id = :productId
       AND available_quantity >= :quantity;
     ```
   - Table-level invariant enforcement: `CHECK (available_quantity >= 0)`.
3. **Decoupled Domain Model**: `Inventory` entity references `productId` as a decoupled scalar foreign key (`Long`), avoiding heavy ORM graph loading and join lockups during high-concurrency bursts.
4. **Spring ThreadPoolTaskExecutor**: Real multi-threaded concurrent execution (`corePoolSize = 5`, `maxPoolSize = 10`, `queueCapacity = 100`).
5. **Redis Ecosystem**:
   - Distributed Idempotency (`Idempotency-Key` lease checks).
   - Redis Streams (`concurra:events`) for persistent event publication.
6. **Real-Time Telemetry via Server-Sent Events (SSE)**: Streaming order transitions (`PENDING` -> `PROCESSING` -> `COMPLETED`/`OUT_OF_STOCK`) to the frontend dashboard in real-time.
7. **Dead Letter Queue (DLQ) & Bounded Retries**: Max 3 retries for transient system errors; deterministic `OUT_OF_STOCK` decisions are terminal and never retried.

---

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.3, Spring Data JPA, Spring Web, Spring Validation, Flyway, Spring Boot Actuator, Maven
- **Database**: PostgreSQL 16
- **Cache & Streams**: Redis 7
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Axios, Recharts, Lucide React
- **Containerization**: Docker, Docker Compose

---

## Quickstart with Docker Compose

1. Clone repository and enter directory:
   ```bash
   git clone https://github.com/Ajay-4772/concurra.git
   cd concurra
   ```

2. Launch full stack via Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Verify running containers:
   ```bash
   docker compose ps
   ```

4. Access endpoints:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8080](http://localhost:8080)
   - **Health Probe**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
