import type { Agent } from "@mastra/core/agent";
import type { ThreadStorePort } from "../../domain/ports/thread-store.port.js";
import { getScope } from "../../domain/types/index.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";

export class AskUseCase {
  constructor(
    private readonly threadStore: ThreadStorePort,
    private readonly agent: Agent,
  ) {}

  async execute(
    threadId: string,
    userId: string,
    message: string,
    abortSignal?: AbortSignal,
  ): Promise<{ sseStream: ReadableStream<Uint8Array> }> {
    if (message.length > 10000) {
      throw new ValidationError("Message must be 10,000 characters or less");
    }

    // Step 1: スレッド取得 + スコープ判定
    const thread = await this.threadStore.findById(threadId);
    if (!thread) throw new NotFoundError("Thread", threadId);
    if (thread.userId !== userId) throw new ForbiddenError();
    const scope = getScope(thread);

    // Step 2: スコープ情報をメッセージに付加（Agentがツールで文脈取得を判断するため）
    let fullMessage = message;
    if (scope.type !== "free") {
      const scopeContext =
        scope.type === "thread"
          ? `[Context: thread scope, channelId=${scope.channelId}, threadRootId=${scope.threadRootId}]`
          : `[Context: channel scope, channelId=${scope.channelId}]`;
      fullMessage = `${scopeContext}\n\n${message}`;
    }

    // Step 3: Mastra Agent がメモリ管理・ツール呼出・応答生成を全自動実行
    const streamResult = await this.agent.stream(fullMessage, {
      memory: {
        thread: threadId,
        resource: userId,
      },
    });

    // Step 4: ストリームを SSE 形式に変換
    const sseStream = this.toSSEStream(streamResult.textStream, threadId);
    return { sseStream };
  }

  private toSSEStream(
    textStream: AsyncIterable<string>,
    threadId: string,
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const iterator = textStream[Symbol.asyncIterator]();

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await iterator.next();
          if (done) {
            const doneEvent = `data: ${JSON.stringify({ type: "done", threadId })}\n\n`;
            controller.enqueue(encoder.encode(doneEvent));
            controller.close();
            return;
          }
          const sseEvent = `data: ${JSON.stringify({ type: "text-delta", content: value })}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
        } catch (err) {
          logger.error({ err }, "Stream error");
          controller.error(err);
        }
      },
    });
  }
}
