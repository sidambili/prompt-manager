
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">PromptManager</h1>
        <p className="text-muted-foreground text-lg">
          Manage, version, and share your AI prompts effectively.
        </p>
        <div className="flex gap-4">
          <Button variant="default">Get Started</Button>
          <Button variant="outline">Documentation</Button>
        </div>
      </main>
    </div>
  );
}
