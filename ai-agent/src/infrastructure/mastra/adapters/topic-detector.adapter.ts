import type { TopicDetectorPort } from "../../../domain/ports/topic-detector.port.js";
import type { LLMGatewayPort } from "../../../domain/ports/llm-gateway.port.js";
import type { ChatContextMessage, LLMMessage } from "../../../domain/types/index.js";

export class TopicDetectorAdapter implements TopicDetectorPort {
  constructor(private readonly llm: LLMGatewayPort) {}

  async detectBoundary(messages: ChatContextMessage[]): Promise<number> {
    if (messages.length === 0) return 0;

    const formattedMessages = messages
      .map((m, i) => `[${i}] ${m.displayName}: ${m.content}`)
      .join("\n");

    const prompt: LLMMessage[] = [
      {
        role: "system",
        content: `あなたはチャットログの話題分析器です。
与えられたメッセージ一覧を分析し、最後の話題が始まったメッセージの番号を特定してください。

ルール:
- 話題の切り替わりとは、会話の主題が明確に変わった地点です
- 雑談の延長や関連する補足は「同じ話題」として扱ってください
- 最初から最後まで同じ話題の場合は 0 を返してください
- 数字のみ返してください（他の文字は不要）`,
      },
      {
        role: "user",
        content: formattedMessages,
      },
    ];

    const result = await this.llm.generate(prompt);
    const boundary = parseInt(result.text.trim(), 10);
    return isNaN(boundary) ? 0 : Math.max(0, Math.min(boundary, messages.length - 1));
  }
}
