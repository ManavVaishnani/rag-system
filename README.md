# RAG System

A production-ready Retrieval-Augmented Generation (RAG) system with a full-stack architecture — Node.js/Express backend, React frontend, Google Gemini AI, Qdrant vector database, and real-time WebSocket streaming.

Upload documents (PDF, DOCX, TXT, MD), ask natural language questions, and get AI-powered answers grounded in your documents with source citations.

## Features

- **Document Processing** — Upload and chunk documents with automatic vector embedding
- **Conversational RAG** — Multi-turn conversations with context-aware retrieval
- **Real-time Streaming** — WebSocket-based token streaming with typing animation
- **Source Citations** — Every answer includes expandable source references with relevance scores
- **JWT Authentication** — Secure auth with access/refresh token flow and token blacklisting
- **BYOK Support** — Bring Your Own Gemini API key for unlimited queries
- **Daily Credit System** — 100 free queries/day for system-key users
- **Circuit Breakers** — Resilient external service calls (Gemini, Qdrant) via opossum
- **Prometheus Metrics** — 14 custom metrics exposed on port 9090
- **Swagger/OpenAPI** — Interactive API docs at `/api-docs`
- **Docker Ready** — Multi-stage Dockerfile with production and development compose files

## Tech Stack

### Backend

| Layer          | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Runtime        | Node.js 20+ · TypeScript 5.5                         |
| Framework      | Express 4.19 · Socket.io 4.8                         |
| AI / Embeddings| Google Gemini 2.5 Flash · gemini-embedding-001        |
| Vector DB      | Qdrant Cloud                                          |
| Database       | PostgreSQL 16 · Prisma ORM 5.20                      |
| Cache / Queue  | Redis 7 · ioredis · Bull                              |
| Auth           | JWT (access + refresh) · bcrypt                       |
| Observability  | Prometheus (prom-client) · Winston logging            |
| Resilience     | opossum circuit breakers · Redis rate limiting        |
| Docs           | Swagger UI (swagger-ui-express)                       |
| Security       | Helmet · CORS · Zod validation · request timeouts     |

### Frontend

| Layer          | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Framework      | React 19 · TypeScript 5.9                             |
| Build          | Vite 7.3                                              |
| Styling        | Tailwind CSS 4.1 (OKLCH dark theme) · shadcn/ui       |
| State          | Zustand 5 · TanStack Query 5                         |
| Routing        | React Router 7                                        |
| Forms          | React Hook Form 7 · Zod 4                            |
| Real-time      | socket.io-client 4.8                                  |
| Markdown       | react-markdown · remark-gfm                           |

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local or Docker)
- Redis 7+ (local or Docker)
- [Qdrant Cloud](https://cloud.qdrant.io) account
- [Google AI Studio](https://aistudio.google.com/apikey) API key

## Quick Start

### Option A: Docker (Recommended)

Spin up PostgreSQL and Redis with the root-level compose file:

```bash
docker compose up -d
```

Then follow the backend and frontend setup below.

### Option B: Manual Setup

Ensure PostgreSQL and Redis are running locally.

---

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Setup database
npx prisma db push

# Verify all external services are reachable
npm test -- manual-test.ts

# Start development server
npm run dev
```

Backend starts on **http://localhost:3001** · API docs at **http://localhost:3001/api-docs**

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

Frontend starts on **http://localhost:5173**

## Testing

```bash
cd backend

# Run all tests (22 passing)
npm test

# Run a specific test file
npm test -- auth.test.ts

# Run a single test by name
npm test -- --testNamePattern="should register"
```

## API Endpoints

### Authentication

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| POST   | `/api/auth/register`  | Register new user     |
| POST   | `/api/auth/login`     | Login (returns tokens)|
| POST   | `/api/auth/refresh`   | Refresh access token  |
| POST   | `/api/auth/logout`    | Logout (blacklist)    |
| GET    | `/api/auth/me`        | Get current user      |

### Documents

| Method | Endpoint                     | Description                          |
| ------ | ---------------------------- | ------------------------------------ |
| POST   | `/api/documents/upload`      | Upload document (PDF, DOCX, TXT, MD)|
| GET    | `/api/documents`             | List user's documents                |
| GET    | `/api/documents/:id/status`  | Get document processing status       |
| DELETE | `/api/documents/:id`         | Delete document and vectors          |

### Queries

| Method    | Endpoint        | Description               |
| --------- | --------------- | ------------------------- |
| POST      | `/api/query`    | Query documents (REST)    |
| WebSocket | `query:stream`  | Stream query response     |

### Conversations

| Method | Endpoint                  | Description                     |
| ------ | ------------------------- | ------------------------------- |
| POST   | `/api/conversations`      | Create conversation             |
| GET    | `/api/conversations`      | List conversations              |
| GET    | `/api/conversations/:id`  | Get conversation with messages  |
| PATCH  | `/api/conversations/:id`  | Update conversation title       |
| DELETE | `/api/conversations/:id`  | Delete conversation             |

### Health

| Method | Endpoint         | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/health`        | Full health check (DB, Redis, Qdrant)    |
| GET    | `/health/live`   | Liveness probe                           |
| GET    | `/health/ready`  | Readiness probe                          |

## WebSocket Streaming

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: { token: "your-jwt-token" },
});

// Send a query
socket.emit("query:stream", {
  query: "What does the document say about X?",
  conversationId: "optional-conversation-id",
});

// Listen for response chunks
socket.on("query:chunk", ({ chunk }) => process.stdout.write(chunk));
socket.on("query:sources", ({ sources }) => console.log(sources));
socket.on("query:complete", () => console.log("\nDone"));
socket.on("query:error", ({ error }) => console.error(error));
```

### Events

| Direction | Event            | Payload                                          |
| --------- | ---------------- | ------------------------------------------------ |
| Client →  | `query:stream`   | `{ query, conversationId? }`                     |
| → Client  | `query:status`   | `{ status }`                                     |
| → Client  | `query:sources`  | `{ sources: SourceCitation[] }`                  |
| → Client  | `query:chunk`    | `{ chunk }`                                      |
| → Client  | `query:complete` | `{ done: true }`                                 |
| → Client  | `query:cached`   | `{ response, sources }`                          |
| → Client  | `query:error`    | `{ error }`                                      |

## Data Model

| Model           | Description                                                |
| --------------- | ---------------------------------------------------------- |
| **User**        | Auth credentials, name, timestamps                         |
| **Document**    | Uploaded file metadata, processing status, chunk count     |
| **DocumentChunk** | Text chunks with vector IDs for Qdrant lookups          |
| **Conversation**| Chat sessions per user                                     |
| **Message**     | User/assistant messages with optional JSON source citations|

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
rag-system/
├── docker-compose.yml          # Dev services (PostgreSQL + Redis)
├── backend/
│   ├── docker-compose.yml      # Full stack (app + services + Qdrant)
│   ├── docker-compose.prod.yml # Production with nginx reverse proxy
│   ├── Dockerfile              # Multi-stage Node 20 Alpine build
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (5 models)
│   ├── src/
│   │   ├── config/             # DB, Redis, Qdrant, metrics config
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, rate-limit, metrics, validation
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Business logic (11 services)
│   │   ├── scripts/            # Collection management
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Logger, validators, WebSocket
│   │   ├── test/               # Jest + Supertest integration tests
│   │   ├── app.ts              # Express app setup
│   │   ├── metrics-server.ts   # Prometheus metrics server (:9090)
│   │   └── server.ts           # Entry point
│   └── uploads/                # Temporary file storage
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # 21 shadcn/ui components
│   │   │   ├── layout/         # AppLayout, Header, Sidebar
│   │   │   ├── chat/           # ChatInterface, MessageBubble, streaming
│   │   │   ├── documents/      # Upload, list, cards, viewer
│   │   │   └── conversations/  # Sidebar conversation list
│   │   ├── pages/              # 7 pages (Landing → Settings)
│   │   ├── stores/             # Zustand (auth, chat, document)
│   │   ├── services/           # API service layer
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Axios, Socket.io, utilities
│   │   └── types/              # Shared TypeScript types
│   └── public/
└── RAG-system.postman_collection.json
```

## Docker Deployment

### Development (full stack)

```bash
cd backend
docker compose up -d
```

Starts PostgreSQL, Redis, Qdrant, and the backend app.

### Production

```bash
cd backend
docker compose -f docker-compose.prod.yml up -d

# With nginx reverse proxy
docker compose -f docker-compose.prod.yml --profile proxy up -d
```

Production includes resource limits (2 CPU / 2 GB), JSON log rotation, and health checks.

## Troubleshooting

### Qdrant Vector Size Mismatch

If you encounter "Bad Request" or "Vector dimension mismatch" errors:

1. Ensure `vectorSize` in `backend/src/config/index.ts` matches your embedding model (768 for `text-embedding-004`).
2. Run the collection management script:
   ```bash
   cd backend
   npx ts-node src/scripts/create-collection.ts
   ```
3. To force recreate the collection:
   ```bash
   npx ts-node src/scripts/create-collection.ts --recreate
   ```

## License

MIT
