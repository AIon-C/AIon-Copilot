import { format } from 'date-fns';

import { ShinyText } from '@/components/ui/shiny-text';

interface ChannelHeroProps {
  name: string;
  creationTime: number;
}

export const ChannelHero = ({ name, creationTime }: ChannelHeroProps) => {
  return (
    <div className="mx-5 mb-4 mt-[88px]">
      <p className="mb-2 flex items-center text-2xl font-bold">
        #
        <ShinyText className="ml-1" color="#f8fafc" shineColor="#ffffff" speed={2.2} spread={120}>
          {name}
        </ShinyText>
      </p>

      <p className="mb-4 text-base font-normal text-slate-800">
        This channel was created on {format(new Date(creationTime), 'MMMM do, yyyy')}. This is the very beginning of the{' '}
        <strong>{name}</strong> channel.
      </p>
    </div>
  );
};
