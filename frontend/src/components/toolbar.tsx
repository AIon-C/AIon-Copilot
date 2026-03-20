import { Bot, MessageSquareText, Pencil, Smile, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { EmojiPopover } from './emoji-popover';
import { Hint } from './hint';

interface ToolbarProps {
  isAuthor: boolean;
  isPending: boolean;
  handleEdit: () => void;
  handleDelete: () => void;
  handleThread: () => void;
  handleCopilotContext: () => void;
  isCopilotContextActive?: boolean;
  handleReaction: (value: string) => void;
  hideThreadButton?: boolean;
}

export const Toolbar = ({
  isAuthor,
  isPending,
  handleEdit,
  handleDelete,
  handleThread,
  handleCopilotContext,
  isCopilotContextActive,
  handleReaction,
  hideThreadButton,
}: ToolbarProps) => {
  return (
    <div className="absolute right-5 top-0">
      <div className="rounded-md border border-slate-700 bg-slate-900/95 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        <EmojiPopover hint="Add reaction" onEmojiSelect={handleReaction}>
          <Button variant="ghost" size="iconSm" disabled={isPending}>
            <Smile className="size-4" />
          </Button>
        </EmojiPopover>

        {!hideThreadButton && (
          <Hint label="Reply in thread">
            <Button onClick={handleThread} variant="ghost" size="iconSm" disabled={isPending}>
              <MessageSquareText className="size-4" />
            </Button>
          </Hint>
        )}

        <Hint label={isCopilotContextActive ? 'Copilot context selected' : 'Use as Copilot context'}>
          <Button
            onClick={handleCopilotContext}
            variant="ghost"
            size="iconSm"
            disabled={isPending}
            className={isCopilotContextActive ? 'bg-cyan-400/15 text-cyan-200 hover:bg-cyan-400/20 hover:text-cyan-100' : undefined}
          >
            <Bot className="size-4" />
          </Button>
        </Hint>

        {isAuthor && (
          <Hint label="Edit message">
            <Button onClick={handleEdit} variant="ghost" size="iconSm" disabled={isPending}>
              <Pencil className="size-4" />
            </Button>
          </Hint>
        )}

        {isAuthor && (
          <Hint label="Delete message">
            <Button onClick={handleDelete} variant="ghost" size="iconSm" disabled={isPending}>
              <Trash className="size-4" />
            </Button>
          </Hint>
        )}
      </div>
    </div>
  );
};
