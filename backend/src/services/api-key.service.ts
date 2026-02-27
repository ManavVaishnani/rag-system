import { prisma } from "../config/database";
import { encrypt, decrypt, maskApiKey } from "../utils/encryption";
import { logger } from "../utils/logger";

export interface ApiKeyResponse {
  id: string;
  provider: string;
  name: string | null;
  isActive: boolean;
  maskedKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export const apiKeyService = {
  /**
   * Add a new API key for a user.
   */
  async addKey(
    userId: string,
    apiKey: string,
    name?: string,
  ): Promise<ApiKeyResponse> {
    // Deactivate any existing active keys for this provider
    await prisma.userApiKey.updateMany({
      where: { userId, provider: "gemini", isActive: true },
      data: { isActive: false },
    });

    const encryptedKey = encrypt(apiKey);

    const created = await prisma.userApiKey.create({
      data: {
        userId,
        provider: "gemini",
        apiKey: encryptedKey,
        name: name || null,
        isActive: true,
      },
    });

    logger.info(`API key added for user ${userId}`);

    return {
      id: created.id,
      provider: created.provider,
      name: created.name,
      isActive: created.isActive,
      maskedKey: maskApiKey(apiKey),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  /**
   * List all API keys for a user (masked).
   */
  async listKeys(userId: string): Promise<ApiKeyResponse[]> {
    const keys = await prisma.userApiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return keys.map((key) => {
      let maskedKey = "****";
      try {
        const decrypted = decrypt(key.apiKey);
        maskedKey = maskApiKey(decrypted);
      } catch {
        logger.warn(`Failed to decrypt API key ${key.id}`);
      }

      return {
        id: key.id,
        provider: key.provider,
        name: key.name,
        isActive: key.isActive,
        maskedKey,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      };
    });
  },

  /**
   * Update an API key (name, isActive, or the key itself).
   */
  async updateKey(
    userId: string,
    keyId: string,
    updates: { apiKey?: string; name?: string; isActive?: boolean },
  ): Promise<ApiKeyResponse | null> {
    // Verify ownership
    const existing = await prisma.userApiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!existing) {
      return null;
    }

    const data: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      data.name = updates.name;
    }

    if (updates.isActive !== undefined) {
      data.isActive = updates.isActive;

      // If activating this key, deactivate others
      if (updates.isActive) {
        await prisma.userApiKey.updateMany({
          where: { userId, provider: "gemini", isActive: true, id: { not: keyId } },
          data: { isActive: false },
        });
      }
    }

    if (updates.apiKey) {
      data.apiKey = encrypt(updates.apiKey);
    }

    const updated = await prisma.userApiKey.update({
      where: { id: keyId },
      data,
    });

    let maskedKey = "****";
    try {
      const decrypted = decrypt(updated.apiKey);
      maskedKey = maskApiKey(decrypted);
    } catch {
      logger.warn(`Failed to decrypt API key ${updated.id}`);
    }

    logger.info(`API key ${keyId} updated for user ${userId}`);

    return {
      id: updated.id,
      provider: updated.provider,
      name: updated.name,
      isActive: updated.isActive,
      maskedKey,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },

  /**
   * Delete an API key.
   */
  async deleteKey(userId: string, keyId: string): Promise<boolean> {
    const existing = await prisma.userApiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!existing) {
      return false;
    }

    await prisma.userApiKey.delete({ where: { id: keyId } });
    logger.info(`API key ${keyId} deleted for user ${userId}`);
    return true;
  },

  /**
   * Get the active decrypted API key for a user, or null if none.
   */
  async getActiveKey(userId: string): Promise<string | null> {
    const key = await prisma.userApiKey.findFirst({
      where: { userId, provider: "gemini", isActive: true },
    });

    if (!key) {
      return null;
    }

    try {
      return decrypt(key.apiKey);
    } catch {
      logger.error(`Failed to decrypt active API key for user ${userId}`);
      return null;
    }
  },

  /**
   * Check if a user has an active BYOK key.
   */
  async hasByok(userId: string): Promise<boolean> {
    const count = await prisma.userApiKey.count({
      where: { userId, provider: "gemini", isActive: true },
    });
    return count > 0;
  },
};
