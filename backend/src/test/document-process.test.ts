import { DocumentController } from "../controllers/document.controller";
import { prisma } from "../config/database";
import { getDocumentParserService } from "../services/document-parser.service";
import { getChunkingService } from "../services/chunking.service";
import { getEmbeddingService } from "../services/embedding.service";
import { getVectorService } from "../services/vector.service";

// Mock dependencies
jest.mock("../config/database", () => ({
  prisma: {
    document: {
      update: jest.fn(),
    },
    documentChunk: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock("../services/document-parser.service");
jest.mock("../services/chunking.service");
jest.mock("../services/embedding.service");
jest.mock("../services/vector.service");
jest.mock("../utils/logger");

describe("Document Process Flow", () => {
  let documentController: DocumentController;
  let mockParser: any;
  let mockChunking: any;
  let mockEmbedding: any;
  let mockVector: any;

  beforeEach(() => {
    jest.clearAllMocks();
    documentController = new DocumentController();

    // Setup mock services
    mockParser = {
      parseDocument: jest.fn(),
      deleteFile: jest.fn(),
    };
    (getDocumentParserService as jest.Mock).mockReturnValue(mockParser);

    mockChunking = {
      chunkText: jest.fn(),
    };
    (getChunkingService as jest.Mock).mockReturnValue(mockChunking);

    mockEmbedding = {
      batchGenerateEmbeddings: jest.fn(),
    };
    (getEmbeddingService as jest.Mock).mockReturnValue(mockEmbedding);

    mockVector = {
      upsertVectors: jest.fn(),
    };
    (getVectorService as jest.Mock).mockReturnValue(mockVector);
  });

  describe("processDocument", () => {
    const documentId = "test-doc-id";
    const filePath = "/uploads/test-file.pdf";
    const mimeType = "application/pdf";
    const userId = "test-user-id";
    const filename = "test-file.pdf";

    it("should successfully parse, chunk, embed, and store document data", async () => {
      // 1. Mock Parse result
      const parsedText =
        "This is a test document content. It has multiple sentences to test chunking flow.";
      mockParser.parseDocument.mockResolvedValue(parsedText);

      // 2. Mock Chunking result
      const mockChunks = [
        {
          content: "This is a test document content.",
          index: 0,
          metadata: { startChar: 0, endChar: 31 },
        },
        {
          content: "It has multiple sentences to test chunking flow.",
          index: 1,
          metadata: { startChar: 32, endChar: 80 },
        },
      ];
      mockChunking.chunkText.mockReturnValue(mockChunks);

      // 3. Mock Embedding result
      const mockEmbeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ];
      mockEmbedding.batchGenerateEmbeddings.mockResolvedValue(mockEmbeddings);

      // 4. Mock Vector storage success
      mockVector.upsertVectors.mockResolvedValue(undefined);

      // 5. Mock Database success
      (prisma.documentChunk.createMany as jest.Mock).mockResolvedValue({
        count: 2,
      });
      (prisma.document.update as jest.Mock).mockResolvedValue({
        id: documentId,
      });

      // Execute the private method using array notation to bypass access modifier
      await (documentController as any).processDocument(
        documentId,
        filePath,
        mimeType,
        userId,
        filename,
      );

      // Assertions
      expect(mockParser.parseDocument).toHaveBeenCalledWith(filePath, mimeType);
      expect(mockChunking.chunkText).toHaveBeenCalledWith(parsedText);
      expect(mockEmbedding.batchGenerateEmbeddings).toHaveBeenCalledWith(
        mockChunks.map((c) => c.content),
      );

      // Verify Vector storage called with correct structure
      expect(mockVector.upsertVectors).toHaveBeenCalledTimes(1);
      const vectorData = mockVector.upsertVectors.mock.calls[0][0];
      expect(vectorData).toHaveLength(2);
      expect(vectorData[0]).toMatchObject({
        vector: mockEmbeddings[0],
        payload: {
          documentId,
          content: mockChunks[0].content,
          userId,
          filename,
        },
      });

      // Verify DB updates
      expect(prisma.documentChunk.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          status: "COMPLETED",
          chunkCount: 2,
        },
      });

      // Verify file cleanup happens in success case
      expect(mockParser.deleteFile).toHaveBeenCalledWith(filePath);
    });

    it("should fail and update status if document contains no extractable text", async () => {
      mockParser.parseDocument.mockResolvedValue("   "); // Empty/whitespace text

      await (documentController as any).processDocument(
        documentId,
        filePath,
        mimeType,
        userId,
        filename,
      );

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          status: "FAILED",
          errorMessage: "Document contains no extractable text",
        },
      });

      // Cleanup should still happen
      expect(mockParser.deleteFile).toHaveBeenCalledWith(filePath);
    });

    it("should fail and update status if any service throws an error", async () => {
      const errorMsg = "Vector DB Connection Refused";
      mockParser.parseDocument.mockResolvedValue("Some valid text");
      mockChunking.chunkText.mockReturnValue([
        {
          content: "Chunk 1",
          index: 0,
          metadata: { startChar: 0, endChar: 7 },
        },
      ]);
      mockEmbedding.batchGenerateEmbeddings.mockResolvedValue([[0.1]]);

      // Force error in vector service
      mockVector.upsertVectors.mockRejectedValue(new Error(errorMsg));

      await (documentController as any).processDocument(
        documentId,
        filePath,
        mimeType,
        userId,
        filename,
      );

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          status: "FAILED",
          errorMessage: errorMsg,
        },
      });

      // Cleanup should still happen
      expect(mockParser.deleteFile).toHaveBeenCalledWith(filePath);
    });

    it("should handle unsupported file types by throwing error in parser", async () => {
      const unsupportedMime = "image/jpeg";
      mockParser.parseDocument.mockRejectedValue(
        new Error(`Unsupported file type: ${unsupportedMime}`),
      );

      await (documentController as any).processDocument(
        documentId,
        filePath,
        unsupportedMime,
        userId,
        filename,
      );

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          status: "FAILED",
          errorMessage: expect.stringContaining("Unsupported file type"),
        },
      });

      expect(mockParser.deleteFile).toHaveBeenCalledWith(filePath);
    });
  });
});
