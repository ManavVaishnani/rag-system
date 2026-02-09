import CircuitBreaker from "opossum";
import { logger } from "../utils/logger";
import { metrics } from "./metrics.service";

export interface CircuitBreakerConfig {
  name: string;
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  volumeThreshold: number;
}

// Default configurations for different external services
export const CircuitBreakerConfigs = {
  geminiEmbedding: {
    name: "gemini-embedding",
    timeout: 10000, // 10 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    volumeThreshold: 5,
  },
  geminiLLM: {
    name: "gemini-llm",
    timeout: 15000, // 15 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    volumeThreshold: 3,
  },
  qdrant: {
    name: "qdrant",
    timeout: 5000, // 5 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 20000, // 20 seconds
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    volumeThreshold: 5,
  },
} as const;

/**
 * Create a circuit breaker with standard configuration and logging
 */
export function createCircuitBreaker<
  T extends (...args: any[]) => Promise<any>,
>(
  fn: T,
  config: CircuitBreakerConfig,
  fallback?: (...args: Parameters<T>) => ReturnType<T>,
): CircuitBreaker {
  const breaker = new CircuitBreaker(fn, {
    name: config.name,
    timeout: config.timeout,
    errorThresholdPercentage: config.errorThresholdPercentage,
    resetTimeout: config.resetTimeout,
    rollingCountTimeout: config.rollingCountTimeout,
    rollingCountBuckets: config.rollingCountBuckets,
    volumeThreshold: config.volumeThreshold,
  });

  // Add fallback if provided
  if (fallback) {
    breaker.fallback(fallback);
  }

  // Event listeners for monitoring
  breaker.on("open", () => {
    logger.warn(`Circuit breaker '${config.name}' opened`);
    metrics.setCircuitBreakerState(config.name, "open");
  });

  breaker.on("halfOpen", () => {
    logger.info(`Circuit breaker '${config.name}' half-open (testing)`);
    metrics.setCircuitBreakerState(config.name, "half-open");
  });

  breaker.on("close", () => {
    logger.info(`Circuit breaker '${config.name}' closed (healthy)`);
    metrics.setCircuitBreakerState(config.name, "closed");
  });

  breaker.on("fallback", (result) => {
    logger.warn(`Circuit breaker '${config.name}' fallback executed`, result);
  });

  breaker.on("timeout", () => {
    logger.error(`Circuit breaker '${config.name}' timeout`);
  });

  breaker.on("failure", (error) => {
    logger.error(`Circuit breaker '${config.name}' failure:`, error);
  });

  return breaker;
}

/**
 * Get circuit breaker statistics for health checks
 */
export function getCircuitBreakerStats(
  breaker: CircuitBreaker,
): Record<string, unknown> {
  return {
    name: breaker.name,
    state: breaker.opened ? "open" : breaker.halfOpen ? "half-open" : "closed",
    stats: breaker.stats,
  };
}
