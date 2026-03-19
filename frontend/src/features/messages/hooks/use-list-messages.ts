"use client";

import { useCallback, useState } from "react";
import { messageService } from "../api/message-service";
import type {
  ListMessagesInput,
  ListMessagesResult,
  MessageModel,
} from "../model/message-types";

export function useListMessages() {
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [page, setPage] = useState<ListMessagesResult["page"]>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (input: ListMessagesInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await messageService.listMessages(input);
      setMessages(result.messages);
      setPage(result.page);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to list messages";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPage(undefined);
    setError(null);
  }, []);

  return {
    messages,
    page,
    fetchMessages,
    clearMessages,
    loading,
    error,
  };
}