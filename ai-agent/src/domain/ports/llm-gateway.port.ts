import type { LLMMessage } from "../types/index.js";

export interface LLMStreamResult {
  textStream: ReadableStream<string>;
  result: Promise<{
    fullText: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  }>;
}

export interface LLMGatewayPort {
  stream(
    messages: LLMMessage[],
    options?: {
      abortSignal?: AbortSignal;
      model?: string;
    },
  ): Promise<LLMStreamResult>;

  generate(
    messages: LLMMessage[],
    options?: {
      model?: string;
    },
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }>;
}
