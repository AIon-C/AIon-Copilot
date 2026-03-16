import type { ThreadStorePort } from "../../domain/ports/thread-store.port.js";
import type { MessageStorePort } from "../../domain/ports/message-store.port.js";
import type { ContextCachePort } from "../../domain/ports/context-cache.port.js";
import type { ChatContextPort } from "../../domain/ports/chat-context.port.js";
import type { LLMGatewayPort } from "../../domain/ports/llm-gateway.port.js";
import type { TopicDetectorPort } from "../../domain/ports/topic-detector.port.js";
import type { ChatContextMessage, LLMMessage } from "../../domain/types/index.js";
import { getScope } from "../../domain/types/index.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";

export class AskUseCase {
  constructor(
    private readonly threadStore: ThreadStorePort,
    private readonly messageStore: MessageStorePort,
    private readonly contextCache: ContextCachePort,
    private readonly chatContext: ChatContextPort,
    private readonly llmGateway: LLMGatewayPort,
    private readonly topicDetector: TopicDetectorPort,
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

    // Step 2: コンテキスト取得 (free スコープ以外)
    let contextMessages: ChatContextMessage[] = [];
    if (scope.type !== "free") {
      contextMessages = await this.fetchContext(scope);
    }

    // Step 3: 話題検出 (channel スコープのみ)
    let topicBoundaryIndex: number | null = null;
    if (scope.type === "channel" && contextMessages.length > 0) {
      topicBoundaryIndex = await this.detectTopic(scope.channelId, contextMessages);
      if (topicBoundaryIndex > 0) {
        contextMessages = contextMessages.slice(topicBoundaryIndex);
      }
    }

    // Step 4: ユーザーメッセージ保存
    await this.messageStore.save({
      aiThreadId: threadId,
      role: "user",
      content: message,
    });

    // Step 5: AI 会話履歴取得
    const history = await this.messageStore.findByThread(threadId);

    // Step 6: プロンプト組立 + LLM 呼出 (ストリーミング)
    const systemPrompt = this.buildSystemPrompt(contextMessages);
    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(0, -1).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const { textStream, result: resultPromise } = await this.llmGateway.stream(messages, {
      abortSignal,
      model: thread.model,
    });

    // Step 7: ストリームを SSE 形式に変換 + 完了後にアシスタントメッセージ保存
    const encoder = new TextEncoder();
    const messageStore = this.messageStore;
    const contextRange =
      contextMessages.length > 0
        ? {
            fromMessageId: contextMessages[0].id,
            toMessageId: contextMessages[contextMessages.length - 1].id,
            messageCount: contextMessages.length,
            topicDetected: topicBoundaryIndex !== null && topicBoundaryIndex > 0,
          }
        : undefined;

    const reader = textStream.getReader();

    const sseStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            // ストリーム完了: アシスタントメッセージを保存
            try {
              const llmResult = await resultPromise;
              const saved = await messageStore.save({
                aiThreadId: threadId,
                role: "assistant",
                content: llmResult.fullText,
                metadata: {
                  inputTokens: llmResult.inputTokens,
                  outputTokens: llmResult.outputTokens,
                  latencyMs: llmResult.latencyMs,
                  modelVersion: thread.model,
                  contextRange,
                },
              });
              const doneEvent = `data: ${JSON.stringify({ type: "done", messageId: saved.id })}\n\n`;
              controller.enqueue(encoder.encode(doneEvent));
            } catch (err) {
              logger.error({ err }, "Failed to save assistant message");
              const errorEvent = `data: ${JSON.stringify({ type: "error", message: "Failed to save response" })}\n\n`;
              controller.enqueue(encoder.encode(errorEvent));
            }
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
      cancel() {
        reader.cancel();
      },
    });

    return { sseStream };
  }

  private async fetchContext(
    scope: { type: "channel"; channelId: string } | { type: "thread"; channelId: string; threadRootId: string },
  ): Promise<ChatContextMessage[]> {
    try {
      // Redis キャッシュから取得
      if (scope.type === "channel") {
        const cached = await this.contextCache.getChannelMessages(scope.channelId);
        if (cached.length > 0) return cached;
      } else {
        const cached = await this.contextCache.getThreadMessages(scope.threadRootId);
        if (cached.length > 0) return cached;
      }
    } catch (err) {
      logger.warn({ err }, "Redis cache read failed, falling back to Go Backend");
    }

    // キャッシュミス → Go Backend API フォールバック
    if (scope.type === "channel") {
      return this.chatContext.getChannelMessages(scope.channelId);
    }
    return this.chatContext.getThreadMessages(scope.channelId, scope.threadRootId);
  }

  private async detectTopic(
    channelId: string,
    messages: ChatContextMessage[],
  ): Promise<number> {
    // キャッシュ確認
    const cached = await this.contextCache.getTopicBoundary(channelId);
    if (cached && cached.messageCount === messages.length) {
      return cached.boundaryIndex;
    }

    // Gemini Flash で境界判定
    const boundaryIndex = await this.topicDetector.detectBoundary(messages);

    // 結果をキャッシュ (TTL 5分)
    await this.contextCache.setTopicBoundary(channelId, {
      boundaryIndex,
      messageCount: messages.length,
      cachedAt: new Date().toISOString(),
    });

    return boundaryIndex;
  }

  private buildSystemPrompt(chatContext: ChatContextMessage[]): string {
    const base =
      "あなたはチャットアプリに統合されたAIアシスタントです。\nユーザーの質問に的確に回答してください。";

    if (chatContext.length === 0) {
      return base;
    }

    const chatLog = chatContext.map((m) => `${m.displayName}: ${m.content}`).join("\n");

    return `${base}\n\n以下はユーザーが現在参加しているチャットの会話ログです。\n質問に関連する情報があればこの文脈を踏まえて回答してください。\n\n--- チャット会話ログ ---\n${chatLog}\n--- ログここまで ---`;
  }
}
