import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { logger } from "../utils/logger";
import { metrics } from "./metrics.service";
import {
  createCircuitBreaker,
  CircuitBreakerConfigs,
} from "./circuit-breaker.service";

interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class LLMService {
  private client: GoogleGenAI;
  private model: string;
  private llmBreaker;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    this.model = config.gemini.llmModel;

    // Initialize circuit breaker for LLM generation
    this.llmBreaker = createCircuitBreaker(
      this.generateResponseInternal.bind(this),
      CircuitBreakerConfigs.geminiLLM,
      () => {
        throw new Error(
          "LLM service temporarily unavailable. Please try again later.",
        );
      },
    );
  }

  async streamCompletion(
    query: string,
    context: string[],
    options: StreamOptions,
  ): Promise<void> {
    try {
      const prompt = this.buildPrompt(query, context);
      const responses = await this.client.models.generateContentStream({
        model: this.model,
        contents: prompt,
      });

      for await (const chunk of responses) {
        const text = chunk.text;
        if (text) {
          options.onChunk(text);
        }
      }

      options.onComplete?.();
    } catch (error) {
      logger.error("LLM streaming failed:", error);
      options.onError?.(error as Error);
    }
  }

  private async generateResponseInternal(
    query: string,
    context: string[],
  ): Promise<string> {
    const prompt = this.buildPrompt(query, context);
    const result = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const response = result.text;
    if (!response) {
      throw new Error("No response generated from Gemini");
    }

    return response;
  }

  async generateResponse(query: string, context: string[]): Promise<string> {
    const start = Date.now();
    try {
      const result = (await this.llmBreaker.fire(query, context)) as string;
      metrics.recordGeminiLLM("success", Date.now() - start);
      return result;
    } catch (error) {
      metrics.recordGeminiLLM("error", Date.now() - start);
      logger.error("LLM generation failed:", error);
      throw error;
    }
  }

  private buildPrompt(query: string, context: string[]): string {
    const contextText = context.join("\n\n---\n\n");

    return `You are a helpful AI assistant. Answer the user's question based on the provided context from their documents. 

If the context doesn't contain enough information to answer the question, say so clearly and suggest what additional information might be needed.

Be concise but thorough. Use markdown formatting when appropriate for better readability.

CONTEXT FROM USER'S DOCUMENTS:
${contextText || "No relevant context found."}

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
