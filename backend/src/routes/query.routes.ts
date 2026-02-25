import { Router } from "express";
import { queryController } from "../controllers/query.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rate-limit.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { querySchema } from "../utils/validators";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get daily usage info
router.get("/usage", (req, res) => queryController.getUsage(req, res));

// Query endpoint
router.post("/", apiRateLimiter, validateBody(querySchema), (req, res) =>
  queryController.query(req, res),
);

export default router;
