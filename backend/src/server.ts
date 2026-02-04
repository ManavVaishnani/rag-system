import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { config } from "./config";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { ensureQdrantCollection } from "./config/qdrant";
import { logger } from "./utils/logger";
import { setupWebSocket } from "./utils/websocket";

const server = http.createServer(app);

// Setup WebSocket
const io = new SocketIOServer(server, {
  cors: {
    origin: config.server.corsOrigin,
    credentials: true,
  },
});

setupWebSocket(io);

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    logger.info("Connecting to databases...");
    await connectDatabase();
    await connectRedis();

    // Ensure Qdrant collection exists
    logger.info("Ensuring Qdrant collection...");
    await ensureQdrantCollection();

    // Start server
    server.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Frontend URL: ${config.server.frontendUrl}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info("All connections closed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

// Start the server
startServer();

export { io };
