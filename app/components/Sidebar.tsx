"use client";
import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    Inbox,
    Send,
    Settings,
    Users,
    Building2,
    Truck,
    ExternalLink,
    ChevronRight,
    LogOut,
    History
} from "lucide-react";
import { deleteCookie } from "cookies-next";
import UserAvatar from "./Avatar";

const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Inward Entry", href: "/transactions/inward", icon: Inbox },
    { name: "Outward Entry", href: "/transactions/outward", icon: Send },
    { type: "divider", label: "Masters" },
    { name: "Offices", href: "/masters/office", icon: Building2 },
    { name: "Modes", href: "/masters/mode", icon: ExternalLink },
    { name: "From/To", href: "/masters/from-to", icon: Users },
    { name: "Courier Companies", href: "/masters/courier", icon: Truck },
    { name: "Admin Master", href: "/masters/admins", icon: Users },
    { name: "Audit Logs", href: "/masters/audit-logs", icon: History },
];




export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [user, setUser] = useState<{ name: string; email: string; profilePath?: string | null }>({
        name: "User",
        email: "user@example.com",
        profilePath: null
    });

    // Initialize from localStorage immediately to prevent layout shift
    useEffect(() => {
        const storedRole = localStorage.getItem("userRole");
        const storedName = localStorage.getItem("userName");
        const storedEmail = localStorage.getItem("userEmail");

        if (storedRole) setRole(storedRole.toLowerCase());
        if (storedName || storedEmail) {
            setUser(prev => ({
                ...prev,
                name: storedName || "User",
                email: storedEmail || "user@example.com"
            }));
        }
    }, []);

    const fetchUserProfile = async (email: string) => {
        if (!email) return;
        try {
            // Added timestamp to bypass browser cache and ensure fresh data
            const res = await fetch(`/api/profile?email=${email}&t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await res.json();
            if (res.ok) {
                setUser({
                    name: data.Name || data.Email.split('@')[0],
                    email: data.Email,
                    profilePath: data.ProfilePath
                });
                if (data.role) setRole(data.role.RoleName.toLowerCase());
            }
        } catch (err) {
            console.error("Sidebar fetch error:", err);
        }
    };

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        if (storedEmail) {
            fetchUserProfile(storedEmail);
        }

        // Listen for profile updates from other components
        const handleProfileUpdate = () => {
            const latestEmail = localStorage.getItem("userEmail");
            const latestRole = localStorage.getItem("userRole");
            if (latestRole) setRole(latestRole.toLowerCase());
            if (latestEmail) fetchUserProfile(latestEmail);
        };

        window.addEventListener('profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('profile-updated', handleProfileUpdate);
    }, []); // Only run once on mount

    const handleLogout = () => {
        localStorage.clear();
        deleteCookie("token");
        router.push("/login");
    };

    const filteredMenuItems = menuItems.filter(item => {
        const userRole = role?.toLowerCase();
        if (userRole === 'clerk') {
            // Clerks only see Dashboard and Transaction entries
            return item.name === 'Dashboard' ||
                item.name === 'Inward Entry' ||
                item.name === 'Outward Entry';
        }
        return true; // Admin sees everything
    });

    return (
        <aside className="w-72 h-screen border-r border-[var(--border)] bg-white flex flex-col sticky top-0">
            <div className="p-8">
                {/* Logo Removed as requested */}
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-8">
                {filteredMenuItems.map((item, idx) => {
                    if (item.type === "divider") {
                        return (
                            <div key={`divider-${idx}`} className="pt-6 pb-2 px-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {item.label}
                                </p>
                            </div>
                        );
                    }

                    const Icon = item.icon!;
                    // Check if active: exact match OR starts with href (for sub-pages), but avoid "/" matching everything
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.name}
                            href={item.href!}
                            className={`sidebar-link ${isActive ? "active" : ""}`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="flex-1">{item.name}</span>
                            {isActive && <ChevronRight size={14} className="opacity-50" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-[var(--border)] bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 flex-1 min-w-0 group hover:bg-[var(--primary)]/30 p-2 rounded-2xl transition-all"
                    >
                        <UserAvatar
                            name={user.name}
                            src={user.profilePath}
                            size="md"
                            className="group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[var(--primary-foreground)] transition-colors">{user.name}</p>
                            <div className="flex items-center gap-1">
                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                {(user as any).team && (
                                    <>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-blue-500 uppercase">{(user as any).team.TeamName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
