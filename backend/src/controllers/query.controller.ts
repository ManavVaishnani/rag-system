import { Request, Response } from "express";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { getEmbeddingService } from "../services/embedding.service";
import { getVectorService } from "../services/vector.service";
import { getLLMService } from "../services/llm.service";
import { getCacheService } from "../services/cache.service";
import { SourceCitation } from "../types";
import { QueryInput } from "../utils/validators";

export class QueryController {
  async query(req: Request, res: Response): Promise<void> {
    try {
      const { query, conversationId } = req.body as QueryInput;
      const userId = req.user!.userId;

      const embeddingService = getEmbeddingService();
      const vectorService = getVectorService();
      const llmService = getLLMService();
      const cacheService = getCacheService();

      // Create a new conversation if conversationId is not provided
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const newConversation = await prisma.conversation.create({
          data: {
            userId,
            title: query.slice(0, 100) + (query.length > 100 ? "..." : ""),
          },
        });
        activeConversationId = newConversation.id;
        logger.info(`Created new conversation: ${activeConversationId}`);
      }

      // Check semantic cache first
      const cached = await cacheService.semanticSearch(query, userId);
      if (cached) {
        // Even for cached responses, save to conversation
        await this.saveToConversation(
          activeConversationId,
          userId,
          query,
          cached.response,
          cached.sources,
        );

        res.json({
          success: true,
          data: {
            response: cached.response,
            sources: cached.sources,
            conversationId: activeConversationId,
            cached: true,
          },
        });
        return;
      }

      // Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Search for similar documents
      const results = await vectorService.similaritySearch(
        queryEmbedding,
        userId,
        5,
      );

      if (results.length === 0) {
        const noResultsResponse =
          "I couldn't find any relevant information in your documents. Please upload some documents first or try a different question.";

        // Save the query and response even when no results found
        await this.saveToConversation(
          activeConversationId,
          userId,
          query,
          noResultsResponse,
          [],
        );

        res.json({
          success: true,
          data: {
            response: noResultsResponse,
            sources: [],
            conversationId: activeConversationId,
            cached: false,
          },
        });
        return;
      }

      // Extract context and sources
      const context = results.map((r) => r.payload.content);
      const sources: SourceCitation[] = results.map((r) => ({
        documentId: r.payload.documentId,
        chunkId: r.payload.chunkId,
        filename: r.payload.filename,
        content:
          r.payload.content.slice(0, 200) +
          (r.payload.content.length > 200 ? "..." : ""),
        score: r.score,
      }));

      // Generate response
      const response = await llmService.generateResponse(query, context);

      // Cache the result
      await cacheService.cacheQuery(
        query,
        userId,
        response,
        sources,
        queryEmbedding,
      );

      // Always save to conversation
      await this.saveToConversation(
        activeConversationId,
        userId,
        query,
        response,
        sources,
      );

      res.json({
        success: true,
        data: {
          response,
          sources,
          conversationId: activeConversationId,
          cached: false,
        },
      });
    } catch (error: any) {
      logger.error("Query failed:", error);
      res.status(500).json({
        error: "Failed to process query",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  private async saveToConversation(
    conversationId: string,
    userId: string,
    query: string,
    response: string,
    sources: SourceCitation[],
  ): Promise<void> {
    try {
      // Verify conversation belongs to user
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        logger.warn(`Conversation not found: ${conversationId}`);
        return;
      }

      // Save messages
      await prisma.message.createMany({
        data: [
          {
            conversationId,
            role: "USER",
            content: query,
          },
          {
            conversationId,
            role: "ASSISTANT",
            content: response,
            sources: JSON.parse(JSON.stringify(sources)),
          },
        ],
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      logger.error("Failed to save to conversation:", error);
    }
  }
}

export const queryController = new QueryController();
