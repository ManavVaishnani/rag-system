import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../utils/logger';

export class DocumentParserService {
  async parseDocument(filePath: string, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.parsePDF(filePath);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseDOCX(filePath);
        case 'text/plain':
        case 'text/markdown':
          return await this.parseText(filePath);
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      logger.error('Document parsing failed:', error);
      throw error;
    }
  }

  private async parsePDF(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  private async parseDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async parseText(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to delete file ${filePath}:`, error);
    }
  }
}

// Singleton instance
let documentParserService: DocumentParserService | null = null;

export function getDocumentParserService(): DocumentParserService {
  if (!documentParserService) {
    documentParserService = new DocumentParserService();
  }
  return documentParserService;
}
