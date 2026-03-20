import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Pool } from "pg";
import type { AskUseCase } from "../../application/usecases/ask.usecase.js";
import type { GetHistoryUseCase } from "../../application/usecases/get-history.usecase.js";
import type { ManageThreadUseCase } from "../../application/usecases/manage-thread.usecase.js";
import { errorHandler } from "./middleware/error-handler.js";
import { jwtAuth } from "./middleware/jwt-auth.js";
import { requestLogger } from "./middleware/request-logger.js";
import { createChatRoute } from "./routes/chat.route.js";
import { createHealthRoute } from "./routes/health.route.js";
import { createReadinessRoute } from "./routes/readiness.route.js";
import { createThreadsRoute } from "./routes/threads.route.js";
import { createSwaggerRoute } from "./swagger/swagger.route.js";

export function createApp(deps: {
  manageThread: ManageThreadUseCase;
  ask: AskUseCase;
  getHistory: GetHistoryUseCase;
  pgPool: Pool;
}) {
  const app = new Hono();

  // Global middleware
  app.use("*", cors());
  app.use("*", requestLogger);
  app.onError(errorHandler);

  // Public routes (no auth)
  app.route("/api/health", createHealthRoute());
  app.route("/api/ready", createReadinessRoute(deps.pgPool));
  app.route("/api/swagger", createSwaggerRoute());

  // Protected routes (JWT auth)
  const api = new Hono();
  api.use("*", jwtAuth);
  api.route("/threads", createThreadsRoute(deps.manageThread));
  api.route("/", createChatRoute(deps.ask, deps.getHistory));
  app.route("/api/ai", api);

  return app;
}
