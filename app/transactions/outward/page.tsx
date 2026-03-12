"use client";

import { useState, useEffect } from "react";
import {
    Send,
    Plus,
    Search,
    Truck,
    Edit2,
    Trash2,
    Save,
    X,
    History,
    Info,
    AlertTriangle,
    Download
} from "lucide-react";
import { utils, writeFile } from "xlsx";
import { toast } from "sonner";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function OutwardEntry() {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [entries, setEntries] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ id: number | number[], name: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    // Masters
    const [offices, setOffices] = useState<any[]>([]);
    const [modes, setModes] = useState<any[]>([]);
    const [couriers, setCouriers] = useState<any[]>([]);
    const [fromTos, setFromTos] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        OutwardNo: "",
        OutwardDate: new Date().toISOString().split('T')[0],
        Subject: "",
        Description: "",
        CourierCompanyName: "",
        CourierReceiptNo: "",
        LetterNo: "",
        LetterDate: "",
        FromInwardOutwardOfficeID: "",
        InOutwardModeID: "",
        InOutwardFromToID: "",
        Amount: "",
        Weight: ""
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [entriesRes, officesRes, modesRes, couriersRes, fromTosRes] = await Promise.all([
                fetch("/api/transactions/outward"),
                fetch("/api/masters/office"),
                fetch("/api/masters/mode"),
                fetch("/api/masters/courier"),
                fetch("/api/masters/from-to")
            ]);

            if (entriesRes.ok) {
                const entriesData = await entriesRes.json();
                setEntries(Array.isArray(entriesData) ? entriesData : []);
            } else {
                setEntries([]);
                console.error("Outward fetch failed:", entriesRes.status);
            }

            if (officesRes.ok) {
                const officesData = await officesRes.json();
                const safeOffices = Array.isArray(officesData) ? officesData : [];
                setOffices(safeOffices);
                if (safeOffices.length > 0 && !editingId) {
                    setFormData(prev => ({ ...prev, FromInwardOutwardOfficeID: safeOffices[0].InwardOutwardOfficeID.toString() }));
                }
            }

            if (modesRes.ok) {
                const mData = await modesRes.json();
                setModes(Array.isArray(mData) ? mData : []);
            }

            if (couriersRes.ok) {
                const cData = await couriersRes.json();
                setCouriers(Array.isArray(cData) ? cData : []);
            }

            if (fromTosRes.ok) {
                const fData = await fromTosRes.json();
                setFromTos(Array.isArray(fData) ? fData : []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const storedId = localStorage.getItem("userId");
        if (storedId) setUserId(parseInt(storedId));
    }, []);

    const handleReload = async () => {
        setIsRefreshing(true);
        await fetchData();
        setTimeout(() => setIsRefreshing(false), 600);
        toast.info("Data refreshed");
    };

    const handleExport = () => {
        const dataToExport = filteredEntries.map(entry => ({
            "Outward No": entry.OutwardNo,
            "Date": new Date(entry.OutwardDate).toLocaleDateString(),
            "Subject": entry.Subject,
            "Receiver": entry.LetterForwardedToName || entry.InOutwardFromToID || "-",
            "From Office": entry.FromInwardOutwardOfficeID || "-",
            "To Office": entry.ToInwardOutwardOfficeID || "-",
            "Courier": entry.CourierCompanyName || "Direct",
            "Mode": entry.InOutwardModeID || "-",
            "Ref No": entry.LetterNo,
            "Amount": entry.Amount || "0"
        }));

        const worksheet = utils.json_to_sheet(dataToExport);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Outward Register");
        writeFile(workbook, `Outward_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Outward Register exported successfully!");
    };

    const filteredEntries = Array.isArray(entries) ? entries.filter(entry =>
        entry.OutwardNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.Subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.CourierCompanyName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = "/api/transactions/outward";
            const method = editingId ? "PUT" : "POST";
            const payload = editingId ? { ...formData, OutwardID: editingId } : { ...formData, UserID: userId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                fetchData();
                window.dispatchEvent(new Event("profile-updated"));
                setFormData({
                    OutwardNo: "",
                    OutwardDate: new Date().toISOString().split('T')[0],
                    Subject: "",
                    Description: "",
                    CourierCompanyName: "",
                    CourierReceiptNo: "",
                    LetterNo: "",
                    LetterDate: "",
                    FromInwardOutwardOfficeID: offices[0]?.InwardOutwardOfficeID?.toString() || "",
                    InOutwardModeID: "",
                    InOutwardFromToID: "",
                    Amount: "",
                    Weight: ""
                });
                toast.success(editingId ? "Outward log updated!" : "New outward dispatched!");
            } else {
                toast.error("Failed to save outward log.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while saving.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: any) => {
        setEditingId(entry.OutwardID);
        setFormData({
            OutwardNo: entry.OutwardNo || "",
            OutwardDate: entry.OutwardDate ? new Date(entry.OutwardDate).toISOString().split('T')[0] : "",
            Subject: entry.Subject || "",
            Description: entry.Remarks || "",
            CourierCompanyName: entry.CourierCompanyID?.toString() || "", // Using ID here requires logic change or mapping
            CourierReceiptNo: entry.CourierReceiptNo || "",
            LetterNo: entry.LetterNo || "",
            LetterDate: entry.LetterDate ? new Date(entry.LetterDate).toISOString().split('T')[0] : "",
            FromInwardOutwardOfficeID: entry.FromInwardOutwardOfficeID?.toString() || "",
            InOutwardModeID: entry.InOutwardModeID?.toString() || "",
            InOutwardFromToID: entry.InOutwardFromToID?.toString() || "",
            Amount: entry.Amount?.toString() || "",
            Weight: ""
        });
        setShowForm(true);
    };

    const handleDelete = (id: number | number[], name: string) => {
        setDeletingItem({ id, name });
        setShowDeleteModal(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredEntries.map(entry => entry.OutwardID));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const startBulkDelete = () => {
        if (selectedIds.length === 0) return;
        handleDelete(selectedIds, `${selectedIds.length} selected items`);
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingItem(null);
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        setSubmitting(true);
        try {
            const isBulk = Array.isArray(deletingItem.id);
            const url = isBulk
                ? `/api/transactions/outward?ids=${(deletingItem.id as number[]).join(',')}`
                : `/api/transactions/outward?id=${deletingItem.id}`;

            const res = await fetch(url, { method: "DELETE" });
            if (res.ok) {
                setShowDeleteModal(false);
                setDeletingItem(null);
                setSelectedIds([]);
                setIsSelectionMode(false);
                fetchData();
                window.dispatchEvent(new Event("profile-updated"));
                toast.success(isBulk ? "Selected entries deleted." : "Entry deleted successfully.");
            } else {
                toast.error("Failed to delete entry.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during deletion.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-10 space-y-8 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Send size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Transactions</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Outward Entry</h1>
                    <p className="text-slate-500 mt-2 font-medium">Record daily dispatches and outgoing mail.</p>
                </div>
                <div className="flex gap-3">
                    {!isSelectionMode ? (
                        <>
                            <button
                                onClick={handleReload}
                                className={`p-3 border border-[var(--border)] rounded-2xl hover:bg-slate-50 transition-all text-slate-600 ${isRefreshing ? 'text-blue-600 border-blue-100 bg-blue-50/50' : ''}`}
                                disabled={loading || isRefreshing}
                                title="Refresh Data"
                            >
                                <History size={20} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="p-3 border border-[var(--border)] rounded-2xl hover:bg-slate-50 transition-all text-slate-600"
                                title="Export to Excel"
                            >
                                <Download size={20} />
                            </button>
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="p-3 border border-[var(--border)] rounded-2xl hover:bg-slate-50 transition-all text-slate-600 group"
                                title="Bulk Delete Mode"
                            >
                                <Trash2 size={20} className="group-hover:text-rose-500 transition-colors" />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        OutwardNo: "",
                                        OutwardDate: new Date().toISOString().split('T')[0],
                                        Subject: "",
                                        Description: "",
                                        CourierCompanyName: "",
                                        CourierReceiptNo: "",
                                        LetterNo: "",
                                        LetterDate: "",
                                        FromInwardOutwardOfficeID: offices[0]?.InwardOutwardOfficeID?.toString() || "",
                                        InOutwardModeID: "",
                                        InOutwardFromToID: "",
                                        Amount: "",
                                        Weight: ""
                                    });
                                    setShowForm(true);
                                }}
                                className="pastel-button flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5"
                            >
                                <Plus size={20} />
                                New Outward
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedIds([]);
                                }}
                                className="px-6 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <X size={20} />
                                Exit Selection
                            </button>
                            <button
                                onClick={startBulkDelete}
                                disabled={selectedIds.length === 0}
                                className="flex items-center gap-2 px-6 py-3.5 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50 disabled:shadow-none"
                            >
                                <Trash2 size={20} />
                                Delete ({selectedIds.length})
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Table view of recent Outwards */}
            <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Recent Dispatches</h2>
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search outward logs..."
                            className="pastel-input py-2.5 pl-12 text-sm w-72 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                {isSelectionMode && (
                                    <th className="px-8 py-5 text-xs text-center w-12">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={filteredEntries.length > 0 && selectedIds.length === filteredEntries.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center w-20">No</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Outward Date</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">To</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Courier/Mode</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={isSelectionMode ? 7 : 6} className="px-8 py-6">
                                            <div className="flex gap-4 items-center">
                                                <Skeleton className="h-10 w-full" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Send size={32} className="text-slate-200" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-400">No outward records found</p>
                                    </td>
                                </tr>
                            ) : filteredEntries.map((entry) => (
                                <tr key={entry.OutwardID} className={`hover:bg-slate-50/30 transition-colors group ${selectedIds.includes(entry.OutwardID) ? 'bg-orange-50/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-8 py-6 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedIds.includes(entry.OutwardID)}
                                                onChange={() => handleSelectRow(entry.OutwardID)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-8 py-6 text-center font-bold text-slate-900">{entry.OutwardNo}</td>
                                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                                        {new Date(entry.OutwardDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-slate-800">{entry.Subject}</p>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-slate-600">
                                        {entry.LetterForwardedToName || "N/A"}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                                <Truck size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">{entry.CourierCompanyName || "Direct"}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.OutwardID, entry.OutwardNo)}
                                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-over Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="h-full w-full max-w-4xl bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
                        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{editingId ? "Edit Outward Log" : "New Outward Dispatch"}</h2>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        {editingId ? `Editing Log: ${formData.OutwardNo}` : "Auto-ID: OUT/2026/001"}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}
                                className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-all border border-transparent hover:border-slate-100"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-10">
                            {/* Section 1: Dispatch Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Dispatch Details</h3>
                                    <Info size={14} className="text-slate-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">From Office</label>
                                        <select
                                            className="pastel-input py-3"
                                            value={formData.FromInwardOutwardOfficeID}
                                            onChange={(e) => setFormData({ ...formData, FromInwardOutwardOfficeID: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Office...</option>
                                            {offices.map(o => (
                                                <option key={o.InwardOutwardOfficeID} value={o.InwardOutwardOfficeID}>
                                                    {o.OfficeName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Dispatch Date</label>
                                        <input
                                            type="date"
                                            className="pastel-input"
                                            value={formData.OutwardDate}
                                            onChange={(e) => setFormData({ ...formData, OutwardDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">To (Receiver)</label>
                                        <select
                                            className="pastel-input py-3"
                                            value={formData.InOutwardFromToID}
                                            onChange={(e) => setFormData({ ...formData, InOutwardFromToID: e.target.value })}
                                        >
                                            <option value="">Select Receiver from Master...</option>
                                            {fromTos.map(ft => (
                                                <option key={ft.InOutwardFromToID} value={ft.InOutwardFromToID}>
                                                    {ft.InOutwardFromToName} {ft.Place ? `(${ft.Place})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Content & Courier */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Content & Delivery</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Subject</label>
                                        <input
                                            type="text"
                                            className="pastel-input"
                                            placeholder="Subject of the document..."
                                            value={formData.Subject}
                                            onChange={(e) => setFormData({ ...formData, Subject: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Mode</label>
                                        <select
                                            className="pastel-input py-3"
                                            value={formData.InOutwardModeID}
                                            onChange={(e) => setFormData({ ...formData, InOutwardModeID: e.target.value })}
                                        >
                                            <option value="">Select Mode...</option>
                                            {modes.map(m => (
                                                <option key={m.InOutwardModeID} value={m.InOutwardModeID}>
                                                    {m.InOutwardModeName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Courier Company</label>
                                        <select
                                            className="pastel-input py-3"
                                            value={formData.CourierCompanyName}
                                            onChange={(e) => setFormData({ ...formData, CourierCompanyName: e.target.value })}
                                        >
                                            <option value="">Select Company...</option>
                                            {couriers.map(c => (
                                                <option key={c.CourierCompanyID} value={c.CourierCompanyName}>
                                                    {c.CourierCompanyName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Receipt No</label>
                                        <input
                                            type="text"
                                            className="pastel-input"
                                            placeholder="Optional"
                                            value={formData.CourierReceiptNo}
                                            onChange={(e) => setFormData({ ...formData, CourierReceiptNo: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Cost (₹)</label>
                                        <input
                                            type="number"
                                            className="pastel-input"
                                            placeholder="0.00"
                                            value={formData.Amount}
                                            onChange={(e) => setFormData({ ...formData, Amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-8 pb-12 border-t border-slate-50 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}
                                    className="flex-1 py-4.5 rounded-2xl border border-[var(--border)] font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[3] py-4.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {submitting ? "Saving..." : editingId ? "Update Outward Log" : "Dispatch Now"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                {Array.isArray(deletingItem?.id) ? "Delete Multiple Entries?" : "Delete Outward Entry?"}
                            </h2>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                This action cannot be undone. Are you sure you want to remove <span className="font-bold text-slate-900">"{deletingItem?.name}"</span> from your records?
                            </p>
                            <div className="flex w-full gap-4">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 py-4 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={submitting}
                                    className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all disabled:opacity-50"
                                >
                                    {submitting ? "Deleting..." : "Delete Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
