import { Request, Response } from "express";
import { prisma } from "../config/database";
import { getRedisClient } from "../config/redis";
import { getQdrantClient } from "../config/qdrant";

import { logger } from "../utils/logger";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "up" | "down";
      responseTime: number;
      message?: string;
    };
    redis: {
      status: "up" | "down";
      responseTime: number;
      message?: string;
    };
    qdrant: {
      status: "up" | "down";
      responseTime: number;
      message?: string;
    };
  };
}

export class HealthController {
  async getHealth(_req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    // Check all dependencies in parallel
    const [dbCheck, redisCheck, qdrantCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQdrant(),
    ]);

    const totalResponseTime = Date.now() - startTime;

    // Determine overall status
    const allUp =
      dbCheck.status === "up" &&
      redisCheck.status === "up" &&
      qdrantCheck.status === "up";

    const anyDown =
      dbCheck.status === "down" ||
      redisCheck.status === "down" ||
      qdrantCheck.status === "down";

    const status: HealthCheckResult["status"] = allUp
      ? "healthy"
      : anyDown
        ? "unhealthy"
        : "degraded";

    const health: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        redis: redisCheck,
        qdrant: qdrantCheck,
      },
    };

    // Log unhealthy states
    if (status !== "healthy") {
      logger.warn("Health check failed:", {
        status,
        checks: health.checks,
        responseTime: totalResponseTime,
      });
    }

    // Return appropriate status code
    const statusCode =
      status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

    res.status(statusCode).json(health);
  }

  async getLiveness(_req: Request, res: Response): Promise<void> {
    // Simple liveness check - just confirms the app is running
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
    });
  }

  async getReadiness(_req: Request, res: Response): Promise<void> {
    // Readiness check - confirms the app is ready to serve traffic
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQdrant(),
    ]);

    const allUp = checks.every((check) => check.status === "up");

    if (allUp) {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        failedChecks: checks
          .map((check, index) => ({
            ...check,
            name: ["database", "redis", "qdrant"][index],
          }))
          .filter((check) => check.status === "down"),
      });
    }
  }

  private async checkDatabase(): Promise<
    HealthCheckResult["checks"]["database"]
  > {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      logger.error("Health check: Database connection failed:", error);
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult["checks"]["redis"]> {
    const start = Date.now();
    try {
      const client = getRedisClient();
      await client.ping();
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      logger.error("Health check: Redis connection failed:", error);
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async checkQdrant(): Promise<HealthCheckResult["checks"]["qdrant"]> {
    const start = Date.now();
    try {
      const client = getQdrantClient();
      await client.getCollections();
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      logger.error("Health check: Qdrant connection failed:", error);
      return {
        status: "down",
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const healthController = new HealthController();
