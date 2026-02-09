import express from "express";
import cors from "cors";
import helmet from "helmet";
import timeout from "connect-timeout";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { swaggerSpec } from "./config/swagger";
import { apiRateLimiter } from "./middleware/rate-limit.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import {
  errorHandler,
  notFoundHandler,
  timeoutErrorHandler,
} from "./middleware/validation.middleware";
import { metricsMiddleware } from "./middleware/metrics.middleware";
import { getRequestLogger } from "./utils/logger";

// Import routes
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import queryRoutes from "./routes/query.routes";
import conversationRoutes from "./routes/conversation.routes";
import vectorRoutes from "./routes/vector.routes";
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

// Request ID middleware (early to ensure all logs have request context)
app.use(requestIdMiddleware);

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

// Request logging with request context
app.use((req, _res, next) => {
  const requestLogger = getRequestLogger(req.requestId);
  requestLogger.debug(`${req.method} ${req.path}`);
  next();
});

// Metrics middleware (tracks HTTP request duration and count)
app.use(metricsMiddleware);

// Health check (comprehensive)
app.use("/health", healthRoutes);

// API documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "RAG System API Documentation",
  }),
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/vectors", vectorRoutes);

// Apply general rate limiting to all other routes
app.use("/api", apiRateLimiter);

// Error handling
app.use(notFoundHandler);
app.use(timeoutErrorHandler);
app.use(errorHandler);

export default app;
