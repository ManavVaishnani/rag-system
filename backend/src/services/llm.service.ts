import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';

interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = config.gemini.llmModel;
  }

  async streamCompletion(
    query: string,
    context: string[],
    options: StreamOptions
  ): Promise<void> {
    try {
      const prompt = this.buildPrompt(query, context);
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          options.onChunk(text);
        }
      }

      options.onComplete?.();
    } catch (error) {
      logger.error('LLM streaming failed:', error);
      options.onError?.(error as Error);
    }
  }

  async generateResponse(query: string, context: string[]): Promise<string> {
    try {
      const prompt = this.buildPrompt(query, context);
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.generateContent(prompt);
      const response = result.response;

      return response.text();
    } catch (error) {
      logger.error('LLM generation failed:', error);
      throw new Error('Failed to generate response');
    }
  }

  private buildPrompt(query: string, context: string[]): string {
    const contextText = context.join('\n\n---\n\n');

    return `You are a helpful AI assistant. Answer the user's question based on the provided context from their documents. 

If the context doesn't contain enough information to answer the question, say so clearly and suggest what additional information might be needed.

Be concise but thorough. Use markdown formatting when appropriate for better readability.

CONTEXT FROM USER'S DOCUMENTS:
${contextText || 'No relevant context found.'}

USER'S QUESTION:
${query}

ANSWER:`;
  }
}

// Singleton instance
let llmService: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmService) {
    llmService = new LLMService();
  }
  return llmService;
}
