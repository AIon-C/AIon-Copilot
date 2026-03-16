'use client';

import { useParams } from 'next/navigation';

import type { Id } from '@/mock/types';

type ChannelIdParams = {
  channelId: Id<'channels'>;
};

export const useChannelId = () => {
  const params = useParams<ChannelIdParams>();

  return params.channelId;
};
