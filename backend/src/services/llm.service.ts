import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { logger } from "../utils/logger";

interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class LLMService {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    this.model = config.gemini.llmModel;
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

  async generateResponse(query: string, context: string[]): Promise<string> {
    try {
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
    } catch (error) {
      logger.error("LLM generation failed:", error);
      throw new Error("Failed to generate response");
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
