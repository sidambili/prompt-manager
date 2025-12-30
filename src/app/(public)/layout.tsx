import PublicHeader from "@/components/layout/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        // Public shell for all unauthenticated-facing pages.
        <div
            className="min-h-screen bg-background text-foreground selection:bg-brand-bg selection:text-brand"
            id="public-layout-root"
        >
            <PublicHeader />
            <main className="flex-1" id="public-layout-main">
                <div
                    className="mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 max-w-[1600px]"
                    id="public-layout-container"
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
