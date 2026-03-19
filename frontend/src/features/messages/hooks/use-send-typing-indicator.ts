"use client";

import { useCallback, useState } from "react";
import { messageService } from "../api/message-service";
import type { SendTypingIndicatorInput } from "../model/message-types";

export function useSendTypingIndicator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTypingIndicator = useCallback(
    async (input: SendTypingIndicatorInput) => {
      setLoading(true);
      setError(null);

      try {
        await messageService.sendTypingIndicator(input);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to send typing indicator";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    sendTypingIndicator,
    loading,
    error,
  };
}