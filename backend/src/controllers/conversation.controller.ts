import { Request, Response } from "express";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { metrics } from "../services/metrics.service";

export class ConversationController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { title } = req.body;

      const conversation = await prisma.conversation.create({
        data: {
          userId,
          title: title || "New Conversation",
        },
      });

      // Record conversation creation metric
      metrics.recordConversationCreated();

      res.status(201).json({
        success: true,
        data: {
          conversation,
        },
      });
    } catch (error) {
      logger.error("Create conversation failed:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
          include: {
            _count: {
              select: { messages: true },
            },
          },
        }),
        prisma.conversation.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("List conversations failed:", error);
      res.status(500).json({ error: "Failed to list conversations" });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const messages = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
      });

      res.json({
        success: true,
        data: {
          conversation,
          messages,
        },
      });
    } catch (error) {
      logger.error("Get conversation failed:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;
      const { title } = req.body;

      const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const updated = await prisma.conversation.update({
        where: { id },
        data: { title },
      });

      res.json({
        success: true,
        data: {
          conversation: updated,
        },
      });
    } catch (error) {
      logger.error("Update conversation failed:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      await prisma.conversation.delete({ where: { id } });

      res.json({
        success: true,
        message: "Conversation deleted successfully",
      });
    } catch (error) {
      logger.error("Delete conversation failed:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  }
}

export const conversationController = new ConversationController();
