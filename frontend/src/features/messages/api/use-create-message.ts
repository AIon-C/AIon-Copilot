import { sendCopilotMessage } from '@/features/messages/api/copilot-client';
import { type CopilotApiMode, type CopilotCreateMessageResult, getTextFromQuillBody } from '@/features/messages/api/copilot-contract';
import { messageService } from '@/features/messages/api/message-service';
import { createMessage } from '@/mock/api';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  body: string;
  image?: string;
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
        throw new Error('プロンプトが空です。');
      }

      return sendCopilotMessage({
        threadId: copilot.threadId,
        workspaceId: values.workspaceId,
        prompt,
        mode: copilot.mode,
      });
    }

    if (values.channelId) {
      const sent = await messageService.sendMessage({
        channelId: values.channelId,
        content: values.body,
        fileIds: values.image ? [values.image] : undefined,
        threadRootId: values.parentMessageId,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('messages:updated', {
            detail: { channelId: values.channelId },
          }),
        );
      }

      return (sent?.id ?? null) as Id<'messages'> | null;
    }

    return createMessage(values);
  });
};
