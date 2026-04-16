"use client";

import { useState, useEffect } from "react";
import { 
    Search, 
    Calendar, 
    ShieldCheck, 
    Download, 
    Printer, 
    Filter, 
    Briefcase,
    Inbox,
    Send,
    FileText,
    Receipt,
    History
} from "lucide-react";
import { utils, writeFile } from "xlsx";
import { toast } from "sonner";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<"inward" | "outward">("inward");
    const [offices, setOffices] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    
    // Filters
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        officeId: "",
        teamId: "",
        search: ""
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const role = globalThis.localStorage?.getItem("userRole")?.toLowerCase();
            setUserRole(role || null);

            const endpoints = [
                fetch("/api/masters/office"),
                fetch(`/api/transactions/${category}?all=true${filters.teamId ? `&teamId=${filters.teamId}` : ''}`)
            ];

            if (role === 'super_admin' || role === 'superadmin') {
                endpoints.push(fetch("/api/masters/teams"));
            }

            const results = await Promise.all(endpoints);
            
            if (results[0].ok) setOffices(await results[0].json());
            if (results[1].ok) setData(await results[1].json());
            if (results[2]?.ok) setTeams(await results[2].json());
        } catch (err) {
            console.error(err);
            toast.error("Failed to load reporting data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [category, filters.teamId]);

    useEffect(() => {
        let result = [...data];

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            result = result.filter(item => new Date(item.InwardDate || item.OutwardDate) >= start);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(item => new Date(item.InwardDate || item.OutwardDate) <= end);
        }
        if (filters.officeId) {
            result = result.filter(item => 
                (item.ToInwardOutwardOfficeID || item.FromInwardOutwardOfficeID)?.toString() === filters.officeId
            );
        }
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(item => 
                (item.InwardNo || item.OutwardNo)?.toLowerCase().includes(q) ||
                item.Subject?.toLowerCase().includes(q)
            );
        }

        setFilteredData(result);
    }, [filters, data]);

    const handleExport = () => {
        const exportData = filteredData.map(item => category === "inward" ? ({
            "Inward No": item.InwardNo,
            "Date": new Date(item.InwardDate).toLocaleDateString(),
            "To Office": offices.find(o => o.InwardOutwardOfficeID === item.ToInwardOutwardOfficeID)?.OfficeName || "N/A",
            "Subject": item.Subject,
            "Courier": item.CourierCompanyName || "Direct",
            "Letter No": item.InwardLetterNo || "-",
            "Letter Date": item.InwardLetterDate ? new Date(item.InwardLetterDate).toLocaleDateString() : "-"
        }) : ({
            "Outward No": item.OutwardNo,
            "Date": new Date(item.OutwardDate).toLocaleDateString(),
            "From Office": offices.find(o => o.InwardOutwardOfficeID === item.FromInwardOutwardOfficeID)?.OfficeName || "N/A",
            "Subject": item.Subject,
            "Courier": item.CourierCompanyName || "Direct",
            "Ref No": item.LetterNo || "-",
            "Amount": item.Amount || "0",
            "Status": item.IsReturned ? "Returned" : "Sent"
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Register");
        writeFile(wb, `${category === 'inward' ? 'Inward' : 'Outward'}_Register_${filters.startDate}_to_${filters.endDate}.xlsx`);
    };

    return (
        <div className="p-10 space-y-8 min-h-screen bg-slate-50/30">
            {/* Header */}
            <header className="flex justify-between items-end print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Filter size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Reporting System</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">System Registers</h1>
                    <p className="text-slate-500 mt-2 font-medium">Generate customized {category} reports and audits.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => window.print()}
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 shadow-sm flex items-center gap-2 font-bold px-6"
                    >
                        <Printer size={20} /> Print PDF
                    </button>
                    <button 
                        onClick={handleExport}
                        className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 font-bold px-6"
                    >
                        <Download size={20} /> Export Excel
                    </button>
                </div>
            </header>

            {/* Category Switcher & Filters */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 print:hidden">
                <div className="flex flex-col gap-8">
                    <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                        <button 
                            onClick={() => setCategory("inward")}
                            className={`px-8 py-3 rounded-xl flex items-center gap-2 font-bold transition-all ${category === "inward" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Inbox size={18} /> Inward Register
                        </button>
                        <button 
                            onClick={() => setCategory("outward")}
                            className={`px-8 py-3 rounded-xl flex items-center gap-2 font-bold transition-all ${category === "outward" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Send size={18} /> Outward Register
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="date" 
                                    className="pastel-input pl-12 py-3"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="date" 
                                    className="pastel-input pl-12 py-3"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        {(userRole === 'super_admin' || userRole === 'superadmin') && (
                            <div>
                                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 px-1">Scope: Team</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select 
                                        className="pastel-input pl-12 py-3 appearance-none border-blue-100 bg-blue-50/20"
                                        value={filters.teamId}
                                        onChange={(e) => setFilters(prev => ({ ...prev, teamId: e.target.value }))}
                                    >
                                        <option value="">Full System Access</option>
                                        {teams.map((t, i) => (
                                            <option key={t.TeamID || `team-${i}`} value={t.TeamID}>{t.TeamName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Office</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select 
                                    className="pastel-input pl-12 py-3 appearance-none"
                                    value={filters.officeId}
                                    onChange={(e) => setFilters(prev => ({ ...prev, officeId: e.target.value }))}
                                >
                                    <option value="">All Offices</option>
                                    {offices.map((o, i) => (
                                        <option key={o.InwardOutwardOfficeID || `office-${i}`} value={o.InwardOutwardOfficeID}>{o.OfficeName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Number or subject..."
                                    className="pastel-input pl-12 py-3"
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {category === "inward" ? <Inbox className="text-blue-500" /> : <Send className="text-orange-500" />}
                        {category === 'inward' ? 'Inward Register' : 'Outward Register'} 
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{filteredData.length} records</span>
                    </h2>
                    <span className="text-xs font-medium text-slate-400 italic">Report generated for {filters.startDate} to {filters.endDate}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-24">No</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Date</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Office</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject/Document Details</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode/Courier</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-8 py-6"><Skeleton className="h-10 w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-32 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <Search size={32} className="text-slate-200" />
                                        </div>
                                        <p className="text-xl font-bold text-slate-400">No matching records found</p>
                                        <p className="text-sm text-slate-300 mt-1">Try adjusting your filters or date range.</p>
                                    </td>
                                </tr>
                            ) : filteredData.map((item, i) => (
                                <tr key={`${category}-${item.InwardID || item.OutwardID || item.id || i}`} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-6 text-center font-bold text-slate-900 font-mono text-sm">{item.InwardNo || item.OutwardNo}</td>
                                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                                        {new Date(item.InwardDate || item.OutwardDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">
                                                {offices.find(o => o.InwardOutwardOfficeID === (item.ToInwardOutwardOfficeID || item.FromInwardOutwardOfficeID))?.OfficeName || "N/A"}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {category === 'inward' ? 'Receiver Office' : 'Sender Office'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-slate-800">{item.Subject}</p>
                                        <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{item.InwardLetterNo || item.LetterNo || "N/A"}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category === 'inward' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                <History size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">{item.CourierCompanyName || "Direct"}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            {category === 'outward' && item.Amount > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">₹{item.Amount}</span>
                                            )}
                                            {category === 'outward' && item.IsReturned && (
                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase">Returned</span>
                                            )}
                                            {item.isReplied && (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">Replied</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Only Disclaimer */}
            <div className="hidden print:block fixed bottom-10 left-10 text-[10px] text-slate-400 italic">
                System Generated Report • Confidential • Inward-Outward System
            </div>
        </div>
    );
}
