import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../config/database";
import { getTokenService } from "../services/token.service";
import { JwtPayload } from "../types";
import { logger } from "../utils/logger";

/**
 * Legacy function - kept for backward compatibility, use getTokenService() instead
 * @deprecated Use getTokenService().generateTokenPair() instead
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * Legacy function - kept for backward compatibility, use getTokenService() instead
 * @deprecated Use getTokenService().generateTokenPair() instead
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry as jwt.SignOptions["expiresIn"],
  });
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: () => void,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const token = authHeader.substring(7);
    const tokenService = getTokenService();
    const decoded = tokenService.verifyToken(token);

    // Ensure this is an access token, not a refresh token
    if (decoded.type !== "access") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name ?? undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    logger.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
