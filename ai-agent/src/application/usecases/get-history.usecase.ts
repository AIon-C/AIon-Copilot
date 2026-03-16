import type { ThreadStorePort } from "../../domain/ports/thread-store.port.js";
import type { MessageStorePort } from "../../domain/ports/message-store.port.js";
import type { AiMessage } from "../../domain/types/index.js";
import { NotFoundError, ForbiddenError } from "../../shared/errors.js";

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
}
