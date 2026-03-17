import { sendCopilotMessage } from '@/features/messages/api/copilot-client';
import type { CopilotApiMode, CopilotCreateMessageResult } from '@/features/messages/api/copilot-contract';
import { getTextFromQuillBody } from '@/features/messages/api/copilot-contract';
import { createMessage } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  body: string;
  image?: Id<'_storage'>;
  workspaceId: Id<'workspaces'>;
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
  copilot?: {
    threadId: string;
    mode?: CopilotApiMode;
    promptText?: string;
  };
};

type ResponseType = Id<'messages'> | CopilotCreateMessageResult | null;

export const useCreateMessage = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const { copilot } = values;

    if (copilot) {
      const prompt = copilot.promptText?.trim() || getTextFromQuillBody(values.body);

      if (!prompt) {
        throw new Error('Prompt is empty.');
      }

      return sendCopilotMessage({
        threadId: copilot.threadId,
        workspaceId: values.workspaceId,
        prompt,
        mode: copilot.mode,
      });
    }

    return createMessage(values);
  });
};
