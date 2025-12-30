import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | PromptManager',
    default: 'Prompt | PromptManager',
  },
};

interface PromptLayoutProps {
  children: React.ReactNode;
}

export default function PromptLayout({ children }: PromptLayoutProps) {
  return children;
}
