# RAG System Frontend Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for the RAG (Retrieval-Augmented Generation) system frontend. The backend is production-ready, and this frontend will provide a stunning user interface using **React + TypeScript + Vite + Tailwind CSS v4.1 + shadcn/ui** with a **dark-only theme** inspired by Tailwind CSS's elegant, minimal aesthetic.

**Key Feature**: Users can upload documents directly from the chat interface (multiple files supported), and these documents are globally available across all conversations and also displayed in the Documents module.

---

## 1. Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 19 + TypeScript | UI library with type safety |
| **Build Tool** | Vite 6 | Fast dev server & optimized builds |
| **Styling** | Tailwind CSS 4.1 | Utility-first CSS (OKLCH color space) |
| **Components** | shadcn/ui | Accessible, customizable components |
| **State Management** | Zustand | Global state management |
| **Data Fetching** | TanStack Query | Server state & caching |
| **HTTP Client** | Axios | API requests with interceptors |
| **Real-time** | Socket.io-client | WebSocket streaming |
| **Routing** | React Router 7 | SPA navigation |
| **Forms** | React Hook Form + Zod | Form validation |
| **Icons** | Lucide React | Consistent iconography |

---

## 2. Tailwind CSS v4.1 Specific Setup

### Key Differences from v3
- **No `tailwind.config.js`** - All configuration in CSS
- **New import syntax**: `@import "tailwindcss";` instead of directives
- **Vite plugin**: `@tailwindcss/vite` instead of PostCSS
- **CSS-first configuration**: Use `@theme` directive in CSS
- **OKLCH color space**: Better perceptual uniformity

### Installation Steps

#### 1. Create Vite Project
```bash
cd rag-system
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

#### 2. Install Tailwind CSS v4.1
```bash
npm install tailwindcss @tailwindcss/vite
```

#### 3. Configure CSS (`src/index.css`)
```css
@import "tailwindcss";

/* Custom theme configuration */
@theme {
  /* Colors - Dark mode only (OKLCH format) */
  --color-background: oklch(0.13 0.028 261.692);
  --color-foreground: oklch(1 0 0);
  --color-muted: oklch(0.21 0.034 264.665);
  --color-muted-foreground: oklch(0.64 0 0);
  --color-accent: oklch(0.72 0.18 250);
  --color-accent-foreground: oklch(1 0 0);
  --color-card: oklch(0.18 0.03 265);
  --color-card-foreground: oklch(1 0 0);
  --color-border: oklch(0.27 0 0);
  --color-ring: oklch(0.72 0.18 250);
  
  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

/* Force dark mode */
html {
  color-scheme: dark;
}

body {
  @apply bg-background text-foreground antialiased;
  font-family: var(--font-sans);
}

/* Custom utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .gradient-text {
    background: linear-gradient(to right, var(--color-accent), oklch(0.8 0.2 300));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .glass-effect {
    background: oklch(0.2 0.02 265 / 0.5);
    backdrop-filter: blur(8px);
  }
}
```

#### 4. Update Vite Config (`vite.config.ts`)
```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

#### 5. Configure TypeScript

**tsconfig.json:**
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**tsconfig.app.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 6. Initialize shadcn/ui
```bash
npx shadcn@latest init
# Select: Neutral base color, CSS variables: Yes
```

#### 7. Install Dependencies
```bash
# Core dependencies
npm install react-router-dom zustand @tanstack/react-query axios
npm install socket.io-client react-hook-form @hookform/resolvers zod
npm install lucide-react date-fns clsx tailwind-merge @radix-ui/react-icons

# Dev dependencies
npm install -D @types/node
```

---

## 3. Design System (Tailwind-inspired)

### Color Palette (Dark Mode Only - OKLCH)
```css
/* Primary Colors */
--color-background: oklch(0.13 0.028 261.692);    /* Deep dark blue-gray */
--color-foreground: oklch(1 0 0);                  /* Pure white */
--color-muted: oklch(0.21 0.034 264.665);         /* Slightly lighter bg */
--color-muted-foreground: oklch(0.64 0 0);        /* Gray text */
--color-accent: oklch(0.72 0.18 250);             /* Sky blue accent */
--color-accent-foreground: oklch(1 0 0);          /* White on accent */

/* Semantic Colors */
--color-card: oklch(0.18 0.03 265);               /* Card background */
--color-card-foreground: oklch(1 0 0);            /* Card text */
--color-border: oklch(0.27 0 0);                  /* Subtle borders */
--color-ring: oklch(0.72 0.18 250);               /* Focus ring */
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Code Font**: JetBrains Mono or Fira Code
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Scale**: text-xs (12px) to text-4xl (36px)

### Spacing
- **Base**: 4px (0.25rem)
- **Standard**: p-4 (16px), p-6 (24px), gap-4 (16px)
- **Cards**: rounded-xl (12px) or rounded-2xl (16px)
- **Buttons**: rounded-lg (8px) or rounded-full (pill)

### Visual Effects
- **Shadows**: shadow-lg for elevation
- **Borders**: border border-border (subtle)
- **Rings**: ring-1 ring-ring for focus states
- **Opacity**: Heavy use of opacity modifiers (e.g., bg-accent/10)
- **Gradients**: OKLCH-based gradients for accents

---

## 4. Component Inventory

### shadcn/ui Components to Install
```bash
# Core UI components
npx shadcn@latest add button card input textarea avatar badge
npx shadcn@latest add dialog dropdown-menu tooltip scroll-area separator
npx shadcn@latest add skeleton sonner tabs accordion sheet select label
npx shadcn@latest add form switch progress
```

### Custom Components to Build

#### Layout Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `AppLayout` | `components/layout/app-layout.tsx` | Main app shell with sidebar |
| `Sidebar` | `components/layout/sidebar.tsx` | Navigation sidebar |
| `AuthLayout` | `components/layout/auth-layout.tsx` | Login/register layout |
| `Header` | `components/layout/header.tsx` | Top navigation bar |

#### Chat Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `ChatInterface` | `components/chat/chat-interface.tsx` | Main chat container |
| `MessageBubble` | `components/chat/message-bubble.tsx` | Individual messages |
| `MessageInput` | `components/chat/message-input.tsx` | Chat input with send and attachment |
| `AttachmentButton` | `components/chat/attachment-button.tsx` | Paperclip upload button |
| `FilePreviewChips` | `components/chat/file-preview-chips.tsx` | Selected files preview |
| `DocumentChip` | `components/chat/document-chip.tsx` | Inline document reference |
| `StreamingText` | `components/chat/streaming-text.tsx` | Real-time text display |
| `SourceCitations` | `components/chat/source-citations.tsx` | Document sources panel |
| `EmptyChat` | `components/chat/empty-chat.tsx` | Empty state placeholder |

#### Document Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `DocumentUpload` | `components/documents/document-upload.tsx` | Drag & drop upload zone (Documents page) |
| `DocumentList` | `components/documents/document-list.tsx` | Grid of documents |
| `DocumentCard` | `components/documents/document-card.tsx` | Individual doc display |
| `UploadProgress` | `components/documents/upload-progress.tsx` | Upload status indicator |
| `FileUploadZone` | `components/documents/file-upload-zone.tsx` | Reusable upload component |

#### Conversation Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `ConversationList` | `components/conversations/conversation-list.tsx` | Chat history sidebar |
| `ConversationItem` | `components/conversations/conversation-item.tsx` | Single conversation |
| `NewConversationButton` | `components/conversations/new-conversation-button.tsx` | Create new chat |

#### UI Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `Logo` | `components/ui/logo.tsx` | Brand logo |
| `ThemeProvider` | `components/theme-provider.tsx` | Dark mode management |
| `LoadingSpinner` | `components/ui/loading-spinner.tsx` | Loading states |
| `ErrorBoundary` | `components/error-boundary.tsx` | Error handling |

---

## 5. Page Structure

### Public Routes (No Authentication Required)
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Marketing/home page with hero section |
| `/login` | `LoginPage` | User authentication form |
| `/register` | `RegisterPage` | User registration form |

### Protected Routes (Authentication Required)
| Route | Component | Description |
|-------|-----------|-------------|
| `/chat` | `ChatPage` | Main chat interface (new conversation) |
| `/chat/:id` | `ChatPage` | Specific conversation by ID |
| `/documents` | `DocumentsPage` | Document management interface |
| `/settings` | `SettingsPage` | User settings and preferences |

### Layout Structure
```
Public Layout:
┌─────────────────────────────────────┐
│ [Logo]          [Login] [Register]  │
├─────────────────────────────────────┤
│                                     │
│           Page Content              │
│                                     │
├─────────────────────────────────────┤
│              Footer                 │
└─────────────────────────────────────┘

App Layout (Authenticated):
┌─────────────────────────────────────────────────────────┐
│  [Logo]  RAG System                    [User ▼]  [⚙️]  │
├─────────────────────────────────────────────────────────┤
│  Conversations                    │  Chat Interface    │
│  ─────────────────────────────   │  ───────────────── │
│  🔍 Search...                     │  [Message 1]       │
│                                  │  [Message 2]       │
│  📄 Conversation 1               │  [Streaming...]    │
│  📄 Conversation 2               │                    │
│  📄 Conversation 3               │  📄 file1.pdf ✓    │
│                                  │  📄 file2.docx ⏳  │
│  [+ New Chat]                    │  ┌────────────────┐│
│                                  │  │Type message... ││
│                                  │  │[📎]        [Send]│
│                                  │  └────────────────┘│
├──────────────────────────────────┴─────────────────────┤
│  Sources: [Doc 1] [Doc 2] [Doc 3]                      │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Chat-Integrated Document Upload Feature

### Overview
Users can upload documents directly from the chat interface. These documents are:
- **Immediately available** for the current conversation context
- **Globally accessible** across all conversations
- **Synchronized** with the Documents module in real-time

### Key Features
- **Multiple file upload**: Support for uploading up to 10 files at once
- **Global availability**: Documents uploaded in chat appear in Documents page
- **File size limit**: 10 MB per file
- **Background processing**: Upload happens while user types message
- **Real-time sync**: Documents module updates automatically

### User Flow
```
User clicks 📎 attachment button in chat
        ↓
File picker opens (multi-select enabled)
        ↓
Selected files appear as chips above input
   [📄 file1.pdf ✓] [📄 file2.docx ⏳] [❌]
        ↓
Upload starts automatically in background
   - Progress shown per file
   - User can type message while uploading
        ↓
User clicks Send (or Ctrl+Enter)
   - Message sent
   - Documents already processing/ready
        ↓
Documents appear in:
   ✓ Current chat (as context/attachment)
   ✓ Documents page (full list with status)
   ✓ Available in all future conversations
```

### Validation Rules
```typescript
// File Upload Constraints
const UPLOAD_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024,  // 10 MB per file
  maxFilesPerUpload: 10,           // Maximum 10 files at once
  allowedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ],
  allowedExtensions: ['.pdf', '.docx', '.txt', '.md']
};

// Duplicate Detection
- Check if file with same name + size already exists
- Show warning: "This file already exists in your documents"
- Allow user to proceed or cancel
```

### New Components for Chat Upload

#### AttachmentButton
```typescript
// components/chat/attachment-button.tsx
- Paperclip icon button
- Opens file picker with multi-select
- Validates file types before selection
- Triggers upload process
```

#### FilePreviewChips
```typescript
// components/chat/file-preview-chips.tsx
- Horizontal scrollable list of selected files
- Shows filename + extension icon
- Status indicator (pending/uploading/completed/error)
- Remove button (❌) for each file
- Progress bar for uploading files
```

#### DocumentChip
```typescript
// components/chat/document-chip.tsx
- Inline reference in sent message
- Shows document name with status
- Click to view document in Documents page
- Visual indicator for document context
```

### Store Updates

#### Chat Store (`stores/chat-store.ts`)
```typescript
interface ChatState {
  // ... existing properties
  
  // New: Chat upload tracking
  pendingAttachments: PendingAttachment[];
  isUploadingAttachments: boolean;
  
  // New: Actions
  uploadAttachments: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

interface PendingAttachment {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  documentId?: string;
  error?: string;
}
```

#### Document Store (`stores/document-store.ts`)
```typescript
interface DocumentState {
  // ... existing properties
  
  // New: Listen for chat uploads
  syncChatUploads: (document: Document) => void;
}
```

### Cross-Store Communication
```typescript
// When upload completes in chat store
// Automatically update document store

chatStore.uploadAttachments(files).then((documents) => {
  // Sync with document store
  documents.forEach(doc => {
    documentStore.syncChatUploads(doc);
  });
});
```

### API Integration

#### Upload Endpoint (Same for Chat and Documents Page)
```typescript
POST /api/documents/upload
Content-Type: multipart/form-data

Form Data:
- files: File[]           // Multiple files
- source: 'chat' | 'documents'  // Track origin
- conversationId?: string  // Optional: link to conversation

Response:
{
  documents: Document[]    // Created documents with IDs
}
```

#### Polling for Status
```typescript
// Poll document status after upload
GET /api/documents/:id/status

// Update both chat attachment and document list
```

### UI/UX Considerations

#### Upload States
```
1. Pending (before upload)
   - Gray chip with filename
   - Loading indicator
   
2. Uploading (0-99%)
   - Blue chip with progress bar
   - Percentage displayed
   - Cancel button available
   
3. Completed (100%)
   - Green checkmark
   - Solid chip styling
   - Clickable to view
   
4. Error
   - Red chip with error icon
   - Hover to see error message
   - Retry button
```

#### Chat Input Behavior
```
Normal State:
┌────────────────────────────────────┐
│ [📎] Type your message...   [Send] │
└────────────────────────────────────┘

With Attachments:
┌────────────────────────────────────┐
│ 📄 report.pdf ✓  📄 data.docx ⏳ ❌ │
├────────────────────────────────────┤
│ [📎] Type your message...   [Send] │
└────────────────────────────────────┘

While Uploading:
┌────────────────────────────────────┐
│ 📄 report.pdf [████░░░░░░] 40% ❌  │
├────────────────────────────────────┤
│ [📎] Type your message...   [⏳]   │
└────────────────────────────────────┘
  (Send disabled until upload completes)
```

### Error Handling
```typescript
// File too large
Error: "File exceeds 10 MB limit"

// Invalid file type
Error: "Only PDF, DOCX, TXT, and MD files are supported"

// Too many files
Error: "Maximum 10 files allowed per upload"

// Duplicate file
Warning: "This file already exists. Upload anyway?"

// Upload failed
Error: "Failed to upload. Click to retry."
```

### Integration with Existing Components

#### Updated MessageInput
```typescript
// components/chat/message-input.tsx
// New props/methods:
- onAttachFiles: () => void
- attachments: PendingAttachment[]
- onRemoveAttachment: (id: string) => void
- isUploading: boolean

// Layout:
<VStack>
  <FilePreviewChips />  // New: Show attachments
  <HStack>
    <AttachmentButton />  // New: Paperclip button
    <Input />
    <SendButton disabled={isUploading} />
  </HStack>
</VStack>
```

#### Updated MessageBubble
```typescript
// components/chat/message-bubble.tsx
// For user messages with attachments:
- Show DocumentChips above message text
- Click to navigate to Documents page
- Show processing status
```

### Time Estimate Addition

**Additional Time for Chat Upload Feature: +3 hours**
- Attachment button & file picker: 30 min
- File preview chips component: 45 min
- Upload progress handling: 45 min
- Store integration & sync: 45 min
- Error handling & validation: 45 min

**Updated Total: 23-28 hours**

---

## 7. State Management Architecture

### Zustand Stores

#### Auth Store (`stores/auth-store.ts`)
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

#### Chat Store (`stores/chat-store.ts`)
```typescript
interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  sources: Source[];
  error: string | null;
  
  // New: Chat upload tracking
  pendingAttachments: PendingAttachment[];
  isUploadingAttachments: boolean;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  
  // New: Upload actions
  uploadAttachments: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

interface PendingAttachment {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  documentId?: string;
  error?: string;
}
```

#### Document Store (`stores/document-store.ts`)
```typescript
interface DocumentState {
  documents: Document[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  
  // Actions
  uploadDocument: (file: File) => Promise<void>;
  uploadDocuments: (files: File[]) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  getDocumentStatus: (id: string) => Promise<DocumentStatus>;
  
  // New: Sync from chat uploads
  syncChatUploads: (document: Document) => void;
}
```

### TanStack Query Keys
```typescript
export const queryKeys = {
  user: ['user'],
  conversations: ['conversations'],
  conversation: (id: string) => ['conversation', id],
  messages: (conversationId: string) => ['messages', conversationId],
  documents: ['documents'],
  document: (id: string) => ['document', id],
};
```

---

## 8. API Integration

### Axios Configuration (`lib/axios.ts`)
```typescript
- Base URL: http://localhost:3001/api
- Request interceptor: Add Authorization header with JWT
- Response interceptor: Handle 401, auto-refresh token
- Error handling: Consistent error format with toast notifications
```

### API Service Structure (`services/`)
```
services/
├── api.ts                 # Axios instance configuration
├── auth.service.ts        # Authentication endpoints
├── chat.service.ts        # Chat & query endpoints
├── document.service.ts    # Document management endpoints
└── conversation.service.ts # Conversation CRUD endpoints
```

### WebSocket Setup (`lib/socket.ts`)
```typescript
- Socket.io client connection to ws://localhost:3001
- Event handlers for streaming responses:
  - `query:status` → Show status updates ("Searching documents...")
  - `query:sources` → Display source citations
  - `query:chunk` → Append to streaming text
  - `query:complete` → Finalize message
  - `query:cached` → Show cached response indicator
  - `query:error` → Display error message
- Reconnection logic with exponential backoff
- Integration with chat store for real-time updates
```

---

## 9. File Structure

```
rag-system/
├── backend/                          # Existing backend
└── frontend/                         # New frontend
    ├── public/
    │   ├── favicon.ico
    │   └── logo.svg
    ├── src/
    │   ├── components/
    │   │   ├── ui/                  # shadcn/ui components
    │   │   ├── layout/              # Layout components
    │   │   ├── chat/                # Chat-related components
    │   │   │   ├── chat-interface.tsx
    │   │   │   ├── message-bubble.tsx
    │   │   │   ├── message-input.tsx
    │   │   │   ├── attachment-button.tsx       # NEW
    │   │   │   ├── file-preview-chips.tsx      # NEW
    │   │   │   ├── document-chip.tsx           # NEW
    │   │   │   ├── streaming-text.tsx
    │   │   │   ├── source-citations.tsx
    │   │   │   └── empty-chat.tsx
    │   │   ├── documents/           # Document components
    │   │   │   ├── document-upload.tsx
    │   │   │   ├── document-list.tsx
    │   │   │   ├── document-card.tsx
    │   │   │   ├── upload-progress.tsx
    │   │   │   └── file-upload-zone.tsx        # NEW
    │   │   ├── conversations/       # Conversation components
    │   │   └── auth/                # Auth form components
    │   ├── hooks/
    │   │   ├── use-auth.ts
    │   │   ├── use-chat.ts
    │   │   ├── use-documents.ts
    │   │   └── use-conversations.ts
    │   ├── lib/
    │   │   ├── utils.ts
    │   │   ├── axios.ts
    │   │   └── socket.ts
    │   ├── pages/
    │   │   ├── landing-page.tsx
    │   │   ├── login-page.tsx
    │   │   ├── register-page.tsx
    │   │   ├── chat-page.tsx
    │   │   ├── documents-page.tsx
    │   │   └── settings-page.tsx
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── chat.service.ts
    │   │   ├── document.service.ts
    │   │   └── conversation.service.ts
    │   ├── stores/
    │   │   ├── auth-store.ts
    │   │   ├── chat-store.ts
    │   │   └── document-store.ts
    │   ├── types/
    │   │   ├── api.types.ts
    │   │   ├── auth.types.ts
    │   │   ├── chat.types.ts
    │   │   └── document.types.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css                # Tailwind v4.1 configuration
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── vite.config.ts
    └── components.json              # shadcn/ui configuration
```

---

## 10. Implementation Phases

### Phase 1: Project Setup (1-2 hours)
- [ ] Initialize Vite project with React + TypeScript
- [ ] Install Tailwind CSS v4.1 with @tailwindcss/vite
- [ ] Configure CSS with OKLCH colors and dark mode
- [ ] Setup TypeScript path aliases (@/src)
- [ ] Initialize shadcn/ui with Neutral base color
- [ ] Install all core dependencies
- [ ] Create folder structure
- [ ] Setup ESLint and Prettier (optional)

### Phase 2: Core Infrastructure (2-3 hours)
- [ ] Create API service layer with Axios
- [ ] Setup request/response interceptors
- [ ] Configure JWT token handling and refresh
- [ ] Setup Zustand stores (auth, chat, documents)
- [ ] Configure React Router with protected routes
- [ ] Create ThemeProvider (dark mode - forced)
- [ ] Setup TanStack Query provider
- [ ] Build layout components (AppLayout, Sidebar, Header)

### Phase 3: Authentication (2-3 hours)
- [ ] Build LoginPage with form validation (Zod + React Hook Form)
- [ ] Build RegisterPage with form validation
- [ ] Implement auth service methods (login, register, logout)
- [ ] Connect auth store to UI components
- [ ] Add protected route guards (redirect to login)
- [ ] Add logout functionality in header
- [ ] Add loading states and error handling
- [ ] Test authentication flow end-to-end

### Phase 4: Document Management (3-4 hours)
- [ ] Build DocumentsPage layout with grid
- [ ] Create DocumentUpload component with drag & drop
- [ ] Create DocumentList component
- [ ] Create DocumentCard component with status badges
- [ ] Create UploadProgress component
- [ ] Implement document service methods
- [ ] Connect to document store
- [ ] Add upload progress indicators
- [ ] Add document deletion with confirmation
- [ ] Add polling for document processing status

### Phase 5: Chat Interface (4-5 hours)
- [ ] Build ChatPage layout with sidebar
- [ ] Create ChatInterface component
- [ ] Create MessageBubble component (user vs assistant)
- [ ] Create MessageInput with send button and enter key
- [ ] Implement message service
- [ ] Setup Socket.io client connection
- [ ] Create StreamingText component with typewriter effect
- [ ] Create SourceCitations component
- [ ] Connect to chat store
- [ ] Handle streaming events (status, sources, chunks, complete)
- [ ] Add typing indicators
- [ ] Add scroll to bottom on new messages

### Phase 6: Chat-Integrated Document Upload (3 hours) - NEW
- [ ] Create AttachmentButton component (paperclip icon)
- [ ] Create FilePreviewChips component with progress bars
- [ ] Create DocumentChip component for inline references
- [ ] Update MessageInput to handle attachments
- [ ] Implement multi-file upload validation (10 MB limit, max 10 files)
- [ ] Add upload progress tracking per file
- [ ] Sync uploaded documents to Documents store
- [ ] Show document status in chat (processing/completed)
- [ ] Handle duplicate file detection
- [ ] Add error handling and retry logic
- [ ] Test upload flow end-to-end

### Phase 7: Conversation Management (2-3 hours)
- [ ] Create ConversationList sidebar component
- [ ] Create ConversationItem component with hover actions
- [ ] Create NewConversationButton
- [ ] Implement conversation CRUD operations
- [ ] Add conversation title editing (inline)
- [ ] Add delete confirmation dialogs
- [ ] Add search/filter conversations
- [ ] Add conversation list sorting (newest first)

### Phase 8: Polish & Landing Page (3-4 hours)
- [ ] Build LandingPage with hero section
- [ ] Add feature highlights section
- [ ] Add CTA buttons
- [ ] Add footer with links
- [ ] Add loading skeletons for all async operations
- [ ] Add error handling with Sonner toast notifications
- [ ] Add empty states for lists
- [ ] Implement responsive design (mobile, tablet, desktop)
- [ ] Add keyboard shortcuts (e.g., Ctrl+Enter to send)
- [ ] Performance optimizations (lazy loading, memoization)

### Phase 9: Testing & Deployment (2-3 hours)
- [ ] Test authentication flow (login, register, logout)
- [ ] Test token refresh on 401 errors
- [ ] Test protected routes
- [ ] Test document upload from chat (multiple files)
- [ ] Test document upload from Documents page
- [ ] Test document sync between chat and Documents page
- [ ] Test file size validation (10 MB limit)
- [ ] Test document processing status updates
- [ ] Test document deletion
- [ ] Test create new conversation
- [ ] Test send message and receive AI response
- [ ] Test WebSocket streaming displays correctly
- [ ] Test source citations appear
- [ ] Test switch between conversations
- [ ] Test edit conversation title
- [ ] Test delete conversation
- [ ] Test responsive on mobile/tablet/desktop
- [ ] Build for production
- [ ] Deploy

**Total Estimated Time: 23-28 hours**

---

## 11. Dependencies

### package.json
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.7.0",
    "socket.io-client": "^4.8.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    "lucide-react": "^0.474.0",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "@radix-ui/react-icons": "^1.3.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@types/node": "^22.0.0",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/vite": "^4.1.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

---

## 12. Backend API Integration

### Authentication Endpoints
```typescript
POST /api/auth/register     # Create new user
POST /api/auth/login        # Authenticate user
POST /api/auth/refresh      # Refresh access token
POST /api/auth/logout       # Revoke tokens
GET  /api/auth/me           # Get current user
```

### Document Endpoints
```typescript
POST /api/documents/upload  # Upload file(s) (multipart/form-data)
                            # Supports multiple files
                            # Max 10 MB per file
GET  /api/documents         # List user's documents
GET  /api/documents/:id/status  # Get processing status
DELETE /api/documents/:id   # Delete document
```

### Query Endpoints
```typescript
POST /api/query             # Send query (non-streaming)
WebSocket: query:stream     # Send query (streaming)
```

### Conversation Endpoints
```typescript
POST   /api/conversations       # Create conversation
GET    /api/conversations       # List conversations
GET    /api/conversations/:id   # Get with messages
PATCH  /api/conversations/:id   # Update title
DELETE /api/conversations/:id   # Delete conversation
```

### WebSocket Events (Client → Server)
- `query:stream` - Send streaming query with conversationId and content

### WebSocket Events (Server → Client)
- `query:status` - Status updates during processing
- `query:sources` - Source document citations
- `query:chunk` - Streaming response chunks
- `query:complete` - Query completion signal
- `query:cached` - Cached response indicator
- `query:error` - Error messages

---

## 13. Key Implementation Notes

### Dark Mode Strategy
Since you want dark mode only:
1. Set `color-scheme: dark` on html element
2. Force `dark` class on document
3. Use Tailwind's `dark:` variants for any conditional styling
4. All shadcn components will use dark theme CSS variables
5. No toggle needed - pure dark experience

### WebSocket Streaming Flow
```
User sends message
       ↓
Emit 'query:stream' event
       ↓
Listen for events:
  • 'query:status' → Show "Searching documents..."
  • 'query:sources' → Display source citations panel
  • 'query:chunk' → Append text to streaming message
  • 'query:complete' → Finalize, enable input
  • 'query:cached' → Show "Cached" badge
  • 'query:error' → Show error toast
```

### File Upload Flow (Chat & Documents Page)
```
User selects/drops file(s)
       ↓
Validate files (size, type, count)
       ↓
Show file preview chips with status
       ↓
Upload starts in background
       ↓
Show progress per file
       ↓
POST to /api/documents/upload
       ↓
Receive document IDs
       ↓
Poll /api/documents/:id/status
       ↓
Update status (PROCESSING → COMPLETED/FAILED)
       ↓
Sync to both Chat and Documents views
       ↓
Show completion or error state
```

### Error Handling Strategy
- **Axios interceptors**: Global error handling for HTTP errors
- **React Error Boundaries**: Catch component rendering errors
- **Sonner toast notifications**: User-friendly error messages
- **Form validation**: Zod + React Hook Form for input validation
- **File validation**: Client-side before upload (size, type, count)
- **Fallback UI**: Skeleton loaders and empty states

### Chat Upload Constraints
```typescript
const UPLOAD_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024,     // 10 MB
  maxFilesPerUpload: 10,              // 10 files max
  allowedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ],
  allowedExtensions: ['.pdf', '.docx', '.txt', '.md']
};
```

---

## 14. Design Mockup Details

### Landing Page Sections
1. **Hero Section**
   - Large gradient headline
   - Subtitle description
   - CTA buttons (Get Started, View Demo)
   - Background with subtle pattern

2. **Features Section**
   - 3-4 feature cards in grid
   - Icons with accent color
   - Brief descriptions

3. **How It Works**
   - Step-by-step visual guide
   - Screenshots or illustrations

4. **Footer**
   - Logo
   - Links
   - Copyright

### Chat Interface Layout (with Upload)
```
┌──────────────────────────────────────────────────────────┐
│ Header: Logo + App Name + User Menu                      │
├──────────────────┬───────────────────────────────────────┤
│                  │                                       │
│ Conversation     │  Chat Messages                        │
│ List             │  ────────────────────────              │
│                  │  👤 User message                       │
│ 🔍 Search...     │  📄 report.pdf (attached)              │
│                  │  ────────────────────────              │
│ 📄 Chat 1        │  🤖 Assistant response                 │
│ 📄 Chat 2        │     with sources...                    │
│ 📄 Chat 3        │                                       │
│                  │  [Sources: Doc 1] [Doc 2]              │
│ [+ New Chat]     │                                       │
│                  │  File Attachments:                    │
│                  │  📄 file1.pdf ✓  📄 file2.docx ⏳ ❌   │
│                  │  ┌─────────────────────────────────┐  │
│                  │  │ [📎] Type message...     [Send] │  │
│                  │  └─────────────────────────────────┘  │
│                  │                                       │
└──────────────────┴───────────────────────────────────────┘
```

### Document Management Layout
```
┌──────────────────────────────────────────────────────────┐
│ Header: Documents                            [Upload +]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Upload Zone (Drag & Drop or Click)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │      📁 Drop files here or click to upload         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Your Documents (includes files from chat)               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│  │ 📄 document.pdf │ │ 📄 notes.docx   │ │ 📄 data.txt │ │
│  │    ✅ Ready     │ │   ⏳ Processing │ │   ✅ Ready  │ │
│  │    2.5 MB       │ │    1.2 MB       │ │   500 KB    │ │
│  │ Source: Chat    │ │ Source: Docs    │ │ Source: Chat│ │
│  │ [View] [Delete] │ │ [Cancel]        │ │ [View] [🗑️]│ │
│  └─────────────────┘ └─────────────────┘ └─────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 15. Testing Checklist

### Functional Testing
- [ ] User can register new account
- [ ] User can login with valid credentials
- [ ] User sees error on invalid login
- [ ] Token refreshes automatically on 401
- [ ] User can logout
- [ ] Protected routes redirect to login when not authenticated
- [ ] User can upload single file from chat
- [ ] User can upload multiple files (up to 10) from chat
- [ ] File size validation works (10 MB limit)
- [ ] File type validation works (PDF, DOCX, TXT, MD only)
- [ ] Duplicate file detection works
- [ ] Upload progress is shown per file
- [ ] Uploaded files appear in Documents page
- [ ] Documents from chat show "Source: Chat" label
- [ ] Documents page upload works independently
- [ ] Document status updates from PROCESSING to COMPLETED
- [ ] User can delete document from both views
- [ ] User can create new conversation
- [ ] User can send message with attachments
- [ ] Streaming response displays smoothly
- [ ] Source citations appear below AI response
- [ ] User can switch between conversations
- [ ] User can edit conversation title
- [ ] User can delete conversation
- [ ] Conversation list updates in real-time

### UI/UX Testing
- [ ] Dark mode is consistent across all pages
- [ ] Loading states show skeletons
- [ ] Empty states are helpful
- [ ] Error messages are user-friendly
- [ ] All buttons have hover states
- [ ] All interactive elements have focus states
- [ ] Scroll areas work smoothly
- [ ] Responsive design works on mobile
- [ ] Responsive design works on tablet
- [ ] Responsive design works on desktop
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Enter key sends message in chat
- [ ] Escape key closes modals
- [ ] File chips are scrollable when many files
- [ ] Upload progress is visually clear
- [ ] Document status indicators are clear

### Performance Testing
- [ ] Initial page load is fast (< 2s)
- [ ] Conversations list loads quickly
- [ ] Messages load without lag
- [ ] Streaming is smooth (no jank)
- [ ] File upload doesn't freeze UI
- [ ] Multiple file uploads work concurrently
- [ ] No memory leaks during long sessions
- [ ] Document list updates without full refresh

---

## 16. Next Steps

1. **Review this plan** - Ensure all requirements are captured
2. **Customize as needed** - Adjust colors, features, or priorities
3. **Begin implementation** - Start with Phase 1: Project Setup
4. **Iterate** - Build incrementally and test each phase

### Commands to Get Started

```bash
# 1. Navigate to project root
cd rag-system

# 2. Create frontend directory and initialize
npm create vite@latest frontend -- --template react-ts
cd frontend

# 3. Install Tailwind CSS v4.1
npm install tailwindcss @tailwindcss/vite

# 4. Configure files (see Section 2)
# - Update src/index.css
# - Update vite.config.ts
# - Update tsconfig.json

# 5. Initialize shadcn/ui
npx shadcn@latest init

# 6. Install dependencies
npm install react-router-dom zustand @tanstack/react-query axios
npm install socket.io-client react-hook-form @hookform/resolvers zod
npm install lucide-react date-fns clsx tailwind-merge @radix-ui/react-icons

# 7. Start development
npm run dev
```

---

## Appendix A: TypeScript Types

```typescript
// types/auth.types.ts
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// types/chat.types.ts
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: Source[];
  attachments?: Document[];  // NEW: Attached documents
  isStreaming?: boolean;
  createdAt: string;
}

export interface Source {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  content: string;
}

// NEW: Pending attachment type
export interface PendingAttachment {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  documentId?: string;
  error?: string;
}

// types/document.types.ts
export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  source: 'chat' | 'documents';  // NEW: Track upload origin
  errorMessage?: string;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

**Document Version**: 2.0  
**Last Updated**: 2026-02-10  
**Status**: Ready for Implementation

**Key Updates in v2.0**:
- Added Chat-Integrated Document Upload feature (Section 6)
- Multiple file upload support (max 10 files)
- 10 MB file size limit per file
- Global document availability across all conversations
- Real-time sync between Chat and Documents modules
- New components: AttachmentButton, FilePreviewChips, DocumentChip
- Updated store interfaces with chat upload tracking
- Extended Phase 6 for chat upload implementation
- Updated testing checklist for upload features
