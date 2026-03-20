import { AuthService } from '@/gen/chatapp/auth/v1/auth_service_pb';
import { createApiClient } from '@/lib/grpc/base-client';

export const authClient = createApiClient(AuthService);
