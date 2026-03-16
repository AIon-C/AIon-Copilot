import type { Scope } from "./scope.js";

export interface ChatContextMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

export interface ChatContext {
  messages: ChatContextMessage[];
  scope: Scope;
  topicBoundaryIndex: number | null;
}
