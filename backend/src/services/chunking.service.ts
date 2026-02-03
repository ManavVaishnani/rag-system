import { TextChunk } from '../types';

export class ChunkingService {
  private readonly CHUNK_SIZE = 1000; // characters
  private readonly OVERLAP = 200; // 20% overlap

  chunkText(text: string): TextChunk[] {
    // Clean and normalize text
    const cleanedText = this.cleanText(text);
    const chunks: TextChunk[] = [];
    let startChar = 0;
    let index = 0;

    while (startChar < cleanedText.length) {
      const endChar = Math.min(startChar + this.CHUNK_SIZE, cleanedText.length);
      let chunkEnd = endChar;

      // Try to end at sentence boundary if not at end of text
      if (endChar < cleanedText.length) {
        const sentenceEnd = this.findSentenceEnd(cleanedText, startChar, endChar);
        if (sentenceEnd > startChar + this.CHUNK_SIZE / 2) {
          chunkEnd = sentenceEnd;
        }
      }

      const content = cleanedText.slice(startChar, chunkEnd).trim();

      if (content.length > 50) {
        // Only add chunks with meaningful content
        chunks.push({
          content,
          index,
          metadata: { startChar, endChar: chunkEnd },
        });
        index++;
      }

      // Move forward with overlap
      startChar = Math.max(startChar + 1, chunkEnd - this.OVERLAP);

      // Avoid infinite loop
      if (startChar >= cleanedText.length) break;
    }

    return chunks;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/[ \t]{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  private findSentenceEnd(text: string, start: number, end: number): number {
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n', '."', '!"', '?"'];

    for (let i = end; i > start + this.CHUNK_SIZE / 2; i--) {
      for (const ender of sentenceEnders) {
        if (text.slice(i, i + ender.length) === ender) {
          return i + 1;
        }
      }
    }

    // Fallback: try to end at a paragraph
    for (let i = end; i > start + this.CHUNK_SIZE / 2; i--) {
      if (text.slice(i, i + 2) === '\n\n') {
        return i;
      }
    }

    return end;
  }
}

// Singleton instance
let chunkingService: ChunkingService | null = null;

export function getChunkingService(): ChunkingService {
  if (!chunkingService) {
    chunkingService = new ChunkingService();
  }
  return chunkingService;
}
