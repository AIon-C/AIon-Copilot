import { messageService } from '@/features/messages/api/message-service';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  id: Id<'messages'>;
};

type ResponseType = Id<'messages'> | null;

export const useRemoveMessage = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const removed = await messageService.deleteMessage({
      messageId: values.id,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messages:updated'));
    }

    return (removed?.id ?? values.id ?? null) as Id<'messages'> | null;
  });
};
