import type { LLMGatewayPort } from "../../../domain/ports/llm-gateway.port.js";
import { createLLMGateway } from "../../../infrastructure/llm/llm-gateway.factory.js";

export function createLLMGatewayAdapter(): LLMGatewayPort {
  return createLLMGateway();
}
