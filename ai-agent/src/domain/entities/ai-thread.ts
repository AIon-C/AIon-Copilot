import { type Scope, determineScope } from "./scope.js";

export interface AiThread {
  id: string;
  workspaceId: string;
  userId: string;
  channelId: string | null;
  threadRootId: string | null;
  title: string;
  model: string;
  systemPrompt: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function getScope(thread: AiThread): Scope {
  return determineScope(thread.channelId, thread.threadRootId);
}

export interface CreateThreadInput {
  workspaceId: string;
  userId: string;
  title: string;
  channelId?: string | null;
  threadRootId?: string | null;
  model?: string;
  systemPrompt?: Record<string, unknown> | null;
}
