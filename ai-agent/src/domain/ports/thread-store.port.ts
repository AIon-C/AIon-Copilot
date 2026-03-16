import type { AiThread, CreateThreadInput } from "../types/index.js";

export interface ThreadStorePort {
  create(input: CreateThreadInput): Promise<AiThread>;
  findById(id: string): Promise<AiThread | null>;
  findByUserId(userId: string): Promise<AiThread[]>;
  updateTitle(id: string, title: string): Promise<AiThread>;
  delete(id: string): Promise<void>;
}
