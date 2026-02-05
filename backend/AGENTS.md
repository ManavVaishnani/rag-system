# AGENTS.md - Coding Guidelines for RAG System Backend

## Build & Development Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Database operations
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:push        # Push schema changes

# Testing
npm test                   # Run all tests
npm test -- auth.test.ts   # Run single test file
npm test -- --testNamePattern="should register"  # Run single test

# Linting & Formatting
npm run lint               # Check for lint errors
npm run lint:fix           # Fix auto-fixable lint issues
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without writing
```

## Code Style Guidelines

### Imports Order

1. Node.js built-in modules (e.g., `http`, `path`)
2. Third-party packages (e.g., `express`, `zod`)
3. Internal modules - use relative paths with `@/` aliases avoided
4. Types (when separate from implementations)

Example:

```typescript
import http from "http";
import { Router } from "express";
import { z } from "zod";

import { config } from "./config";
import { logger } from "../utils/logger";
import { JwtPayload } from "../types";
```

### Formatting

- Use double quotes for strings
- Semicolons required
- 2-space indentation
- Trailing commas in multi-line objects/arrays
- Max line length: 80-100 characters (Prettier default)

### TypeScript Conventions

**Types & Interfaces:**

- Use `interface` for object shapes that may be extended
- Use `type` for unions, tuples, and mapped types
- Export types from `src/types/index.ts`
- Use strict null checks - always handle null/undefined

**Functions:**

- Explicit return types for public methods (optional for private)
- Use `async/await` over raw promises
- Prefix unused parameters with `_`
- Arrow functions for callbacks, regular functions for methods

**Naming:**

- PascalCase: Classes, interfaces, types, enums
- camelCase: Variables, functions, methods, properties
- UPPER_SNAKE_CASE: Constants, environment variables
- Files: camelCase (e.g., `auth.controller.ts`, `logger.ts`)

**Classes:**

- Use singleton pattern for services (export `getXxxService()`)
- Private fields prefixed with `_` (optional)
- Method ordering: public → protected → private

Example:

```typescript
export class LLMService {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    this.model = config.gemini.llmModel;
  }

  async generateResponse(query: string): Promise<string> {
    // implementation
  }

  private buildPrompt(query: string): string {
    // implementation
  }
}

// Singleton export
let llmService: LLMService | null = null;
export function getLLMService(): LLMService {
  if (!llmService) {
    llmService = new LLMService();
  }
  return llmService;
}
```

### Error Handling

**Controllers:**

- Wrap async operations in try-catch
- Return early on errors to avoid nested blocks
- Use `logger.error()` for server errors
- Send appropriate HTTP status codes

```typescript
async function handler(req: Request, res: Response): Promise<void> {
  try {
    const data = await fetchData();
    if (!data) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ success: true, data });
  } catch (error) {
    logger.error("Operation failed:", error);
    res.status(500).json({ error: "Operation failed" });
  }
}
```

**Validation:**

- Use Zod schemas for all input validation
- Define schemas in `src/utils/validators.ts`
- Export types using `z.infer<typeof schema>`

### Project Structure

```
src/
├── config/          # Configuration (DB, Redis, Qdrant)
├── controllers/     # Request handlers (class-based)
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── services/        # Business logic (singletons)
├── types/           # TypeScript types/interfaces
├── utils/           # Utilities (logger, validators)
└── test/            # Test files (*.test.ts)
```

### API Response Format

```typescript
// Success
res.json({
  success: true,
  data: {
    /* payload */
  },
});

// Error
res.status(XXX).json({
  error: "Human readable message",
});
```

### Testing

- Use Jest with Supertest for API tests
- Clean database between tests using `cleanDatabase()` helper
- Use `beforeEach` for test isolation
- Group related tests with `describe` blocks

```typescript
describe("Feature", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("should do something", async () => {
    const res = await request(app).get("/api/endpoint");
    expect(res.status).toBe(200);
  });
});
```

### Environment Variables

- Define schema in `src/config/index.ts` using Zod
- Access via `config` object, not `process.env` directly
- Provide defaults only for non-sensitive values

### Logging

- Use Winston logger from `src/utils/logger`
- Levels: `error`, `warn`, `info`, `debug`
- Include context in messages: `logger.info("User registered:", user.email)`
- Never log sensitive data (passwords, tokens)

## ESLint Rules

- `@typescript-eslint/no-unused-vars`: warn (ignore `_` prefix)
- `@typescript-eslint/no-explicit-any`: warn
- `no-console`: warn (use logger instead)
- Prettier integration enabled
