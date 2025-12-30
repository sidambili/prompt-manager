
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="px-6 h-16 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <Link className="text-xl font-bold tracking-tighter" href="/">
          PromptManager
        </Link>
        <nav className="flex gap-8 items-center">
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="/login">
            Sign In
          </Link>
          <Button asChild size="sm" className="rounded-full px-6">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="w-full max-w-5xl px-6 py-24 md:py-32 lg:py-48">
          <div className="flex flex-col items-center text-center space-y-12">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
                Your prompts, <br className="hidden md:block" />
                <span className="text-muted-foreground">beautifully managed.</span>
              </h1>
              <p className="mx-auto max-w-[600px] text-lg md:text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                Small, fast, and secure. A minimalist workspace for AI prompt engineering and versioning.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button asChild size="lg" className="rounded-full px-8 h-12 text-base">
                <Link href="/signup">
                  Start creating for free
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="rounded-full px-8 h-12 text-base" asChild>
                <Link href="/login">
                  Live Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full border-t border-border/40 py-12 md:py-24">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Minimalist</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No bloat. A focus on speed and clarity for your terminal-like prompt workflows.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Variable Engine</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Automatic variable detection and live preview. Save hours of manual copy-pasting.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Self-Hosted</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Full control over your data. Deploy locally or to your own cloud instance in minutes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="h-16 flex items-center justify-between px-6 border-t text-xs text-muted-foreground">
        <p>© 2025 PromptManager</p>
        <div className="flex gap-4">
          <Link href="https://github.com" className="hover:text-foreground">GitHub</Link>
          <Link href="/login" className="hover:text-foreground">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
