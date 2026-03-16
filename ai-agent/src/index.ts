import { serve } from "@hono/node-server";
import { config } from "./shared/config.js";
import { logger } from "./shared/logger.js";
import { buildContainer } from "./di/container.js";
import { closeRedis } from "./infrastructure/persistence/redis/client.js";

const { app, pgPool } = buildContainer();

const server = serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    logger.info({ port: info.port }, "AI Agent server started");
  },
);

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down...");
  server.close();
  await closeRedis();
  await pgPool.end();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
