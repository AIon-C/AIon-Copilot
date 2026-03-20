'use client';

import { useState } from 'react';

import type { SignInFlow } from '../types';
import { SignInCard } from './sign-in-card';
import { SignUpCard } from './sign-up-card';

export const AuthScreen = () => {
  const [flow, setFlow] = useState<SignInFlow>('signIn');

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#030712] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_32%)]" />
      <div className="relative md:h-auto md:w-[420px]">
        {flow === 'signIn' ? <SignInCard onChangeFlowAction={setFlow} /> : <SignUpCard onChangeFlowAction={setFlow} />}
      </div>
    </div>
  );
};
