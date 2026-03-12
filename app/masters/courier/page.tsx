"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Truck,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    History,
    AlertTriangle,
    X,
    Info,
    CheckCircle2,
    XCircle,
    User
} from "lucide-react";

// Data fetching and states
const useCouriers = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCouriers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/masters/courier?t=${Date.now()}`, { cache: "no-store" });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Failed to fetch couriers:", errorData);
                setCompanies([]);
                return;
            }

            const data = await res.json();

            // Ensure data is an array
            if (Array.isArray(data)) {
                setCompanies(data);
            } else {
                console.error("Invalid data format:", data);
                setCompanies([]);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCouriers();
    }, []);

    return { companies, loading, fetchCouriers, setCompanies };
};

export default function CourierMaster() {
    const router = useRouter();
    const { companies, loading, fetchCouriers, setCompanies } = useCouriers();
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ id: number | number[]; name: string } | null>(null);
    const [formData, setFormData] = useState({
        CourierCompanyName: "",
        ContactPersonName: "",
        DefaultRate: "",
        PhoneNo: "",
        Email: "",
        Address: ""
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

    const handleEdit = (company: any) => {
        setEditingId(company.CourierCompanyID);
        setFormData({
            CourierCompanyName: company.CourierCompanyName || "",
            ContactPersonName: company.ContactPersonName || "",
            DefaultRate: company.DefaultRate?.toString() || "",
            PhoneNo: company.PhoneNo || "",
            Email: company.Email || "",
            Address: company.Address || ""
        });
        setShowForm(true);
    };

    const handleReload = async () => {
        setIsRefreshing(true);
        await fetchCouriers();
        setTimeout(() => setIsRefreshing(false), 500);
    };

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
                ? `/api/masters/courier?ids=${(deletingItem.id as number[]).join(',')}`
                : `/api/masters/courier?id=${deletingItem.id}`;

            const res = await fetch(url, { method: "DELETE" });
            if (res.ok) {
                fetchCouriers();
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

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredCompanies = companies.filter(company =>
        company.CourierCompanyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.ContactPersonName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = "/api/masters/courier";
            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingId ? { ...formData, id: editingId } : { ...formData, UserID: userId }),
            });
            const data = await res.json();
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);

                // Immediate UI Update
                if (editingId) {
                    setCompanies(prev => prev.map(c => c.CourierCompanyID === data.CourierCompanyID ? data : c));
                } else {
                    setCompanies(prev => [data, ...prev]);
                }

                window.dispatchEvent(new Event("profile-updated"));
                setFormData({
                    CourierCompanyName: "",
                    ContactPersonName: "",
                    DefaultRate: "",
                    PhoneNo: "",
                    Email: "",
                    Address: ""
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
            CourierCompanyName: "",
            ContactPersonName: "",
            DefaultRate: "",
            PhoneNo: "",
            Email: "",
            Address: ""
        });
    };

    return (
        <div className="p-10 space-y-8 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Truck size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Master Directory</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Courier Master</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage your shipping partners and delivery rates.</p>
                </div>
                <div className="flex gap-3">
                    {!isSelectionMode ? (
                        <>
                            <div className="relative mr-2">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search partners..."
                                    className="pastel-input py-3 pl-12 text-sm w-64 bg-white border-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleReload}
                                disabled={loading || isRefreshing}
                                className={`p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 ${isRefreshing ? 'text-blue-600 border-blue-100 bg-blue-50/50' : ''}`}
                                title="Reload Data"
                            >
                                <History size={20} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => setIsSelectionMode(true)}
                                className="p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 group"
                                title="Bulk Delete Mode"
                            >
                                <Trash2 size={20} className="group-hover:text-rose-500 transition-colors" />
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="pastel-button flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5 shadow-lg shadow-slate-100"
                            >
                                <Plus size={20} />
                                Add Courier
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
                                onClick={() => handleDelete(selectedIds, `${selectedIds.length} partners`)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading || isRefreshing ? (
                    <div className="col-span-full p-20 text-center">
                        <p className="text-slate-400 animate-pulse font-bold text-lg">Loading courier partners directory...</p>
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="col-span-full p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Truck size={40} className="text-slate-200" />
                        </div>
                        <p className="text-xl font-bold text-slate-400">
                            {searchTerm ? `No partners matching "${searchTerm}"` : "No courier partners found"}
                        </p>
                        <button onClick={() => setShowForm(true)} className="text-sm font-bold text-slate-900 mt-2 hover:underline">Add your first partner</button>
                    </div>
                ) : (
                    <>
                        {filteredCompanies.map((company) => (
                            <div
                                key={company.CourierCompanyID}
                                onClick={() => isSelectionMode && handleSelectRow(company.CourierCompanyID)}
                                className={`pastel-card hover:translate-y-[-4px] group relative cursor-pointer transition-all ${selectedIds.includes(company.CourierCompanyID) ? 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/10' : ''}`}
                            >
                                {isSelectionMode && (
                                    <div className="absolute top-6 left-6 z-10">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedIds.includes(company.CourierCompanyID)}
                                            readOnly
                                        />
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-[var(--primary)] text-slate-700 flex items-center justify-center shadow-sm ${isSelectionMode ? 'ml-10' : ''}`}>
                                        <Truck size={28} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!isSelectionMode && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(company); }}
                                                    className="p-2.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-white transition-all border border-transparent hover:border-slate-100 shadow-sm"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(company.CourierCompanyID, company.CourierCompanyName); }}
                                                    className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 shadow-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-1">{company.CourierCompanyName}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-6">
                                    <User size={14} className="text-slate-400" />
                                    {company.ContactPersonName}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium font-bold">
                                        <Phone size={14} className="text-slate-400" />
                                        {company.PhoneNo || "N/A"}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <Mail size={14} className="text-slate-400" />
                                        <span className="truncate">{company.Email || "N/A"}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-xs text-slate-400 font-medium leading-relaxed">
                                        <MapPin size={14} className="text-slate-300 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{company.Address || "No address provided"}</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Rate</span>
                                    <span className="text-lg font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-xl">₹{company.DefaultRate}</span>
                                </div>
                            </div>
                        ))}

                        {!isSelectionMode && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="pastel-card border-dashed border-2 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50/50 transition-all min-h-[300px]"
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Plus size={24} />
                                </div>
                                <span className="font-bold text-sm uppercase tracking-widest">Add New Partner</span>
                            </button>
                        )}
                    </>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {editingId ? "Update Courier Partner" : "Configure Courier"}
                                </h2>
                                <p className="text-[var(--primary-foreground)]/60 text-sm font-medium mt-1">
                                    {editingId ? "Modify partner details and rates." : "Register a new shipping partner."}
                                </p>
                            </div>
                            <button
                                onClick={closeForm}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-900 transition-all text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Company Name</label>
                                    <input
                                        type="text"
                                        className="pastel-input"
                                        placeholder="e.g. Blue Dart"
                                        value={formData.CourierCompanyName}
                                        onChange={(e) => setFormData({ ...formData, CourierCompanyName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Contact Person</label>
                                    <input
                                        type="text"
                                        className="pastel-input"
                                        placeholder="Name"
                                        value={formData.ContactPersonName}
                                        onChange={(e) => setFormData({ ...formData, ContactPersonName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Base Rate (₹)</label>
                                    <input
                                        type="number"
                                        className="pastel-input"
                                        placeholder="0.00"
                                        value={formData.DefaultRate}
                                        onChange={(e) => setFormData({ ...formData, DefaultRate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="pastel-input"
                                        placeholder="10-digit number"
                                        value={formData.PhoneNo}
                                        onChange={(e) => setFormData({ ...formData, PhoneNo: e.target.value.replace(/\D/g, '') })}
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                        title="Please enter a 10-digit phone number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Email Address</label>
                                    <input
                                        type="email"
                                        className="pastel-input"
                                        placeholder="contact@company.com"
                                        value={formData.Email}
                                        onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Full Address</label>
                                    <textarea
                                        className="pastel-input min-h-[80px]"
                                        placeholder="Office address..."
                                        value={formData.Address}
                                        onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={closeForm} className="flex-1 py-4 rounded-2xl border border-[var(--border)] font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all disabled:opacity-50"
                                >
                                    {submitting ? "Processing..." : (editingId ? "Save Changes" : "Register Partner")}
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
                                {Array.isArray(deletingItem?.id) ? "Delete Multiple Partners?" : "Delete Partner?"}
                            </h2>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                This action cannot be undone. Are you sure you want to remove <span className="font-bold text-slate-900">"{deletingItem?.name}"</span> from your courier directory?
                            </p>
                            <div className="flex w-full gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
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
