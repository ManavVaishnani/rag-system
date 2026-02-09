import { getQdrantClient } from "../config/qdrant";
import { config } from "../config";
import { logger } from "../utils/logger";
import { metrics } from "./metrics.service";
import { VectorData, SearchResult, VectorPayload } from "../types";
import {
  createCircuitBreaker,
  CircuitBreakerConfigs,
} from "./circuit-breaker.service";

export class VectorService {
  private get client() {
    return getQdrantClient();
  }

  private get collectionName() {
    return config.qdrant.collectionName;
  }

  private upsertBreaker;
  private searchBreaker;

  constructor() {
    // Initialize circuit breakers for Qdrant operations
    this.upsertBreaker = createCircuitBreaker(
      this.upsertVectorsInternal.bind(this),
      CircuitBreakerConfigs.qdrant,
      () => {
        throw new Error(
          "Vector storage service temporarily unavailable. Please try again later.",
        );
      },
    );

    this.searchBreaker = createCircuitBreaker(
      this.similaritySearchInternal.bind(this),
      CircuitBreakerConfigs.qdrant,
      async () => {
        // Return empty results for search fallback (graceful degradation)
        logger.warn(
          "Vector search circuit breaker open, returning empty results",
        );
        return [] as SearchResult[];
      },
    );
  }

  private async upsertVectorsInternal(vectors: VectorData[]): Promise<void> {
    if (vectors.length > 0) {
      logger.info(
        `Upserting ${vectors.length} vectors. First vector length: ${vectors[0].vector.length}`,
      );
    }
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: vectors.map((v) => ({
        id: v.id,
        vector: v.vector,
        payload: v.payload as unknown as Record<string, unknown>,
      })),
    });
    logger.info(`Upserted ${vectors.length} vectors to Qdrant`);
  }

  async upsertVectors(vectors: VectorData[]): Promise<void> {
    const start = Date.now();
    try {
      await this.upsertBreaker.fire(vectors);
      metrics.recordQdrantOperation("upsert", "success", Date.now() - start);
    } catch (error: any) {
      metrics.recordQdrantOperation("upsert", "error", Date.now() - start);
      logger.error("Full Qdrant Error object:", JSON.stringify(error, null, 2));
      if (error?.data) {
        logger.error("Qdrant error data:", JSON.stringify(error.data, null, 2));
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to upsert vectors: ${errorMessage}`, error);
      throw error;
    }
  }

  private async similaritySearchInternal(
    queryVector: number[],
    userId: string,
    k: number = 5,
  ): Promise<SearchResult[]> {
    const results = await this.client.search(this.collectionName, {
      vector: queryVector,
      limit: k,
      filter: {
        must: [{ key: "userId", match: { value: userId } }],
      },
      with_payload: true,
    });

    return results.map((result) => ({
      id: result.id as string,
      score: result.score,
      payload: result.payload as unknown as VectorPayload,
    }));
  }

  async similaritySearch(
    queryVector: number[],
    userId: string,
    k: number = 5,
  ): Promise<SearchResult[]> {
    const start = Date.now();
    try {
      const result = (await this.searchBreaker.fire(
        queryVector,
        userId,
        k,
      )) as SearchResult[];
      metrics.recordQdrantOperation("search", "success", Date.now() - start);
      return result;
    } catch (error: any) {
      metrics.recordQdrantOperation("search", "error", Date.now() - start);
      logger.error("Similarity search failed:", error);
      if (error?.data) {
        logger.error("Qdrant error data:", JSON.stringify(error.data, null, 2));
      }
      throw error;
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const start = Date.now();
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [{ key: "documentId", match: { value: documentId } }],
        },
      });
      metrics.recordQdrantOperation("delete", "success", Date.now() - start);
      logger.info(`Deleted vectors for document: ${documentId}`);
    } catch (error) {
      metrics.recordQdrantOperation("delete", "error", Date.now() - start);
      logger.error("Failed to delete vectors:", error);
      throw new Error("Failed to delete vectors");
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    const start = Date.now();
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [{ key: "userId", match: { value: userId } }],
        },
      });
      metrics.recordQdrantOperation("delete", "success", Date.now() - start);
      logger.info(`Deleted all vectors for user: ${userId}`);
    } catch (error) {
      metrics.recordQdrantOperation("delete", "error", Date.now() - start);
      logger.error("Failed to delete user vectors:", error);
      throw new Error("Failed to delete user vectors");
    }
  }

  async deleteAllVectors(): Promise<void> {
    const start = Date.now();
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {},
      });
      metrics.recordQdrantOperation("delete", "success", Date.now() - start);
      logger.info("Deleted all vectors from collection");
    } catch (error) {
      metrics.recordQdrantOperation("delete", "error", Date.now() - start);
      logger.error("Failed to delete all vectors:", error);
      throw new Error("Failed to delete all vectors");
    }
  }
}

// Singleton instance
let vectorService: VectorService | null = null;

export function getVectorService(): VectorService {
  if (!vectorService) {
    vectorService = new VectorService();
  }
  return vectorService;
}
