import { createConnectTransport } from "@connectrpc/connect-web";
import { authInterceptor } from "../auth/auth-interceptor";


export const transport = createConnectTransport({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  useBinaryFormat: false,
  interceptors: [authInterceptor],
  fetch(input, init) {
    return fetch(input, {
      ...init,
      credentials: "include",
    });
  },
});