
"use client";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground selection:bg-brand-bg selection:text-brand">
            <Sidebar />
            <div className="flex flex-1 flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
