'use client';

import { Loader } from 'lucide-react';
import dynamic from 'next/dynamic';
import type Quill from 'quill';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { fileService } from '@/features/file/api/file-service';
import { useGenerateUploadUrl } from '@/features/file/api/use-generate-upload-url';
import { useCreateMessage } from '@/features/messages/api/use-create-message';
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

interface ChatInputProps {
  placeholder?: string;
  conversationId: Id<'conversations'>;
}

type CreateMessageValues = {
  conversationId: Id<'conversations'>;
  workspaceId: Id<'workspaces'>;
  body: string;
  image?: string;
};

export const ChatInput = ({ placeholder, conversationId }: ChatInputProps) => {
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const innerRef = useRef<Quill | null>(null);

  const workspaceId = useWorkspaceId();

  const { mutate: createMessage } = useCreateMessage();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  const handleSubmit = async ({ body, image }: { body: string; image: File | null }) => {
    try {
      setIsPending(true);
      innerRef.current?.enable(false);

      const values: CreateMessageValues = {
        conversationId,
        workspaceId,
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

  return (
    <div className="w-full px-5">
      <Editor placeholder={placeholder} key={editorKey} onSubmit={handleSubmit} disabled={isPending} innerRef={innerRef} />
    </div>
  );
};
