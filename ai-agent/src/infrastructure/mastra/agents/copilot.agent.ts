import { Agent } from "@mastra/core/agent";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";
import { memory } from "../memory.js";
import { createFetchContextTool } from "../tools/fetch-context.tool.js";
import { createDetectTopicTool } from "../tools/detect-topic.tool.js";
import { config } from "../../../shared/config.js";

function createModel() {
  if (config.GCP_PROJECT_ID) {
    const vertex = createVertex({
      project: config.GCP_PROJECT_ID,
      location: config.GCP_LOCATION ?? "asia-northeast1",
    });
    return vertex("gemini-2.5-flash");
  }
  const google = createGoogleGenerativeAI({
    apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
  });
  return google("gemini-2.5-flash");
}

export function createCopilotAgent(
  fetchContextTool: ReturnType<typeof createFetchContextTool>,
  detectTopicTool: ReturnType<typeof createDetectTopicTool>,
) {
  return new Agent({
    id: "copilot",
    name: "AIon Copilot",
    instructions: `## Role
あなたはチャットアプリに統合されたAIアシスタント「AIon Copilot」です。
ワークスペース内のチャンネルやスレッドの会話を理解し、ユーザーの質問に回答します。

## Rules
- 会話の文脈を踏まえて、質問に的確かつ簡潔に回答してください
- 文脈に答えがない場合は推測せず「会話からは判断できません」と伝えてください
- 日本語で質問された場合は日本語で、英語の場合は英語で回答してください
- コードを含む回答はMarkdownコードブロックで囲んでください
- 特定メッセージに言及する場合は発言者名を明示してください
- 必要に応じて fetch-context ツールでチャットの会話ログを取得してください`,
    model: createModel(),
    tools: {
      fetchContext: fetchContextTool,
      detectTopic: detectTopicTool,
    },
    memory,
  });
}