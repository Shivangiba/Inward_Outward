"use client";

import { useState, useEffect } from "react";
import {
    Inbox,
    Send,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ChevronRight,
    PieChart as PieIcon,
    BarChart as BarIcon
} from "lucide-react";
import Link from "next/link";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

export default function Dashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [role, setRole] = useState<string | null>(null);
    const [userName, setUserName] = useState("User");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>({
        stats: {
            totalInward: 0,
            totalOutward: 0,
            pendingItems: 0,
            activeOffices: 0
        },
        recentTraffic: [],
        charts: {
            volume: [],
            distribution: []
        }
    });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // No need to send userId/role - API will use server session
            const res = await fetch(`/api/dashboard`, {
                cache: "no-store",
                credentials: "include",
                headers: { "Cache-Control": "no-cache" },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to load dashboard data");
            }

            const d = await res.json();
            setData(d);
            setError(null);
        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            setError(err.message || "A connection error occurred. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setRole(localStorage.getItem("userRole"));
        setUserName(localStorage.getItem("userName")?.split(" ")[0] || "User");
        fetchDashboardData();
    }, []);

    const stats = [
        { name: "Total Inward", value: (data?.stats?.totalInward ?? 0).toString(), change: "+0%", trend: "up" },
        { name: "Total Outward", value: (data?.stats?.totalOutward ?? 0).toString(), change: "+0%", trend: "up" },
        { name: "Pending Items", value: (data?.stats?.pendingItems ?? 0).toString(), change: "0", trend: "neutral" },
        { name: "Active Offices", value: (data?.stats?.activeOffices ?? 0).toString(), change: "0", trend: "neutral" },
    ];

    const filteredStats = stats.filter(stat => {
        if (role === 'clerk') {
            return stat.name !== "Active Offices";
        }
        return true;
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="p-10 space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-2 font-medium">Welcome back, {userName}. Here's your overview.</p>
                </div>
            </header>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center justify-between">
                    <p className="font-medium">{error}</p>
                    <button
                        onClick={() => { setLoading(true); fetchDashboardData(); }}
                        className="text-sm font-bold bg-rose-600 text-white px-4 py-1.5 rounded-xl hover:bg-rose-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${role === 'clerk' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
                {filteredStats.map((stat) => (
                    <div key={stat.name} className="pastel-card group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
                            <div className={`p-1.5 rounded-lg ${stat.trend === "up" ? "bg-emerald-50 text-emerald-600" :
                                stat.trend === "down" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                                }`}>
                                {stat.trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Volume Chart */}
                    <div className="lg:col-span-2 pastel-card bg-white p-6 min-h-[400px]">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <BarIcon size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Weekly Volume</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.charts?.volume || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="inward" name="Inward" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="outward" name="Outward" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribution Chart */}
                    <div className="pastel-card bg-white p-6 min-h-[400px]">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <PieIcon size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Inward Channels</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.charts?.distribution || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(data.charts?.distribution || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Activity Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pastel-input py-1.5 pl-10 text-sm w-64"
                                    value={searchTerm || ""}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[var(--border)] rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-[var(--border)]">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date/Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading data...</td></tr>
                                ) : data.recentTraffic.filter((item: any) =>
                                    item.subject.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">No records found</td></tr>
                                ) : data.recentTraffic
                                    .filter((item: any) =>
                                        item.subject.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${item.type.toLowerCase() === "inward"
                                                    ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                                                    : "bg-orange-50 text-orange-600 group-hover:bg-orange-100"
                                                    }`}>
                                                    {item.type.toLowerCase() === "inward" ? <Inbox size={12} /> : <Send size={12} />}
                                                    {item.type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{item.subject}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{item.time}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <div className="p-6 text-center border-t border-slate-50">
                            <Link
                                href="/transactions"
                                className="text-sm font-bold text-[var(--primary-foreground)] hover:underline inline-flex items-center gap-1"
                            >
                                View All Transactions
                                <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quick Entry</h2>
                    <div className="space-y-4">
                        <Link href="/transactions/inward" className="block mb-6">
                            <div className="pastel-card bg-blue-50/50 border-blue-100 cursor-pointer group hover:bg-blue-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200 transition-transform group-hover:scale-110">
                                        <Inbox size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-blue-900">Inward Log</h3>
                                        <p className="text-xs text-blue-600/70 font-medium">Record incoming item</p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/transactions/outward">
                            <div className="pastel-card bg-orange-50/50 border-orange-100 cursor-pointer group hover:bg-orange-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 transition-transform group-hover:scale-110">
                                        <Send size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-orange-900">Outward Log</h3>
                                        <p className="text-xs text-orange-600/70 font-medium">Record dispatch</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
