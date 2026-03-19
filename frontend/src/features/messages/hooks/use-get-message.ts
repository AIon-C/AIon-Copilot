"use client";

import { useCallback, useState } from "react";
import { messageService } from "../api/message-service";
import type { GetMessageInput, MessageModel } from "../model/message-types";

export function useGetMessage() {
  const [message, setMessage] = useState<MessageModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessage = useCallback(async (input: GetMessageInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await messageService.getMessage(input);
      setMessage(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to get message";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  return {
    message,
    fetchMessage,
    clearMessage,
    loading,
    error,
  };
}