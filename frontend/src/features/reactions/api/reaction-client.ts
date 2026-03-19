import { createApiClient } from "@/lib/grpc/base-client";
import { ReactionService } from "@/gen/chatapp/reaction/v1/reaction_service_pb";

export const reactionClient = createApiClient(ReactionService);