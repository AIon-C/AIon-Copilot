export type Id<T extends string = string> = string & { readonly __table?: T };

export interface MockUser {
  _id: Id<'users'>;
  name: string;
  email?: string;
  image?: string;
}

export interface MockWorkspace {
  _id: Id<'workspaces'>;
  _creationTime: number;
  name: string;
  joinCode: string;
}

export interface MockWorkspaceInfo extends MockWorkspace {
  role: 'admin' | 'member';
  isMember: boolean;
}

export interface MockChannel {
  _id: Id<'channels'>;
  _creationTime: number;
  name: string;
  workspaceId: Id<'workspaces'>;
}

export interface MockMember {
  _id: Id<'members'>;
  _creationTime: number;
  role: 'admin' | 'member';
  workspaceId: Id<'workspaces'>;
  userId: Id<'users'>;
  user: MockUser;
}

export interface MockReaction {
  _id: Id<'reactions'>;
  _creationTime: number;
  value: string;
  count: number;
  memberIds: Id<'members'>[];
  memberId?: Id<'members'>;
}

export interface MockMessage {
  _id: Id<'messages'>;
  _creationTime: number;
  body: string;
  image?: string | null;
  updatedAt?: number;
  memberId: Id<'members'>;
  user: Pick<MockUser, '_id' | 'name' | 'image'>;
  reactions: MockReaction[];
  workspaceId: Id<'workspaces'>;
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
  threadCount?: number;
  threadImage?: string;
  threadName?: string;
  threadTimestamp?: number;
}

export interface MockConversation {
  _id: Id<'conversations'>;
  _creationTime: number;
  workspaceId: Id<'workspaces'>;
  memberId: Id<'members'>;
}

export type DocMap = {
  users: MockUser;
  workspaces: MockWorkspace;
  channels: MockChannel;
  members: MockMember;
  reactions: MockReaction;
  messages: MockMessage;
  conversations: MockConversation;
};

export type Doc<T extends keyof DocMap> = DocMap[T];
