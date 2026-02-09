import express from "express";
import { register } from "./services/metrics.service";
import { METRICS_CONFIG } from "./config/metrics";
import { logger } from "./utils/logger";

/**
 * Start the metrics server on a separate port
 * This server exposes Prometheus metrics at /metrics
 */
export function startMetricsServer(): void {
  if (!METRICS_CONFIG.enabled) {
    logger.info("Metrics collection disabled");
    return;
  }

  const app = express();

  // Metrics endpoint for Prometheus scraping
  app.get("/metrics", async (_req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      logger.error("Failed to generate metrics:", error);
      res.status(500).end("Failed to generate metrics");
    }
  });

  // Health check for metrics server
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "metrics" });
  });

  // Start server
  app.listen(METRICS_CONFIG.port, () => {
    logger.info(`Metrics server listening on port ${METRICS_CONFIG.port}`);
    logger.info(
      `Prometheus metrics available at http://localhost:${METRICS_CONFIG.port}/metrics`,
    );
  });
}
