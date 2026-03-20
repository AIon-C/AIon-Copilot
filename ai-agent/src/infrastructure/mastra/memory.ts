import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";
import { config } from "../../shared/config.js";

function createEmbedder() {
    if (config.GCP_PROJECT_ID) {
        const vertex = createVertex({
            project: config.GCP_PROJECT_ID,
            location: config.GCP_LOCATION ?? "asia-northeast1",
        });
        return vertex.textEmbeddingModel("gemini-embedding-001");
    }
    const google = createGoogleGenerativeAI({
        apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
    });
    return google.textEmbeddingModel("gemini-embedding-001");
}

export const memory = new Memory({
    storage: new PostgresStore({
        id: "ai-agent-store",
        connectionString: config.DATABASE_URL,
    }),
    vector: new PgVector({
        id: "ai-agent-vector",
        connectionString: config.DATABASE_URL,
    }),
    embedder: createEmbedder(),
    options: {
        lastMessages: 40,
        semanticRecall: {
            topK: 5,
            messageRange: 3,
        },
        workingMemory: {
            enabled: true,
        },
    },
});