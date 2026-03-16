import { Agent } from "@mastra/core/agent";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { config } from "../../../shared/config.js";

const google = createGoogleGenerativeAI({
  apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

export const copilotAgent = new Agent({
  id: "copilot",
  name: "copilot",
  instructions:
    "あなたはチャットアプリに統合されたAIアシスタントです。ユーザーの質問に的確に回答してください。",
  model: google("gemini-2.5-flash"),
});
