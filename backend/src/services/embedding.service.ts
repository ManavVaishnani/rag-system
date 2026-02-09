import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { logger } from "../utils/logger";
import { metrics } from "./metrics.service";
import {
  createCircuitBreaker,
  CircuitBreakerConfigs,
} from "./circuit-breaker.service";

export class EmbeddingService {
  private client: GoogleGenAI;
  private model: string;
  private embeddingBreaker;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    this.model = config.gemini.embeddingModel;

    // Initialize circuit breaker for embedding generation
    this.embeddingBreaker = createCircuitBreaker(
      this.generateEmbeddingInternal.bind(this),
      CircuitBreakerConfigs.geminiEmbedding,
      () => {
        throw new Error(
          "Embedding service temporarily unavailable. Please try again later.",
        );
      },
    );
  }

  private async generateEmbeddingInternal(text: string): Promise<number[]> {
    const result = await this.client.models.embedContent({
      model: this.model,
      contents: [text],
      config: {
        outputDimensionality: 768,
      },
    });

    if (!result.embeddings || result.embeddings.length === 0) {
      throw new Error("No embedding returned from Gemini");
    }

    return result.embeddings[0].values!;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const start = Date.now();
    try {
      const result = (await this.embeddingBreaker.fire(text)) as number[];
      metrics.recordGeminiEmbedding("success", Date.now() - start);
      return result;
    } catch (error) {
      metrics.recordGeminiEmbedding("error", Date.now() - start);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Embedding generation failed: ${errorMessage}`, error);
      throw error;
    }
  }

  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const batchSize = 5;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map((text) => this.generateEmbedding(text));

      try {
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
      } catch (error) {
        logger.error(`Batch ${i / batchSize} failed:`, error);
        throw error;
      }

      // Rate limiting: 300ms delay between batches
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return embeddings;
  }
}

// Singleton instance
let embeddingService: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingService) {
    embeddingService = new EmbeddingService();
  }
  return embeddingService;
}
