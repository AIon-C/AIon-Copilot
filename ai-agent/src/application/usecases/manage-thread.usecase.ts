import type { ThreadStorePort } from "../../domain/ports/thread-store.port.js";
import type { MessageStorePort } from "../../domain/ports/message-store.port.js";
import type { AiThread, CreateThreadInput } from "../../domain/types/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/errors.js";

export class ManageThreadUseCase {
  constructor(
    private readonly threadStore: ThreadStorePort,
    private readonly messageStore: MessageStorePort,
  ) {}

  async create(input: CreateThreadInput): Promise<AiThread> {
    if (input.title.length > 200) {
      throw new ValidationError("Title must be 200 characters or less");
    }
    if (input.threadRootId && !input.channelId) {
      throw new ValidationError("channelId is required when threadRootId is set");
    }
    return this.threadStore.create(input);
  }

  async list(userId: string): Promise<AiThread[]> {
    return this.threadStore.findByUserId(userId);
  }

  async updateTitle(threadId: string, userId: string, title: string): Promise<AiThread> {
    const thread = await this.threadStore.findById(threadId);
    if (!thread) throw new NotFoundError("Thread", threadId);
    if (thread.userId !== userId) throw new ForbiddenError();
    if (title.length > 200) throw new ValidationError("Title must be 200 characters or less");
    return this.threadStore.updateTitle(threadId, title);
  }

  async delete(threadId: string, userId: string): Promise<void> {
    const thread = await this.threadStore.findById(threadId);
    if (!thread) throw new NotFoundError("Thread", threadId);
    if (thread.userId !== userId) throw new ForbiddenError();
    await this.messageStore.deleteByThread(threadId);
    await this.threadStore.delete(threadId);
  }
}
