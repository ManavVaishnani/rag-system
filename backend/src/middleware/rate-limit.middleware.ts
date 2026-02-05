import rateLimit from "express-rate-limit";
import RedisStore, { RedisReply } from "rate-limit-redis";
import { config } from "../config";
import { getRedisClient } from "../config/redis";

// Check if we're in test mode
const isTestEnvironment = process.env.NODE_ENV === "test";

// Create Redis store for distributed rate limiting
const createRedisStore = () => {
  const client = getRedisClient();

  return new RedisStore({
    sendCommand: async (
      ...args: [string, ...string[]]
    ): Promise<RedisReply> => {
      const result = await client.call(...args);
      return (result ?? undefined) as RedisReply;
    },
  });
};

// General API rate limiter
export const apiRateLimiter = rateLimit({
  store: createRedisStore(),
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnvironment, // Skip rate limiting in tests
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip || "anonymous";
  },
});

// Stricter rate limiter for file uploads
export const uploadRateLimiter = rateLimit({
  store: createRedisStore(),
  windowMs: config.rateLimit.uploadWindowMs,
  max: config.rateLimit.uploadMaxRequests,
  message: {
    error: "Upload limit exceeded. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnvironment, // Skip rate limiting in tests
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || "anonymous";
  },
});

// Auth endpoints rate limiter (prevent brute force)
export const authRateLimiter = rateLimit({
  store: createRedisStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    error: "Too many login attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnvironment, // Skip rate limiting in tests
});
