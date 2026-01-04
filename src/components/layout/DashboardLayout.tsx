
"use client";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-brand-bg selection:text-brand">
            <Sidebar />
            <div className="flex flex-1 flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto scroll-smooth">
                    <div className="mx-auto p-4 sm:p-6 lg:p-8 max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
