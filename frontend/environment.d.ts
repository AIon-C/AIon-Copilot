// This file is needed to support autocomplete for process.env
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Copilot API mode (client-side, controls mock/stub/real behaviour)
      NEXT_PUBLIC_COPILOT_API_MODE?: 'mock' | 'stub' | 'real';
      // Client-side request timeout for the local proxy (milliseconds, not sensitive)
      NEXT_PUBLIC_COPILOT_API_TIMEOUT_MS?: string;

      // Copilot API (server-side only — never exposed to the browser)
      COPILOT_API_BASE_URL?: string;
      COPILOT_API_TOKEN?: string;
    }
  }
}
