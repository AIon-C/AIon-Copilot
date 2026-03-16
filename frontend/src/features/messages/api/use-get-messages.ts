import { useCallback } from 'react';

import { getMessagesByFilter } from '@/mock/api';
import { useMockPaginatedQuery } from '@/mock/hooks';
import type { Id, MockMessage } from '@/mock/types';

interface UseGetMessagesProps {
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
}

export type GetMessagesReturnType = MockMessage[];

export const useGetMessages = ({ channelId, conversationId, parentMessageId }: UseGetMessagesProps) => {
  const queryFn = useCallback(
    () => getMessagesByFilter({ channelId, conversationId, parentMessageId }),
    [channelId, conversationId, parentMessageId],
  );

  return useMockPaginatedQuery(queryFn);
};
