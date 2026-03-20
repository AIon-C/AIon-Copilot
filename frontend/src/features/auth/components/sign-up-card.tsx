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

import { useSignUp } from '../hooks/use-sign-up';
import type { SignInFlow } from '../types';

interface SignUpCardProps {
  onChangeFlowAction: (state: SignInFlow) => void;
}

export const SignUpCard = ({ onChangeFlowAction }: SignUpCardProps) => {
  const router = useRouter();
  const { signUp, loading, error } = useSignUp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    return String(value)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  };

  const validatePassword = (value: string) => {
    return String(value).match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateEmail(email)) {
      setLocalError('Invalid email.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Password and confirm password don't match.");
      return;
    }

    if (!validatePassword(password)) {
      setLocalError('Password must be strong.');
      return;
    }

    try {
      await signUp({
        displayName: name,
        email,
        password,
      });

      router.replace('/');
    } catch {
      // gRPC error is managed in useSignUp
    }
  };

  const handleOAuthSignUp = async (provider: 'github' | 'google') => {
    console.warn(`${provider} OAuth is not implemented yet.`);
  };

  const displayError = localError ?? error;

  return (
    <Card className="size-full border-emerald-400/30 bg-slate-950/85 p-8 text-slate-100 backdrop-blur-xl">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl text-white">Sign up to continue</CardTitle>
        <CardDescription className="text-slate-300">Use your email or another service to continue.</CardDescription>
      </CardHeader>

      {!!displayError && (
        <div className="mb-6 flex items-center gap-x-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4" />
          <p>{displayError}</p>
        </div>
      )}

      <CardContent className="space-y-5 px-0 pb-0">
        <form onSubmit={handleSignUp} className="space-y-2.5">
          <Input
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            minLength={3}
            maxLength={50}
            required
          />

          <Input disabled={loading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />

          <Input
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
          />

          <Input
            disabled={loading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            type="password"
            required
          />

          <Button type="submit" className="w-full bg-emerald-400 text-slate-900 hover:bg-emerald-300" size="lg" disabled={loading}>
            Continue
          </Button>
        </form>

        <Separator />

        <div className="flex flex-col gap-y-2.5">
          <Button
            type="button"
            disabled={loading}
            onClick={() => handleOAuthSignUp('google')}
            variant="outline"
            size="lg"
            className="relative w-full border-slate-700 bg-slate-900/70 hover:bg-slate-800"
          >
            <FcGoogle className="absolute left-2.5 top-3 size-5" />
            Continue with Google
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={() => handleOAuthSignUp('github')}
            variant="outline"
            size="lg"
            className="relative w-full border-slate-700 bg-slate-900/70 hover:bg-slate-800"
          >
            <FaGithub className="absolute left-2.5 top-3 size-5" />
            Continue with GitHub
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            disabled={loading}
            onClick={() => onChangeFlowAction('signIn')}
            className="cursor-pointer font-medium text-emerald-300 hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Sign in
          </button>
        </p>
      </CardContent>
    </Card>
  );
};
