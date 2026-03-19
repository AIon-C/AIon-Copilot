"use client";

import { useCallback, useState } from "react";
import { messageService } from "../api/message-service";
import type { DeleteMessageInput, MessageModel } from "../model/message-types";

export function useDeleteMessage() {
  const [message, setMessage] = useState<MessageModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMessage = useCallback(async (input: DeleteMessageInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await messageService.deleteMessage(input);
      setMessage(result);
      return result;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to delete message";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    message,
    deleteMessage,
    loading,
    error,
  };
}