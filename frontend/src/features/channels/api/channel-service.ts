import { create } from '@bufbuild/protobuf';

import {
  CreateChannelRequestSchema,
  GetChannelRequestSchema,
  GetUnreadCountsRequestSchema,
  JoinChannelRequestSchema,
  LeaveChannelRequestSchema,
  ListChannelsRequestSchema,
  MarkChannelReadRequestSchema,
  SearchChannelsRequestSchema,
  UpdateChannelRequestSchema,
} from '@/gen/chatapp/channel/v1/channel_service_pb';
import { toGrpcClientError } from '@/lib/grpc/error';

import type {
  ChannelMemberModel,
  ChannelModel,
  CreateChannelInput,
  GetChannelInput,
  JoinChannelInput,
  LeaveChannelInput,
  ListChannelsInput,
  MarkChannelReadInput,
  SearchChannelsInput,
  UnreadCountModel,
  UpdateChannelInput,
} from '../model/channel-types';
import { mapChannel, mapChannelResponse, mapChannels, mapJoinChannelResponse, mapUnreadCounts } from '../utils/channel-mapper';
import { channelClient } from './channel-client';

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

export const channelService = {
  async listChannels(input: ListChannelsInput): Promise<ChannelModel[]> {
    try {
      const response = await channelClient.listChannels(
        create(ListChannelsRequestSchema, {
          workspaceId: input.workspaceId,
          page: input.page,
          sort: input.sort,
        }),
      );

      return mapChannels(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async getUnreadCounts(workspaceId: string): Promise<UnreadCountModel[]> {
    try {
      const response = await channelClient.getUnreadCounts(
        create(GetUnreadCountsRequestSchema, {
          workspaceId,
        }),
      );

      return mapUnreadCounts(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async getChannel(input: GetChannelInput): Promise<ChannelModel | null> {
    try {
      const response = await channelClient.getChannel(
        create(GetChannelRequestSchema, {
          channelId: input.channelId,
        }),
      );

      return mapChannelResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async searchChannels(input: SearchChannelsInput): Promise<ChannelModel[]> {
    try {
      const response = await channelClient.searchChannels(
        create(SearchChannelsRequestSchema, {
          workspaceId: input.workspaceId,
          query: input.query,
          page: input.page,
        }),
      );

      return mapChannels(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async createChannel(input: CreateChannelInput): Promise<ChannelModel | null> {
    try {
      const response = await channelClient.createChannel(
        create(CreateChannelRequestSchema, {
          workspaceId: input.workspaceId,
          name: input.name,
          description: input.description ?? '',
          clientRequestId: input.clientRequestId ?? createClientRequestId('create-channel'),
        }),
      );

      return mapChannel(response.channel);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async updateChannel(input: UpdateChannelInput): Promise<ChannelModel | null> {
    const paths: string[] = [];

    if (input.name !== undefined) {
      paths.push('name');
    }

    if (input.description !== undefined) {
      paths.push('description');
    }

    if (paths.length === 0) {
      throw new Error('No channel fields to update');
    }

    try {
      const response = await channelClient.updateChannel(
        create(UpdateChannelRequestSchema, {
          channel: {
            id: input.id,
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
          },
          updateMask: {
            paths,
          },
        }),
      );

      return mapChannel(response.channel);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async joinChannel(input: JoinChannelInput): Promise<ChannelMemberModel | null> {
    try {
      const response = await channelClient.joinChannel(
        create(JoinChannelRequestSchema, {
          channelId: input.channelId,
          clientRequestId: input.clientRequestId ?? createClientRequestId('join-channel'),
        }),
      );

      return mapJoinChannelResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async leaveChannel(input: LeaveChannelInput): Promise<void> {
    try {
      await channelClient.leaveChannel(
        create(LeaveChannelRequestSchema, {
          channelId: input.channelId,
        }),
      );
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },

  async markChannelRead(input: MarkChannelReadInput): Promise<void> {
    try {
      await channelClient.markChannelRead(
        create(MarkChannelReadRequestSchema, {
          channelId: input.channelId,
          lastReadMessageId: input.lastReadMessageId,
        }),
      );
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};
