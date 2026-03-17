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

export interface LLMStreamOptions {
  abortSignal?: AbortSignal;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGatewayPort {
  stream(
    messages: LLMMessage[],
    options?: LLMStreamOptions,
  ): Promise<LLMStreamResult>;

  generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }>;
}
