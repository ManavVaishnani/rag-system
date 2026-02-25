import { getRedisClient } from "../config/redis";
import { logger } from "../utils/logger";

const DAILY_MESSAGE_LIMIT = 25;
const REDIS_KEY_PREFIX = "daily_msg_count";

/**
 * Returns the Redis key for a user's daily message count.
 * Format: daily_msg_count:{userId}:{YYYY-MM-DD}
 */
function getDailyKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${REDIS_KEY_PREFIX}:${userId}:${today}`;
}

export interface DailyUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string; // ISO timestamp for midnight UTC
}

export const dailyLimitService = {
  /**
   * Get the current daily usage for a user.
   */
  async getUsage(userId: string): Promise<DailyUsage> {
    try {
      const redis = getRedisClient();
      const key = getDailyKey(userId);
      const countStr = await redis.get(key);
      const used = countStr ? parseInt(countStr, 10) : 0;

      // Calculate when the limit resets (next midnight UTC)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      return {
        used,
        limit: DAILY_MESSAGE_LIMIT,
        remaining: Math.max(0, DAILY_MESSAGE_LIMIT - used),
        resetsAt: tomorrow.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to get daily usage:", error);
      // Fail open — allow the request if Redis is down
      return {
        used: 0,
        limit: DAILY_MESSAGE_LIMIT,
        remaining: DAILY_MESSAGE_LIMIT,
        resetsAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Check if the user can send a message. Returns the usage info.
   * Does NOT increment the counter.
   */
  async canSendMessage(userId: string): Promise<{ allowed: boolean; usage: DailyUsage }> {
    const usage = await this.getUsage(userId);
    return {
      allowed: usage.remaining > 0,
      usage,
    };
  },

  /**
   * Increment the daily message counter for a user.
   * Should be called AFTER a message is successfully processed.
   * Returns the updated usage.
   */
  async incrementUsage(userId: string): Promise<DailyUsage> {
    try {
      const redis = getRedisClient();
      const key = getDailyKey(userId);
      const newCount = await redis.incr(key);

      // Set TTL to expire at end of day (max 24h) if this is the first message
      if (newCount === 1) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        const ttlSeconds = Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
        await redis.expire(key, ttlSeconds);
      }

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      return {
        used: newCount,
        limit: DAILY_MESSAGE_LIMIT,
        remaining: Math.max(0, DAILY_MESSAGE_LIMIT - newCount),
        resetsAt: tomorrow.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to increment daily usage:", error);
      return this.getUsage(userId);
    }
  },
};
