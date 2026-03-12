"use client";

import { useState, useEffect } from "react";
import {
    Inbox,
    Send,
    Search,
    Filter,
    ArrowLeft,
    Calendar,
    ChevronRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AllTransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await fetch("/api/transactions");
                const data = await res.json();
                if (res.ok) {
                    setTransactions(data);
                }
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.senderReceiver?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = activeFilter === "All" || t.type === activeFilter;

        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="p-10 space-y-10 max-w-7xl mx-auto font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-4 group"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Dashboard</span>
                    </button>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">All Transactions</h1>
                    <p className="text-slate-500 mt-2 font-medium">History of all inward and outward courier movements.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by subject, number or sender..."
                            className="pastel-input py-3.5 pl-12 w-full md:w-80 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
                {["All", "Inward", "Outward"].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFilter === filter
                                ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-[var(--border)]">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No.</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sender/Receiver</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 size={40} className="text-slate-200 animate-spin" />
                                            <p className="text-slate-400 font-medium">Fetching transaction history...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <p className="text-slate-400 font-medium text-lg">No transactions found</p>
                                        <p className="text-slate-300 text-sm mt-1">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase ${item.type === "Inward"
                                                ? "bg-blue-50 text-blue-600"
                                                : "bg-orange-50 text-orange-600"
                                            }`}>
                                            {item.type === "Inward" ? <Inbox size={12} /> : <Send size={12} />}
                                            {item.type}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-mono text-xs font-bold text-slate-500">#{item.no}</td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-slate-900 line-clamp-1">{item.subject}</div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{item.senderReceiver}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                            <Calendar size={14} className="text-slate-300" />
                                            {formatDate(item.date)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900">
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center mt-auto">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Showing {filteredTransactions.length} of {transactions.length} Transactions
                    </p>
                </div>
            </div>
        </div>
    );
}
