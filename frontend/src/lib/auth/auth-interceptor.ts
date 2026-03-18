import type { Interceptor } from '@connectrpc/connect';

import { tokenStore } from './token-store';

export const authInterceptor: Interceptor = (next) => async (req) => {
  const accessToken = tokenStore.getAccessToken();

  if (accessToken && !req.header.has('Authorization')) {
    req.header.set('Authorization', `Bearer ${accessToken}`);
  }

  return next(req);
};
