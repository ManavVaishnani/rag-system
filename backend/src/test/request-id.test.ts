import request from "supertest";
import app from "../app";

describe("Request ID Middleware", () => {
  it("should generate and return X-Request-ID header", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("should accept and propagate existing X-Request-ID header", async () => {
    const existingRequestId = "12345678-1234-4123-8234-123456789abc";
    const res = await request(app)
      .get("/health")
      .set("X-Request-ID", existingRequestId);

    expect(res.status).toBe(200);
    expect(res.headers["x-request-id"]).toBe(existingRequestId);
  });

  it("should return unique request IDs for different requests", async () => {
    const res1 = await request(app).get("/health");
    const res2 = await request(app).get("/health");

    expect(res1.headers["x-request-id"]).toBeDefined();
    expect(res2.headers["x-request-id"]).toBeDefined();
    expect(res1.headers["x-request-id"]).not.toBe(res2.headers["x-request-id"]);
  });
});
