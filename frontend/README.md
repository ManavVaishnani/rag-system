# RAG System — Frontend

React-based frontend for the RAG system with real-time chat streaming, document management, and a dark-themed UI.

## Tech Stack

- **React 19** · TypeScript 5.9 · Vite 7.3
- **Tailwind CSS 4.1** — OKLCH color palette, dark-only theme
- **shadcn/ui** — 21 pre-built components (Radix UI primitives)
- **Zustand 5** — Lightweight state management (auth, chat, document stores)
- **TanStack Query 5** — Server state, caching, and background refetching
- **React Router 7** — Client-side routing with protected routes
- **Socket.io Client** — Real-time WebSocket streaming
- **React Hook Form + Zod 4** — Form validation

## Development

```bash
npm install
npm run dev       # Start dev server on http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Pages

| Route              | Page         | Description                        |
| ------------------ | ------------ | ---------------------------------- |
| `/`                | Landing      | Marketing landing page             |
| `/login`           | Login        | Email/password sign in             |
| `/register`        | Register     | New account creation               |
| `/chat`            | Chat         | New conversation                   |
| `/chat/:id`        | Chat         | Existing conversation with history |
| `/documents`       | Documents    | Upload, list, manage documents     |
| `/settings`        | Settings     | User preferences                   |

## Architecture

```
src/
├── components/
│   ├── ui/              # 21 shadcn/ui components
│   ├── layout/          # AppLayout, AuthLayout, Header, Sidebar
│   ├── chat/            # ChatInterface, MessageBubble, streaming, citations
│   ├── documents/       # Upload zone, cards, list, viewer
│   └── conversations/   # Sidebar conversation list
├── pages/               # Route-level page components
├── stores/              # Zustand stores (auth, chat, document)
├── services/            # API service layer (axios-based)
├── hooks/               # Custom hooks (useAuth, useChat, useDocuments, etc.)
├── lib/                 # Axios client, Socket.io client, utilities
└── types/               # Shared TypeScript types and Zod schemas
```

## Key Features

- **Real-time Streaming** — Token-by-token response rendering with cursor animation
- **Source Citations** — Expandable citations with content preview and relevance scores
- **Document Upload** — Drag & drop, multi-file, progress tracking, file validation
- **Conversation Management** — Create, rename, delete conversations from the sidebar
- **Chat Attachments** — Upload documents directly from the chat input
- **Responsive Layout** — Adaptive grid layouts (1 → 2 → 3 columns)
- **Error Boundaries** — Graceful error handling with recovery UI
- **Auto Token Refresh** — Seamless JWT refresh with request queuing
