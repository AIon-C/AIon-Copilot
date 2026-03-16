import { createMiddleware } from "hono/factory";
import { logger } from "../../../shared/logger.js";

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({ method, path, status, duration }, "Request completed");
});
