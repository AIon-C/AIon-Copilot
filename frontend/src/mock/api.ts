import { mockMessages } from '@/mock/messages';
import type { Id, MockChannel, MockConversation, MockMember, MockMessage, MockUser, MockWorkspace, MockWorkspaceInfo } from '@/mock/types';

const toId = <T extends string>(value: string): Id<T> => value as Id<T>;

const BASE_TIME = new Date('2026-01-01T09:00:00.000Z').getTime();
let timeTick = 0;
const now = () => BASE_TIME + timeTick++ * 1000;

let joinCodeSeq = 1000;
let reactionSeq = 1;

const currentUser: MockUser = {
  _id: toId<'users'>('u1'),
  name: 'Demo User',
  email: 'demo@example.com',
  image: 'https://api.dicebear.com/9.x/initials/svg?seed=Demo+User',
};

const workspaces: MockWorkspace[] = [
  {
    _id: toId<'workspaces'>('w1'),
    _creationTime: now() - 100000,
    name: 'Mock Workspace',
    joinCode: 'MOCK123',
  },
];

const channels: MockChannel[] = [
  {
    _id: toId<'channels'>('c1'),
    _creationTime: now() - 90000,
    name: 'general',
    workspaceId: toId<'workspaces'>('w1'),
  },
];

const members: MockMember[] = [
  {
    _id: toId<'members'>('m1'),
    _creationTime: now() - 80000,
    role: 'admin',
    workspaceId: toId<'workspaces'>('w1'),
    userId: currentUser._id,
    user: currentUser,
  },
  {
    _id: toId<'members'>('m2'),
    _creationTime: now() - 70000,
    role: 'member',
    workspaceId: toId<'workspaces'>('w1'),
    userId: toId<'users'>('u2'),
    user: {
      _id: toId<'users'>('u2'),
      name: 'Alice',
      email: 'alice@example.com',
      image: 'https://api.dicebear.com/9.x/initials/svg?seed=Alice',
    },
  },
];

const conversations: MockConversation[] = [];

const messages: MockMessage[] = mockMessages.map((item, index) => ({
  _id: toId<'messages'>(item.id),
  _creationTime: new Date(item.createdAt).getTime(),
  body: JSON.stringify([{ insert: `${item.text}\n` }]),
  image: null,
  memberId: members[index % members.length]._id,
  user: {
    _id: members[index % members.length].user._id,
    name: item.user,
    image: members[index % members.length].user.image,
  },
  reactions: [],
  workspaceId: toId<'workspaces'>('w1'),
  channelId: toId<'channels'>('c1'),
  parentMessageId: item.parentId ? toId<'messages'>(item.parentId) : undefined,
}));

let messageSeq = messages.length + 1;

export async function getMessages() {
  return [...mockMessages];
}

export async function sendMessage(text: string) {
  const newMessage = {
    id: String(mockMessages.length + 1),
    user: 'Demo User',
    text,
    createdAt: new Date().toISOString(),
  };

  mockMessages.push(newMessage);
  return newMessage;
}

export async function getCurrentUser() {
  return currentUser;
}

export async function signInMockUser(values: { name: string; email: string }) {
  currentUser.name = values.name;
  currentUser.email = values.email;
  currentUser.image = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(values.name)}`;
  return currentUser;
}

export async function signOutMockUser() {
  return true;
}

export async function getWorkspaceById(id: Id<'workspaces'>) {
  return workspaces.find((item) => item._id === id) ?? null;
}

export async function getWorkspaceInfoById(id: Id<'workspaces'>): Promise<MockWorkspaceInfo | null> {
  const workspace = workspaces.find((item) => item._id === id);
  if (!workspace) return null;

  return { ...workspace, role: 'admin', isMember: true };
}

export async function getWorkspaces() {
  return [...workspaces];
}

export async function createWorkspace(values: { name: string }) {
  const workspaceId = toId<'workspaces'>(`w${workspaces.length + 1}`);
  workspaces.push({
    _id: workspaceId,
    _creationTime: now(),
    name: values.name,
    joinCode: `JOIN${workspaces.length + 1}`,
  });

  return workspaceId;
}

export async function updateWorkspace(values: { id: Id<'workspaces'>; name: string }) {
  const workspace = workspaces.find((item) => item._id === values.id);
  if (workspace) workspace.name = values.name;
  return values.id;
}

export async function removeWorkspace(values: { id: Id<'workspaces'> }) {
  const index = workspaces.findIndex((item) => item._id === values.id);
  if (index >= 0) workspaces.splice(index, 1);
  return values.id;
}

export async function joinWorkspace(values: { workspaceId: Id<'workspaces'>; joinCode: string }) {
  const workspace = workspaces.find((item) => item._id === values.workspaceId && item.joinCode === values.joinCode);
  return workspace?._id ?? null;
}

export async function generateNewJoinCode(values: { workspaceId: Id<'workspaces'> }) {
  const workspace = workspaces.find((item) => item._id === values.workspaceId);
  if (workspace) workspace.joinCode = `JOIN${joinCodeSeq++}`;
  return values.workspaceId;
}

export async function getChannels(values: { workspaceId: Id<'workspaces'> }) {
  return channels.filter((item) => item.workspaceId === values.workspaceId);
}

export async function getChannelById(values: { id: Id<'channels'> }) {
  return channels.find((item) => item._id === values.id) ?? null;
}

export async function createChannel(values: { name: string; workspaceId: Id<'workspaces'> }) {
  const id = toId<'channels'>(`c${channels.length + 1}`);
  channels.push({
    _id: id,
    _creationTime: now(),
    name: values.name,
    workspaceId: values.workspaceId,
  });
  return id;
}

export async function updateChannel(values: { id: Id<'channels'>; name: string }) {
  const channel = channels.find((item) => item._id === values.id);
  if (channel) channel.name = values.name;
  return values.id;
}

export async function removeChannel(values: { id: Id<'channels'> }) {
  const index = channels.findIndex((item) => item._id === values.id);
  if (index >= 0) channels.splice(index, 1);
  return values.id;
}

export async function getMembers(values: { workspaceId: Id<'workspaces'> }) {
  return members.filter((item) => item.workspaceId === values.workspaceId);
}

export async function getCurrentMember(values: { workspaceId: Id<'workspaces'> }) {
  return members.find((item) => item.workspaceId === values.workspaceId && item.userId === currentUser._id) ?? null;
}

export async function getMemberById(values: { id: Id<'members'> }) {
  return members.find((item) => item._id === values.id) ?? null;
}

export async function updateMember(values: { id: Id<'members'>; role: 'admin' | 'member' }) {
  const member = members.find((item) => item._id === values.id);
  if (member) member.role = values.role;
  return values.id;
}

export async function removeMember(values: { id: Id<'members'> }) {
  const index = members.findIndex((item) => item._id === values.id);
  if (index >= 0) members.splice(index, 1);
  return values.id;
}

export async function createOrGetConversation(values: { workspaceId: Id<'workspaces'>; memberId: Id<'members'> }) {
  const existing = conversations.find((item) => item.workspaceId === values.workspaceId && item.memberId === values.memberId);
  if (existing) return existing._id;

  const id = toId<'conversations'>(`cv${conversations.length + 1}`);
  conversations.push({ _id: id, _creationTime: now(), workspaceId: values.workspaceId, memberId: values.memberId });
  return id;
}

export async function getMessageById(values: { id: Id<'messages'> }) {
  return messages.find((item) => item._id === values.id) ?? null;
}

export async function getMessagesByFilter(values: {
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
}) {
  const filtered = messages.filter((item) => {
    if (values.channelId && item.channelId !== values.channelId) return false;
    if (values.conversationId && item.conversationId !== values.conversationId) return false;
    if (values.parentMessageId && item.parentMessageId !== values.parentMessageId) return false;
    if (!values.channelId && !values.conversationId && !values.parentMessageId) {
      return item.channelId === toId<'channels'>('c1') && !item.parentMessageId;
    }

    if (!values.parentMessageId && item.parentMessageId) return false;

    return true;
  });

  if (values.parentMessageId) {
    return filtered;
  }

  return filtered.map((item) => {
    const replies = messages.filter((reply) => reply.parentMessageId === item._id).sort((a, b) => b._creationTime - a._creationTime);

    if (!replies.length) {
      return {
        ...item,
        threadCount: undefined,
        threadImage: undefined,
        threadName: undefined,
        threadTimestamp: undefined,
      };
    }

    const latestReply = replies[0];

    return {
      ...item,
      threadCount: replies.length,
      threadImage: latestReply.user.image,
      threadName: latestReply.user.name,
      threadTimestamp: latestReply._creationTime,
    };
  });
}

export async function createMessage(values: {
  body: string;
  image?: Id<'_storage'>;
  workspaceId: Id<'workspaces'>;
  channelId?: Id<'channels'>;
  conversationId?: Id<'conversations'>;
  parentMessageId?: Id<'messages'>;
}) {
  const currentMember = members.find((item) => item.userId === currentUser._id) ?? members[0];
  const id = toId<'messages'>(`msg${messageSeq++}`);

  const created: MockMessage = {
    _id: id,
    _creationTime: now(),
    body: values.body,
    image: values.image ? 'https://placehold.co/600x400/png' : null,
    memberId: currentMember._id,
    user: {
      _id: currentMember.user._id,
      name: currentMember.user.name,
      image: currentMember.user.image,
    },
    reactions: [],
    workspaceId: values.workspaceId,
    channelId: values.channelId,
    conversationId: values.conversationId,
    parentMessageId: values.parentMessageId,
  };

  messages.push(created);
  await sendMessage(typeof values.body === 'string' ? values.body.replace(/\n/g, ' ').slice(0, 120) : 'Message');
  return id;
}

export async function updateMessage(values: { id: Id<'messages'>; body: string }) {
  const message = messages.find((item) => item._id === values.id);
  if (message) {
    message.body = values.body;
    message.updatedAt = now();
  }

  return values.id;
}

export async function removeMessage(values: { id: Id<'messages'> }) {
  const index = messages.findIndex((item) => item._id === values.id);
  if (index >= 0) messages.splice(index, 1);

  return values.id;
}

export async function toggleReaction(values: { value: string; messageId: Id<'messages'> }) {
  const message = messages.find((item) => item._id === values.messageId);
  if (!message) return null;

  const member = members[0];
  const existing = message.reactions.find((item) => item.value === values.value);

  if (!existing) {
    message.reactions.push({
      _id: toId<'reactions'>(`r${reactionSeq++}`),
      _creationTime: now(),
      value: values.value,
      count: 1,
      memberIds: [member._id],
    });
  } else if (existing.memberIds.includes(member._id)) {
    existing.memberIds = existing.memberIds.filter((id) => id !== member._id);
    existing.count = existing.memberIds.length;
  } else {
    existing.memberIds.push(member._id);
    existing.count = existing.memberIds.length;
  }

  return toId<'reactions'>(`r-${values.messageId}`);
}

export async function generateUploadUrl() {
  return '/api/mock-upload';
}
