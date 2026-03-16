import pg from "pg";
import { config } from "../shared/config.js";

// Infrastructure
import { RedisContextCacheImpl } from "../infrastructure/persistence/redis/context-cache.impl.js";
import { PgThreadStoreImpl } from "../infrastructure/persistence/mastra-memory/thread-store.impl.js";
import { PgMessageStoreImpl } from "../infrastructure/persistence/mastra-memory/message-store.impl.js";
import { GoBackendChatContextImpl } from "../infrastructure/go-client/chat-context.impl.js";
import { createLLMGateway } from "../infrastructure/llm/llm-gateway.factory.js";
import { TopicDetectorAdapter } from "../infrastructure/mastra/adapters/topic-detector.adapter.js";

// Use cases
import { ManageThreadUseCase } from "../application/usecases/manage-thread.usecase.js";
import { AskUseCase } from "../application/usecases/ask.usecase.js";
import { GetHistoryUseCase } from "../application/usecases/get-history.usecase.js";

// HTTP
import { createApp } from "../interface/http/app.js";

export function buildContainer() {
  // Database pool
  const pgPool = new pg.Pool({ connectionString: config.DATABASE_URL });

  // Port implementations
  const threadStore = new PgThreadStoreImpl(pgPool);
  const messageStore = new PgMessageStoreImpl(pgPool);
  const contextCache = new RedisContextCacheImpl();
  const chatContext = new GoBackendChatContextImpl();
  const llmGateway = createLLMGateway();
  const topicDetector = new TopicDetectorAdapter(llmGateway);

  // Use cases
  const manageThread = new ManageThreadUseCase(threadStore, messageStore);
  const getHistory = new GetHistoryUseCase(threadStore, messageStore);
  const ask = new AskUseCase(
    threadStore,
    messageStore,
    contextCache,
    chatContext,
    llmGateway,
    topicDetector,
  );

  // HTTP app
  const app = createApp({ manageThread, ask, getHistory, pgPool });

  return { app, pgPool };
}
