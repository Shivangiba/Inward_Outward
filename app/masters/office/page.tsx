"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    X,
    History
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/app/components/ui/skeleton";

// Data fetching and states
const useOffices = () => {
    const [offices, setOffices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOffices = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/masters/office?t=${Date.now()}`, { cache: "no-store" });

            if (!res.ok) {
                // If 401/500, we might get an error object
                console.error("Fetch failed:", res.status, res.statusText);
                setOffices([]);
                return;
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setOffices(data);
            } else {
                console.error("Invalid data format:", data);
                setOffices([]);
            }
        } catch (err) {
            console.error("Error fetching offices:", err);
            toast.error("Failed to load offices.");
            setOffices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffices();
    }, []);

    return { offices, loading, fetchOffices, setOffices };
};

export default function OfficeMaster() {
    const router = useRouter();
    const { offices, loading, fetchOffices, setOffices } = useOffices();
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        OfficeName: "",
        InstituteID: "1",
        DepartmentID: "",
        OpeningDate: new Date().toISOString().split('T')[0],
        OpeningInwardNo: "1",
        OpeningOutwardNo: "1"
    });

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ id: number | number[], name: string } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = "/api/masters/office";
            const method = editingId ? "PUT" : "POST";
            const payload = editingId ? { ...formData, id: editingId } : { ...formData, UserID: userId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);

                // Immediate UI Update
                if (editingId) {
                    setOffices(prev => prev.map(o => o.InwardOutwardOfficeID === data.InwardOutwardOfficeID ? data : o));
                } else {
                    setOffices(prev => [data, ...prev]);
                }

                window.dispatchEvent(new Event("profile-updated"));
                setFormData({
                    OfficeName: "",
                    InstituteID: "1",
                    DepartmentID: "",
                    OpeningDate: new Date().toISOString().split('T')[0],
                    OpeningInwardNo: "1",
                    OpeningOutwardNo: "1"
                });
                toast.success(editingId ? "Office updated successfully!" : "New office added!");
            } else {
                toast.error("Failed to save office.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while saving.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (office: any) => {
        setEditingId(office.InwardOutwardOfficeID);
        setFormData({
            OfficeName: office.OfficeName,
            InstituteID: office.InstituteID.toString(),
            DepartmentID: office.DepartmentID?.toString() || "",
            OpeningDate: office.OpeningDate.split('T')[0],
            OpeningInwardNo: office.OpeningInwardNo.toString(),
            OpeningOutwardNo: office.OpeningOutwardNo.toString()
        });
        setShowForm(true);
    };

    const handleReload = async () => {
        setIsRefreshing(true);
        await fetchOffices();
        setTimeout(() => setIsRefreshing(false), 600);
        toast.info("Office list refreshed");
    };

    const handleDelete = (id: number | number[], name: string) => {
        setDeletingItem({ id, name });
        setShowDeleteModal(true);
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
                ? `/api/masters/office?ids=${(deletingItem.id as number[]).join(',')}`
                : `/api/masters/office?id=${deletingItem.id}`;

            const res = await fetch(url, {
                method: "DELETE",
            });
            if (res.ok) {
                setShowDeleteModal(false);
                setDeletingItem(null);
                setSelectedIds([]);
                setIsSelectionMode(false);
                fetchOffices();
                window.dispatchEvent(new Event("profile-updated"));
                toast.success(isBulk ? "Selected offices deleted." : "Office deleted successfully.");
            } else {
                toast.error("Failed to delete office.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during deletion.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredOffices.map(o => o.InwardOutwardOfficeID));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredOffices = offices.filter(office =>
        office.OfficeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-10 space-y-8 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Building2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Master Directory</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Office Master</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage your organization's branches and departments.</p>
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
                                        OfficeName: "",
                                        InstituteID: "1",
                                        DepartmentID: "",
                                        OpeningDate: new Date().toISOString().split('T')[0],
                                        OpeningInwardNo: "1",
                                        OpeningOutwardNo: "1"
                                    });
                                    setShowForm(true);
                                }}
                                className="pastel-button flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5"
                            >
                                <Plus size={20} />
                                Add Office
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
                                onClick={() => handleDelete(selectedIds, `${selectedIds.length} selected offices`)}
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

            {/* Main Content Area */}
            <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search offices..."
                            className="pastel-input py-2.5 pl-12 text-sm w-80 bg-white"
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
                                            checked={filteredOffices.length > 0 && selectedIds.length === filteredOffices.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Office Name</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Institute</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Opening Date</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Inward Start</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Outward Start</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={isSelectionMode ? 7 : 6} className="px-8 py-6">
                                            <Skeleton className="h-12 w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredOffices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-10 text-center text-slate-400">No offices matching "{searchTerm}" found.</td>
                                </tr>
                            ) : filteredOffices.map((office) => (
                                <tr key={office.InwardOutwardOfficeID} className={`hover:bg-slate-50/30 transition-colors group ${selectedIds.includes(office.InwardOutwardOfficeID) ? 'bg-blue-50/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-8 py-6 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedIds.includes(office.InwardOutwardOfficeID)}
                                                onChange={() => handleSelectRow(office.InwardOutwardOfficeID)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-slate-700">
                                                <Building2 size={20} />
                                            </div>
                                            <span className="font-bold text-slate-800">{office.OfficeName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-medium text-slate-500">Institute #{office.InstituteID}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(office.OpeningDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">
                                            #{office.OpeningInwardNo}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-block bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold">
                                            #{office.OpeningOutwardNo}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(office)}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(office.InwardOutwardOfficeID, office.OfficeName)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 shadow-sm"
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

                <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <p className="text-sm font-medium text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        Showing {filteredOffices.length} of {offices.length} offices
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30" disabled>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30" disabled>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Dialog */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? "Edit Office" : "Add New Office"}</h2>
                                <p className="text-sm text-slate-500 mt-1">{editingId ? "Modify the existing office details." : "Fill in the office registration details below."}</p>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-900 transition-all font-bold text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Office Name</label>
                                    <input
                                        type="text"
                                        className="pastel-input"
                                        placeholder="e.g. Main Branch"
                                        value={formData.OfficeName}
                                        onChange={(e) => setFormData({ ...formData, OfficeName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Institute ID</label>
                                    <input
                                        type="number"
                                        className="pastel-input"
                                        placeholder="1"
                                        value={formData.InstituteID}
                                        onChange={(e) => setFormData({ ...formData, InstituteID: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Department ID</label>
                                    <input
                                        type="number"
                                        className="pastel-input"
                                        placeholder="Optional"
                                        value={formData.DepartmentID}
                                        onChange={(e) => setFormData({ ...formData, DepartmentID: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Opening Date</label>
                                    <input
                                        type="date"
                                        className="pastel-input"
                                        value={formData.OpeningDate}
                                        onChange={(e) => setFormData({ ...formData, OpeningDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Opening Inward No</label>
                                    <input
                                        type="number"
                                        className="pastel-input"
                                        placeholder="1"
                                        value={formData.OpeningInwardNo}
                                        onChange={(e) => setFormData({ ...formData, OpeningInwardNo: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Opening Outward No</label>
                                    <input
                                        type="number"
                                        className="pastel-input"
                                        placeholder="1"
                                        value={formData.OpeningOutwardNo}
                                        onChange={(e) => setFormData({ ...formData, OpeningOutwardNo: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-3.5 rounded-2xl border border-[var(--border)] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : "Save Office"}
                                </button>
                            </div>
                        </form>
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
                                {Array.isArray(deletingItem?.id) ? "Delete Multiple Offices?" : "Delete Office Master?"}
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
