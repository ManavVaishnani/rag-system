import jwt from "jsonwebtoken";
import { config } from "../config";
import { getRedisClient } from "../config/redis";
import { logger } from "../utils/logger";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  type: "access" | "refresh";
}

export class TokenService {
  private readonly redisKeyPrefix = "token:";
  private readonly blacklistPrefix = "blacklist:";

  /**
   * Generate both access and refresh tokens for a user
   */
  async generateTokenPair(userId: string): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Store refresh token in Redis
    await this.storeRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Generate a short-lived access token
   */
  private generateAccessToken(userId: string): string {
    const payload: TokenPayload = {
      userId,
      type: "access",
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Generate a long-lived refresh token
   */
  private generateRefreshToken(userId: string): string {
    const payload: TokenPayload = {
      userId,
      type: "refresh",
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiry as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const redis = getRedisClient();
    const key = `${this.redisKeyPrefix}${userId}`;

    // Parse expiry time from config (e.g., "7d" -> seconds)
    const expirySeconds = this.parseExpiryToSeconds(config.jwt.refreshExpiry);

    await redis.setex(key, expirySeconds, refreshToken);
    logger.debug(`Stored refresh token for user: ${userId}`);
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = this.verifyToken(refreshToken);

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new Error("Token has been revoked");
      }

      // Validate refresh token against stored value
      const isValid = await this.validateRefreshToken(
        payload.userId,
        refreshToken,
      );
      if (!isValid) {
        throw new Error("Invalid refresh token");
      }

      // Generate new token pair (rotate refresh token)
      const tokenPair = await this.generateTokenPair(payload.userId);

      // Blacklist old refresh token
      await this.blacklistToken(refreshToken, config.jwt.refreshExpiry);

      logger.info(`Refreshed tokens for user: ${payload.userId}`);
      return tokenPair;
    } catch (error) {
      logger.error("Token refresh failed:", error);
      throw error;
    }
  }

  /**
   * Validate refresh token against Redis stored value
   */
  private async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const redis = getRedisClient();
    const key = `${this.redisKeyPrefix}${userId}`;
    const storedToken = await redis.get(key);
    return storedToken === refreshToken;
  }

  /**
   * Revoke all tokens for a user (logout)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const redis = getRedisClient();
    const key = `${this.redisKeyPrefix}${userId}`;

    // Get current refresh token and blacklist it
    const currentToken = await redis.get(key);
    if (currentToken) {
      await this.blacklistToken(currentToken, config.jwt.refreshExpiry);
    }

    // Delete stored refresh token
    await redis.del(key);
    logger.info(`Revoked all tokens for user: ${userId}`);
  }

  /**
   * Blacklist a token
   */
  private async blacklistToken(
    token: string,
    expiryTime: string,
  ): Promise<void> {
    const redis = getRedisClient();
    const key = `${this.blacklistPrefix}${token}`;
    const expirySeconds = this.parseExpiryToSeconds(expiryTime);

    await redis.setex(key, expirySeconds, "1");
  }

  /**
   * Check if a token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `${this.blacklistPrefix}${token}`;
    const result = await redis.get(key);
    return result !== null;
  }

  /**
   * Parse expiry string (e.g., "7d", "15m", "1h") to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60; // Default 7 days
    }
  }
}

// Singleton instance
let tokenService: TokenService | null = null;
export function getTokenService(): TokenService {
  if (!tokenService) {
    tokenService = new TokenService();
  }
  return tokenService;
}
