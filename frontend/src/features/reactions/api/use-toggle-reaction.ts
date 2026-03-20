import { useSyncExternalStore } from 'react';

import { authStore } from '@/features/auth/model/auth-store';
import { reactionService } from '@/features/reactions/api/reaction-service';
import type { Id } from '@/mock/types';
import { useMockMutation } from '@/mock/use-mock-mutation';

type RequestType = {
  value: string;
  messageId: Id<'messages'>;
};

type ResponseType = Id<'reactions'> | null;

export const useToggleReaction = () => {
  const authState = useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);

  return useMockMutation<RequestType, ResponseType>(async (values) => {
    const currentUserId = authState.user?.id;

    if (!currentUserId) {
      throw new Error('User is not authenticated');
    }

    const currentReactions = await reactionService.listReactions({
      messageId: values.messageId,
    });

    const hasReaction = currentReactions.some(
      (reaction) => reaction.emojiCode === values.value && reaction.userId === currentUserId,
    );

    if (hasReaction) {
      await reactionService.removeReaction({
        messageId: values.messageId,
        emojiCode: values.value,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('messages:updated'));
      }

      return null;
    }

    const added = await reactionService.addReaction({
      messageId: values.messageId,
      emojiCode: values.value,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messages:updated'));
    }

    return (added?.id ?? null) as Id<'reactions'> | null;
  });
};
