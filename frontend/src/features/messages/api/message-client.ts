import { createApiClient } from "@/lib/grpc/base-client";
import { MessageService } from "@/gen/chatapp/message/v1/message_service_pb";

export const messageClient = createApiClient(MessageService);