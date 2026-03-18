import { User } from '@/gen/chatapp/model/v1/user_pb';
import { GetMeResponse, UpdateProfileResponse } from '@/gen/chatapp/user/v1/user_service_pb';

import { UserModel } from '../model/user-types';

export function mapUser(user?: User): UserModel | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl || null,
    metadata: user.metadata,
    raw: user,
  };
}

export function mapGetMeResponse(response: GetMeResponse): UserModel | null {
  return mapUser(response.user);
}

export function mapUpdateProfileResponse(response: UpdateProfileResponse): UserModel | null {
  return mapUser(response.user);
}
