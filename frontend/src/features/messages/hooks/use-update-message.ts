'use client';

import { useCallback, useState } from 'react';

import { messageService } from '../api/message-service';
import type { MessageModel, UpdateMessageInput } from '../model/message-types';

export function useUpdateMessage() {
  const [message, setMessage] = useState<MessageModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMessage = useCallback(async (input: UpdateMessageInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await messageService.updateMessage(input);
      setMessage(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update message';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    message,
    updateMessage,
    loading,
    error,
  };
}
