import type { LLMGatewayPort } from "../../domain/ports/llm-gateway.port.js";
import { config } from "../../shared/config.js";
import { GeminiApiGateway } from "./gemini-api.gateway.js";
import { VertexAiGateway } from "./vertex-ai.gateway.js";

export function createLLMGateway(): LLMGatewayPort {
  if (config.GCP_PROJECT_ID) {
    return new VertexAiGateway();
  }
  if (config.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new GeminiApiGateway();
  }
  throw new Error(
    "No LLM provider configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GCP_PROJECT_ID.",
  );
}
