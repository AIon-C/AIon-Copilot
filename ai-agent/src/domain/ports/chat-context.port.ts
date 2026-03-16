import type { ChatContextMessage } from "../types/index.js";

export interface ChatContextPort {
  getChannelMessages(channelId: string, pageSize?: number): Promise<ChatContextMessage[]>;
  getThreadMessages(
    channelId: string,
    threadRootId: string,
    pageSize?: number,
  ): Promise<ChatContextMessage[]>;
}
