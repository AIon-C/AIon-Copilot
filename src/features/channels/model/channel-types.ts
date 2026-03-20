import type { ListChannelsRequest, SearchChannelsRequest } from '@/gen/chatapp/channel/v1/channel_service_pb';

export type ChannelModel = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdBy: string;
  metadata?: unknown;
  raw?: unknown;
};

export type ChannelMemberModel = {
  id: string;
  channelId: string;
  userId: string;
  lastReadAt: Date | null;
  joinedAt: Date | null;
  raw?: unknown;
};

export type UnreadCountModel = {
  channelId: string;
  count: number;
};

export type ListChannelsInput = {
  workspaceId: string;
  page?: ListChannelsRequest['page'];
  sort?: ListChannelsRequest['sort'];
};

export type SearchChannelsInput = {
  workspaceId: string;
  query: string;
  page?: SearchChannelsRequest['page'];
};

export type CreateChannelInput = {
  workspaceId: string;
  name: string;
  description?: string;
  clientRequestId?: string;
};

export type GetChannelInput = {
  channelId: string;
};

export type JoinChannelInput = {
  channelId: string;
  clientRequestId?: string;
};

export type LeaveChannelInput = {
  channelId: string;
};

export type MarkChannelReadInput = {
  channelId: string;
  lastReadMessageId: string;
};
