# RAG System

A production-ready Retrieval-Augmented Generation (RAG) system built with Node.js, React, Gemini AI, and Qdrant vector database.

## Tech Stack

### Backend

- Node.js 20+ with Express.js and TypeScript
- Prisma ORM with PostgreSQL
- Redis for caching
- Qdrant Cloud for vector storage
- Google Gemini 2.5 Flash (LLM) + gemini-embedding-001
- Socket.io for real-time streaming
- JWT authentication

### Frontend (Coming Soon)

- React 18+ with TypeScript
- Vite build tool
- TanStack Query + Zustand
- Tailwind CSS + Shadcn/ui

## Prerequisites

- Node.js 20+
- PostgreSQL (Local or Docker)
- Redis (Local or Docker)
- Qdrant Cloud account
- Google AI Studio API key

## Quick Start

### 1. Clone and Install

```bash
cd rag-system/backend
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your credentials
# - DATABASE_URL: Your local postgres connection string
# - REDIS_URL: Your local redis connection string
# - GEMINI_API_KEY: Get from https://aistudio.google.com/apikey
# - QDRANT_URL: Your Qdrant Cloud cluster URL
# - QDRANT_API_KEY: Your Qdrant Cloud API key
```

### 3. Setup Database

```bash
# From the backend directory
npx prisma db push
```

### 4. Verify Connections (Important)

Run the manual test script to verify all external services (Gemini, Qdrant, Redis, DB) are reachable:

```bash
npm test src/test/manual-test.ts
# OR
npx ts-node src/test/manual-test.ts
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on http://localhost:3001

## 🧪 Testing

The project uses Jest and Supertest for API testing.

```bash
# Run all tests
npm test

# Run a specific test
npm test src/test/auth.test.ts
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Documents

- `POST /api/documents/upload` - Upload document (PDF, DOCX, TXT, MD)
- `GET /api/documents` - List user's documents
- `GET /api/documents/:id/status` - Get document processing status
- `DELETE /api/documents/:id` - Delete document

### Queries

- `POST /api/query` - Query documents (non-streaming)
- WebSocket `query:stream` - Stream query response

### Conversations

- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `PATCH /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

## WebSocket Events

Connect with authentication token:

```javascript
const socket = io("http://localhost:3001", {
  auth: { token: "your-jwt-token" },
});
```

### Client Events

- `query:stream` - `{ query: string, conversationId?: string }`

### Server Events

- `query:status` - `{ status: string }`
- `query:sources` - `{ sources: SourceCitation[] }`
- `query:chunk` - `{ chunk: string }`
- `query:complete` - `{ done: true }`
- `query:cached` - `{ response: string, sources: SourceCitation[] }`
- `query:error` - `{ error: string }`

## Environment Variables

| Variable                 | Description                          | Required           |
| ------------------------ | ------------------------------------ | ------------------ |
| `NODE_ENV`               | Environment (development/production) | No                 |
| `PORT`                   | Server port                          | No (default: 3001) |
| `DATABASE_URL`           | PostgreSQL connection string         | Yes                |
| `REDIS_URL`              | Redis connection string              | No                 |
| `JWT_SECRET`             | JWT signing secret (min 32 chars)    | Yes                |
| `GEMINI_API_KEY`         | Google AI Studio API key             | Yes                |
| `QDRANT_URL`             | Qdrant Cloud URL                     | Yes                |
| `QDRANT_API_KEY`         | Qdrant Cloud API key                 | Yes                |
| `QDRANT_COLLECTION_NAME` | Qdrant collection name               | No                 |
| `CORS_ORIGIN`            | Allowed CORS origin                  | No                 |

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration and clients
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   ├── test/           # Integration & Manual tests
│   ├── app.ts          # Express app
│   └── server.ts       # Entry point
├── prisma/
│   └── schema.prisma   # Database schema
└── uploads/            # Temporary file storage
```

## License

MIT
