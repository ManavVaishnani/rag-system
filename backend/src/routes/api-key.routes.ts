import { Router } from "express";
import { z } from "zod";
import { apiKeyController } from "../controllers/api-key.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";

const addKeySchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  name: z.string().max(100).optional(),
});

const updateKeySchema = z.object({
  apiKey: z.string().min(1).optional(),
  name: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// BYOK endpoints
router.post("/api-keys", validateBody(addKeySchema), (req, res) =>
  apiKeyController.addKey(req, res),
);

router.get("/api-keys", (req, res) =>
  apiKeyController.listKeys(req, res),
);

router.patch("/api-keys/:id", validateBody(updateKeySchema), (req, res) =>
  apiKeyController.updateKey(req, res),
);

router.delete("/api-keys/:id", (req, res) =>
  apiKeyController.deleteKey(req, res),
);

// Credit status endpoint
router.get("/credits", (req, res) =>
  apiKeyController.getCredits(req, res),
);

export default router;
