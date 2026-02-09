# Security Hardening Implementation Plan

## Executive Summary

This document outlines the security hardening plan for the RAG System Backend based on a comprehensive security assessment. Current security rating: **7.5/10** - Good fundamentals with room for improvement.

**Last Updated:** 2026-02-09  
**Assessment Date:** 2026-02-09  
**Risk Level:** Medium

---

## Table of Contents

1. [Security Assessment Summary](#security-assessment-summary)
2. [Phase 1: Critical Security Fixes](#phase-1-critical-security-fixes-must-do-before-production)
3. [Phase 2: Important Security Improvements](#phase-2-important-security-improvements)
4. [Phase 3: Enhanced Security Features](#phase-3-enhanced-security-features)
5. [Phase 4: Security Monitoring & Audit](#phase-4-security-monitoring--audit)
6. [Implementation Timeline](#implementation-timeline)
7. [Security Checklist](#security-checklist)
8. [Security Testing Tools](#security-testing-tools)

---

## Security Assessment Summary

### Current Strengths

- ✅ **SQL Injection Protection**: Prisma ORM used consistently with parameterized queries
- ✅ **Authentication**: JWT with refresh tokens, bcrypt password hashing
- ✅ **Input Validation**: Zod schemas for request validation
- ✅ **Rate Limiting**: Redis-backed rate limiting implemented
- ✅ **Security Headers**: Helmet middleware enabled
- ✅ **Request Timeouts**: Proper timeout middleware configured
- ✅ **CORS**: Restricted to specific origins
- ✅ **File Uploads**: MIME type whitelist, size limits, UUID filenames

### Identified Vulnerabilities

| Severity   | Issue                                          | Location                 |
| ---------- | ---------------------------------------------- | ------------------------ |
| **High**   | Document ID parameters lack UUID validation    | `document.controller.ts` |
| **High**   | Rate limiter may not apply correctly           | `app.ts` routing order   |
| **High**   | File type validation can be bypassed           | `document.routes.ts`     |
| **Medium** | pdf-parse dependency has known vulnerabilities | `package.json`           |
| **Medium** | bcrypt cost factor is minimum (10)             | `auth.controller.ts`     |
| **Medium** | Access tokens cannot be revoked immediately    | `auth.middleware.ts`     |
| **Medium** | No HTTPS/HSTS enforcement                      | `app.ts`                 |
| **Low**    | CORS origin not validated as URL               | `config/index.ts`        |
| **Low**    | No upload quotas per user                      | `document.controller.ts` |

---

## Phase 1: Critical Security Fixes (Must Do Before Production)

### 1.1 Input Validation Hardening

**Issue:** Document ID parameters lack UUID validation, pagination accepts negative values

**Risk:** Path traversal, injection attacks

**Implementation:**

```typescript
// Add to src/utils/validators.ts
export const uuidParamSchema = z.string().uuid();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
```

**Files to Modify:**

- `src/utils/validators.ts` - Add new schemas
- `src/controllers/document.controller.ts` - Validate document ID params
- `src/controllers/conversation.controller.ts` - Validate conversation ID params
- `src/controllers/vector.controller.ts` - Validate vector ID params

**Example Usage:**

```typescript
// In document.controller.ts
import { uuidParamSchema } from "../utils/validators";

async getStatus(req: Request, res: Response): Promise<void> {
  const id = uuidParamSchema.parse(req.params.id);
  // ... rest of code
}
```

**Testing:**

- Test with invalid UUID: `GET /api/documents/invalid-id` should return 400
- Test with SQL injection attempt: `GET /api/documents/1' OR '1'='1` should return 400

---

### 1.2 Fix Rate Limiting Application Order

**Issue:** Rate limiter may not apply correctly due to Express routing order

**Risk:** Endpoints may not be rate limited as intended

**Current Code (Vulnerable):**

```typescript
// src/app.ts - Lines 81-88
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/query", queryRoutes);
// ... other routes

// Rate limiter applied AFTER routes
app.use("/api", apiRateLimiter);
```

**Solution (Option A - Recommended):** Apply to each route file

```typescript
// In src/routes/auth.routes.ts
import { authRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();
router.use(authRateLimiter); // Apply at the top

// Then define routes...
router.post("/register", ...);
```

**Solution (Option B):** Reorder in app.ts

```typescript
// src/app.ts
// Apply rate limiting BEFORE route definitions
app.use("/api", apiRateLimiter);

// Then mount routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
// ... other routes
```

**Testing:**

```bash
# Test rate limiting
for i in {1..105}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/health; done
# Should see 429 after 100 requests
```

---

### 1.3 File Upload Security Enhancement

**Issue:** MIME type validation can be bypassed (client can spoof mime types)

**Risk:** Upload of malicious files

**Implementation:**

```bash
npm install file-type
```

```typescript
// In src/services/document-parser.service.ts
import { fileTypeFromFile } from "file-type";

export class DocumentParserService {
  async validateFileType(filePath: string): Promise<boolean> {
    const type = await fileTypeFromFile(filePath);

    if (!type) {
      return false;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];

    return allowedTypes.includes(type.mime);
  }

  async parseDocument(filePath: string, mimeType: string): Promise<string> {
    // Validate actual file type before processing
    const isValidType = await this.validateFileType(filePath);
    if (!isValidType) {
      throw new Error("File type validation failed");
    }

    // Continue with parsing...
  }
}
```

**Testing:**

- Upload file with spoofed MIME type: `curl -F "file=@malware.exe;type=application/pdf"`
- Should be rejected even though MIME type claims to be PDF

---

### 1.4 Increase Password Hashing Strength

**Issue:** bcrypt cost factor of 10 is minimum, should be 12+ for modern hardware

**Risk:** Faster password cracking if database is compromised

**Current Code:**

```typescript
// src/controllers/auth.controller.ts line 25
const passwordHash = await bcrypt.hash(password, 10);
```

**Fixed Code:**

```typescript
// src/controllers/auth.controller.ts line 25
const passwordHash = await bcrypt.hash(password, 12);
```

**Performance Impact:**

- Cost factor 10: ~100ms per hash
- Cost factor 12: ~400ms per hash (acceptable for auth)

**Note:** This only affects NEW passwords. Existing passwords will be re-hashed on next login if you implement automatic rehashing.

---

### 1.5 Access Token Blacklist Implementation

**Issue:** Access tokens cannot be revoked immediately (15-minute window)

**Risk:** If account is compromised, attacker has access for 15 minutes minimum

**Implementation:**

```typescript
// src/services/token.service.ts
async generateTokenPair(userId: string): Promise<TokenPair> {
  const tokenId = uuidv4(); // Add unique token ID

  const accessToken = jwt.sign(
    { userId, type: "access", jti: tokenId },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );

  // Store token metadata in Redis for revocation
  await redis.setex(
    `token:${tokenId}`,
    15 * 60, // 15 minutes
    JSON.stringify({ userId, createdAt: Date.now() })
  );

  // ... rest of token generation
}

async revokeToken(tokenId: string): Promise<void> {
  await redis.setex(`blacklist:token:${tokenId}`, 15 * 60, "revoked");
}
```

```typescript
// src/middleware/auth.middleware.ts
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check if token is blacklisted
    if (decoded.jti) {
      const isBlacklisted = await redis.get(`blacklist:token:${decoded.jti}`);
      if (isBlacklisted) {
        return res.status(401).json({ error: "Token revoked" });
      }
    }

    // ... rest of middleware
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
```

**Testing:**

1. Login and get access token
2. Call logout endpoint
3. Try to use access token within 15 minutes
4. Should return 401 "Token revoked"

---

## Phase 2: Important Security Improvements

### 2.1 HTTPS Enforcement (Production)

**Issue:** No HSTS headers, HTTPS not enforced

**Implementation:**

```typescript
// src/app.ts
import helmet from "helmet";

// After existing helmet setup
if (config.server.nodeEnv === "production") {
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    }),
  );
}
```

**Additional: Force HTTPS redirect**

```typescript
// src/app.ts
if (config.server.nodeEnv === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}
```

**Note:** Requires reverse proxy (Nginx/Traefik) to set `x-forwarded-proto` header

---

### 2.2 CORS URL Validation

**Issue:** CORS_ORIGIN accepts any string without URL validation

**Implementation:**

```typescript
// src/config/index.ts
const envSchema = z.object({
  // ... other fields
  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
  // ... rest of schema
});
```

**Migration:**

- Existing `.env` files with invalid URLs will fail validation
- Update deployment scripts to ensure valid URLs

---

### 2.3 Upload Quotas Per User

**Issue:** Users can upload unlimited documents

**Implementation:**

```typescript
// src/config/index.ts
export const config = {
  // ... other config
  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
    uploadDir: env.UPLOAD_DIR,
    allowedMimeTypes: [...],
    maxDocumentsPerUser: 100,
    maxTotalSizePerUser: 100 * 1024 * 1024, // 100MB
  },
};
```

```typescript
// src/controllers/document.controller.ts
async upload(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  // Check document count quota
  const userDocCount = await prisma.document.count({ where: { userId } });
  if (userDocCount >= config.upload.maxDocumentsPerUser) {
    res.status(429).json({
      error: "Upload quota exceeded",
      message: `Maximum ${config.upload.maxDocumentsPerUser} documents allowed`,
    });
    return;
  }

  // Check total storage quota
  const userDocs = await prisma.document.findMany({
    where: { userId },
    select: { fileSize: true },
  });
  const totalSize = userDocs.reduce((sum, doc) => sum + doc.fileSize, 0);

  if (totalSize + req.file!.size > config.upload.maxTotalSizePerUser) {
    res.status(429).json({
      error: "Storage quota exceeded",
      message: `Maximum ${config.upload.maxTotalSizePerUser / 1024 / 1024}MB storage allowed`,
    });
    return;
  }

  // Continue with upload...
}
```

---

### 2.4 Environment Variable Hardening

**Issue:** Sensitive variables may use default/placeholder values

**Implementation:**

```typescript
// src/config/index.ts
const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);

    // Additional security checks
    if (parsed.NODE_ENV === "production") {
      // Ensure JWT_SECRET is not the default
      if (parsed.JWT_SECRET.includes("change-this")) {
        throw new Error(
          "JWT_SECRET must be changed from default in production",
        );
      }

      // Ensure database URL uses SSL
      if (!parsed.DATABASE_URL.includes("sslmode=require")) {
        logger.warn("DATABASE_URL should use SSL in production");
      }
    }

    return parsed;
  } catch (error) {
    // ... existing error handling
  }
};
```

---

## Phase 3: Enhanced Security Features

### 3.1 Replace pdf-parse Dependency

**Issue:** pdf-parse@1.1.1 has known vulnerabilities and is unmaintained

**Options:**

**Option A: pdf2json (Recommended)**

```bash
npm uninstall pdf-parse
npm install pdf2json
```

```typescript
// src/services/document-parser.service.ts
import PDFParser from "pdf2json";

async parsePDF(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      resolve(pdfParser.getRawTextContent());
    });

    pdfParser.loadPDF(filePath);
  });
}
```

**Option B: pdfjs-dist (Mozilla PDF.js)**

```bash
npm install pdfjs-dist
```

**Testing:**

- Test with various PDF types (text-based, scanned, encrypted)
- Ensure performance is acceptable
- Verify text extraction accuracy

---

### 3.2 Progressive Rate Limiting

**Issue:** No escalating penalties for repeated violations

**Implementation:**

```typescript
// src/middleware/rate-limit.middleware.ts
import { getRedisClient } from "../config/redis";

const abuseTracker = new Map<string, number>();

export function createProgressiveRateLimiter(
  baseWindowMs: number,
  maxRequests: number,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.user?.userId || req.ip;
    const violations = abuseTracker.get(identifier) || 0;

    // Calculate penalty window based on violations
    let windowMs = baseWindowMs;
    if (violations > 10) windowMs = baseWindowMs * 8;
    else if (violations > 5) windowMs = baseWindowMs * 4;
    else if (violations > 3) windowMs = baseWindowMs * 2;

    // Apply rate limiting with adjusted window
    // ... rate limit logic

    // Track violations
    if (res.statusCode === 429) {
      abuseTracker.set(identifier, violations + 1);
    }

    next();
  };
}
```

---

### 3.3 Security Headers Customization

**Issue:** Default helmet configuration may need customization for API use

**Implementation:**

```typescript
// src/app.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for Swagger UI compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);
```

---

### 3.4 Database Connection Security

**Implementation:**

```typescript
// src/config/database.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  // Query timeout
  queryTimeout: 30000, // 30 seconds
  // Connection pooling (managed by Prisma)
  // Log slow queries in development
  log:
    config.server.nodeEnv === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

// Ensure SSL in production
if (config.server.nodeEnv === "production") {
  if (!config.database.url.includes("sslmode=require")) {
    logger.error("Database connection must use SSL in production");
    process.exit(1);
  }
}
```

---

### 3.5 JWT Secret Rotation Support

**Implementation:**

```typescript
// src/services/token.service.ts
const jwtKeys = [
  { id: "2024-02", key: config.jwt.secret, primary: true },
  { id: "2024-01", key: process.env.JWT_SECRET_OLD }, // For validating old tokens
];

export function verifyToken(token: string): JwtPayload {
  let lastError: Error | null = null;

  // Try each key (newest first)
  for (const key of jwtKeys.filter((k) => k.primary || k.key)) {
    try {
      const decoded = jwt.verify(token, key.key) as JwtPayload;

      // If token was signed with old key, consider reissuing
      if (key.id !== jwtKeys.find((k) => k.primary)?.id) {
        decoded._needsReissue = true;
      }

      return decoded;
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error("Invalid token");
}
```

---

## Phase 4: Security Monitoring & Audit

### 4.1 Security Event Logging

**Implementation:**

```typescript
// src/utils/security-logger.ts
import { logger } from "./logger";

export interface SecurityEvent {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  ip: string;
  userId?: string;
  endpoint: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export function logSecurityEvent(
  event: Omit<SecurityEvent, "timestamp">,
): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const logMethod =
    event.severity === "critical"
      ? logger.error
      : event.severity === "high"
        ? logger.warn
        : logger.info;

  logMethod("Security event", fullEvent);
}

// Usage examples:
logSecurityEvent({
  type: "authentication_failure",
  severity: "medium",
  ip: req.ip,
  endpoint: req.path,
  details: { reason: "invalid_password", email: req.body.email },
});

logSecurityEvent({
  type: "rate_limit_exceeded",
  severity: "low",
  ip: req.ip,
  userId: req.user?.userId,
  endpoint: req.path,
  details: { limit: 100, window: "15m" },
});
```

**Events to Log:**

- Failed authentication attempts
- Rate limit violations
- Authorization failures (accessing other users' data)
- File upload failures
- Token validation failures
- SQL injection attempts (blocked by validation)
- Unusual API usage patterns

---

### 4.2 Request Sanitization Middleware

**Implementation:**

```typescript
// src/middleware/sanitization.middleware.ts
import { Request, Response, NextFunction } from "express";

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

function sanitizeString(value: string): string {
  let sanitized = value;

  // Remove potential SQL injection
  SQL_INJECTION_PATTERNS.forEach((pattern) => {
    if (pattern.test(sanitized)) {
      logSecurityEvent({
        type: "suspicious_input",
        severity: "medium",
        ip: "system",
        endpoint: "sanitization",
        details: { pattern: pattern.toString(), value: value.slice(0, 100) },
      });
      sanitized = sanitized.replace(pattern, "");
    }
  });

  // Remove potential XSS
  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  return sanitized;
}

function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

export function sanitizationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params) as Record<string, string>;
  next();
}
```

---

### 4.3 Security Headers Testing

**Implementation:**

```typescript
// src/test/security.test.ts
import request from "supertest";
import app from "../app";

describe("Security Headers", () => {
  it("should include security headers", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-xss-protection"]).toBe("0");
    expect(res.headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("should not expose server information", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("Input Validation", () => {
  it("should reject SQL injection attempts", async () => {
    const res = await request(app)
      .get("/api/documents/1' OR '1'='1")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(400);
  });

  it("should reject XSS attempts", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ title: "<script>alert('xss')</script>" });

    // Should either sanitize or reject
    expect([200, 400]).toContain(res.status);
  });
});
```

---

## Implementation Timeline

### Week 1: Critical Security Fixes (Phase 1)

- [ ] Day 1-2: Input validation for all parameters
- [ ] Day 2-3: Fix rate limiting order
- [ ] Day 3-4: File upload security (magic numbers)
- [ ] Day 4: Increase bcrypt cost factor
- [ ] Day 5: Access token blacklisting
- **Testing:** Run security test suite

### Week 2: Important Improvements (Phase 2)

- [ ] Day 1: HTTPS/HSTS enforcement
- [ ] Day 2: CORS URL validation
- [ ] Day 3: Upload quotas
- [ ] Day 4: Environment hardening
- [ ] Day 5: Documentation updates
- **Testing:** Staging environment deployment

### Week 3: Enhanced Security (Phase 3)

- [ ] Day 1-2: Replace pdf-parse dependency
- [ ] Day 3: Progressive rate limiting
- [ ] Day 4: Security headers customization
- [ ] Day 5: Database hardening
- **Testing:** Penetration testing

### Week 4: Monitoring & Audit (Phase 4)

- [ ] Day 1-2: Security event logging
- [ ] Day 3: Request sanitization
- [ ] Day 4: Security testing & fixes
- [ ] Day 5: Final security review
- **Testing:** Full security audit

---

## Security Checklist

Before going to production, ensure:

### Authentication & Authorization

- [ ] All passwords hashed with bcrypt cost ≥ 12
- [ ] JWT secrets are cryptographically random (≥ 64 chars)
- [ ] Access tokens can be revoked immediately
- [ ] Refresh tokens stored securely in Redis
- [ ] Token expiration times appropriate (access: 15min, refresh: 7days)
- [ ] All endpoints require authentication except public ones
- [ ] Users can only access their own data (authorization checks)

### Input Validation

- [ ] All user inputs validated with Zod schemas
- [ ] UUID parameters validated before database queries
- [ ] File uploads validated with magic numbers
- [ ] Pagination parameters bounded (page > 0, limit ≤ 100)
- [ ] Request size limits enforced
- [ ] Content-Type headers validated

### Rate Limiting

- [ ] Rate limiting applied to all API endpoints
- [ ] Different limits for different endpoint types
- [ ] Redis-backed for distributed deployments
- [ ] Rate limit headers returned to clients
- [ ] Progressive penalties for abuse

### File Upload Security

- [ ] File type validation (MIME + magic numbers)
- [ ] File size limits enforced
- [ ] Files stored outside web root
- [ ] UUID-based filenames (no original names)
- [ ] Virus scanning (ClamAV or cloud service)
- [ ] Upload quotas per user
- [ ] Temporary files cleaned up after processing

### Network Security

- [ ] HTTPS enforced in production
- [ ] HSTS headers enabled
- [ ] CORS restricted to specific origins
- [ ] Security headers (Helmet) configured
- [ ] Reverse proxy configured (Nginx/Traefik)
- [ ] Firewall rules restricting direct backend access

### Database Security

- [ ] Prisma ORM used (no raw SQL)
- [ ] SSL connections enforced in production
- [ ] Connection pooling configured
- [ ] Query timeouts set
- [ ] No sensitive data logged

### Error Handling

- [ ] Stack traces disabled in production
- [ ] Generic error messages returned to clients
- [ ] Detailed errors logged internally
- [ ] No sensitive data in error responses

### Dependencies

- [ ] `npm audit` shows 0 critical vulnerabilities
- [ ] pdf-parse replaced with secure alternative
- [ ] All dependencies up to date
- [ ] Snyk or similar monitoring enabled

### Environment & Secrets

- [ ] No default secrets in production
- [ ] Environment variables validated at startup
- [ ] Secrets not committed to version control
- [ ] JWT secret rotated recently
- [ ] Database credentials use least privilege principle

### Monitoring & Logging

- [ ] Security events logged
- [ ] Failed authentication attempts tracked
- [ ] Rate limit violations logged
- [ ] Unusual activity alerts configured
- [ ] Log files have restricted permissions (0600)

### Testing

- [ ] Security unit tests passing
- [ ] SQL injection tests passing
- [ ] XSS tests passing
- [ ] Rate limiting tests passing
- [ ] Penetration testing completed
- [ ] Security headers verified (securityheaders.com)

---

## Security Testing Tools

### Automated Testing

1. **npm audit**

   ```bash
   npm audit
   npm audit fix
   ```

2. **Snyk**

   ```bash
   npm install -g snyk
   snyk test
   snyk monitor
   ```

3. **OWASP Dependency-Check**
   ```bash
   # Scans dependencies for known vulnerabilities
   ```

### Manual Testing

4. **OWASP ZAP** (Zed Attack Proxy)
   - Automated security scanner
   - Spider and active scanning
   - Free and open source

5. **Burp Suite**
   - Professional web vulnerability scanner
   - Proxy for manual testing
   - Community edition available

6. **Postman / Insomnia**
   - API security testing
   - Automated test suites
   - Environment management

### Online Tools

7. **Security Headers**
   - https://securityheaders.com
   - Check security headers configuration

8. **SSL Labs**
   - https://www.ssllabs.com/ssltest
   - Test SSL/TLS configuration

9. **Mozilla Observatory**
   - https://observatory.mozilla.org
   - Security scan and recommendations

### Testing Commands

```bash
# Run security audit
npm audit

# Run linter (catches some security issues)
npm run lint

# Test rate limiting
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/health
done

# Test SQL injection (should return 400)
curl -X GET "http://localhost:3001/api/documents/1' OR '1'='1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test XSS (should be sanitized)
curl -X POST "http://localhost:3001/api/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "<script>alert(1)</script>"}'
```

---

## Emergency Response Plan

### Security Incident Response

1. **Detect**
   - Monitor security logs
   - Set up alerts for:
     - Multiple failed login attempts
     - Rate limit violations
     - Unusual API usage patterns
     - Error spikes

2. **Contain**
   - Block IP addresses: Update firewall rules
   - Revoke tokens: Add to Redis blacklist
   - Disable accounts: Set user status to inactive
   - Scale resources: Enable DDoS protection

3. **Investigate**
   - Review logs for attack vectors
   - Identify compromised data
   - Determine scope of breach
   - Preserve evidence

4. **Recover**
   - Rotate all secrets (JWT, DB, API keys)
   - Force password resets for affected users
   - Patch vulnerabilities
   - Restore from clean backups if needed

5. **Learn**
   - Document incident
   - Update security measures
   - Train team on new threats
   - Share lessons learned

### Contact Information

- **Security Team:** security@yourcompany.com
- **On-Call Engineer:** oncall@yourcompany.com
- **Hosting Provider:** [Add contact]
- **Cloudflare/DDoS Protection:** [Add contact]

---

## Resources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/security)

### Tools

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Zod Documentation](https://zod.dev/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Training

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Secure Code Warrior](https://securecodewarrior.com/)
- [Cybrary - Free Security Courses](https://www.cybrary.it/)

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-09  
**Next Review:** 2026-03-09  
**Owner:** Security Team

**Approval:**

- [ ] Tech Lead
- [ ] Security Officer
- [ ] DevOps Lead
