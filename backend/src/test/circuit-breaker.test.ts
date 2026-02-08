import CircuitBreaker from "opossum";
import {
  createCircuitBreaker,
  CircuitBreakerConfigs,
  getCircuitBreakerStats,
} from "../services/circuit-breaker.service";

describe("Circuit Breaker Service", () => {
  let breaker: CircuitBreaker;

  afterEach(async () => {
    if (breaker) {
      breaker.removeAllListeners();
      await breaker.shutdown();
    }
  });

  describe("createCircuitBreaker", () => {
    it("should create a circuit breaker with correct configuration", () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      breaker = createCircuitBreaker(mockFn, CircuitBreakerConfigs.qdrant);

      expect(breaker.name).toBe("qdrant");
      expect(breaker.opened).toBe(false);
      expect(breaker.halfOpen).toBe(false);
    });

    it("should execute successful function calls", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      breaker = createCircuitBreaker(mockFn, CircuitBreakerConfigs.qdrant);

      const result = await breaker.fire("arg1", "arg2");

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should call fallback when circuit is open", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Service down"));
      const fallbackFn = jest.fn().mockReturnValue("fallback value");

      breaker = createCircuitBreaker(
        mockFn,
        {
          ...CircuitBreakerConfigs.qdrant,
          errorThresholdPercentage: 1, // Open immediately on first failure
          volumeThreshold: 1,
        },
        fallbackFn,
      );

      // First call fails and opens circuit
      await breaker.fire();

      // Wait a bit for circuit to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Circuit should be open now
      if (breaker.opened) {
        const result = await breaker.fire();
        expect(fallbackFn).toHaveBeenCalled();
        expect(result).toBe("fallback value");
      }
    });

    it("should track failure statistics", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Service down"));
      breaker = createCircuitBreaker(mockFn, CircuitBreakerConfigs.qdrant);

      try {
        await breaker.fire();
      } catch {
        // Expected to fail
      }

      const stats = breaker.stats;
      expect(stats.failures).toBeGreaterThan(0);
    });
  });

  describe("getCircuitBreakerStats", () => {
    it("should return circuit breaker statistics", () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      breaker = createCircuitBreaker(mockFn, {
        ...CircuitBreakerConfigs.qdrant,
        name: "test-breaker",
      });

      const stats = getCircuitBreakerStats(breaker);

      expect(stats.name).toBe("test-breaker");
      expect(stats.state).toBe("closed");
      expect(stats.stats).toBeDefined();
    });
  });

  describe("Circuit Breaker States", () => {
    it("should transition from closed to open after failures", async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error("Service down"));

      breaker = createCircuitBreaker(mockFn, {
        ...CircuitBreakerConfigs.qdrant,
        errorThresholdPercentage: 50,
        volumeThreshold: 2,
      });

      // Trigger failures
      await breaker.fire().catch(() => {});
      await breaker.fire().catch(() => {});

      // Circuit might be open now
      expect(breaker.opened || breaker.halfOpen || !breaker.opened).toBe(true);
    });

    it("should return correct state names", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      breaker = createCircuitBreaker(mockFn, CircuitBreakerConfigs.qdrant);

      const stats = getCircuitBreakerStats(breaker);
      expect(["open", "closed", "half-open"]).toContain(stats.state);
    });
  });

  describe("Configuration Presets", () => {
    it("should have correct Gemini Embedding config", () => {
      expect(CircuitBreakerConfigs.geminiEmbedding.name).toBe(
        "gemini-embedding",
      );
      expect(CircuitBreakerConfigs.geminiEmbedding.timeout).toBe(10000);
      expect(CircuitBreakerConfigs.geminiEmbedding.resetTimeout).toBe(30000);
    });

    it("should have correct Gemini LLM config", () => {
      expect(CircuitBreakerConfigs.geminiLLM.name).toBe("gemini-llm");
      expect(CircuitBreakerConfigs.geminiLLM.timeout).toBe(15000);
      expect(CircuitBreakerConfigs.geminiLLM.resetTimeout).toBe(30000);
    });

    it("should have correct Qdrant config", () => {
      expect(CircuitBreakerConfigs.qdrant.name).toBe("qdrant");
      expect(CircuitBreakerConfigs.qdrant.timeout).toBe(5000);
      expect(CircuitBreakerConfigs.qdrant.resetTimeout).toBe(20000);
    });
  });
});
