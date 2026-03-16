import { Hono } from "hono";
import { z } from "zod";
import type { AskUseCase } from "../../../application/usecases/ask.usecase.js";
import type { GetHistoryUseCase } from "../../../application/usecases/get-history.usecase.js";
import { ValidationError } from "../../../shared/errors.js";

const askSchema = z.object({
  threadId: z.string().uuid(),
  message: z.string().min(1).max(10000),
});

type AuthEnv = { Variables: { userId: string } };

export function createChatRoute(askUseCase: AskUseCase, historyUseCase: GetHistoryUseCase) {
  const app = new Hono<AuthEnv>();

  // POST /api/ai/ask
  app.post("/ask", async (c) => {
    const body = await c.req.json();
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid request", parsed.error.flatten());
    }

    const userId = c.get("userId");
    const abortController = new AbortController();

    c.req.raw.signal.addEventListener("abort", () => {
      abortController.abort();
    });

    const { sseStream } = await askUseCase.execute(
      parsed.data.threadId,
      userId,
      parsed.data.message,
      abortController.signal,
    );

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  // GET /api/ai/threads/:id/messages
  app.get("/threads/:id/messages", async (c) => {
    const userId = c.get("userId");
    const threadId = c.req.param("id");
    const messages = await historyUseCase.execute(threadId, userId);
    return c.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  });

  return app;
}
