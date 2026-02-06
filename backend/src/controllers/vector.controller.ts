import { Request, Response } from "express";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { getVectorService } from "../services/vector.service";

export class VectorController {
  async deleteByDocumentId(req: Request, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;
      const userId = req.user!.userId;

      // Verify document belongs to user
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
      });

      if (!document) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      // Delete vectors from Qdrant
      const vectorService = getVectorService();
      await vectorService.deleteByDocumentId(documentId);

      logger.info(`Vectors deleted for document: ${documentId}`);

      res.json({
        success: true,
        message: "Document vectors deleted successfully",
      });
    } catch (error) {
      logger.error("Delete document vectors failed:", error);
      res.status(500).json({ error: "Failed to delete document vectors" });
    }
  }

  async deleteByUserId(req: Request, res: Response): Promise<void> {
    try {
      const targetUserId = req.params.userId as string;
      const requestingUserId = req.user!.userId;

      // Users can only delete their own vectors
      if (targetUserId !== requestingUserId) {
        res
          .status(403)
          .json({ error: "Cannot delete vectors for other users" });
        return;
      }

      // Delete vectors from Qdrant
      const vectorService = getVectorService();
      await vectorService.deleteByUserId(targetUserId);

      logger.info(`All vectors deleted for user: ${targetUserId}`);

      res.json({
        success: true,
        message: "All user vectors deleted successfully",
      });
    } catch (error) {
      logger.error("Delete user vectors failed:", error);
      res.status(500).json({ error: "Failed to delete user vectors" });
    }
  }

  async deleteAllVectors(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      // Delete vectors from Qdrant (all vectors for this user)
      const vectorService = getVectorService();
      await vectorService.deleteByUserId(userId);

      logger.info(`All vectors deleted for user: ${userId}`);

      res.json({
        success: true,
        message: "All vectors deleted successfully",
      });
    } catch (error) {
      logger.error("Delete all vectors failed:", error);
      res.status(500).json({ error: "Failed to delete all vectors" });
    }
  }

  async deleteAllVectorsAdmin(_req: Request, res: Response): Promise<void> {
    try {
      // Delete all vectors from Qdrant (entire collection)
      const vectorService = getVectorService();
      await vectorService.deleteAllVectors();

      logger.info("All vectors deleted from collection by admin");

      res.json({
        success: true,
        message: "All vectors deleted from collection successfully",
      });
    } catch (error) {
      logger.error("Delete all vectors (admin) failed:", error);
      res.status(500).json({ error: "Failed to delete all vectors" });
    }
  }
}

export const vectorController = new VectorController();
