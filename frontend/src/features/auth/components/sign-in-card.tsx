'use client';

import { TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { useLogin } from '../hooks/use-login';
import type { SignInFlow } from '../types';

interface SignInCardProps {
  onChangeFlowAction: (state: SignInFlow) => void;
}

export const SignInCard = ({ onChangeFlowAction }: SignInCardProps) => {
  const router = useRouter();
  const { login, loading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await login({
        email,
        password,
      });

      router.replace('/');
    } catch {
      throw error;
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    console.warn(`${provider} OAuth is not implemented yet.`);
  };

  return (
    <Card className="size-full border-cyan-400/30 bg-slate-950/85 p-8 text-slate-100 backdrop-blur-xl">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl text-white">Login to continue</CardTitle>
        <CardDescription className="text-slate-300">Use your email or another service to continue.</CardDescription>
      </CardHeader>

      {!!error && (
        <div className="mb-6 flex items-center gap-x-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4" />
          <p>{error}</p>
        </div>
      )}

      <CardContent className="space-y-5 px-0 pb-0">
        <form onSubmit={handleSignIn} className="space-y-2.5">
          <Input disabled={loading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />

          <Input
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
          />

          <Button type="submit" className="w-full bg-cyan-400 text-slate-900 hover:bg-cyan-300" size="lg" disabled={loading}>
            Continue
          </Button>
        </form>

        <Separator />

        <div className="flex flex-col gap-y-2.5">
          <Button
            disabled={loading}
            onClick={() => handleOAuthSignIn('google')}
            variant="outline"
            size="lg"
            className="relative w-full border-slate-700 bg-slate-900/70 hover:bg-slate-800"
            type="button"
          >
            <FcGoogle className="absolute left-2.5 top-3 size-5" />
            Continue with Google
          </Button>

          <Button
            disabled={loading}
            onClick={() => handleOAuthSignIn('github')}
            variant="outline"
            size="lg"
            className="relative w-full border-slate-700 bg-slate-900/70 hover:bg-slate-800"
            type="button"
          >
            <FaGithub className="absolute left-2.5 top-3 size-5" />
            Continue with GitHub
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <button
            disabled={loading}
            onClick={() => onChangeFlowAction('signUp')}
            className="cursor-pointer font-medium text-cyan-300 hover:underline disabled:pointer-events-none disabled:opacity-50"
            type="button"
          >
            Sign up
          </button>
        </p>
      </CardContent>
    </Card>
  );
};
