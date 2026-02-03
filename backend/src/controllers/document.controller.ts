import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { getDocumentParserService } from '../services/document-parser.service';
import { getChunkingService } from '../services/chunking.service';
import { getEmbeddingService } from '../services/embedding.service';
import { getVectorService } from '../services/vector.service';
import { VectorData } from '../types';

export class DocumentController {
  async upload(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const userId = req.user!.userId;

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    let documentId: string | null = null;

    try {
      // Create document record
      const document = await prisma.document.create({
        data: {
          userId,
          filename: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'PROCESSING',
        },
      });

      documentId = document.id;

      // Process document asynchronously
      this.processDocument(document.id, file.path, file.mimetype, userId, file.originalname)
        .catch((error) => {
          logger.error(`Document processing failed for ${document.id}:`, error);
        });

      res.status(202).json({
        success: true,
        data: {
          id: document.id,
          filename: document.originalName,
          status: document.status,
          message: 'Document uploaded and processing started',
        },
      });
    } catch (error) {
      logger.error('Document upload failed:', error);

      // Clean up if document was created
      if (documentId) {
        await prisma.document.delete({ where: { id: documentId } }).catch(() => {});
      }

      res.status(500).json({ error: 'Failed to upload document' });
    }
  }

  private async processDocument(
    documentId: string,
    filePath: string,
    mimeType: string,
    userId: string,
    filename: string
  ): Promise<void> {
    const parserService = getDocumentParserService();
    const chunkingService = getChunkingService();
    const embeddingService = getEmbeddingService();
    const vectorService = getVectorService();

    try {
      // Parse document
      logger.info(`Parsing document: ${documentId}`);
      const text = await parserService.parseDocument(filePath, mimeType);

      if (!text || text.trim().length === 0) {
        throw new Error('Document contains no extractable text');
      }

      // Chunk text
      logger.info(`Chunking document: ${documentId}`);
      const chunks = chunkingService.chunkText(text);

      if (chunks.length === 0) {
        throw new Error('No chunks generated from document');
      }

      // Generate embeddings
      logger.info(`Generating embeddings for ${chunks.length} chunks`);
      const embeddings = await embeddingService.batchGenerateEmbeddings(
        chunks.map((c) => c.content)
      );

      // Prepare vector data
      const vectorData: VectorData[] = [];
      const chunkRecords: {
        documentId: string;
        content: string;
        chunkIndex: number;
        vectorId: string;
        metadata: object;
      }[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const vectorId = uuidv4();
        const chunk = chunks[i];

        vectorData.push({
          id: vectorId,
          vector: embeddings[i],
          payload: {
            documentId,
            chunkId: vectorId,
            content: chunk.content,
            chunkIndex: chunk.index,
            userId,
            filename,
          },
        });

        chunkRecords.push({
          documentId,
          content: chunk.content,
          chunkIndex: chunk.index,
          vectorId,
          metadata: chunk.metadata,
        });
      }

      // Store vectors in Qdrant
      logger.info(`Storing ${vectorData.length} vectors in Qdrant`);
      await vectorService.upsertVectors(vectorData);

      // Store chunks in database
      await prisma.documentChunk.createMany({
        data: chunkRecords,
      });

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'COMPLETED',
          chunkCount: chunks.length,
        },
      });

      logger.info(`Document processed successfully: ${documentId}`);
    } catch (error) {
      logger.error(`Document processing failed: ${documentId}`, error);

      // Update document status to failed
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } finally {
      // Clean up uploaded file
      await parserService.deleteFile(filePath);
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            status: true,
            chunkCount: true,
            errorMessage: true,
            createdAt: true,
          },
        }),
        prisma.document.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('List documents failed:', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      const document = await prisma.document.findFirst({
        where: { id, userId },
        select: {
          id: true,
          originalName: true,
          status: true,
          chunkCount: true,
          errorMessage: true,
          createdAt: true,
        },
      });

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      logger.error('Get document status failed:', error);
      res.status(500).json({ error: 'Failed to get document status' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      // Verify document belongs to user
      const document = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Delete vectors from Qdrant
      const vectorService = getVectorService();
      await vectorService.deleteByDocumentId(id);

      // Delete document (cascades to chunks)
      await prisma.document.delete({ where: { id } });

      logger.info(`Document deleted: ${id}`);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      logger.error('Delete document failed:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
}

export const documentController = new DocumentController();
