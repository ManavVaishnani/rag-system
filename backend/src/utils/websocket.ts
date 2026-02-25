import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../config/database";
import { logger } from "./logger";
import { getEmbeddingService } from "../services/embedding.service";
import { getVectorService } from "../services/vector.service";
import { getLLMService } from "../services/llm.service";
import { getCacheService } from "../services/cache.service";
import { dailyLimitService } from "../services/daily-limit.service";
import { SourceCitation, JwtPayload } from "../types";

export function setupWebSocket(io: SocketIOServer): void {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true },
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.userId = user.id;
      socket.data.email = user.email;
      next();
    } catch (error) {
      logger.error("WebSocket auth error:", error);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`User connected via WebSocket: ${userId}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Handle streaming query
    socket.on(
      "query:stream",
      async (data: { query: string; conversationId?: string }) => {
        try {
          const { query, conversationId } = data;

          // Check daily message limit
          const { allowed, usage } = await dailyLimitService.canSendMessage(userId);
          if (!allowed) {
            socket.emit("query:error", {
              error: `Daily message limit reached (${usage.limit} messages per day). Resets at ${new Date(usage.resetsAt).toLocaleTimeString()}.`,
              code: "DAILY_LIMIT_REACHED",
              usage,
            });
            return;
          }

          const embeddingService = getEmbeddingService();
          const vectorService = getVectorService();
          const llmService = getLLMService();
          const cacheService = getCacheService();

          // Check semantic cache
          const cached = await cacheService.semanticSearch(query, userId);
          if (cached) {
            socket.emit("query:cached", {
              response: cached.response,
              sources: cached.sources,
            });
            return;
          }

          // Generate embedding
          socket.emit("query:status", { status: "Searching documents..." });
          const queryEmbedding =
            await embeddingService.generateEmbedding(query);

          // Search vectors
          const results = await vectorService.similaritySearch(
            queryEmbedding,
            userId,
            5,
          );

          if (results.length === 0) {
            socket.emit("query:complete", {
              response:
                "I couldn't find any relevant information in your documents.",
              sources: [],
            });
            return;
          }

          // Prepare context and sources
          const context = results.map((r) => r.payload.content);
          const sources: SourceCitation[] = results.map((r) => ({
            documentId: r.payload.documentId,
            chunkId: r.payload.chunkId,
            filename: r.payload.filename,
            content: r.payload.content.slice(0, 200) + "...",
            score: r.score,
          }));

          // Stream LLM response
          socket.emit("query:status", { status: "Generating response..." });
          socket.emit("query:sources", { sources });

          let fullResponse = "";

          await llmService.streamCompletion(query, context, {
            onChunk: (chunk: string) => {
              fullResponse += chunk;
              socket.emit("query:chunk", { chunk });
            },
            onComplete: async () => {
              // Cache the result
              await cacheService.cacheQuery(
                query,
                userId,
                fullResponse,
                sources,
                queryEmbedding,
              );

              // Save to conversation if provided
              let assistantMessageId = `msg-${Date.now()}`;
              if (conversationId) {
                try {
                  // Create user message first
                  await prisma.message.create({
                    data: {
                      conversationId,
                      role: "USER",
                      content: query,
                    },
                  });

                  // Create assistant message
                  const assistantMessage = await prisma.message.create({
                    data: {
                      conversationId,
                      role: "ASSISTANT",
                      content: fullResponse,
                      sources: JSON.parse(JSON.stringify(sources)),
                    },
                  });
                  assistantMessageId = assistantMessage.id;

                  await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() },
                  });
                } catch (err) {
                  logger.error("Failed to save conversation:", err);
                }
              }

              // Increment daily usage after successful response
              const updatedUsage = await dailyLimitService.incrementUsage(userId);

              socket.emit("query:complete", { 
                done: true,
                messageId: assistantMessageId,
                usage: updatedUsage,
              });
            },
            onError: (error: Error) => {
              logger.error("LLM streaming error:", error);
              socket.emit("query:error", {
                error: "Failed to generate response",
              });
            },
          });
        } catch (error) {
          logger.error("WebSocket query error:", error);
          socket.emit("query:error", { error: "Query processing failed" });
        }
      },
    );

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });
}
