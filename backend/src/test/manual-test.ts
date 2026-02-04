import { getEmbeddingService } from "../services/embedding.service";
import { getLLMService } from "../services/llm.service";

import { connectDatabase } from "../config/database";
import { connectRedis } from "../config/redis";
import { ensureQdrantCollection } from "../config/qdrant";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

async function runManualTests() {
  logger.info("Starting manual backend verification...");

  try {
    // 1. Test Database
    logger.info("Testing Database connection...");
    await connectDatabase();
    logger.info("✅ Database connected");

    // 2. Test Redis
    logger.info("Testing Redis connection...");
    await connectRedis();
    logger.info("✅ Redis connected");

    // 3. Test Qdrant
    logger.info("Testing Qdrant connection...");
    try {
      await ensureQdrantCollection();
      logger.info("✅ Qdrant collection ready");
    } catch (error) {
      logger.error(
        "❌ Qdrant connection failed. Check QDRANT_URL and QDRANT_API_KEY",
      );
      logger.error(error);
    }

    // 4. Test Gemini Embeddings
    logger.info("Testing Gemini Embedding API...");
    try {
      const embeddingService = getEmbeddingService();
      const embedding = await embeddingService.generateEmbedding("Hello world");
      logger.info(
        `✅ Gemini Embedding successful (Dimensions: ${embedding.length})`,
      );
    } catch (error) {
      logger.error("❌ Gemini Embedding failed. Check GEMINI_API_KEY");
      logger.error(error);
    }

    // 5. Test Gemini LLM
    logger.info("Testing Gemini LLM API...");
    try {
      const llmService = getLLMService();
      const response = await llmService.generateResponse(
        'Say "RAG System Online"',
        [],
      );
      logger.info(`✅ Gemini LLM response: "${response.trim()}"`);
    } catch (error) {
      logger.error("❌ Gemini LLM failed. Check GEMINI_API_KEY");
      logger.error(error);
    }

    logger.info("Manual verification finished.");
    process.exit(0);
  } catch (error) {
    logger.error("Manual verification aborted due to critical error:");
    logger.error(error);
    process.exit(1);
  }
}

runManualTests();
