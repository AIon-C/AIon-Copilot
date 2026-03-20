'use client';

import { useCallback, useState } from 'react';

import { messageService } from '../api/message-service';
import type { MessageModel, SendMessageInput } from '../model/message-types';

export function useSendMessage() {
  const [message, setMessage] = useState<MessageModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (input: SendMessageInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await messageService.sendMessage(input);
      setMessage(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send message';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    message,
    sendMessage,
    loading,
    error,
  };
}
