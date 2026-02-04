import { ChunkingService } from "../services/chunking.service";

describe("ChunkingService", () => {
  let chunkingService: ChunkingService;

  beforeEach(() => {
    chunkingService = new ChunkingService();
  });

  it("should clean and normalize text", () => {
    const dirtyText =
      "Line 1\r\nLine 2\n\n\nLine 3    Space. This is some extra padding content to make the text loger than 50 characters so it actually gets chunked.";
    const chunks = chunkingService.chunkText(dirtyText);

    expect(chunks[0].content).not.toContain("\r");
    expect(chunks[0].content).not.toContain("\n\n\n");
    expect(chunks[0].content).not.toContain("    ");
  });

  it("should create chunks of appropriate size", () => {
    const longText =
      "This is a test sentence that will be repeated many times to create a large enough text for multiple chunks. ".repeat(
        25,
      );
    const chunks = chunkingService.chunkText(longText);

    expect(chunks.length).toBeGreaterThan(1);

    chunks.forEach((chunk) => {
      expect(chunk.content.length).toBeLessThanOrEqual(1100);
      expect(chunk.content.length).toBeGreaterThan(50);
    });
  });

  it("should attempt to respect sentence boundaries", () => {
    const text =
      "First sentence. Second sentence. Third sentence. Fourth sentence.";
    const chunks = chunkingService.chunkText(text);
    expect(chunks.length).toBe(1);

    const sentence =
      "This is a long sentence that stays together because it is one unit of thought. ";
    const longTextWithBoundaries = sentence.repeat(30);
    const chunksWithBoundaries = chunkingService.chunkText(
      longTextWithBoundaries,
    );

    chunksWithBoundaries.forEach((chunk) => {
      const lastChar = chunk.content.slice(-1);
      const possibleEnders = [".", "!", "?", '"'];
      if (chunk.index < chunksWithBoundaries.length - 1) {
        expect(possibleEnders).toContain(lastChar);
      }
    });
  });

  it("should have overlap between consecutive chunks", () => {
    const longText =
      "Sentence A. Sentence B. Sentence C. Sentence D. Sentence E. ".repeat(30);
    const chunks = chunkingService.chunkText(longText);

    if (chunks.length > 1) {
      const firstChunkEnd = chunks[0].content.slice(-50);
      const secondChunkStart = chunks[1].content.slice(0, 100);

      let foundOverlap = false;
      const words = firstChunkEnd.split(" ");
      for (const word of words) {
        if (word.length > 5 && secondChunkStart.includes(word)) {
          foundOverlap = true;
          break;
        }
      }
      expect(foundOverlap).toBe(true);
    }
  });

  it("should include metadata about character offsets", () => {
    const text = "Start content. Mid content. End content.".repeat(50);
    const chunks = chunkingService.chunkText(text);

    chunks.forEach((chunk) => {
      expect(chunk.metadata).toBeDefined();
      expect(chunk.metadata.endChar).toBeGreaterThan(chunk.metadata.startChar);
    });
  });
});
