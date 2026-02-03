import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  (req, res) => authController.register(req, res)
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  (req, res) => authController.login(req, res)
);

// Protected routes
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
