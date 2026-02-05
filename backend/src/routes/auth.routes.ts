import { Router } from "express";
import { z } from "zod";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { registerSchema, loginSchema } from "../utils/validators";

// Schema for refresh token
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const router = Router();

// Public routes
router.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  (req, res) => authController.register(req, res),
);

router.post("/login", authRateLimiter, validateBody(loginSchema), (req, res) =>
  authController.login(req, res),
);

// Token refresh route (also rate limited)
router.post(
  "/refresh",
  authRateLimiter,
  validateBody(refreshTokenSchema),
  (req, res) => authController.refresh(req, res),
);

// Protected routes
router.get("/me", authMiddleware, (req, res) => authController.me(req, res));

router.post("/logout", authMiddleware, (req, res) =>
  authController.logout(req, res),
);

export default router;
