# Prometheus Metrics Implementation Plan

## Overview

Add production-grade Prometheus metrics on a separate port (9090) with parameterized HTTP routes, Redis tracking, and minimal labels.

**Priority**: Medium  
**Effort**: ~1 hour  
**Package**: `prom-client`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG System Backend                        │
├──────────────────────────────┬──────────────────────────────┤
│      Main API Server         │      Metrics Server          │
│        Port: 3001            │        Port: 9090            │
├──────────────────────────────┼──────────────────────────────┤
│  • /api/auth/*               │  • /metrics (Prometheus)     │
│  • /api/documents/*          │                              │
│  • /api/query/*              │  Security: Internal only     │
│  • /api/conversations/*      │  (firewall/docker network)   │
│  • /api/vectors/*            │                              │
│  • /health/*                 │                              │
└──────────────────────────────┴──────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Prometheus     │
                    │   Scraping       │
                    └──────────────────┘
```

---

## Configuration

### Environment Variables

```bash
# Add to .env and .env.example
METRICS_ENABLED=true          # Enable/disable metrics collection
METRICS_PORT=9090            # Metrics server port
```

### Global Labels (Applied to all metrics)

```typescript
{
  environment: "development" | "production" | "test",
  service: "rag-system-backend",
  version: "1.0.0"
}
```

---

## Implementation Steps

### Phase 1: Setup & Dependencies (10 minutes)

**1. Install prom-client**

```bash
npm install prom-client
```

**2. Create Metrics Configuration** (`src/config/metrics.ts`)

- Metrics configuration and constants
- Route parameterization patterns to prevent high cardinality
- Histogram buckets for request durations

**3. Create Metrics Service** (`src/services/metrics.service.ts`)

- Initialize Prometheus registry
- Define all custom metrics
- Export metric increment/observation helpers

**Metrics to Define:**

| Metric Name                         | Type      | Labels                     | Description                                           |
| ----------------------------------- | --------- | -------------------------- | ----------------------------------------------------- |
| `http_request_duration_seconds`     | Histogram | method, route, status_code | HTTP request latency                                  |
| `http_requests_total`               | Counter   | method, route, status_code | Total HTTP requests                                   |
| `gemini_embedding_requests_total`   | Counter   | status                     | Gemini embedding API calls                            |
| `gemini_embedding_duration_seconds` | Histogram | status                     | Embedding request duration                            |
| `gemini_llm_requests_total`         | Counter   | status                     | Gemini LLM API calls                                  |
| `gemini_llm_duration_seconds`       | Histogram | status                     | LLM request duration                                  |
| `qdrant_requests_total`             | Counter   | operation, status          | Qdrant operations                                     |
| `qdrant_duration_seconds`           | Histogram | operation, status          | Qdrant operation duration                             |
| `documents_processed_total`         | Counter   | status                     | Documents processed                                   |
| `documents_uploaded_total`          | Counter   | -                          | Document uploads                                      |
| `queries_total`                     | Counter   | cache                      | Queries (hit/miss)                                    |
| `conversations_created_total`       | Counter   | -                          | New conversations                                     |
| `redis_operations_total`            | Counter   | operation, result          | Redis get/set operations                              |
| `circuit_breaker_state`             | Gauge     | service                    | Circuit breaker state (0=closed, 1=open, 2=half-open) |

**4. Create Metrics Middleware** (`src/middleware/metrics.middleware.ts`)

- HTTP request duration tracking
- Error rate tracking
- Route labeling with parameterization

### Phase 2: Metrics Server (10 minutes)

**Create** `src/metrics-server.ts`

- Separate Express server for metrics
- Exposes `/metrics` endpoint for Prometheus scraping
- Health check endpoint

### Phase 3: Integration (20 minutes)

**1. Update** `src/server.ts`

- Import and start metrics server alongside main server

**2. Update** `src/app.ts`

- Add metrics middleware before API routes
- Skip metrics on health endpoints (avoid recursion)

**3. Update Configuration**

- `src/config/index.ts`: Add METRICS_ENABLED and METRICS_PORT env vars
- `.env.example`: Add metrics configuration section

### Phase 4: Service Instrumentation (20 minutes)

**1. Embedding Service** (`src/services/embedding.service.ts`)

- Track embedding generation duration and success/error
- Wrap `generateEmbedding` method

**2. LLM Service** (`src/services/llm.service.ts`)

- Track LLM calls duration and success/error
- Wrap `generateResponse` method

**3. Vector Service** (`src/services/vector.service.ts`)

- Track all Qdrant operations (upsert, search, delete)
- Record operation type, duration, and success/error

**4. Circuit Breaker Service** (`src/services/circuit-breaker.service.ts`)

- Track state changes (open/closed/half-open)
- Emit metrics on state transitions via event listeners

**5. Redis Operations** (`src/config/redis.ts`)

- Wrap get/set/delete operations
- Track cache hits/misses for get operations

**6. Document Controller** (`src/controllers/document.controller.ts`)

- Track document uploads
- Track document processing status (completed/failed)

**7. Query Controller** (`src/controllers/query.controller.ts`)

- Track queries processed
- Track cache hits/misses

**8. Conversation Controller** (`src/controllers/conversation.controller.ts`)

- Track conversation creation

### Phase 5: Testing & Validation (10 minutes)

**Test Checklist:**

1. **Start the application**

   ```bash
   npm run dev
   ```

   - Verify both servers start (port 3001 and 9090)
   - Check logs for "Metrics server listening on port 9090"

2. **Test metrics endpoint**

   ```bash
   curl http://localhost:9090/metrics
   ```

   - Should return Prometheus format text
   - Should include default Node.js metrics
   - Should include custom metrics (initialized to 0)

3. **Generate some traffic**

   ```bash
   # Make some API calls
   curl http://localhost:3001/health
   curl http://localhost:3001/api/auth/register \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"TestPass123"}'
   ```

4. **Verify metrics updated**

   ```bash
   curl http://localhost:9090/metrics | grep http_requests_total
   ```

   - Should show incremented counters

5. **Run lint and build**
   ```bash
   npm run lint
   npm run build
   ```

---

## File Structure

```
src/
├── config/
│   ├── index.ts              # Add metrics config
│   └── metrics.ts            # NEW: Metrics constants & patterns
├── middleware/
│   └── metrics.middleware.ts # NEW: HTTP request tracking
├── services/
│   ├── metrics.service.ts    # NEW: Metrics registry & helpers
│   ├── embedding.service.ts  # MODIFY: Add embedding metrics
│   ├── llm.service.ts        # MODIFY: Add LLM metrics
│   ├── vector.service.ts     # MODIFY: Add Qdrant metrics
│   └── circuit-breaker.service.ts # MODIFY: Add breaker metrics
├── config/
│   └── redis.ts              # MODIFY: Add Redis metrics
├── controllers/
│   ├── document.controller.ts # MODIFY: Add document metrics
│   ├── query.controller.ts   # MODIFY: Add query metrics
│   └── conversation.controller.ts # MODIFY: Add conversation metrics
├── metrics-server.ts         # NEW: Separate metrics server
├── app.ts                    # MODIFY: Add metrics middleware
└── server.ts                 # MODIFY: Start metrics server
```

---

## Code Examples

### Recording a Metric (Embedding Service)

```typescript
// Before
async generateEmbedding(text: string): Promise<number[]> {
  try {
    return (await this.embeddingBreaker.fire(text)) as number[];
  } catch (error) {
    logger.error(`Embedding generation failed`, error);
    throw error;
  }
}

// After
async generateEmbedding(text: string): Promise<number[]> {
  const start = Date.now();
  try {
    const result = (await this.embeddingBreaker.fire(text)) as number[];
    metrics.recordGeminiEmbedding("success", Date.now() - start);
    return result;
  } catch (error) {
    metrics.recordGeminiEmbedding("error", Date.now() - start);
    logger.error(`Embedding generation failed`, error);
    throw error;
  }
}
```

### Redis Metrics Wrapper

```typescript
// In src/config/redis.ts
const originalGet = redisClient.get.bind(redisClient);
redisClient.get = async (key: string) => {
  const result = await originalGet(key);
  metrics.recordRedisOperation("get", result ? "hit" : "miss");
  return result;
};
```

---

## Prometheus Scraping Configuration

**Example `prometheus.yml`:**

```yaml
scrape_configs:
  - job_name: "rag-system"
    static_configs:
      - targets: ["localhost:9090"]
    metrics_path: "/metrics"
    scrape_interval: 15s
```

**Docker Compose (if using):**

```yaml
services:
  app:
    ports:
      - "3001:3001"
      - "9090:9090" # Expose metrics port

  prometheus:
    image: prom/prometheus
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

---

## Success Criteria

- [ ] Metrics server starts on port 9090
- [ ] `/metrics` endpoint returns valid Prometheus format
- [ ] HTTP request metrics track parameterized routes
- [ ] External API metrics (Gemini, Qdrant) are recorded
- [ ] Business metrics (documents, queries) are recorded
- [ ] Redis operations tracked with hit/miss
- [ ] Circuit breaker states visible in metrics
- [ ] All builds pass lint checks
- [ ] TypeScript compilation successful
- [ ] FIX.md updated with completion status

---

## Grafana Dashboard Ideas (Future)

Once metrics are flowing, you can create dashboards for:

1. **API Overview**
   - Requests per second by route
   - Average response time by route
   - Error rate percentage

2. **External Dependencies**
   - Gemini API latency
   - Qdrant operation latency
   - Circuit breaker states

3. **Business Metrics**
   - Documents processed per hour
   - Query volume
   - Cache hit rate

---

## Notes

- HTTP routes are parameterized to prevent metric cardinality explosion
- Query parameters are NOT included in metrics (privacy + cardinality)
- Metrics are disabled in test environment by default
- Separate port (9090) allows independent scaling and security
- All external API calls tracked with duration and status
- Business metrics provide insight into system usage patterns
