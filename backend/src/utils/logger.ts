import winston from "winston";
import { config } from "../config";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, requestId }) => {
    const requestIdStr = requestId ? `[${requestId}] ` : "";
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${requestIdStr}${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${requestIdStr}${message}`;
  }),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, requestId }) => {
    const requestIdStr = requestId ? `[${requestId}] ` : "";
    return `${timestamp} ${level}: ${requestIdStr}${message}`;
  }),
);

export const logger = winston.createLogger({
  level: config.server.nodeEnv === "development" ? "debug" : "info",
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Add file transport in production
if (config.server.nodeEnv === "production") {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
    }),
  );
}

/**
 * Get a logger with request context
 * @param requestId - The request ID to include in log entries
 * @returns A child logger with the request ID in metadata
 */
export function getRequestLogger(
  requestId: string | undefined,
): winston.Logger {
  if (requestId) {
    return logger.child({ requestId });
  }
  return logger;
}
