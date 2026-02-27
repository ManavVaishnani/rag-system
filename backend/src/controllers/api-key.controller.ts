import { Request, Response } from "express";
import { apiKeyService } from "../services/api-key.service";
import { dailyLimitService } from "../services/daily-limit.service";
import { logger } from "../utils/logger";

export class ApiKeyController {
  async addKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { apiKey, name } = req.body as { apiKey: string; name?: string };

      const result = await apiKeyService.addKey(userId, apiKey, name);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Failed to add API key:", error);
      res.status(500).json({ error: "Failed to add API key" });
    }
  }

  async listKeys(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const keys = await apiKeyService.listKeys(userId);

      res.json({
        success: true,
        data: keys,
      });
    } catch (error) {
      logger.error("Failed to list API keys:", error);
      res.status(500).json({ error: "Failed to list API keys" });
    }
  }

  async updateKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      const updates = req.body as {
        apiKey?: string;
        name?: string;
        isActive?: boolean;
      };

      const result = await apiKeyService.updateKey(userId, id, updates);

      if (!result) {
        res.status(404).json({ error: "API key not found" });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Failed to update API key:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  }

  async deleteKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;

      const deleted = await apiKeyService.deleteKey(userId, id);

      if (!deleted) {
        res.status(404).json({ error: "API key not found" });
        return;
      }

      res.json({
        success: true,
        data: { message: "API key deleted" },
      });
    } catch (error) {
      logger.error("Failed to delete API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  }

  async getCredits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const hasByok = await apiKeyService.hasByok(userId);
      const usage = await dailyLimitService.getUsage(userId);

      res.json({
        success: true,
        data: {
          dailyLimit: usage.limit,
          used: usage.used,
          remaining: usage.remaining,
          resetsAt: usage.resetsAt,
          hasByok,
          usingCredits: !hasByok,
        },
      });
    } catch (error) {
      logger.error("Failed to get credits:", error);
      res.status(500).json({ error: "Failed to get credit status" });
    }
  }
}

export const apiKeyController = new ApiKeyController();
