import { getQdrantClient } from '../config/qdrant';
import { config } from '../config';
import { logger } from '../utils/logger';
import { VectorData, SearchResult, VectorPayload } from '../types';

export class VectorService {
  private get client() {
    return getQdrantClient();
  }

  private get collectionName() {
    return config.qdrant.collectionName;
  }

  async upsertVectors(vectors: VectorData[]): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: vectors.map((v) => ({
          id: v.id,
          vector: v.vector,
          payload: v.payload as unknown as Record<string, unknown>,
        })),
      });
      logger.info(`Upserted ${vectors.length} vectors to Qdrant`);
    } catch (error) {
      logger.error('Failed to upsert vectors:', error);
      throw new Error('Failed to store vectors');
    }
  }

  async similaritySearch(
    queryVector: number[],
    userId: string,
    k: number = 5
  ): Promise<SearchResult[]> {
    try {
      const results = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit: k,
        filter: {
          must: [{ key: 'userId', match: { value: userId } }],
        },
        with_payload: true,
      });

      return results.map((result) => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as unknown as VectorPayload,
      }));
    } catch (error) {
      logger.error('Similarity search failed:', error);
      throw new Error('Failed to search vectors');
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [{ key: 'documentId', match: { value: documentId } }],
        },
      });
      logger.info(`Deleted vectors for document: ${documentId}`);
    } catch (error) {
      logger.error('Failed to delete vectors:', error);
      throw new Error('Failed to delete vectors');
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [{ key: 'userId', match: { value: userId } }],
        },
      });
      logger.info(`Deleted all vectors for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to delete user vectors:', error);
      throw new Error('Failed to delete user vectors');
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
