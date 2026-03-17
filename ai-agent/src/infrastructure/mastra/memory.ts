import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { config } from "../../shared/config.js";

const google = createGoogleGenerativeAI({
    apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

export const memory = new Memory({
    storage: new PostgresStore({
        id: "ai-agent-store",
        connectionString: config.DATABASE_URL,
    }),
    vector: new PgVector({
        id: "ai-agent-vector",
        connectionString: config.DATABASE_URL,
    }),
    embedder: google.textEmbeddingModel("gemini-embedding-001"),
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