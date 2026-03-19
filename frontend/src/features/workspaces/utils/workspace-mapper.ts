import type { Timestamp } from '@bufbuild/protobuf/wkt';

import type { WorkspaceMember } from '@/gen/chatapp/model/v1/workspace_member_pb';
import type { Workspace } from '@/gen/chatapp/model/v1/workspace_pb';
import type {
  GetInviteInfoResponse,
  GetWorkspaceResponse,
  JoinWorkspaceByInviteResponse,
  ListWorkspaceMembersResponse,
  ListWorkspacesResponse,
} from '@/gen/chatapp/workspace/v1/workspace_service_pb';

import type { InviteInfoModel, WorkspaceMemberModel, WorkspaceModel } from '../model/workspace-types';

function toDate(timestamp?: Timestamp): Date | null {
  if (!timestamp) {
    return null;
  }

  const seconds = typeof timestamp.seconds === 'bigint' ? Number(timestamp.seconds) : Number(timestamp.seconds ?? 0);

  const nanos = Number(timestamp.nanos ?? 0);

  return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
}

export function mapWorkspace(workspace?: Workspace): WorkspaceModel | null {
  if (!workspace) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    iconUrl: workspace.iconUrl || null,
    metadata: workspace.metadata,
    raw: workspace,
  };
}

export function mapWorkspaces(response: ListWorkspacesResponse): WorkspaceModel[] {
  return response.workspace.map((item) => mapWorkspace(item)).filter((item): item is WorkspaceModel => item !== null);
}

export function mapWorkspaceResponse(response: GetWorkspaceResponse): WorkspaceModel | null {
  return mapWorkspace(response.workspace);
}

export function mapWorkspaceMember(member?: WorkspaceMember): WorkspaceMemberModel | null {
  if (!member) {
    return null;
  }

  return {
    id: member.id,
    workspaceId: member.workspaceId,
    userId: member.userId,
    role: member.role,
    joinedAt: toDate(member.joinedAt),
    raw: member,
  };
}

export function mapWorkspaceMembers(response: ListWorkspaceMembersResponse): WorkspaceMemberModel[] {
  return response.members.map((item) => mapWorkspaceMember(item)).filter((item): item is WorkspaceMemberModel => item !== null);
}

export function mapInviteInfo(response: GetInviteInfoResponse): InviteInfoModel {
  return {
    workspace: mapWorkspace(response.workspace),
  };
}

export function mapJoinWorkspaceByInviteResponse(response: JoinWorkspaceByInviteResponse): WorkspaceMemberModel | null {
  return mapWorkspaceMember(response.member);
}
