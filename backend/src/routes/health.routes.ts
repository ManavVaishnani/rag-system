import { Router } from "express";
import { healthController } from "../controllers/health.controller";

const router = Router();

// Main health endpoint - comprehensive check
router.get("/", (_req, res) => healthController.getHealth(_req, res));

// Kubernetes-style health probes
router.get("/live", (_req, res) => healthController.getLiveness(_req, res));
router.get("/ready", (_req, res) => healthController.getReadiness(_req, res));

export default router;
