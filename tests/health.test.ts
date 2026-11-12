import request from "supertest";
import app from "../src/app";

describe("GET /api/v1/health", () => {
  it("should return 200 and health message", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      uptime: expect.any(Number),
    });
  });
});
