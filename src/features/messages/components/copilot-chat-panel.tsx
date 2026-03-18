'use client';

import { Bot, Loader, User, XIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { copilotApiConfig } from '@/config';
import { createCopilotThread, getCopilotUserErrorMessage } from '@/features/messages/api/copilot-client';
import { getTextFromQuillBody } from '@/features/messages/api/copilot-contract';
import { useCreateMessage } from '@/features/messages/api/use-create-message';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

const Editor = dynamic(() => import('@/components/editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface AiChatPanelProps {
  onClose: () => void;
}

interface EditorSubmitPayload {
  body: string;
  image: File | null;
}

export const AiChatPanel = ({ onClose }: AiChatPanelProps) => {
  const workspaceId = useWorkspaceId();

  const [threadId, setThreadId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-initial',
      role: 'assistant',
      content: 'Welcome to Copilot!! Ask me anything.',
    },
  ]);

  const { mutate: createMessage } = useCreateMessage();

  const handleSubmit = async ({ body }: EditorSubmitPayload) => {
    const prompt = getTextFromQuillBody(body);

    if (!prompt || isThinking) return;

    const optimisticUserMessageId = `user-${Date.now()}`;

    setMessages((prev) => [...prev, { id: optimisticUserMessageId, role: 'user', content: prompt }]);
    setIsThinking(true);

    try {
      let activeThreadId = threadId;

      if (!activeThreadId) {
        const createdThread = await createCopilotThread({
          workspaceId,
          title: prompt.slice(0, 80),
          mode: copilotApiConfig.mode,
        });

        activeThreadId = createdThread.id;
        setThreadId(createdThread.id);
      }

      const result = await createMessage(
        {
          body,
          workspaceId,
          copilot: {
            threadId: activeThreadId,
            mode: copilotApiConfig.mode,
            promptText: prompt,
          },
        },
        {
          throwError: true,
        },
      );

      if (result && typeof result === 'object' && 'fallbackUsed' in result && result.fallbackUsed) {
        toast.message('実API未稼働のため、stub応答に切り替えました。');
      }

      if (result && typeof result === 'object' && 'assistantContent' in result) {
        setMessages((prev) => [...prev, { id: result.assistantMessageId, role: 'assistant', content: result.assistantContent }]);
      }

      setEditorKey((prevKey) => prevKey + 1);
    } catch (error) {
      setMessages((prev) => {
        const withoutFailedUserMessage = prev.filter((message) => message.id !== optimisticUserMessageId);

        return [
          ...withoutFailedUserMessage,
          {
            id: `assistant-error-${Date.now()}`,
            role: 'assistant',
            content: 'メッセージの送信に失敗しました。ネットワークまたは認証状態を確認して、再度お試しください。',
          },
        ];
      });
      toast.error(getCopilotUserErrorMessage(error));
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center justify-between border-b px-4">
        <p className="text-lg font-bold">Copilot</p>

        <Button onClick={onClose} size="iconSm" variant="ghost">
          <XIcon className="size-5 stroke-[1.5]" />
        </Button>
      </div>

      <div className="messages-scrollbar flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
        {messages.map((message) => (
          <div key={message.id} className={cn('flex w-full', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed shadow-sm',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'border bg-background text-foreground',
              )}
            >
              <div className="mb-1 flex items-center gap-1.5 text-[11px] opacity-80">
                {message.role === 'assistant' ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                <span>{message.role === 'assistant' ? 'Copilot' : 'You'}</span>
              </div>
              <p>{message.content}</p>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex w-full justify-start">
            <div className="flex max-w-[85%] items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Loader className="size-3.5 animate-spin" />
              <span>Copilotが回答を作成中です...</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t px-3">
        <Editor key={editorKey} onSubmit={handleSubmit} disabled={isThinking} placeholder="Ask Copilot..." />
      </div>
    </div>
  );
};
