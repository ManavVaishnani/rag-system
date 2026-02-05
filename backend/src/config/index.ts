import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3001"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  GEMINI_API_KEY: z.string(),
  QDRANT_URL: z.string(),
  QDRANT_API_KEY: z.string(),
  QDRANT_COLLECTION_NAME: z.string().default("rag-documents"),
  MAX_FILE_SIZE: z.string().default("10485760"),
  UPLOAD_DIR: z.string().default("./uploads"),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join(".")).join(", ");
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}`,
      );
    }
    throw error;
  }
};

export const env = parseEnv();

export const config = {
  server: {
    port: parseInt(env.PORT, 10),
    nodeEnv: env.NODE_ENV,
    frontendUrl: env.FRONTEND_URL,
    corsOrigin: env.CORS_ORIGIN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY,
    embeddingModel: "text-embedding-004",
    llmModel: "gemini-2.5-flash",
  },
  qdrant: {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    collectionName: env.QDRANT_COLLECTION_NAME,
    vectorSize: 768,
  },
  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
    uploadDir: env.UPLOAD_DIR,
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    uploadMaxRequests: 10,
    uploadWindowMs: 60 * 60 * 1000, // 1 hour
  },
  cache: {
    queryTtl: 3600, // 1 hour
    semanticThreshold: 0.95,
  },
};
