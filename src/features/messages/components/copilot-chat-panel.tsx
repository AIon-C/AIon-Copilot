'use client';

import { Bot, Loader, User, XIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
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

const getTextFromEditorBody = (body: string) => {
  try {
    const parsed = JSON.parse(body) as { ops?: Array<{ insert?: unknown }> };

    if (!Array.isArray(parsed.ops)) return '';

    return parsed.ops
      .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
      .join('')
      .trim();
  } catch {
    return '';
  }
};

const ASSISTANT_REPLY =
  'これはCopilotのデモです。実際のCopilotは、コードの提案や質問への回答など、さまざまな機能を提供します。何か質問がありますか？';

export const AiChatPanel = ({ onClose }: AiChatPanelProps) => {
  const [isThinking, setIsThinking] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-initial',
      role: 'assistant',
      content: 'Welcome to Copilot!! Ask me anything.',
    },
  ]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = ({ body }: EditorSubmitPayload) => {
    const prompt = getTextFromEditorBody(body);

    if (!prompt || isThinking) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setEditorKey((prevKey) => prevKey + 1);
    setIsThinking(true);

    timerRef.current = setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: ASSISTANT_REPLY,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 450);
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
