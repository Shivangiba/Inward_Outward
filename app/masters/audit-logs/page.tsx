"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    History,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Calendar,
    User as UserIcon,
    Database,
    Tag,
    Activity,
    Info,
    RefreshCw
} from "lucide-react";

export default function AuditLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<any>({});
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [tableFilter, setTableFilter] = useState("");

    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    const fetchLogs = async (p = page) => {
        setLoading(true);
        try {
            let url = `/api/audit-logs?page=${p}&limit=50`;
            if (actionFilter) url += `&action=${actionFilter}`;
            if (tableFilter) url += `&tableName=${tableFilter}`;

            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        const userRole = role?.toLowerCase().replace(/\s+/g, '');
        if (userRole === "clerk") {
            router.push("/dashboard");
        } else {
            fetchLogs();
        }
    }, [page, actionFilter, tableFilter]);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'UPDATE': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'DELETE': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'LOGIN': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'CRASH': return 'text-purple-600 bg-purple-50 border-purple-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const filteredLogs = logs.filter(log =>
        log.TableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user?.Name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.Details || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-10 space-y-8 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <History size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">System Security</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
                    <p className="text-slate-500 mt-2 font-medium">Monitor data changes, user activities, and system health.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => fetchLogs()}
                        className="p-3 border border-[var(--border)] rounded-2xl hover:bg-slate-50 transition-all text-slate-600"
                        title="Refresh Logs"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </header>

            <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex flex-wrap items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by table, user, or details..."
                            className="pastel-input py-2.5 pl-12 text-sm w-full bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="pastel-input py-2.5 text-sm w-48 bg-white"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="CRASH">CRASH</option>
                    </select>
                    <select
                        className="pastel-input py-2.5 text-sm w-48 bg-white"
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                    >
                        <option value="">All Tables</option>
                        <option value="Inward">Inward</option>
                        <option value="Outward">Outward</option>
                        <option value="User">User</option>
                        <option value="InOutwardMode">Mode</option>
                        <option value="InwardOutwardOffice">Office</option>
                        <option value="CourierCompany">Courier</option>
                        <option value="InOutwardFromTo">From/To</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Module</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw size={40} className="text-slate-200 animate-spin" />
                                            <p className="text-slate-400 font-medium">Fetching secure logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">No audit logs found matching your filters.</td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.AuditLogID} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-700 font-medium whitespace-nowrap">
                                            <Calendar size={14} className="text-slate-300" />
                                            {formatDate(log.Created)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                {log.user?.Name?.charAt(0) || "S"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{log.user?.Name || "System"}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{log.team?.TeamName || "Global"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 font-bold text-slate-600 text-sm">
                                            <Database size={14} className="text-slate-300" />
                                            {log.TableName}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionColor(log.Action)}`}>
                                            {log.Action}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-[200px] truncate text-xs text-slate-500 font-medium" title={log.Details}>
                                            {log.Details || (log.Action === 'UPDATE' ? `Updated record #${log.RecordID}` : log.Action === 'CREATE' ? `Created record #${log.RecordID}` : '-')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {(log.OldData || log.NewData || log.Details?.length > 50) && (
                                            <button
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setShowDetails(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-sm"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {pagination.total > 0 ? `Showing ${(pagination.currentPage - 1) * pagination.limit + 1} - ${Math.min(pagination.currentPage * pagination.limit, pagination.total)} of ${pagination.total} entries` : 'No entries'}
                    </p>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="p-2.5 border border-slate-200 rounded-xl hover:bg-white text-slate-500 disabled:opacity-20 transition-all shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-xs font-bold text-slate-900 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                            Page {pagination.currentPage} of {pagination.pages || 1}
                        </span>
                        <button
                            onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                            disabled={page >= pagination.pages}
                            className="p-2.5 border border-slate-200 rounded-xl hover:bg-white text-slate-500 disabled:opacity-20 transition-all shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {showDetails && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${getActionColor(selectedLog.Action)}`}>
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Audit Detail: {selectedLog.Action}</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">{selectedLog.TableName} Record #{selectedLog.RecordID || 'N/A'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white hover:border-slate-100 border border-transparent text-slate-400 hover:text-slate-900 transition-all text-2xl font-light"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Metadata */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User</p>
                                    <p className="text-sm font-bold text-slate-900">{selectedLog.user?.Name || 'System'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IP Address</p>
                                    <p className="text-sm font-bold text-slate-900 font-mono text-xs">{selectedLog.IPAddress}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 col-span-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User Agent</p>
                                    <p className="text-sm font-bold text-slate-900 truncate text-xs" title={selectedLog.UserAgent}>{selectedLog.UserAgent}</p>
                                </div>
                            </div>

                            {selectedLog.Details && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Info size={16} className="text-blue-500" />
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Additional Details</h3>
                                    </div>
                                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-sm text-blue-900 leading-relaxed font-medium">
                                        {selectedLog.Details}
                                    </div>
                                </div>
                            )}

                            {/* Data Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-rose-500 px-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        PREVIOUS STATE
                                    </h3>
                                    <div className="bg-slate-900 rounded-[2rem] p-6 overflow-hidden shadow-inner">
                                        <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto leading-relaxed">
                                            {selectedLog.OldData ? JSON.stringify(selectedLog.OldData, null, 4) : '// No previous data'}
                                        </pre>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-emerald-500 px-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        NEW STATE
                                    </h3>
                                    <div className="bg-slate-900 rounded-[2rem] p-6 overflow-hidden shadow-inner border border-emerald-500/20">
                                        <pre className="text-[10px] text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                                            {selectedLog.NewData ? JSON.stringify(selectedLog.NewData, null, 4) : '// No changes recorded'}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-full py-4 rounded-3xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
