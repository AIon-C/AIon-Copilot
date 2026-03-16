import { useQueryState } from 'nuqs';

import { useProfileMemberId } from '@/features/members/store/use-profile-member-id';
import { useParentMessageId } from '@/features/messages/store/use-parent-message-id';

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();
  const [aiChatOpen, setAiChatOpen] = useQueryState('aiChat');

  const onOpenMessage = (messageId: string) => {
    setParentMessageId(messageId);
    setProfileMemberId(null);
  };

  const onOpenProfile = (memberId: string) => {
    setAiChatOpen(null);
    setProfileMemberId(memberId);
    setParentMessageId(null);
  };

  const onOpenAiChat = () => {
    setAiChatOpen('1');
    setProfileMemberId(null);
  };

  const onCloseAiChat = () => {
    setAiChatOpen(null);
  };

  const onCloseMessage = () => {
    setParentMessageId(null);
  };

  const onClose = () => {
    setAiChatOpen(null);
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
