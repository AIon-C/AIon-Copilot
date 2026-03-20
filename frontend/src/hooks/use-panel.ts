import { atom, useAtom } from 'jotai';

import { useParentMessageId } from '@/features/messages/store/use-parent-message-id';
import { useProfileMemberId } from '@/features/user/store/use-profile-member-id';

const aiChatOpenAtom = atom(false);
const copilotContextMessageIdAtom = atom<string | null>(null);

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();
  const [aiChatOpen, setAiChatOpen] = useAtom(aiChatOpenAtom);
  const [copilotContextMessageId, setCopilotContextMessageId] = useAtom(copilotContextMessageIdAtom);

  const onOpenMessage = (messageId: string) => {
    setParentMessageId(messageId);
    setProfileMemberId(null);
  };

  const onOpenProfile = (memberId: string) => {
    setAiChatOpen(false);
    setProfileMemberId(memberId);
    setParentMessageId(null);
  };

  const onOpenAiChat = () => {
    setAiChatOpen(true);
  };

  const onSetCopilotContextMessage = (messageId: string | null) => {
    setCopilotContextMessageId(messageId);
  };

  const onCloseAiChat = () => {
    setAiChatOpen(false);
    setCopilotContextMessageId(null);
  };

  const onCloseMessage = () => {
    setParentMessageId(null);
  };

  const onClose = () => {
    setAiChatOpen(false);
    setParentMessageId(null);
    setCopilotContextMessageId(null);
    setProfileMemberId(null);
  };

  return {
    aiChatOpen,
    copilotContextMessageId,
    parentMessageId,
    profileMemberId,
    onOpenAiChat,
    onSetCopilotContextMessage,
    onOpenMessage,
    onOpenProfile,
    onCloseAiChat,
    onCloseMessage,
    onClose,
  };
};
