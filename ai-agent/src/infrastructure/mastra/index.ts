import { Mastra } from "@mastra/core";
import type { createCopilotAgent } from "./agents/copilot.agent.js";

export function createMastra(agent: ReturnType<typeof createCopilotAgent>) {
  return new Mastra({
    agents: { copilot: agent },
  });
}
