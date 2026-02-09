import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";
import { METRICS_CONFIG } from "../config/metrics";

// Create Prometheus registry
export const register = new Registry();

// Set default labels for all metrics
register.setDefaultLabels({
  environment: process.env.NODE_ENV || "development",
  service: "rag-system-backend",
  version: process.env.npm_package_version || "1.0.0",
});

// Collect default Node.js metrics
if (METRICS_CONFIG.enabled) {
  collectDefaultMetrics({ register });
}

// ==================== HTTP METRICS ====================

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: METRICS_CONFIG.httpBuckets,
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// ==================== GEMINI API METRICS ====================

export const geminiEmbeddingRequestsTotal = new Counter({
  name: "gemini_embedding_requests_total",
  help: "Total Gemini embedding API requests",
  labelNames: ["status"],
  registers: [register],
});

export const geminiEmbeddingDuration = new Histogram({
  name: "gemini_embedding_duration_seconds",
  help: "Duration of Gemini embedding requests in seconds",
  labelNames: ["status"],
  buckets: METRICS_CONFIG.apiBuckets,
  registers: [register],
});

export const geminiLLMRequestsTotal = new Counter({
  name: "gemini_llm_requests_total",
  help: "Total Gemini LLM API requests",
  labelNames: ["status"],
  registers: [register],
});

export const geminiLLMDuration = new Histogram({
  name: "gemini_llm_duration_seconds",
  help: "Duration of Gemini LLM requests in seconds",
  labelNames: ["status"],
  buckets: METRICS_CONFIG.apiBuckets,
  registers: [register],
});

// ==================== QDRANT METRICS ====================

export const qdrantRequestsTotal = new Counter({
  name: "qdrant_requests_total",
  help: "Total Qdrant operations",
  labelNames: ["operation", "status"],
  registers: [register],
});

export const qdrantDuration = new Histogram({
  name: "qdrant_duration_seconds",
  help: "Duration of Qdrant operations in seconds",
  labelNames: ["operation", "status"],
  buckets: METRICS_CONFIG.apiBuckets,
  registers: [register],
});

// ==================== BUSINESS METRICS ====================

export const documentsProcessedTotal = new Counter({
  name: "documents_processed_total",
  help: "Total documents processed",
  labelNames: ["status"],
  registers: [register],
});

export const documentsUploadedTotal = new Counter({
  name: "documents_uploaded_total",
  help: "Total document uploads",
  registers: [register],
});

export const queriesTotal = new Counter({
  name: "queries_total",
  help: "Total queries processed",
  labelNames: ["cache"],
  registers: [register],
});

export const conversationsCreatedTotal = new Counter({
  name: "conversations_created_total",
  help: "Total conversations created",
  registers: [register],
});

// ==================== REDIS METRICS ====================

export const redisOperationsTotal = new Counter({
  name: "redis_operations_total",
  help: "Total Redis operations",
  labelNames: ["operation", "result"],
  registers: [register],
});

// ==================== CIRCUIT BREAKER METRICS ====================

export const circuitBreakerState = new Gauge({
  name: "circuit_breaker_state",
  help: "Circuit breaker state (0=closed, 1=open, 2=half-open)",
  labelNames: ["service"],
  registers: [register],
});

// ==================== HELPER FUNCTIONS ====================

export const metrics = {
  /**
   * Record HTTP request metrics
   */
  observeHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    if (!METRICS_CONFIG.enabled) return;

    const duration = durationMs / 1000;
    const statusCodeStr = statusCode.toString();

    httpRequestDuration.observe(
      { method, route, status_code: statusCodeStr },
      duration,
    );
    httpRequestsTotal.inc({ method, route, status_code: statusCodeStr });
  },

  /**
   * Record Gemini embedding API metrics
   */
  recordGeminiEmbedding(status: "success" | "error", durationMs: number): void {
    if (!METRICS_CONFIG.enabled) return;

    geminiEmbeddingRequestsTotal.inc({ status });
    geminiEmbeddingDuration.observe({ status }, durationMs / 1000);
  },

  /**
   * Record Gemini LLM API metrics
   */
  recordGeminiLLM(status: "success" | "error", durationMs: number): void {
    if (!METRICS_CONFIG.enabled) return;

    geminiLLMRequestsTotal.inc({ status });
    geminiLLMDuration.observe({ status }, durationMs / 1000);
  },

  /**
   * Record Qdrant operation metrics
   */
  recordQdrantOperation(
    operation: "upsert" | "search" | "delete",
    status: "success" | "error",
    durationMs: number,
  ): void {
    if (!METRICS_CONFIG.enabled) return;

    qdrantRequestsTotal.inc({ operation, status });
    qdrantDuration.observe({ operation, status }, durationMs / 1000);
  },

  /**
   * Record document processed metric
   */
  recordDocumentProcessed(status: "completed" | "failed"): void {
    if (!METRICS_CONFIG.enabled) return;

    documentsProcessedTotal.inc({ status });
  },

  /**
   * Record document uploaded metric
   */
  recordDocumentUploaded(): void {
    if (!METRICS_CONFIG.enabled) return;

    documentsUploadedTotal.inc();
  },

  /**
   * Record query metric
   */
  recordQuery(cacheHit: boolean): void {
    if (!METRICS_CONFIG.enabled) return;

    queriesTotal.inc({ cache: cacheHit ? "hit" : "miss" });
  },

  /**
   * Record conversation created metric
   */
  recordConversationCreated(): void {
    if (!METRICS_CONFIG.enabled) return;

    conversationsCreatedTotal.inc();
  },

  /**
   * Record Redis operation metric
   */
  recordRedisOperation(
    operation: "get" | "set" | "delete",
    result: "hit" | "miss" | "success" | "error",
  ): void {
    if (!METRICS_CONFIG.enabled) return;

    redisOperationsTotal.inc({ operation, result });
  },

  /**
   * Set circuit breaker state
   */
  setCircuitBreakerState(
    service: string,
    state: "closed" | "open" | "half-open",
  ): void {
    if (!METRICS_CONFIG.enabled) return;

    const stateValue = state === "closed" ? 0 : state === "open" ? 1 : 2;
    circuitBreakerState.set({ service }, stateValue);
  },
};

export default metrics;
