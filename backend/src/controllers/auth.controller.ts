import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import { getTokenService } from "../services/token.service";
import { logger } from "../utils/logger";
import { RegisterInput, LoginInput } from "../utils/validators";

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body as RegisterInput;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      // Generate token pair (access + refresh)
      const tokenService = getTokenService();
      const { accessToken, refreshToken } =
        await tokenService.generateTokenPair(user.id);

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        success: true,
        data: {
          user,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      logger.error("Registration failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as LoginInput;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Generate token pair (access + refresh)
      const tokenService = getTokenService();
      const { accessToken, refreshToken } =
        await tokenService.generateTokenPair(user.id);

      logger.info(`User logged in: ${user.email}`);

      // Remove passwordHash from response
      const { passwordHash: _unused, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      logger.error("Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: "Refresh token required" });
        return;
      }

      const tokenService = getTokenService();
      const tokens = await tokenService.refreshAccessToken(refreshToken);

      logger.info("Token refreshed successfully");

      res.json({
        success: true,
        data: {
          tokens,
        },
      });
    } catch (error) {
      logger.error("Token refresh failed:", error);

      // Handle JWT errors
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: "Invalid or expired refresh token" });
        return;
      }
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: "Invalid or expired refresh token" });
        return;
      }

      // Handle specific error messages
      if (error instanceof Error) {
        if (
          error.message.includes("revoked") ||
          error.message.includes("Invalid token type") ||
          error.message.includes("Invalid refresh token")
        ) {
          res.status(401).json({ error: "Invalid or expired refresh token" });
          return;
        }
      }

      res.status(500).json({ error: "Token refresh failed" });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const tokenService = getTokenService();
      await tokenService.revokeAllUserTokens(userId);

      logger.info(`User logged out: ${userId}`);

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Logout failed:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              documents: true,
              conversations: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error("Get user failed:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  }
}

export const authController = new AuthController();
