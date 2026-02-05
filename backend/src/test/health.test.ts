import request from "supertest";
import app from "../app";

describe("Health Check", () => {
  it("should return comprehensive health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("version");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("checks");
    expect(res.body.checks).toHaveProperty("database");
    expect(res.body.checks).toHaveProperty("redis");
    expect(res.body.checks).toHaveProperty("qdrant");
  });

  it("should return liveness status", async () => {
    const res = await request(app).get("/health/live");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("alive");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("should return readiness status", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });
});
