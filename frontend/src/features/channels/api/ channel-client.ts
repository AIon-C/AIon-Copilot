import { ChannelService } from "@/gen/chatapp/channel/v1/channel_service_pb";
import { createApiClient } from "@/lib/grpc/base-client";

export const channelClient = createApiClient(ChannelService);