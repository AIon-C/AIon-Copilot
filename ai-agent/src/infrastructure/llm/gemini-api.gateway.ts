import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import type {
  LLMGatewayPort,
  LLMGenerateOptions,
  LLMStreamOptions,
  LLMStreamResult,
} from "../../domain/ports/llm-gateway.port.js";
import type { LLMMessage } from "../../domain/types/index.js";
import { config } from "../../shared/config.js";
import { LLMError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";

export class GeminiApiGateway implements LLMGatewayPort {
  private google = createGoogleGenerativeAI({
    apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY!,
  });

  async stream(messages: LLMMessage[], options?: LLMStreamOptions): Promise<LLMStreamResult> {
    const modelName = options?.model ?? "gemini-2.5-flash";
    const startTime = Date.now();

    const doStream = () =>
      streamText({
        model: this.google(modelName),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        abortSignal: options?.abortSignal,
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      });

    let streamResult: ReturnType<typeof streamText>;
    try {
      streamResult = doStream();
    } catch (err) {
      logger.warn({ err }, "LLM stream failed, retrying once");
      try {
        streamResult = doStream();
      } catch (retryErr) {
        throw new LLMError(`LLM stream failed after retry: ${retryErr}`);
      }
    }

    const result = streamResult;

    const textStream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    const resultPromise = (async () => {
      const fullText = await result.text;
      const usage = await result.usage;
      return {
        fullText,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        latencyMs: Date.now() - startTime,
      };
    })();

    return { textStream, result: resultPromise };
  }

  async generate(
    messages: LLMMessage[],
    options?: LLMGenerateOptions,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const modelName = options?.model ?? "gemini-2.5-flash";

    try {
      const result = await generateText({
        model: this.google(modelName),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.1,
        maxOutputTokens: options?.maxTokens ?? 256,
      });
      return {
        text: result.text,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      };
    } catch (err) {
      logger.warn({ err }, "LLM generate failed, retrying once");
      try {
        const result = await generateText({
          model: this.google(modelName),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options?.temperature ?? 0.1,
          maxOutputTokens: options?.maxTokens ?? 256,
        });
        return {
          text: result.text,
          inputTokens: result.usage?.inputTokens ?? 0,
          outputTokens: result.usage?.outputTokens ?? 0,
        };
      } catch (retryErr) {
        throw new LLMError(`LLM generate failed after retry: ${retryErr}`);
      }
    }
  }
}
