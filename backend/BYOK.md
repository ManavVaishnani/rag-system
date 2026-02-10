# Bring Your Own API Key (BYOK) Implementation Plan

## Overview

This document outlines the implementation of:

1. **BYOK Feature**: Users can add their own Gemini API keys
2. **Daily Credit Limit**: Free users have a daily query limit when using system API key

## Key Features

- ✅ Allow users to add custom Gemini API keys (BYOK)
- ✅ Daily credit limit for free users using system API (e.g., 100 queries/day)
- ✅ BYOK users don't consume credits (they bring their own resources)
- ✅ System-managed embeddings (no user control, simpler implementation)
- ✅ Simple master-key encryption for API key storage
- ✅ Available to all authenticated users (premium gating can be added later)
- ✅ Automatic daily credit reset at midnight UTC

## Architecture

### Data Flow

```
1. User adds API key → Encrypt with master key → Store in database
2. User makes query → Check for user's active API key
   ├── If BYOK active → Use user's key (no credit check)
   └── If system key → Check credits → Use system key → Consume credit
3. Return response
```

### Credit System Logic

```
Before Query:
  ├─ User has active BYOK? → YES → Skip credit check
  │                         → NO  → Check daily credits
  │                                      ├─ Credits > 0? → YES → Process query → Decrement credit
  │                                      └─ Credits = 0? → NO  → Return 429 (Too Many Requests)
```

### Security Model

- **Encryption**: AES-256-GCM with master key
- **Storage**: Encrypted at rest in PostgreSQL
- **Transmission**: Never return full API keys in API responses (masked)
- **Fallback**: System API key used if user has no custom key

## Database Schema

### New Model: UserApiKey

```prisma
model UserApiKey {
  id        String   @id @default(uuid())
  userId    String
  provider  String   // "gemini" for now
  apiKey    String   // encrypted
  name      String?  // optional label (e.g., "My Production Key")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### Updated User Model (with Credits)

```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  passwordHash      String
  name              String?
  dailyCreditsUsed  Int      @default(0)     // Credits used today
  creditsResetAt    DateTime @default(now()) // When to reset credits
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  apiKeys           UserApiKey[]
  documents         Document[]
  conversations     Conversation[]

  @@index([creditsResetAt])
}
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Encryption key for API key storage (32+ characters)
ENCRYPTION_KEY=your-super-secret-32-char-encryption-key

# Daily credit limit for free users (default: 100)
DAILY_CREDIT_LIMIT=100
```

### Config Schema

```typescript
encryption: {
  key: string; // 32+ characters
}
credits: {
  dailyLimit: number; // default: 100
}
```

## API Endpoints

### BYOK Endpoints

#### 1. Add API Key

```http
POST /api/user/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "apiKey": "your-gemini-api-key",
  "name": "Production Key" // optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider": "gemini",
    "name": "Production Key",
    "isActive": true,
    "createdAt": "2026-02-10T12:00:00Z",
    "maskedKey": "****-xxxx-1234"
  }
}
```

#### 2. List API Keys

```http
GET /api/user/api-keys
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "gemini",
      "name": "Production Key",
      "isActive": true,
      "createdAt": "2026-02-10T12:00:00Z",
      "maskedKey": "****-xxxx-1234"
    }
  ]
}
```

#### 3. Update API Key

```http
PATCH /api/user/api-keys/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "apiKey": "new-api-key",    // optional
  "name": "Updated Name",      // optional
  "isActive": false            // optional
}
```

#### 4. Delete API Key

```http
DELETE /api/user/api-keys/:id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "API key deleted"
  }
}
```

### Credit Endpoints

#### 5. Get Credit Status

```http
GET /api/user/credits
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "dailyLimit": 100,
    "used": 45,
    "remaining": 55,
    "resetsAt": "2026-02-11T00:00:00Z",
    "hasByok": true, // Whether user has active BYOK
    "usingCredits": false // If BYOK active, not using credits
  }
}
```

## Implementation Steps

### Phase 1: Database & Configuration

1. **Update Prisma Schema**
   - Add `UserApiKey` model
   - Add credit fields to `User` model:
     - `dailyCreditsUsed: Int @default(0)`
     - `creditsResetAt: DateTime @default(now())`
   - Update `User` model with `apiKeys` relation
   - Generate migration

2. **Update Configuration**
   - Add `ENCRYPTION_KEY` to config schema
   - Add `DAILY_CREDIT_LIMIT` to config schema
   - Add validation with Zod
   - Update `.env.example`

### Phase 2: Encryption Utility

Create `src/utils/encryption.ts`:

```typescript
import crypto from "crypto";
import { config } from "../config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  // Implementation using AES-256-GCM
  // Returns: iv:authTag:encrypted (base64)
}

export function decrypt(encrypted: string): string {
  // Implementation using AES-256-GCM
  // Parses: iv:authTag:encrypted (base64)
}
```

### Phase 3: Credit Service

Create `src/services/credit.service.ts`:

```typescript
import { prisma } from "../config/database";
import { config } from "../config";

export class CreditService {
  async checkAndConsumeCredit(userId: string): Promise<boolean> {
    // Check if user has BYOK
    const userApiKey = await prisma.userApiKey.findFirst({
      where: { userId, isActive: true },
    });

    // If user has BYOK, don't consume credits
    if (userApiKey) {
      return true;
    }

    // Check and reset credits if needed
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    const now = new Date();
    const resetTime = new Date(user.creditsResetAt);
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    resetTime.setUTCHours(0, 0, 0, 0);

    // Reset if past midnight UTC
    if (now >= resetTime) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyCreditsUsed: 0,
          creditsResetAt: now,
        },
      });
      user.dailyCreditsUsed = 0;
    }

    // Check if credits available
    if (user.dailyCreditsUsed >= config.credits.dailyLimit) {
      return false;
    }

    // Consume credit
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyCreditsUsed: {
          increment: 1,
        },
      },
    });

    return true;
  }

  async getCreditStatus(userId: string): Promise<CreditStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        apiKeys: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if reset needed
    const now = new Date();
    const resetTime = new Date(user.creditsResetAt);
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    resetTime.setUTCHours(0, 0, 0, 0);

    let creditsUsed = user.dailyCreditsUsed;
    if (now >= resetTime) {
      creditsUsed = 0;
    }

    const hasByok = user.apiKeys.length > 0;

    return {
      dailyLimit: config.credits.dailyLimit,
      used: creditsUsed,
      remaining: Math.max(0, config.credits.dailyLimit - creditsUsed),
      resetsAt: resetTime.toISOString(),
      hasByok,
      usingCredits: !hasByok,
    };
  }
}

export interface CreditStatus {
  dailyLimit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  hasByok: boolean;
  usingCredits: boolean;
}

// Singleton
let creditService: CreditService | null = null;
export function getCreditService(): CreditService {
  if (!creditService) {
    creditService = new CreditService();
  }
  return creditService;
}
```

### Phase 4: Service Layer Updates

#### Update LLMService

```typescript
export class LLMService {
  private client: GoogleGenAI;
  private model: string;
  private circuitBreaker: CircuitBreaker;

  constructor(apiKey?: string) {
    const key = apiKey || config.gemini.apiKey;
    this.client = new GoogleGenAI({ apiKey: key });
    // ... rest of initialization
  }
}

// Modify singleton to support user-specific instances
const serviceInstances = new Map<string, LLMService>();

export function getLLMService(apiKey?: string): LLMService {
  const key = apiKey || "default";
  if (!serviceInstances.has(key)) {
    serviceInstances.set(key, new LLMService(apiKey));
  }
  return serviceInstances.get(key)!;
}
```

**Note**: Keep embeddings service unchanged (system-managed)

### Phase 5: Controller Implementation

#### BYOK Controller

Create `src/controllers/user-api-key.controller.ts`:

```typescript
export class UserApiKeyController {
  async create(req: Request, res: Response): Promise<void> {
    // Validate request
    // Validate API key format (AIza...)
    // Test API key with Gemini (optional but recommended)
    // Encrypt API key
    // Store in database
    // Deactivate other keys if only one allowed
    // Return masked key
  }

  async list(req: Request, res: Response): Promise<void> {
    // Fetch user's API keys
    // Mask keys before returning
  }

  async update(req: Request, res: Response): Promise<void> {
    // Validate ownership
    // Update fields
    // Re-encrypt if API key changed
  }

  async delete(req: Request, res: Response): Promise<void> {
    // Validate ownership
    // Delete from database
  }
}
```

#### Credit Controller

Create `src/controllers/credit.controller.ts`:

```typescript
import { Request, Response } from "express";
import { getCreditService } from "../services/credit.service";

export class CreditController {
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const status = await getCreditService().getCreditStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get credit status",
      });
    }
  }
}
```

### Phase 6: Routes & Validation

#### BYOK Routes

Create `src/routes/user-api-key.routes.ts`:

```typescript
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { UserApiKeyController } from "../controllers/user-api-key.controller";
import { createApiKeySchema, updateApiKeySchema } from "../utils/validators";

const router = Router();
const controller = new UserApiKeyController();

router.post(
  "/",
  authenticate,
  validate(createApiKeySchema),
  controller.create.bind(controller),
);

router.get("/", authenticate, controller.list.bind(controller));

router.patch(
  "/:id",
  authenticate,
  validate(updateApiKeySchema),
  controller.update.bind(controller),
);

router.delete("/:id", authenticate, controller.delete.bind(controller));

export default router;
```

#### Credit Routes

Create `src/routes/credit.routes.ts`:

```typescript
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { CreditController } from "../controllers/credit.controller";

const router = Router();
const controller = new CreditController();

router.get("/", authenticate, controller.getStatus.bind(controller));

export default router;
```

### Phase 7: Integration

#### Update Query Controller

Update `src/controllers/query.controller.ts`:

```typescript
import { getCreditService } from "../services/credit.service";
import { decrypt } from "../utils/encryption";

async function query(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user.id;

    // Check credits first
    const hasCredits = await getCreditService().checkAndConsumeCredit(userId);
    if (!hasCredits) {
      res.status(429).json({
        error: "Daily credit limit exceeded. Add your own API key for unlimited queries.",
        code: "CREDIT_LIMIT_EXCEEDED",
        data: {
          dailyLimit: config.credits.dailyLimit,
          resetsAt: // calculate reset time
        }
      });
      return;
    }

    // Check if user has custom API key
    const userApiKey = await prisma.userApiKey.findFirst({
      where: { userId, isActive: true }
    });

    let apiKey: string | undefined;
    if (userApiKey) {
      apiKey = decrypt(userApiKey.apiKey);
    }

    // Use user's key if available, otherwise system default
    const llmService = getLLMService(apiKey);

    // ... rest of query logic
  } catch (error) {
    // Handle errors
  }
}
```

#### Update App.ts

Update `src/app.ts`:

```typescript
import userApiKeyRoutes from "./routes/user-api-key.routes";
import creditRoutes from "./routes/credit.routes";

// ... existing routes ...
app.use("/api/user/api-keys", userApiKeyRoutes);
app.use("/api/user/credits", creditRoutes);
```

## Security Considerations

1. **Encryption Key Management**
   - Store `ENCRYPTION_KEY` in secure environment
   - Rotate keys periodically (requires re-encryption)
   - Never commit encryption key to repository

2. **API Key Masking**
   - Always mask keys in API responses
   - Show only first 4 and last 4 characters
   - Example: `AIza-****-****-1234`

3. **Validation**
   - Validate API key format before storing
   - Test key with Gemini API before saving
   - Provide clear error messages for invalid keys

4. **Rate Limiting**
   - Apply rate limits to API key management endpoints
   - Prevent abuse of key creation/deletion

5. **Credit System Security**
   - Atomic credit consumption (check + decrement)
   - Prevent race conditions with database transactions
   - Log credit usage for audit trails

## Error Handling

### Credit Limit Exceeded

```json
{
  "error": "Daily credit limit exceeded. Add your own API key for unlimited queries.",
  "code": "CREDIT_LIMIT_EXCEEDED",
  "data": {
    "dailyLimit": 100,
    "used": 100,
    "remaining": 0,
    "resetsAt": "2026-02-11T00:00:00Z"
  }
}
```

### API Key Errors

```json
{
  "error": "Invalid API key format. Must start with 'AIza' and be 39 characters.",
  "code": "INVALID_API_KEY_FORMAT"
}
```

```json
{
  "error": "API key validation failed. Please check your key and try again.",
  "code": "INVALID_API_KEY"
}
```

## Testing Strategy

### Unit Tests

1. **Credit Service**
   - Test credit consumption
   - Test daily reset logic
   - Test BYOK bypass
   - Test race conditions

2. **Encryption Utility**
   - Test encrypt/decrypt roundtrip
   - Test with various input sizes
   - Test error handling

3. **API Key Controller**
   - Test CRUD operations
   - Test authorization
   - Test input validation

### Integration Tests

1. **Credit Flow**
   - Query without BYOK → Credit consumed
   - Query with BYOK → No credit consumed
   - Daily limit reached → 429 error
   - After midnight → Credits reset

2. **End-to-end BYOK flow**
   - Add API key → Make query → Verify custom key used
   - Delete API key → Make query → Verify system key used
   - Credit limit not applied with BYOK

3. **Error scenarios**
   - Invalid API key format
   - Expired/revoked API key
   - Credit limit exceeded
   - Encryption/decryption failures

## Deployment Checklist

- [ ] Generate secure 32+ character `ENCRYPTION_KEY`
- [ ] Set `DAILY_CREDIT_LIMIT` (default: 100)
- [ ] Add environment variables to production
- [ ] Run database migrations
- [ ] Update API documentation
- [ ] Test on staging environment
- [ ] Monitor credit consumption after deployment

## Migration Guide

### For Existing Users

- No action required
- System continues to work with default API key
- Users get daily credit limit automatically
- Users can add BYOK anytime for unlimited queries

### For Developers

1. Add `ENCRYPTION_KEY` to local `.env`
2. Set `DAILY_CREDIT_LIMIT` if different from default
3. Run `npm run prisma:migrate`
4. Test new endpoints

## API Key Format Validation

Gemini API keys typically follow this pattern:

- Start with `AIza`
- 39 characters total
- Alphanumeric characters

Example: `AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9`

## Success Metrics

- Number of users adding custom API keys
- Query success rate with custom vs system keys
- Average queries per free user per day
- Conversion rate from free to BYOK
- Support tickets related to API keys or credits

## Future Enhancements

### Phase 2: Advanced Encryption

- **Password-derived keys**: Encrypt with key derived from user's password
- **Key rotation**: Automatic rotation of encryption keys
- **Hardware security modules**: HSM integration for enterprise

### Phase 3: Multi-Provider Support

- Support OpenAI, Anthropic, Cohere, etc.
- Provider abstraction layer
- Per-conversation provider selection

### Phase 4: Premium Gating

- Add subscription tier field to User model
- Gate BYOK feature behind premium subscription
- Usage tracking and billing integration
- Custom credit limits per tier

### Phase 5: User Embeddings

- Allow custom embedding models
- Separate vector collections per user
- Handle model switching (re-indexing strategy)

### Phase 6: Credit System Improvements

- Per-feature credit costs (e.g., embeddings cost more)
- Credit rollover (unused credits carry over)
- Credit gifting/sharing between users
- Admin credit adjustment panel

---

**Last Updated**: 2026-02-10
**Status**: Ready for Implementation
**Priority**: High
