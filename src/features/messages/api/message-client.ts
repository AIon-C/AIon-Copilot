import { MessageService } from '@/gen/chatapp/message/v1/message_service_pb';
import { createApiClient } from '@/lib/grpc/base-client';

export const messageClient = createApiClient(MessageService);
