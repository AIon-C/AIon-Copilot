import { Channel } from "@/gen/chatapp/model/v1/channel_pb";
import { Timestamp } from "@bufbuild/protobuf/wkt";
import { ChannelMemberModel, ChannelModel, UnreadCountModel } from "../model/channel-types";
import { GetChannelResponse, GetUnreadCountsResponse, JoinChannelResponse, ListChannelsResponse, SearchChannelsResponse, UnreadCount } from "@/gen/chatapp/channel/v1/channel_service_pb";
import { ChannelMember } from "@/gen/chatapp/model/v1/channel_member_pb";

function toDate(timestamp?: Timestamp): Date | null {
  if (!timestamp) {
    return null;
  }

  const seconds =
    typeof timestamp.seconds === "bigint"
      ? Number(timestamp.seconds)
      : Number(timestamp.seconds ?? 0);

  const nanos = Number(timestamp.nanos ?? 0);

  return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
}

export function mapChannel(channel?: Channel): ChannelModel | null {
  if (!channel) {
    return null;
  }

  return {
    id: channel.id,
    workspaceId: channel.workspaceId,
    name: channel.name,
    description: channel.description,
    createdBy: channel.createdBy,
    metadata: channel.metadata,
    raw: channel,
  };
}

export function mapChannels(
  response: ListChannelsResponse | SearchChannelsResponse,
): ChannelModel[] {
  return response.channels
    .map((channel) => mapChannel(channel))
    .filter((channel): channel is ChannelModel => channel !== null);
}

export function mapChannelResponse(
  response: GetChannelResponse,
): ChannelModel | null {
  return mapChannel(response.channel);
}

export function mapUnreadCounts(
  response: GetUnreadCountsResponse,
): UnreadCountModel[] {
  return response.unreadCounts.map((item) => ({
    channelId: item.channelId,
    count: item.count,
  }));
}

export function mapChannelMember(
  membership?: ChannelMember,
): ChannelMemberModel | null {
  if (!membership) {
    return null
  }

  return {
    id: membership.id,
    channelId: membership.channelId,
    userId: membership.userId,
    lastReadAt: toDate(membership.lastReadAt),
    joinedAt: toDate(membership.joinedAt),
    raw: membership,
  };
}

export function mepJoinChannelResponse(
  response: JoinChannelResponse,
): ChannelMemberModel | null {
  return mapChannelMember(response.membership);
}
