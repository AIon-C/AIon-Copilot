import { Hono } from "hono";
import { z } from "zod";
import type { ManageThreadUseCase } from "../../../application/usecases/manage-thread.usecase.js";
import type { AiThread } from "../../../domain/types/index.js";
import { ValidationError } from "../../../shared/errors.js";

const createThreadSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(200),
  channelId: z.string().uuid().optional().nullable(),
  threadRootId: z.string().uuid().optional().nullable(),
});

const updateTitleSchema = z.object({
  title: z.string().min(1).max(200),
});

type AuthEnv = { Variables: { userId: string } };

export function createThreadsRoute(useCase: ManageThreadUseCase) {
  const app = new Hono<AuthEnv>();

  // POST /api/ai/threads
  app.post("/", async (c) => {
    const body = await c.req.json();
    const parsed = createThreadSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid request", parsed.error.flatten());
    }
    const userId = c.get("userId");
    const thread = await useCase.create({ ...parsed.data, userId });
    return c.json(threadToResponse(thread), 201);
  });

  // GET /api/ai/threads
  app.get("/", async (c) => {
    const userId = c.get("userId");
    const threads = await useCase.list(userId);
    return c.json({ threads: threads.map(threadToResponse) });
  });

  // PATCH /api/ai/threads/:id
  app.patch("/:id", async (c) => {
    const body = await c.req.json();
    const parsed = updateTitleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid request", parsed.error.flatten());
    }
    const userId = c.get("userId");
    const thread = await useCase.updateTitle(c.req.param("id"), userId, parsed.data.title);
    return c.json(threadToResponse(thread));
  });

  // DELETE /api/ai/threads/:id
  app.delete("/:id", async (c) => {
    const userId = c.get("userId");
    await useCase.delete(c.req.param("id"), userId);
    return c.body(null, 204);
  });

  return app;
}

function threadToResponse(t: AiThread) {
  return {
    id: t.id,
    workspaceId: t.workspaceId,
    userId: t.userId,
    title: t.title,
    scope: buildScopeResponse(t),
    model: t.model,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function buildScopeResponse(t: AiThread) {
  if (t.channelId && t.threadRootId) {
    return { type: "thread", channelId: t.channelId, threadRootId: t.threadRootId };
  }
  if (t.channelId) {
    return { type: "channel", channelId: t.channelId };
  }
  return { type: "free" };
}
