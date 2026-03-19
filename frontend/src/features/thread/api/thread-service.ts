import { create } from '@bufbuild/protobuf';

import { GetThreadRequestSchema } from '@/gen/chatapp/thread/v1/thread_service_pb';
import { toGrpcClientError } from '@/lib/grpc/error';

import type { GetThreadInput, GetThreadResult } from '../model/thread-types';
import { mapThreadResponse } from '../utils/thread-mapper';
import { threadClient } from './thread-client';

export const threadService = {
  async getThread(input: GetThreadInput): Promise<GetThreadResult> {
    try {
      const response = await threadClient.getThread(
        create(GetThreadRequestSchema, {
          threadRootId: input.threadRootId,
        }),
      );

      return mapThreadResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};
