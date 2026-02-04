import Redis from "ioredis";
import { config } from "./index";
import { logger } from "../utils/logger";

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
