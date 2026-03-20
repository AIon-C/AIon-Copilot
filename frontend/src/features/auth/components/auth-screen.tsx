'use client';

import { useState } from 'react';

import { Galaxy } from '@/components/ui/galaxy';

import type { SignInFlow } from '../types';
import { SignInCard } from './sign-in-card';
import { SignUpCard } from './sign-up-card';

export const AuthScreen = () => {
  const [flow, setFlow] = useState<SignInFlow>('signIn');

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#030712] px-4">
      <div className="absolute inset-0">
        <Galaxy
          density={1.2}
          glowIntensity={0.38}
          hueShift={185}
          mouseInteraction
          mouseRepulsion
          repulsionStrength={2.2}
          saturation={0.15}
          starSpeed={0.55}
          twinkleIntensity={0.45}
          transparent={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.18),transparent_36%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.14),transparent_34%)]" />
      <div className="relative md:h-auto md:w-[420px]">
        {flow === 'signIn' ? <SignInCard onChangeFlowAction={setFlow} /> : <SignUpCard onChangeFlowAction={setFlow} />}
      </div>
    </div>
  );
};
