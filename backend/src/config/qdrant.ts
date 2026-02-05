import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "./index";
import { logger } from "../utils/logger";

let qdrantClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
      checkCompatibility: true,
    });
  }

  return qdrantClient;
}

export async function ensureQdrantCollection(): Promise<void> {
  const client = getQdrantClient();

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (col) => col.name === config.qdrant.collectionName,
    );

    if (exists) {
      const collectionInfo = await client.getCollection(
        config.qdrant.collectionName,
      );
      const vectorParams = collectionInfo.config?.params?.vectors as any;
      let currentSize: number | undefined;

      if (typeof vectorParams === "number") {
        currentSize = vectorParams;
      } else if (vectorParams?.size) {
        currentSize = vectorParams.size;
      } else if (vectorParams?.[""]?.size) {
        // Handle default unnamed vector in map
        currentSize = vectorParams[""].size;
      }

      if (currentSize && currentSize !== config.qdrant.vectorSize) {
        logger.warn(
          `Collection ${config.qdrant.collectionName} has vector size ${currentSize}, expected ${config.qdrant.vectorSize}. Recreating collection...`,
        );
        await client.deleteCollection(config.qdrant.collectionName);
        await createCollection(client);
      } else {
        logger.info(
          `Qdrant collection exists: ${config.qdrant.collectionName}`,
        );
      }
    } else {
      await createCollection(client);
    }
  } catch (error) {
    logger.error("Failed to ensure Qdrant collection:", error);
    throw error;
  }
}

async function createCollection(client: QdrantClient): Promise<void> {
  await client.createCollection(config.qdrant.collectionName, {
    vectors: {
      size: config.qdrant.vectorSize,
      distance: "Cosine",
    },
  });
  logger.info(`Created Qdrant collection: ${config.qdrant.collectionName}`);
}
