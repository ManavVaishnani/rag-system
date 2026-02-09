export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "RAG System API",
    description:
      "A production-ready Retrieval-Augmented Generation (RAG) system API powered by Google's Gemini and Qdrant vector database. Upload documents, query them using natural language, and get AI-powered responses with source citations.\n\n## Monitoring\n\nPrometheus metrics are exposed on a separate port (default: 9090) at `http://localhost:9090/metrics`. Metrics include HTTP request duration, external API calls (Gemini, Qdrant), business metrics (documents, queries), Redis operations, and circuit breaker states.",
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
    {
      url: "https://api.example.com",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Health",
      description:
        "Health check endpoints for monitoring and Kubernetes probes",
    },
    {
      name: "Authentication",
      description: "User authentication and token management",
    },
    {
      name: "Documents",
      description: "Document upload, management, and processing",
    },
    {
      name: "Query",
      description: "Natural language queries with AI responses",
    },
    {
      name: "Conversations",
      description: "Conversation management for chat history",
    },
    {
      name: "Vectors",
      description: "Vector database management operations",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Comprehensive health check",
        description:
          "Returns detailed health status including database, Redis, and Qdrant connectivity checks with response times.",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Service is healthy or degraded",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthCheckResponse",
                },
              },
            },
          },
          "503": {
            description: "Service is unhealthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthCheckResponse",
                },
              },
            },
          },
        },
      },
    },
    "/health/live": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        description:
          "Kubernetes-style liveness probe. Returns 200 if the application is running.",
        operationId: "getLiveness",
        responses: {
          "200": {
            description: "Application is alive",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LivenessResponse",
                },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        tags: ["Health"],
        summary: "Readiness probe",
        description:
          "Kubernetes-style readiness probe. Returns 200 if the application is ready to serve traffic.",
        operationId: "getReadiness",
        responses: {
          "200": {
            description: "Application is ready",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReadinessResponse",
                },
              },
            },
          },
          "503": {
            description: "Application is not ready",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReadinessResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description:
          "Create a new user account with email and password. Returns user data with access and refresh tokens.",
        operationId: "registerUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "400": {
            description: "Validation error or email already registered",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        description:
          "Authenticate user with email and password. Returns user data with access and refresh tokens.",
        operationId: "loginUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        description:
          "Get a new access token using a valid refresh token. The old refresh token is invalidated and a new one is issued.",
        operationId: "refreshToken",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RefreshTokenRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token refreshed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TokenResponse",
                },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user",
        description: "Get information about the currently authenticated user.",
        operationId: "getCurrentUser",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "User information retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UserResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout user",
        description: "Logout the current user and revoke all refresh tokens.",
        operationId: "logoutUser",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/documents/upload": {
      post: {
        tags: ["Documents"],
        summary: "Upload a document",
        description:
          "Upload a document (PDF, DOCX, TXT, or MD) for processing. The document will be parsed, chunked, and embedded asynchronously.",
        operationId: "uploadDocument",
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description:
                      "Document file (PDF, DOCX, TXT, MD). Max size: 10MB",
                  },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Document uploaded and processing started",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DocumentUploadResponse",
                },
              },
            },
          },
          "400": {
            description: "No file provided or invalid file type",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "413": {
            description: "File too large",
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents",
        description:
          "Get a paginated list of documents for the authenticated user.",
        operationId: "listDocuments",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number (default: 1)",
            schema: {
              type: "integer",
              default: 1,
              minimum: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Items per page (default: 20, max: 100)",
            schema: {
              type: "integer",
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        responses: {
          "200": {
            description: "Documents retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DocumentListResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/documents/{id}/status": {
      get: {
        tags: ["Documents"],
        summary: "Get document status",
        description: "Get the processing status of a specific document.",
        operationId: "getDocumentStatus",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Document ID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Document status retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DocumentStatusResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "Document not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/documents/{id}": {
      delete: {
        tags: ["Documents"],
        summary: "Delete document",
        description: "Delete a document and all associated vectors.",
        operationId: "deleteDocument",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Document ID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Document deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "Document not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/query": {
      post: {
        tags: ["Query"],
        summary: "Send a query",
        description:
          "Send a natural language query and get an AI-generated response based on your uploaded documents. Results include source citations.",
        operationId: "sendQuery",
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/QueryRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Query processed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/QueryResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/conversations": {
      get: {
        tags: ["Conversations"],
        summary: "List conversations",
        description:
          "Get a paginated list of conversations for the authenticated user.",
        operationId: "listConversations",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number (default: 1)",
            schema: {
              type: "integer",
              default: 1,
              minimum: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Items per page (default: 20, max: 100)",
            schema: {
              type: "integer",
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        responses: {
          "200": {
            description: "Conversations retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ConversationListResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Conversations"],
        summary: "Create conversation",
        description: "Create a new conversation with an optional title.",
        operationId: "createConversation",
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Conversation title",
                    example: "Project Discussion",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Conversation created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ConversationResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/conversations/{id}": {
      get: {
        tags: ["Conversations"],
        summary: "Get conversation",
        description: "Get a conversation with all its messages.",
        operationId: "getConversation",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Conversation ID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Conversation retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ConversationWithMessagesResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "Conversation not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Conversations"],
        summary: "Update conversation",
        description: "Update a conversation's title.",
        operationId: "updateConversation",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Conversation ID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "New conversation title",
                    example: "Updated Title",
                  },
                },
                required: ["title"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Conversation updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ConversationResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "Conversation not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Conversations"],
        summary: "Delete conversation",
        description: "Delete a conversation and all its messages.",
        operationId: "deleteConversation",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Conversation ID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Conversation deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "Conversation not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/vectors/document/{documentId}": {
      delete: {
        tags: ["Vectors"],
        summary: "Delete document vectors",
        description:
          "Delete all vectors associated with a specific document from the vector database.",
        operationId: "deleteDocumentVectors",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "documentId",
            in: "path",
            required: true,
            description: "Document ID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Vectors deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "Document not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/vectors/user/{userId}": {
      delete: {
        tags: ["Vectors"],
        summary: "Delete user vectors",
        description:
          "Delete all vectors for a specific user. Users can only delete their own vectors.",
        operationId: "deleteUserVectors",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            description: "User ID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Vectors deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "403": {
            description: "Cannot delete vectors for other users",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/vectors/all": {
      delete: {
        tags: ["Vectors"],
        summary: "Delete all user vectors",
        description: "Delete all vectors for the currently authenticated user.",
        operationId: "deleteAllUserVectors",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "All vectors deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/vectors/admin/all": {
      delete: {
        tags: ["Vectors"],
        summary: "Delete all vectors (admin)",
        description: "Delete all vectors from the collection. Admin operation.",
        operationId: "deleteAllVectorsAdmin",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "All vectors deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded",
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthCheckResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["healthy", "degraded", "unhealthy"],
            example: "healthy",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
          version: {
            type: "string",
            example: "1.0.0",
          },
          uptime: {
            type: "number",
            description: "Server uptime in seconds",
            example: 3600,
          },
          checks: {
            type: "object",
            properties: {
              database: {
                $ref: "#/components/schemas/HealthCheck",
              },
              redis: {
                $ref: "#/components/schemas/HealthCheck",
              },
              qdrant: {
                $ref: "#/components/schemas/HealthCheck",
              },
            },
          },
        },
      },
      HealthCheck: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["up", "down"],
            example: "up",
          },
          responseTime: {
            type: "integer",
            description: "Response time in milliseconds",
            example: 5,
          },
          message: {
            type: "string",
            description: "Error message if status is down",
            example: "Connection refused",
          },
        },
      },
      LivenessResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["alive"],
            example: "alive",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
        },
      },
      ReadinessResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ready", "not ready"],
            example: "ready",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
          failedChecks: {
            type: "array",
            description: "List of failed checks when status is 'not ready'",
            items: {
              $ref: "#/components/schemas/FailedCheck",
            },
          },
        },
      },
      FailedCheck: {
        type: "object",
        properties: {
          name: {
            type: "string",
            example: "database",
          },
          status: {
            type: "string",
            enum: ["down"],
            example: "down",
          },
          responseTime: {
            type: "integer",
            example: 5000,
          },
          message: {
            type: "string",
            example: "Connection timeout",
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            description:
              "Must contain at least one uppercase, one lowercase, and one number",
            example: "SecurePass123",
          },
          name: {
            type: "string",
            minLength: 2,
            example: "John Doe",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "SecurePass123",
          },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: {
            type: "string",
            description: "Valid refresh token",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              user: {
                $ref: "#/components/schemas/User",
              },
              tokens: {
                $ref: "#/components/schemas/TokenPair",
              },
            },
          },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              tokens: {
                $ref: "#/components/schemas/TokenPair",
              },
            },
          },
        },
      },
      TokenPair: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            description: "JWT access token (valid for 15 minutes)",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          refreshToken: {
            type: "string",
            description: "JWT refresh token (valid for 7 days)",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              user: {
                $ref: "#/components/schemas/UserWithStats",
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          name: {
            type: "string",
            example: "John Doe",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
        },
      },
      UserWithStats: {
        allOf: [
          {
            $ref: "#/components/schemas/User",
          },
          {
            type: "object",
            properties: {
              _count: {
                type: "object",
                properties: {
                  documents: {
                    type: "integer",
                    example: 5,
                  },
                  conversations: {
                    type: "integer",
                    example: 10,
                  },
                },
              },
            },
          },
        ],
      },
      DocumentUploadResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              id: {
                type: "string",
                format: "uuid",
                example: "550e8400-e29b-41d4-a716-446655440000",
              },
              filename: {
                type: "string",
                example: "document.pdf",
              },
              status: {
                type: "string",
                enum: ["PROCESSING", "COMPLETED", "FAILED"],
                example: "PROCESSING",
              },
              message: {
                type: "string",
                example: "Document uploaded and processing started",
              },
            },
          },
        },
      },
      DocumentListResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Document",
            },
          },
          pagination: {
            $ref: "#/components/schemas/Pagination",
          },
        },
      },
      DocumentStatusResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            $ref: "#/components/schemas/Document",
          },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          originalName: {
            type: "string",
            example: "document.pdf",
          },
          fileSize: {
            type: "integer",
            description: "File size in bytes",
            example: 1048576,
          },
          mimeType: {
            type: "string",
            example: "application/pdf",
          },
          status: {
            type: "string",
            enum: ["PROCESSING", "COMPLETED", "FAILED"],
            example: "COMPLETED",
          },
          chunkCount: {
            type: "integer",
            example: 42,
          },
          errorMessage: {
            type: "string",
            description: "Error message if status is FAILED",
            example: "Document contains no extractable text",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
        },
      },
      QueryRequest: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 2000,
            description: "Natural language query",
            example: "What are the main points discussed in the document?",
          },
          conversationId: {
            type: "string",
            format: "uuid",
            description:
              "Optional conversation ID to add this query to an existing conversation",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        },
      },
      QueryResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              response: {
                type: "string",
                description: "AI-generated response",
                example:
                  "Based on your documents, the main points discussed are...",
              },
              sources: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/SourceCitation",
                },
              },
              conversationId: {
                type: "string",
                format: "uuid",
                example: "550e8400-e29b-41d4-a716-446655440000",
              },
              cached: {
                type: "boolean",
                description: "Whether the response was retrieved from cache",
                example: false,
              },
            },
          },
        },
      },
      SourceCitation: {
        type: "object",
        properties: {
          documentId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          chunkId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440001",
          },
          filename: {
            type: "string",
            example: "document.pdf",
          },
          content: {
            type: "string",
            description: "Relevant content snippet (first 200 chars)",
            example:
              "This is the relevant text from the document that was used to generate the response...",
          },
          score: {
            type: "number",
            description: "Similarity score (0-1)",
            example: 0.85,
          },
        },
      },
      ConversationListResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ConversationWithCount",
            },
          },
          pagination: {
            $ref: "#/components/schemas/Pagination",
          },
        },
      },
      ConversationResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            $ref: "#/components/schemas/Conversation",
          },
        },
      },
      ConversationWithMessagesResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            allOf: [
              {
                $ref: "#/components/schemas/Conversation",
              },
              {
                type: "object",
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Message",
                    },
                  },
                },
              },
            ],
          },
        },
      },
      Conversation: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          userId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440001",
          },
          title: {
            type: "string",
            example: "Project Discussion",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T11:30:00.000Z",
          },
        },
      },
      ConversationWithCount: {
        allOf: [
          {
            $ref: "#/components/schemas/Conversation",
          },
          {
            type: "object",
            properties: {
              _count: {
                type: "object",
                properties: {
                  messages: {
                    type: "integer",
                    example: 15,
                  },
                },
              },
            },
          },
        ],
      },
      Message: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
          conversationId: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440001",
          },
          role: {
            type: "string",
            enum: ["USER", "ASSISTANT"],
            example: "ASSISTANT",
          },
          content: {
            type: "string",
            example: "Based on your documents, I can see that...",
          },
          sources: {
            type: "array",
            description: "Source citations for assistant messages",
            items: {
              $ref: "#/components/schemas/SourceCitation",
            },
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 20,
          },
          total: {
            type: "integer",
            example: 100,
          },
          totalPages: {
            type: "integer",
            example: 5,
          },
        },
      },
      SuccessMessageResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Error message describing what went wrong",
          },
          details: {
            type: "string",
            description: "Additional error details (development mode only)",
            example: "Stack trace or additional context",
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
    },
  },
} as const;
