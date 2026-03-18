import { create } from "@bufbuild/protobuf";
import { toGrpcClientError } from "@/lib/grpc/error";
import {
  ChangePasswordRequestSchema,
  GetMeRequestSchema,
  UpdateProfileRequestSchema,
} from "@/gen/chatapp/user/v1/user_service_pb";
import { userClient } from "./user-client";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
  UserModel,
} from "../model/user-types";
import {
  mapGetMeResponse,
  mapUpdateProfileResponse,
} from "../utils/user-mapper";

const PROFILE_FIELD_PATH_MAP = {
  displayName: "display_name",
  avatarUrl: "avatar_url",
  email: "email",
} as const;

function buildUpdateMaskPaths(input: UpdateProfileInput): string[] {
  const paths: string[] = [];

  if (input.displayName !== undefined) {
    paths.push(PROFILE_FIELD_PATH_MAP.displayName);
  }

  if (input.avatarUrl !== undefined) {
    paths.push(PROFILE_FIELD_PATH_MAP.avatarUrl);
  }

  if (input.email !== undefined) {
    paths.push(PROFILE_FIELD_PATH_MAP.email);
  }

  return paths;
}

export const userService = {
  async getMe(): Promise<UserModel | null> {
    try {
      const response = await userClient.getMe(
        create(GetMeRequestSchema, {}),
      );

      return mapGetMeResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async updateProfile(input: UpdateProfileInput): Promise<UserModel | null> {
    const paths = buildUpdateMaskPaths(input);

    if (paths.length === 0) {
      throw new Error("No profile fields to update");
    }

    try {
      const response = await userClient.updateProfile(
        create(UpdateProfileRequestSchema, {
          user: {
            ...(input.displayName !== undefined
              ? { displayName: input.displayName }
              : {}),
            ...(input.avatarUrl !== undefined
              ? { avatarUrl: input.avatarUrl }
              : {}),
            ...(input.email !== undefined
              ? { email: input.email }
              : {}),
          },
          updateMask: {
            paths,
          },
        }),
      );

      return mapUpdateProfileResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    try {
      await userClient.changePassword(
        create(ChangePasswordRequestSchema, {
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
        }),
      );
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};