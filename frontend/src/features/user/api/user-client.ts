import { UserService } from "@/gen/chatapp/user/v1/user_service_pb";
import { createApiClient } from "@/lib/grpc/base-client";

export const userClient = createApiClient(UserService);