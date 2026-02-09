import Redis from "ioredis";
import { config } from "./index";
import { logger } from "../utils/logger";
import { metrics } from "../services/metrics.service";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on("connect", () => {
      logger.info("Redis connected successfully");
    });

    redis.on("error", (error: Error) => {
      logger.error("Redis connection error:", error);
    });

    redis.on("close", () => {
      logger.warn("Redis connection closed");
    });

    // Wrap methods for metrics tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalGet = (redis as any).get.bind(redis);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redis as any).get = async function (...args: any[]) {
      try {
        const result = await originalGet(...args);
        metrics.recordRedisOperation("get", result ? "hit" : "miss");
        return result;
      } catch (error) {
        metrics.recordRedisOperation("get", "error");
        throw error;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalSet = (redis as any).set.bind(redis);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redis as any).set = async function (...args: any[]) {
      try {
        const result = await originalSet(...args);
        metrics.recordRedisOperation("set", "success");
        return result;
      } catch (error) {
        metrics.recordRedisOperation("set", "error");
        throw error;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalDel = (redis as any).del.bind(redis);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redis as any).del = async function (...args: any[]) {
      try {
        const result = await originalDel(...args);
        metrics.recordRedisOperation("delete", "success");
        return result;
      } catch (error) {
        metrics.recordRedisOperation("delete", "error");
        throw error;
      }
    };
  }

  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.connect();
  } catch (error) {
    // Already connected or connecting
    if ((error as Error).message !== "Redis is already connecting/connected") {
      throw error;
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info("Redis disconnected");
  }
}
