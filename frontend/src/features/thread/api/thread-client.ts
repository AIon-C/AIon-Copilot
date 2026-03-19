import { ThreadService } from "@/gen/chatapp/thread/v1/thread_service_pb";
import { createApiClient } from "@/lib/grpc/base-client";

export const threadClient = createApiClient(ThreadService);