
"use client";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-background">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 md:pl-64">
                    <div className="container mx-auto p-6 md:p-8 max-w-7xl animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
