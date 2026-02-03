import { QueryController } from '../controllers/query.controller';
import { getEmbeddingService } from '../services/embedding.service';
import { getVectorService } from '../services/vector.service';
import { getLLMService } from '../services/llm.service';
import { getCacheService } from '../services/cache.service';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    conversation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    message: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock('../services/embedding.service');
jest.mock('../services/vector.service');
jest.mock('../services/llm.service');
jest.mock('../services/cache.service');
jest.mock('../utils/logger');

describe('Query Flow', () => {
  let queryController: QueryController;
  let mockEmbedding: any;
  let mockVector: any;
  let mockLLM: any;
  let mockCache: any;
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    queryController = new QueryController();

    mockEmbedding = { generateEmbedding: jest.fn() };
    (getEmbeddingService as jest.Mock).mockReturnValue(mockEmbedding);

    mockVector = { similaritySearch: jest.fn() };
    (getVectorService as jest.Mock).mockReturnValue(mockVector);

    mockLLM = { generateResponse: jest.fn() };
    (getLLMService as jest.Mock).mockReturnValue(mockLLM);

    mockCache = {
      semanticSearch: jest.fn(),
      cacheQuery: jest.fn(),
    };
    (getCacheService as jest.Mock).mockReturnValue(mockCache);

    req = {
      body: { query: 'Test query' },
      user: { userId: 'user-123' }
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('query', () => {
    it('should return cached result if semantic cache hits', async () => {
      const cachedData = {
        response: 'Cached response',
        sources: []
      };
      mockCache.semanticSearch.mockResolvedValue(cachedData);

      await queryController.query(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ response: 'Cached response' })
      }));
    });

    it('should proceed with full RAG flow if cache misses', async () => {
      mockCache.semanticSearch.mockResolvedValue(null);
      mockEmbedding.generateEmbedding.mockResolvedValue([0.1]);
      mockVector.similaritySearch.mockResolvedValue([{
        score: 0.8, payload: { content: 'Context', documentId: 'd', filename: 'f', chunkId: 'c' }
      }]);
      mockLLM.generateResponse.mockResolvedValue('LLM Response');

      await queryController.query(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ response: 'LLM Response' })
      }));
    });

    it('should handle errors gracefully', async () => {
       mockCache.semanticSearch.mockRejectedValue(new Error('Redis Error'));

       await queryController.query(req, res);

       expect(res.status).toHaveBeenCalledWith(500);
       expect(res.json).toHaveBeenCalledWith({ error: 'Failed to process query' });
    });
  });
});
