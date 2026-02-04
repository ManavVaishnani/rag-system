import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { logger } from "../utils/logger";

export class EmbeddingService {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    this.model = config.gemini.embeddingModel;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.client.models.embedContent({
        model: this.model,
        contents: [text],
      });

      if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error("No embedding returned from Gemini");
      }

      return result.embeddings[0].values!;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Embedding generation failed: ${errorMessage}`, error);
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
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
