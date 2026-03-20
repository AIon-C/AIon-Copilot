import type { Metadata } from 'next';

export const siteConfig: Metadata = {
  title: 'AIon Copilot',
  description:
    'AIon Copilot is an AI-powered assistant designed to help developers build a Slack clone application. It provides explanations, and guidance throughout the development process, making it easier for developers to create a feature-rich and user-friendly Slack clone.',
  icons: {
    icon: '/logo.png',
  },
  keywords: [
    'AIon Copilot',
    'AIon',
    'copilot',
    'AI assistant',
    'Slack clone',
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
