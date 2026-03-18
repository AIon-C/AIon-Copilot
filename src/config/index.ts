import type { Metadata } from 'next';

export const siteConfig: Metadata = {
  title: 'Slack Clone',
  description:
    'Collaborate with your team using real-time messaging, rich text editing, and emoji support in this Slack-like app built with Next.js and Shadcn UI.',
  keywords: [
    'reactjs',
    'nextjs',
    'next-auth',
    'emoji-picker-react',
    'lucide-icons',
    'react-icons',
    'quill-editor',
    'shadcn-ui',
    'radix-ui',
    'tailwindcss',
    'nuqs',
    'sonner',

    'typescript',
    'javascript',
    'vercel',
    'postcss',
    'prettier',
    'eslint',
    'react-dom',
    'html',
    'css',

    'state-management',
    'real-time-messaging',
    'collaboration',
    'ui/ux',
    'slack-clone',

    'date-fns',
    'cn',
    'clsx',
    'lucide-react',
  ] as Array<string>,
  authors: {
    name: 'Sanidhya Kumar Verma',
    url: 'https://github.com/sanidhyy',
  },
} as const;

export const links = {
  sourceCode: 'https://github.com/sanidhyy/slack-clone',
} as const;

const resolveCopilotMode = () => {
  const mode = process.env.NEXT_PUBLIC_COPILOT_API_MODE;
  if (mode === 'mock' || mode === 'stub' || mode === 'real') return mode;
  return 'real';
};

const resolveCopilotTimeout = () => {
  const parsed = Number(process.env.NEXT_PUBLIC_COPILOT_API_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
};

export const copilotApiConfig = {
  mode: resolveCopilotMode(),
  timeoutMs: resolveCopilotTimeout(),
} as const;
