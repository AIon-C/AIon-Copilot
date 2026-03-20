import { messageService } from '@/features/messages/api/message-service';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  body: string;
  id: Id<'messages'>;
};

type ResponseType = Id<'messages'> | null;

export const useUpdateMessage = () => {
  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const updated = await messageService.updateMessage({
      id: values.id,
      content: values.body,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messages:updated'));
    }

    return (updated?.id ?? null) as Id<'messages'> | null;
  });
};
