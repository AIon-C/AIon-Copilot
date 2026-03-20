import type { MessageStorePort } from "../../domain/ports/message-store.port.js";
import type { ThreadStorePort } from "../../domain/ports/thread-store.port.js";
import type { AiMessage } from "../../domain/types/index.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors.js";

export class GetHistoryUseCase {
  constructor(
    private readonly threadStore: ThreadStorePort,
    private readonly messageStore: MessageStorePort,
  ) {}

  async execute(threadId: string, userId: string): Promise<AiMessage[]> {
    const thread = await this.threadStore.findById(threadId);
    if (!thread) throw new NotFoundError("Thread", threadId);
    if (thread.userId !== userId) throw new ForbiddenError();
    return this.messageStore.findByThread(threadId);
  }

  async executePaginated(
    threadId: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ messages: AiMessage[]; total: number }> {
    const thread = await this.threadStore.findById(threadId);
    if (!thread) throw new NotFoundError("Thread", threadId);
    if (thread.userId !== userId) throw new ForbiddenError();
    return this.messageStore.findByThreadPaginated(threadId, limit, offset);
  }
}
