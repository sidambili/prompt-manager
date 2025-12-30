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
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand-bg selection:text-brand">
      <main className="flex-1">
        <div className="mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
