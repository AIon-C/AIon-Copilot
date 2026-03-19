import type {
  ListWorkspaceMembersRequest,
  ListWorkspacesRequest,
} from "@/gen/chatapp/workspace/v1/workspace_service_pb";

export type WorkspaceModel = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  metadata?: unknown;
  raw?: unknown;
};

export type WorkspaceMemberModel = {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  joinedAt: Date | null;
  raw?: unknown;
};

export type InviteInfoModel = {
  workspace: WorkspaceModel | null;
};

export type ListWorkspacesInput = {
  page?: ListWorkspacesRequest["page"];
};

export type GetWorkspaceInput = {
  workspaceId: string;
};

export type CreateWorkspaceInput = {
  name: string;
  iconUrl?: string;
  clientRequestId?: string;
};

export type UpdateWorkspaceInput = {
  id: string;
  name?: string;
  slug?: string;
  iconUrl?: string;
};

export type InviteWorkspaceMemberInput = {
  workspaceId: string;
  email: string;
};

export type JoinWorkspaceByInviteInput = {
  inviteToken: string;
  clientRequestId?: string;
};

export type ListWorkspaceMembersInput = {
  workspaceId: string;
  page?: ListWorkspaceMembersRequest["page"];
};

export type RemoveWorkspaceMemberInput = {
  workspaceId: string;
  userId: string;
};