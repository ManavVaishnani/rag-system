import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from './index';
import { logger } from '../utils/logger';

let qdrantClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }

  return qdrantClient;
}

export async function ensureQdrantCollection(): Promise<void> {
  const client = getQdrantClient();

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (col) => col.name === config.qdrant.collectionName
    );

    if (!exists) {
      await client.createCollection(config.qdrant.collectionName, {
        vectors: {
          size: config.qdrant.vectorSize,
          distance: 'Cosine',
        },
      });
      logger.info(`Created Qdrant collection: ${config.qdrant.collectionName}`);
    } else {
      logger.info(`Qdrant collection already exists: ${config.qdrant.collectionName}`);
    }
  } catch (error) {
    logger.error('Failed to ensure Qdrant collection:', error);
    throw error;
  }
}
