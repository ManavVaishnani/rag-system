import { Router } from "express";
import { vectorController } from "../controllers/vector.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Delete all vectors for a specific document
router.delete("/document/:documentId", apiRateLimiter, (req, res) =>
  vectorController.deleteByDocumentId(req, res),
);

// Delete all vectors for a specific user
router.delete("/user/:userId", apiRateLimiter, (req, res) =>
  vectorController.deleteByUserId(req, res),
);

// Delete all vectors in the collection (admin operation) - MUST come before "/all"
router.delete("/admin/all", apiRateLimiter, (req, res) =>
  vectorController.deleteAllVectorsAdmin(req, res),
);

// Delete all vectors for the current user
router.delete("/all", apiRateLimiter, (req, res) =>
  vectorController.deleteAllVectors(req, res),
);

export default router;
