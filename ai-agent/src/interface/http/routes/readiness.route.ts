import type { Pool } from "pg";
import { Hono } from "hono";
import { getRedisClient } from "../../../infrastructure/persistence/redis/client.js";
import { logger } from "../../../shared/logger.js";

export function createReadinessRoute(pool: Pool) {
  const app = new Hono();

  app.get("/", async (c) => {
    try {
      const redis = getRedisClient();
      await redis.ping();
      await pool.query("SELECT 1");
      return c.json({ status: "ready" });
    } catch (err) {
      logger.warn({ err }, "Readiness check failed");
      return c.json({ status: "not ready", error: String(err) }, 503);
    }
  });

  return app;
}
