import type { MessageModel } from '@/features/message/model/message-types';
import { mapMessage } from '@/features/message/utils/message-mapper';
import type { GetThreadResponse } from '@/gen/chatapp/thread/v1/thread_service_pb';

import type { GetThreadResult } from '../model/thread-types';

export function mapThreadResponse(response: GetThreadResponse): GetThreadResult {
  return {
    rootMessage: mapMessage(response.rootMessage),
    replies: response.replies.map((item) => mapMessage(item)).filter((item): item is MessageModel => item !== null),
    raw: response,
  };
}
