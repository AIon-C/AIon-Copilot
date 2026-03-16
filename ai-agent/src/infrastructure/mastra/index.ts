import { Mastra } from "@mastra/core";
import { copilotAgent } from "./agents/copilot.agent.js";

export const mastra = new Mastra({
  agents: { copilot: copilotAgent },
});
