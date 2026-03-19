import { create } from '@bufbuild/protobuf';

import {
  CreateWorkspaceRequestSchema,
  GetInviteInfoRequestSchema,
  GetWorkspaceRequestSchema,
  InviteWorkspaceMemberRequestSchema,
  JoinWorkspaceByInviteRequestSchema,
  ListWorkspaceMembersRequestSchema,
  ListWorkspacesRequestSchema,
  RemoveMemberRequestSchema,
  UpdateWorkspaceRequestSchema,
} from '@/gen/chatapp/workspace/v1/workspace_service_pb';
import { toGrpcClientError } from '@/lib/grpc/error';

import type {
  CreateWorkspaceInput,
  GetWorkspaceInput,
  InviteInfoModel,
  InviteWorkspaceMemberInput,
  JoinWorkspaceByInviteInput,
  ListWorkspaceMembersInput,
  ListWorkspacesInput,
  RemoveWorkspaceMemberInput,
  UpdateWorkspaceInput,
  WorkspaceMemberModel,
  WorkspaceModel,
} from '../model/workspace-types';
import {
  mapInviteInfo,
  mapJoinWorkspaceByInviteResponse,
  mapWorkspace,
  mapWorkspaceMembers,
  mapWorkspaceResponse,
  mapWorkspaces,
} from '../utils/workspace-mapper';
import { workspaceClient } from './workspace-client';

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function buildWorkspaceUpdateMaskPaths(input: UpdateWorkspaceInput): string[] {
  const paths: string[] = [];

  if (input.name !== undefined) {
    paths.push('name');
  }

  if (input.slug !== undefined) {
    paths.push('slug');
  }

  if (input.iconUrl !== undefined) {
    paths.push('icon_url');
  }

  return paths;
}

export const workspaceService = {
  async listWorkspaces(input?: ListWorkspacesInput): Promise<WorkspaceModel[]> {
    try {
      const response = await workspaceClient.listWorkspaces(
        create(ListWorkspacesRequestSchema, {
          page: input?.page,
        }),
      );

      return mapWorkspaces(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async getWorkspace(input: GetWorkspaceInput): Promise<WorkspaceModel | null> {
    try {
      const response = await workspaceClient.getWorkspace(
        create(GetWorkspaceRequestSchema, {
          workspaceId: input.workspaceId,
        }),
      );

      return mapWorkspaceResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceModel | null> {
    try {
      const response = await workspaceClient.createWorkspace(
        create(CreateWorkspaceRequestSchema, {
          name: input.name,
          iconUrl: input.iconUrl ?? '',
          clientRequestId: input.clientRequestId ?? createClientRequestId('create-workspace'),
        }),
      );

      return mapWorkspace(response.workspace);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async updateWorkspace(input: UpdateWorkspaceInput): Promise<WorkspaceModel | null> {
    const paths = buildWorkspaceUpdateMaskPaths(input);

    if (paths.length === 0) {
      throw new Error('No workspace fields to update');
    }

    try {
      const response = await workspaceClient.updateWorkspace(
        create(UpdateWorkspaceRequestSchema, {
          workspace: {
            id: input.id,
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.slug !== undefined ? { slug: input.slug } : {}),
            ...(input.iconUrl !== undefined ? { iconUrl: input.iconUrl } : {}),
          },
          updateMask: {
            paths,
          },
        }),
      );

      return mapWorkspace(response.workspace);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async inviteWorkspaceMember(input: InviteWorkspaceMemberInput): Promise<string> {
    try {
      const response = await workspaceClient.inviteWorkspaceMember(
        create(InviteWorkspaceMemberRequestSchema, {
          workspaceId: input.workspaceId,
          email: input.email,
        }),
      );

      return response.inviteToken;
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async joinWorkspaceByInvite(input: JoinWorkspaceByInviteInput): Promise<WorkspaceMemberModel | null> {
    try {
      const response = await workspaceClient.joinWorkspaceByInvite(
        create(JoinWorkspaceByInviteRequestSchema, {
          inviteToken: input.inviteToken,
          clientRequestId: input.clientRequestId ?? createClientRequestId('join-workspace'),
        }),
      );

      return mapJoinWorkspaceByInviteResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async listWorkspaceMembers(input: ListWorkspaceMembersInput): Promise<WorkspaceMemberModel[]> {
    try {
      const response = await workspaceClient.listWorkspaceMembers(
        create(ListWorkspaceMembersRequestSchema, {
          workspaceId: input.workspaceId,
          page: input.page,
        }),
      );

      return mapWorkspaceMembers(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async getInviteInfo(inviteCode: string): Promise<InviteInfoModel> {
    try {
      const response = await workspaceClient.getInviteInfo(
        create(GetInviteInfoRequestSchema, {
          inviteCode,
        }),
      );

      return mapInviteInfo(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async removeMember(input: RemoveWorkspaceMemberInput): Promise<void> {
    try {
      await workspaceClient.removeMember(
        create(RemoveMemberRequestSchema, {
          workspaceId: input.workspaceId,
          userId: input.userId,
        }),
      );
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};
