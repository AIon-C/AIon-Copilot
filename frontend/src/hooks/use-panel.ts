import { atom, useAtom } from 'jotai';

import { useParentMessageId } from '@/features/messages/store/use-parent-message-id';
import { useProfileMemberId } from '@/features/user/store/use-profile-member-id';

const aiChatOpenAtom = atom(false);

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();
  const [aiChatOpen, setAiChatOpen] = useAtom(aiChatOpenAtom);

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

  const onCloseAiChat = () => {
    setAiChatOpen(false);
  };

  const onCloseMessage = () => {
    setParentMessageId(null);
  };

  const onClose = () => {
    setAiChatOpen(false);
    setParentMessageId(null);
    setProfileMemberId(null);
  };

  return {
    aiChatOpen,
    parentMessageId,
    profileMemberId,
    onOpenAiChat,
    onOpenMessage,
    onOpenProfile,
    onCloseAiChat,
    onCloseMessage,
    onClose,
  };
};
