import { differenceInMinutes, format, isToday, isYesterday } from 'date-fns';
import { AlertTriangle, Loader, XIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import type Quill from 'quill';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Message } from '@/components/message';
import { Button } from '@/components/ui/button';
import { ShinyText } from '@/components/ui/shiny-text';
import { fileService } from '@/features/file/api/file-service';
import { useGenerateUploadUrl } from '@/features/file/api/use-generate-upload-url';
import { useCreateMessage } from '@/features/messages/api/use-create-message';
import { useGetMessage } from '@/features/messages/api/use-get-message';
import { useGetMessages } from '@/features/messages/api/use-get-messages';
import { useCurrentMember } from '@/features/user/api/use-current-member';
import { useChannelId } from '@/hooks/use-channel-id';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import type { Id } from '@/mock/types';

const Editor = dynamic(() => import('@/components/editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

const TIME_THRESHOLD = 5;

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);

  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';

  return format(date, 'EEEE, MMMM d');
};

type CreateMessageValues = {
  channelId: Id<'channels'>;
  workspaceId: Id<'workspaces'>;
  parentMessageId: Id<'messages'>;
  body: string;
  image?: string;
};

interface ThreadProps {
  messageId: Id<'messages'>;
  onClose: () => void;
}

export const Thread = ({ messageId, onClose }: ThreadProps) => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();

  const [editingId, setEditingId] = useState<Id<'messages'> | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const innerRef = useRef<Quill | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevResultsLengthRef = useRef(0);
  const prevMessageIdRef = useRef<string | undefined>(undefined);

  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: message, isLoading: isMessageLoading } = useGetMessage({ id: messageId });
  const threadRootMessageId = (message?.parentMessageId as Id<'messages'> | undefined) ?? messageId;

  const { mutate: createMessage } = useCreateMessage();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { results, status, loadMore } = useGetMessages({
    channelId,
    parentMessageId: threadRootMessageId,
  });

  const canLoadMore = status === 'CanLoadMore';
  const isLoadingMore = status === 'LoadingMore';

  const handleSubmit = async ({ body, image }: { body: string; image: File | null }) => {
    try {
      setIsPending(true);
      innerRef.current?.enable(false);

      const values: CreateMessageValues = {
        channelId,
        workspaceId,
        parentMessageId: threadRootMessageId,
        body,
        image: undefined,
      };

      if (image) {
        const uploadSession = await generateUploadUrl(
          {
            workspaceId,
            fileName: image.name,
            contentType: image.type || 'application/octet-stream',
            fileSize: image.size,
          },
          {
            throwError: true,
          },
        );

        if (!uploadSession) throw new Error('Upload session not found.');

        const formData = new FormData();
        formData.append('uploadUrl', uploadSession.uploadUrl);
        formData.append('file', image);

        const result = await fetch('/api/upload-proxy', {
          method: 'POST',
          body: formData,
        });

        if (!result.ok) {
          const payload = (await result.json().catch(() => null)) as { error?: string; detail?: string } | null;
          throw new Error(payload?.detail || payload?.error || 'Failed to upload image.');
        }

        await fileService.completeUpload({ fileId: uploadSession.fileId });

        values.image = uploadSession.fileId;
      }

      await createMessage(values, { throwError: true });

      setEditorKey((prevKey) => prevKey + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message.';
      toast.error(message);
    } finally {
      setIsPending(false);
      innerRef?.current?.enable(true);
    }
  };

  const groupedMessages = results?.reduce(
    (groups, message) => {
      const date = new Date(message._creationTime);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(message);

      return groups;
    },
    {} as Record<string, typeof results>,
  );

  useEffect(() => {
    if (status === 'LoadingFirstPage') {
      return;
    }

    const currentLength = results?.length ?? 0;
    const prevLength = prevResultsLengthRef.current;
    const prevMessageId = prevMessageIdRef.current;
    const currentMessageId = message?._id;

    prevResultsLengthRef.current = currentLength;
    prevMessageIdRef.current = currentMessageId;

    const threadSwitched = currentMessageId !== prevMessageId;

    if (!threadSwitched) {
      if (currentLength <= prevLength) return;

      const el = scrollContainerRef.current;
      const nearBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      if (!nearBottom) return;
    }

    const rafId = window.requestAnimationFrame(() => {
      bottomAnchorRef.current?.scrollIntoView({ block: 'end' });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [message?._id, results, status]);

  if (isMessageLoading || status === 'LoadingFirstPage') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-[49px] items-center justify-between border-b px-4">
          <ShinyText className="text-lg font-bold" color="#cbd5e1" shineColor="#ffffff" speed={2.2} spread={115}>
            Thread
          </ShinyText>

          <Button onClick={onClose} size="iconSm" variant="ghost">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>

        <div className="flex h-full items-center justify-center">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-[49px] items-center justify-between border-b px-4">
          <ShinyText className="text-lg font-bold" color="#cbd5e1" shineColor="#ffffff" speed={2.2} spread={115}>
            Thread
          </ShinyText>

          <Button onClick={onClose} size="iconSm" variant="ghost">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>

        <div className="flex h-full flex-col items-center justify-center gap-y-2">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Message not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center justify-between border-b px-4">
        <ShinyText className="text-lg font-bold" color="#cbd5e1" shineColor="#ffffff" speed={2.2} spread={115}>
          Thread
        </ShinyText>

        <Button onClick={onClose} size="iconSm" variant="ghost">
          <XIcon className="size-5 stroke-[1.5]" />
        </Button>
      </div>

      <div ref={scrollContainerRef} className="messages-scrollbar flex flex-1 flex-col justify-end overflow-y-auto pb-4">
        <Message
          hideThreadButton
          memberId={message.memberId}
          authorName={message.user.name}
          authorImage={message.user.image}
          isAuthor={message.memberId === currentMember?._id}
          body={message.body}
          image={message.image}
          createdAt={message._creationTime}
          updatedAt={message.updatedAt}
          id={message._id}
          reactions={message.reactions}
          isEditing={editingId === message._id}
          setEditingId={setEditingId}
        />

        {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
          <div key={dateKey}>
            <div className="relative my-2 text-center">
              <hr className="absolute left-0 right-0 top-1/2 border-t border-gray-300" />

              <span className="relative inline-block rounded-full border border-slate-600 bg-slate-900/90 px-4 py-1 text-xs shadow-sm">
                {formatDateLabel(dateKey)}
              </span>
            </div>

            {messages.map((message, i) => {
              const prevMessage = messages[i - 1];
              const isCompact =
                prevMessage &&
                prevMessage.user._id === message.user._id &&
                differenceInMinutes(new Date(message._creationTime), new Date(prevMessage._creationTime)) < TIME_THRESHOLD;

              return (
                <Message
                  key={message._id}
                  id={message._id}
                  memberId={message.memberId}
                  authorImage={message.user.image}
                  authorName={message.user.name}
                  isAuthor={message.memberId === currentMember?._id}
                  reactions={message.reactions}
                  body={message.body}
                  image={message.image}
                  updatedAt={message.updatedAt}
                  createdAt={message._creationTime}
                  threadCount={message.threadCount}
                  threadImage={message.threadImage}
                  threadName={message.threadName}
                  threadTimestamp={message.threadTimestamp}
                  isEditing={editingId === message._id}
                  setEditingId={setEditingId}
                  isCompact={isCompact}
                  hideThreadButton
                />
              );
            })}
          </div>
        ))}

        <div
          className="h-1"
          ref={(el) => {
            if (el) {
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting && canLoadMore) loadMore();
                },
                { threshold: 1.0 },
              );

              observer.observe(el);

              return () => observer.disconnect();
            }
          }}
        />

        {isLoadingMore && (
          <div className="relative my-2 text-center">
            <hr className="absolute left-0 right-0 top-1/2 border-t border-gray-300" />

            <span className="relative inline-block rounded-full border border-slate-600 bg-slate-900/90 px-4 py-1 text-xs shadow-sm">
              <Loader className="size-4 animate-spin" />
            </span>
          </div>
        )}

        <div ref={bottomAnchorRef} />
      </div>

      <div className="px-4">
        <Editor key={editorKey} onSubmit={handleSubmit} innerRef={innerRef} disabled={isPending} placeholder="Reply..." />
      </div>
    </div>
  );
};
