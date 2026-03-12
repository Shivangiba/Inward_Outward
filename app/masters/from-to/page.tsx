"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    CheckCircle2,
    XCircle,
    MapPin,
    User,
    Info,
    RotateCw,
    History,
    AlertTriangle,
    X
} from "lucide-react";

// Data fetching and states
const useFromToData = () => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/masters/from-to?t=${Date.now()}`, { cache: "no-store" });

            if (!res.ok) {
                console.error("Fetch failed:", res.status, res.statusText);
                setEntries([]);
                return;
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setEntries(data);
            } else {
                console.error("Invalid data format:", data);
                setEntries([]);
            }
        } catch (err) {
            console.error(err);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    return { entries, loading, fetchEntries };
};

export default function FromToMaster() {
    const router = useRouter();
    const { entries, loading, fetchEntries } = useFromToData();
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ id: number | number[]; name: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [formData, setFormData] = useState({
        InOutwardFromToName: "",
        PersonName: "",
        Address: "",
        Place: "",
        IsActive: true,
        Sequence: "1",
        Remarks: ""
    });
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const role = localStorage.getItem("userRole");
        const storedId = localStorage.getItem("userId");
        if (storedId) setUserId(parseInt(storedId));

        const userRole = role?.toLowerCase().replace(/\s+/g, '');
        if (userRole !== "admin" && userRole !== "superadmin") {
            router.push("/dashboard");
        }
    }, [router]);

    const handleEdit = (entry: any) => {
        setEditingId(entry.InOutwardFromToID);
        setFormData({
            InOutwardFromToName: entry.InOutwardFromToName || "",
            PersonName: entry.PersonName || "",
            Address: entry.Address || "",
            Place: entry.Place || "",
            IsActive: entry.IsActive,
            Sequence: entry.Sequence?.toString() || "1",
            Remarks: entry.Remarks || ""
        });
        setShowForm(true);
    };

    const handleReload = async () => {
        setIsRefreshing(true);
        await fetchEntries();
        // Artificial delay for better UX if it's too fast
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const filteredEntries = entries.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.InOutwardFromToName?.toLowerCase().includes(query) ||
            entry.PersonName?.toLowerCase().includes(query) ||
            entry.Place?.toLowerCase().includes(query) ||
            entry.Address?.toLowerCase().includes(query)
        );
    });

    const handleDelete = (id: number | number[], name: string) => {
        setDeletingItem({ id, name });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingItem) return;
        setSubmitting(true);
        try {
            const isBulk = Array.isArray(deletingItem.id);
            const url = isBulk
                ? `/api/masters/from-to?ids=${(deletingItem.id as number[]).join(',')}`
                : `/api/masters/from-to?id=${deletingItem.id}`;

            const res = await fetch(url, { method: "DELETE" });
            if (res.ok) {
                fetchEntries();
                setShowDeleteModal(false);
                setDeletingItem(null);
                setSelectedIds([]);
                setIsSelectionMode(false);
                window.dispatchEvent(new Event("profile-updated"));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredEntries.map(entry => entry.InOutwardFromToID));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingItem(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = "/api/masters/from-to";
            const payload = editingId ? { ...formData, InOutwardFromToID: editingId } : { ...formData, UserID: userId };

            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                fetchEntries();
                window.dispatchEvent(new Event("profile-updated"));
                setFormData({
                    InOutwardFromToName: "",
                    PersonName: "",
                    Address: "",
                    Place: "",
                    IsActive: true,
                    Sequence: "1",
                    Remarks: ""
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            InOutwardFromToName: "",
            PersonName: "",
            Address: "",
            Place: "",
            IsActive: true,
            Sequence: "1",
            Remarks: ""
        });
    };

    return (
        <div className="p-10 space-y-8 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary-foreground)]/60">Master Directory</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">From/To Master</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage frequent senders and recipients for your documents.</p>
                </div>
                <div className="flex gap-3">
                    {!isSelectionMode ? (
                        <>
                            <button
                                onClick={handleReload}
                                disabled={loading || isRefreshing}
                                className={`p-3 border border-[var(--border)] rounded-2xl hover:bg-[var(--secondary)] transition-all text-[var(--primary-foreground)] ${isRefreshing ? 'text-blue-600 border-blue-100 bg-blue-50/50' : ''}`}
                                title="Reload Data"
                            >
                                <History size={20} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="p-3 border border-[var(--border)] rounded-2xl hover:bg-slate-50 transition-all text-slate-600 group"
                                title="Bulk Delete Mode"
                            >
                                <Trash2 size={20} className="group-hover:text-rose-500 transition-colors" />
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="pastel-button flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5 shadow-lg shadow-slate-100"
                            >
                                <Plus size={20} />
                                Add Contact
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
                                onClick={() => handleDelete(selectedIds, `${selectedIds.length} selected contacts`)}
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

            <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 bg-[var(--secondary)]/30 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Registered Contacts</h2>
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-foreground)]/40" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="pastel-input py-2.5 pl-12 text-sm w-80 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Entity Info</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Contact & Location</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Remarks</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading || isRefreshing ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <p className="text-slate-400 animate-pulse">Loading contact directory...</p>
                                    </td>
                                </tr>
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={isSelectionMode ? 6 : 5} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users size={32} className="text-[var(--primary-foreground)]/20" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-400">
                                            {searchQuery ? `No contacts matching "${searchQuery}"` : "No contacts found"}
                                        </p>
                                        <button onClick={() => setShowForm(true)} className="text-sm font-bold text-[var(--primary-foreground)] mt-2 hover:underline">Add your first contact</button>
                                    </td>
                                </tr>
                            ) : filteredEntries.map((entry) => (
                                <tr key={entry.InOutwardFromToID} className={`hover:bg-[var(--secondary)]/20 transition-colors group ${selectedIds.includes(entry.InOutwardFromToID) ? 'bg-blue-50/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-8 py-6 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedIds.includes(entry.InOutwardFromToID)}
                                                onChange={() => handleSelectRow(entry.InOutwardFromToID)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] shadow-sm">
                                                <Users size={22} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{entry.InOutwardFromToName}</p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-[200px] truncate">{entry.Address || "No address provided"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col items-center gap-1.5">
                                            {entry.PersonName ? (
                                                <div className="flex items-center gap-1.5 text-sm text-[var(--primary-foreground)] font-bold bg-[var(--primary)]/30 px-3 py-1 rounded-full">
                                                    <User size={14} />
                                                    {entry.PersonName}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">No contact person</span>
                                            )}
                                            {entry.Place && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    {entry.Place}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            {entry.IsActive ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                                    <CheckCircle2 size={12} />
                                                    Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                                                    <XCircle size={12} />
                                                    Inactive
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-slate-500 font-medium max-w-xs">{entry.Remarks || "-"}</p>
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
                                                onClick={() => handleDelete(entry.InOutwardFromToID, entry.InOutwardFromToName || "this contact")}
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

                <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 text-sm font-bold text-slate-400">
                    <p>DISPLAYING {filteredEntries.length} OF {entries.length} MASTER ENTRIES</p>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-[2.5rem] flex flex-col border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Sticky Header */}
                        <div className="p-6 sm:p-10 border-b border-slate-50 flex justify-between items-center bg-[var(--secondary)]/30 shrink-0">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                    {editingId ? "Update Master Entry" : "Add Master Entry"}
                                </h2>
                                <p className="text-[var(--primary-foreground)]/60 text-xs sm:text-sm font-medium mt-1">
                                    {editingId ? "Modify existing contact details." : "Register a recurring entity for quick selection."}
                                </p>
                            </div>
                            <button
                                onClick={closeForm}
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-900 transition-all text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                    <div className="col-span-1 sm:col-span-2">
                                        <div className="flex items-center gap-2 mb-2 sm:mb-3 px-1">
                                            <label className="text-sm font-bold text-slate-700">Entity Name</label>
                                            <Info size={14} className="text-slate-300" />
                                        </div>
                                        <input
                                            type="text"
                                            className="pastel-input py-3 sm:py-3.5"
                                            placeholder="e.g. Regional Office or John Smith"
                                            value={formData.InOutwardFromToName}
                                            onChange={(e) => setFormData({ ...formData, InOutwardFromToName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 sm:mb-3 px-1">Contact Person</label>
                                        <input
                                            type="text"
                                            className="pastel-input py-3 sm:py-3.5"
                                            placeholder="Name of the department head or official"
                                            value={formData.PersonName}
                                            onChange={(e) => setFormData({ ...formData, PersonName: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 sm:mb-3 px-1">Full Address</label>
                                        <textarea
                                            className="pastel-input min-h-[80px] sm:min-h-[100px] py-3 sm:py-4"
                                            placeholder="Complete mailing address for dispatches..."
                                            value={formData.Address}
                                            onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 sm:mb-3 px-1">City / Place</label>
                                        <input
                                            type="text"
                                            className="pastel-input py-3 sm:py-3.5"
                                            placeholder="City name"
                                            value={formData.Place}
                                            onChange={(e) => setFormData({ ...formData, Place: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 sm:mb-3 px-1">Status</label>
                                        <select
                                            className="pastel-input py-3 sm:py-3.5"
                                            value={formData.IsActive ? "Active" : "Inactive"}
                                            onChange={(e) => setFormData({ ...formData, IsActive: e.target.value === "Active" })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 sm:mb-3 px-1">Internal Remarks</label>
                                        <textarea
                                            className="pastel-input min-h-[60px] sm:min-h-[80px] py-3 sm:py-4"
                                            placeholder="Notes for internal reference..."
                                            value={formData.Remarks}
                                            onChange={(e) => setFormData({ ...formData, Remarks: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 sticky bottom-0 bg-white pb-2 sm:pb-0">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="w-full sm:flex-1 py-3.5 sm:py-4.5 rounded-xl sm:rounded-2xl border border-[var(--border)] font-bold text-slate-600 hover:bg-[var(--secondary)]/50 transition-all text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full sm:flex-[2] py-3.5 sm:py-4.5 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all disabled:opacity-50 text-sm sm:text-base"
                                    >
                                        {submitting ? "Processing..." : "Save Master Details"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                {Array.isArray(deletingItem?.id) ? "Delete Multiple Contacts?" : "Delete Contact?"}
                            </h2>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                This action cannot be undone. Are you sure you want to remove <span className="font-bold text-slate-900">"{deletingItem?.name}"</span> from your master directory?
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
