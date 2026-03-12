"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-white">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden bg-[#fafafa]">
                {children}
            </main>
        </div>
    );
}
