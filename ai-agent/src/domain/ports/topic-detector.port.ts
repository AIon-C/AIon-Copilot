import type { ChatContextMessage } from "../types/index.js";

export interface TopicDetectorPort {
  detectBoundary(messages: ChatContextMessage[]): Promise<number>;
}
