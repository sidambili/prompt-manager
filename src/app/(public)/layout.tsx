import { Suspense } from "react";
import PublicHeader from "@/components/layout/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        // Public shell for all unauthenticated-facing pages.
        <div
            className="min-h-screen bg-background text-foreground selection:bg-brand-bg selection:text-brand"
            id="public-layout-root"
        >
            <Suspense fallback={<div className="h-[56px] w-full border-b bg-background/80 backdrop-blur-md" />}>
                <PublicHeader />
            </Suspense>
            <main className="flex-1" id="public-layout-main">
                <div
                    className="animate-in fade-in duration-500"
                    id="public-layout-container"
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
