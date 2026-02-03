import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = config.gemini.embeddingModel;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: this.model });
      const result = await embeddingModel.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding returned from Gemini');
      }

      return result.embedding.values;
    } catch (error) {
      logger.error('Embedding generation failed:', error);
      throw new Error('Failed to generate embedding');
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
