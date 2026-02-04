import { getRedisClient } from "../config/redis";
import { config } from "../config";
import { logger } from "../utils/logger";
import { CachedQueryResult, SourceCitation } from "../types";
import { getEmbeddingService } from "./embedding.service";

const CACHE_PREFIX = "rag:";
const QUERY_CACHE_PREFIX = `${CACHE_PREFIX}query:`;

export class CacheService {
  private get redis() {
    return getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(CACHE_PREFIX + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Cache get failed:", error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(CACHE_PREFIX + key, ttl, serialized);
      } else {
        await this.redis.set(CACHE_PREFIX + key, serialized);
      }
    } catch (error) {
      logger.error("Cache set failed:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(CACHE_PREFIX + key);
    } catch (error) {
      logger.error("Cache delete failed:", error);
    }
  }

  async semanticSearch(
    query: string,
    userId: string,
  ): Promise<CachedQueryResult | null> {
    try {
      const embeddingService = getEmbeddingService();
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Get all cached queries for this user
      const pattern = `${QUERY_CACHE_PREFIX}${userId}:*`;
      const keys = await this.redis.keys(pattern);

      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (!cached) continue;

        const cachedData: CachedQueryResult = JSON.parse(cached);
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          cachedData.embedding,
        );

        if (similarity >= config.cache.semanticThreshold) {
          logger.info(
            `Semantic cache hit: similarity=${similarity.toFixed(3)}`,
          );
          return cachedData;
        }
      }

      return null;
    } catch (error) {
      logger.error("Semantic search failed:", error);
      return null;
    }
  }

  async cacheQuery(
    query: string,
    userId: string,
    response: string,
    sources: SourceCitation[],
    embedding: number[],
  ): Promise<void> {
    const key = `${QUERY_CACHE_PREFIX}${userId}:${Date.now()}`;
    const data: CachedQueryResult = {
      query,
      response,
      sources,
      embedding,
      createdAt: Date.now(),
    };

    try {
      await this.redis.setex(key, config.cache.queryTtl, JSON.stringify(data));
      logger.debug(`Cached query for user ${userId}`);
    } catch (error) {
      logger.error("Failed to cache query:", error);
    }
  }

  async clearUserCache(userId: string): Promise<void> {
    try {
      const pattern = `${QUERY_CACHE_PREFIX}${userId}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Cleared ${keys.length} cached queries for user ${userId}`);
      }
    } catch (error) {
      logger.error("Failed to clear user cache:", error);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}
