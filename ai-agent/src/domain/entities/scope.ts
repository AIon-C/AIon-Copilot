export type ChannelScope = {
  type: "channel";
  channelId: string;
};

export type ThreadScope = {
  type: "thread";
  channelId: string;
  threadRootId: string;
};

export type FreeScope = {
  type: "free";
};

export type Scope = ChannelScope | ThreadScope | FreeScope;

export function determineScope(
  channelId: string | null,
  threadRootId: string | null,
): Scope {
  if (channelId && threadRootId) {
    return { type: "thread", channelId, threadRootId };
  }
  if (channelId) {
    return { type: "channel", channelId };
  }
  return { type: "free" };
}
