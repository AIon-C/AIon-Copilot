import { MdOutlineAddReaction } from 'react-icons/md';

import { useCurrentMember } from '@/features/user/api/use-current-member';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { cn } from '@/lib/utils';
import type { Doc, Id } from '@/mock/types';

import { EmojiPopover } from './emoji-popover';
import { Hint } from './hint';

interface ReactionsProps {
  data: Array<
    Omit<Doc<'reactions'>, 'memberId'> & {
      count: number;
      memberIds: Id<'members'>[];
    }
  >;
  onChange: (value: string) => void;
}

export const Reactions = ({ data, onChange }: ReactionsProps) => {
  const workspaceId = useWorkspaceId();
  const { data: currentMember } = useCurrentMember({ workspaceId });

  const currentMemberId = currentMember?._id;

  if (data.length === 0 || !currentMemberId) return null;

  return (
    <div className="my-1 flex items-center gap-1">
      {data.map((reaction) => (
        <Hint key={reaction._id} label={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted with ${reaction.value}`}>
          <button
            onClick={() => onChange(reaction.value)}
            className={cn(
              'flex h-6 items-center gap-x-1 rounded-full border border-slate-600 bg-slate-700/70 px-2 text-slate-200',
              reaction.memberIds.includes(currentMemberId) && 'border-slate-500 bg-slate-600/80 text-slate-100',
            )}
          >
            {reaction.value}{' '}
            <span
              className={cn('text-xs font-semibold text-slate-400', reaction.memberIds.includes(currentMemberId) && 'text-slate-200')}
            >
              {reaction.count}
            </span>
          </button>
        </Hint>
      ))}

      <EmojiPopover hint="Add a reaction" onEmojiSelect={onChange}>
        <button className="flex h-7 items-center gap-x-1 rounded-full border border-slate-600 bg-slate-700/70 px-3 text-slate-200 hover:border-slate-500 hover:bg-slate-600/80">
          <MdOutlineAddReaction className="size-4" />
        </button>
      </EmojiPopover>
    </div>
  );
};
