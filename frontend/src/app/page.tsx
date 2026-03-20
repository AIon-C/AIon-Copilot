'use client';

import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import { useCreateWorkspaceModal } from '@/features/workspaces/store/use-create-workspace-modal';

const HomePage = () => {
  const router = useRouter();
  const [open, setOpen] = useCreateWorkspaceModal();
  const { initialized, isAuthenticated } = useAuth();
  const { data, isLoading } = useGetWorkspaces();

  const workspaceId = data?.[0]?._id;

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (isLoading) return;

    if (workspaceId) {
      router.replace('/workspace/' + workspaceId);
      return;
    }

    if (!open) {
      setOpen(true);
    }
  }, [initialized, isAuthenticated, isLoading, workspaceId, open, setOpen, router]);

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 bg-[#5E2C5F]/95 text-white">
      <Loader className="size-5 animate-spin" />
    </div>
  );
};

export default HomePage;
