import request from "supertest";
import app from "../app";
import { cleanDatabase } from "./setup";

describe("Auth Endpoints", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const testUser = {
    email: "test@example.com",
    password: "Password123!",
    name: "Test User",
  };

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.tokens).toHaveProperty("accessToken");
    expect(res.body.data.tokens).toHaveProperty("refreshToken");
  });

  it("should not register a user with an existing email", async () => {
    // First registration
    await request(app).post("/api/auth/register").send(testUser);

    // Second registration with same email
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email already registered");
  });

  it("should login an existing user", async () => {
    // Register first
    await request(app).post("/api/auth/register").send(testUser);

    // Login
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty("accessToken");
    expect(res.body.data.tokens).toHaveProperty("refreshToken");
  });

  it("should not login with wrong password", async () => {
    // Register first
    await request(app).post("/api/auth/register").send(testUser);

    // Login with wrong password
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should get current user info with access token", async () => {
    // Register
    const regRes = await request(app).post("/api/auth/register").send(testUser);

    const accessToken = regRes.body.data.tokens.accessToken;

    // Get /me
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it("should refresh access token using refresh token", async () => {
    // Register first
    const regRes = await request(app).post("/api/auth/register").send(testUser);
    const refreshToken = regRes.body.data.tokens.refreshToken;

    // Refresh tokens
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty("accessToken");
    expect(res.body.data.tokens).toHaveProperty("refreshToken");
  });

  it("should not refresh with invalid refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "invalid-token",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired refresh token");
  });

  it("should logout user and revoke tokens", async () => {
    // Register
    const regRes = await request(app).post("/api/auth/register").send(testUser);
    const accessToken = regRes.body.data.tokens.accessToken;
    const refreshToken = regRes.body.data.tokens.refreshToken;

    // Logout
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.message).toBe("Logged out successfully");

    // Try to refresh with revoked token
    const refreshRes = await request(app).post("/api/auth/refresh").send({
      refreshToken,
    });

    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.error).toBe("Invalid or expired refresh token");
  });

  it("should reject requests with refresh token as access token", async () => {
    // Register
    const regRes = await request(app).post("/api/auth/register").send(testUser);
    const refreshToken = regRes.body.data.tokens.refreshToken;

    // Try to use refresh token as access token
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${refreshToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token type");
  });
});
