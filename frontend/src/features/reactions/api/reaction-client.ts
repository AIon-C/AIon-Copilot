import { ReactionService } from '@/gen/chatapp/reaction/v1/reaction_service_pb';
import { createApiClient } from '@/lib/grpc/base-client';

export const reactionClient = createApiClient(ReactionService);
