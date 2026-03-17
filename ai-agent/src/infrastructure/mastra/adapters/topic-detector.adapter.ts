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
与えられたメッセージ一覧を分析し、最後の話題ブロックが始まったメッセージの番号を返してください。

## 判定基準
- 話題の切り替わり = 会話の主題が明確に変わり、以前の話題に戻らない地点
- 以下は「同じ話題」として扱う:
  - 質問に対する補足・回答・リアクション
  - 雑談の延長や脱線後の復帰
  - 同一プロジェクトや同一タスクに関する別の側面
- 判断に迷う場合は 0 を返してください（文脈を多く残す方が安全）

## 出力形式
数字のみ1つ返してください。説明は不要です。
- 最初から最後まで同じ話題 → 0
- 途中で話題が変わった → その開始メッセージ番号`,
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
