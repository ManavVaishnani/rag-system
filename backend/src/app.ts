import express from "express";
import cors from "cors";
import helmet from "helmet";
import timeout from "connect-timeout";
import { config } from "./config";
import { apiRateLimiter } from "./middleware/rate-limit.middleware";
import {
  errorHandler,
  notFoundHandler,
  timeoutErrorHandler,
} from "./middleware/validation.middleware";
import { logger } from "./utils/logger";

// Import routes
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import queryRoutes from "./routes/query.routes";
import conversationRoutes from "./routes/conversation.routes";
import healthRoutes from "./routes/health.routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.server.corsOrigin,
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request timeout middleware (skip health checks)
app.use((req, res, next) => {
  if (req.path.startsWith("/health")) {
    next();
  } else if (req.path.startsWith("/api/documents") && req.method === "POST") {
    // Longer timeout for file uploads
    timeout("120s")(req, res, next);
  } else {
    timeout("30s")(req, res, next);
  }
});

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check (comprehensive)
app.use("/health", healthRoutes);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/conversations", conversationRoutes);

// Apply general rate limiting to all other routes
app.use("/api", apiRateLimiter);

// Error handling
app.use(notFoundHandler);
app.use(timeoutErrorHandler);
app.use(errorHandler);

export default app;
