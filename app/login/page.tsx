"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { setCookie } from "cookies-next";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        Name: "",
        Password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/login", formData);
            const { token, user, redirectUrl } = res.data;

            // Store accessible token for client-side logic if needed (redundant with cookie but safe for now)
            setCookie("token", token, { maxAge: 60 * 60 * 8 });

            // Store user info
            localStorage.setItem("userRole", user.role);
            localStorage.setItem("userName", user.name || user.username);
            localStorage.setItem("userEmail", user.username); // API returns email as username field currently
            localStorage.setItem("userId", user.id);
            localStorage.setItem("teamId", user.teamId || "");

            // Redirect
            router.push(redirectUrl);
        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.response?.data?.error || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4 font-sans">
            <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[var(--border)] min-h-[600px]">

                {/* Left Side - Visual */}
                <div className="md:w-1/2 bg-slate-900 relative p-12 flex flex-col justify-between text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)] rounded-full -mr-32 -mt-32 blur-3xl opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent)] rounded-full -ml-32 -mb-32 blur-3xl opacity-20"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                            <Lock className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-slate-400">Sign in to manage your inward and outward transactions.</p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">A</div>
                            <div>
                                <p className="font-bold text-sm">Admin Access</p>
                                <p className="text-xs text-slate-400">Full system control</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">C</div>
                            <div>
                                <p className="font-bold text-sm">Clerk Portal</p>
                                <p className="text-xs text-slate-400">Transaction management</p>
                            </div>
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-slate-500 mt-8">© 2026 Inward-Outward System. Secure Access.</p>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white relative">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-10">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h2>
                            <p className="text-slate-500 text-sm">Please enter your credentials to continue.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle size={18} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        className="pastel-input pl-12 py-4"
                                        placeholder="Enter your name"
                                        value={formData.Name}
                                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        className="pastel-input pl-12 py-4"
                                        placeholder="Min. 6 characters"
                                        value={formData.Password}
                                        onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>

                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
