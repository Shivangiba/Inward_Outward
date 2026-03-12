"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    Mail,
    Lock,
    Shield,
    ChevronLeft,
    ChevronRight,
    Loader2,
    History,
    AlertTriangle,
    X,
    CheckCircle2,
    XCircle
} from "lucide-react";

const useAdmins = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/masters/admins?t=${Date.now()}`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return { users, loading, fetchUsers };
};

export default function AdminMaster() {
    const router = useRouter();
    const { users, loading, fetchUsers } = useAdmins();
    const [roles, setRoles] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [formData, setFormData] = useState({
        Name: "",
        Email: "",
        Password: "",
        RoleID: "",
        TeamID: ""
    });
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [addingTeam, setAddingTeam] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<{ id: number | number[]; name: string } | null>(null);

    const fetchTeams = async () => {
        try {
            const res = await fetch("/api/masters/teams");
            const data = await res.json();
            setTeams(data);
            if (data.length > 0 && !formData.TeamID) {
                setFormData(prev => ({ ...prev, TeamID: data[0].TeamID.toString() }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const storedRole = localStorage.getItem("userRole");
        const userRole = storedRole?.toLowerCase().replace(/\s+/g, '');
        if (userRole !== "admin" && userRole !== "superadmin") {
            router.push("/dashboard");
        }

        const fetchRoles = async () => {
            try {
                const res = await fetch("/api/masters/roles");
                const data = await res.json();
                setRoles(data);
                if (data.length > 0 && !formData.RoleID) {
                    const currentUserRole = localStorage.getItem("userRole")?.toLowerCase().replace(/\s+/g, '');
                    const allowedRoles = data.filter((role: any) => {
                        const normalizedRole = role.RoleName.toLowerCase().replace(/\s+/g, '');
                        if (currentUserRole === 'admin') {
                            return normalizedRole !== 'superadmin';
                        }
                        return true;
                    });
                    if (allowedRoles.length > 0) {
                        setFormData(prev => ({ ...prev, RoleID: allowedRoles[0].RoleID.toString() }));
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchRoles();
        fetchTeams();
    }, [router]);

    const handleAddTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        setAddingTeam(true);
        try {
            const res = await fetch("/api/masters/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ TeamName: newTeamName }),
            });
            if (res.ok) {
                const newTeam = await res.json();
                await fetchTeams();
                setFormData(prev => ({ ...prev, TeamID: newTeam.TeamID.toString() }));
                setNewTeamName("");
                setShowTeamForm(false);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to create team");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAddingTeam(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = "/api/masters/admins";
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...formData, UserID: editingId } : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                fetchUsers();
                window.dispatchEvent(new Event("profile-updated"));
                const currentUserRole = localStorage.getItem("userRole")?.toLowerCase().replace(/\s+/g, '');
                const allowedRoles = roles.filter(role => {
                    const normalizedRole = role.RoleName.toLowerCase().replace(/\s+/g, '');
                    if (currentUserRole === 'admin') {
                        return normalizedRole !== 'superadmin';
                    }
                    return true;
                });
                setFormData({
                    Name: "",
                    Email: "",
                    Password: "",
                    RoleID: allowedRoles[0]?.RoleID.toString() || "",
                    TeamID: teams[0]?.TeamID.toString() || ""
                });
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user: any) => {
        setEditingId(user.UserID);
        setFormData({
            Name: user.Name || "",
            Email: user.Email,
            Password: "", // Reset password on edit for security
            RoleID: user.RoleID.toString(),
            TeamID: user.TeamID?.toString() || ""
        });
        setShowForm(true);
    };

    const handleReload = async () => {
        setIsRefreshing(true);
        await fetchUsers();
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
                ? `/api/masters/admins?ids=${(deletingItem.id as number[]).join(',')}`
                : `/api/masters/admins?id=${deletingItem.id}`;

            const res = await fetch(url, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchUsers();
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
            setSelectedIds(filteredUsers.map(u => u.UserID));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFilter = activeFilter === "All" || user.role.RoleName.toLowerCase().replace(/\s+/g, '') === activeFilter.toLowerCase().replace(/\s+/g, '');

        // Hierarchy: Admins cannot see Super Admins
        const loggedInRole = localStorage.getItem("userRole")?.toLowerCase().replace(/\s+/g, '');
        const targetRole = user.role.RoleName.toLowerCase().replace(/\s+/g, '');

        if (loggedInRole === 'admin' && targetRole === 'superadmin') {
            return false;
        }

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-10 space-y-8 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Master Directory</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Admin Master</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage system users, roles and permissions.</p>
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
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        Name: "",
                                        Email: "",
                                        Password: "",
                                        RoleID: roles[0]?.RoleID.toString() || "",
                                        TeamID: teams[0]?.TeamID.toString() || ""
                                    });
                                    setShowForm(true);
                                }}
                                className="pastel-button flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5 shadow-lg shadow-slate-100"
                            >
                                <Plus size={20} />
                                Add User
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
                                onClick={() => handleDelete(selectedIds, `${selectedIds.length} users`)}
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

            <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
                {(localStorage.getItem("userRole")?.toLowerCase().replace(/\s+/g, '') === 'superadmin'
                    ? ["All", "Super Admin", "Admin", "Clerk"]
                    : ["All", "Admin", "Clerk"]
                ).map(filter => (
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

            {/* Main Content Area */}
            <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
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
                                            checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Team</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined At</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading || isRefreshing ? (
                                <tr>
                                    <td colSpan={isSelectionMode ? 6 : 5} className="px-8 py-10 text-center text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={isSelectionMode ? 6 : 5} className="px-8 py-10 text-center text-slate-400">No users matching "{searchTerm}" found.</td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.UserID} className={`hover:bg-slate-50/30 transition-colors group ${selectedIds.includes(user.UserID) ? 'bg-blue-50/30' : ''}`}>
                                    {isSelectionMode && (
                                        <td className="px-8 py-6 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedIds.includes(user.UserID)}
                                                onChange={() => handleSelectRow(user.UserID)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-slate-700">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{user.Name || "Unnamed User"}</p>
                                                <p className="text-xs text-slate-500">{user.Email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${user.role.RoleName.toLowerCase().replace(/\s+/g, '') === 'superadmin'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : user.role.RoleName.toLowerCase() === 'admin'
                                                ? 'bg-purple-50 text-purple-600'
                                                : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            <Shield size={12} />
                                            {user.role.RoleName.toLowerCase().replace(/\s+/g, '') === 'superadmin' ? 'SUPER ADMIN' : user.role.RoleName.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-slate-600">
                                        {user.team?.TeamName || "No Team"}
                                    </td>
                                    <td className="px-8 py-6 text-sm font-medium text-slate-500">
                                        {user.JoinedAt ? new Date(user.JoinedAt).toLocaleDateString() : "N/A"}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${user.IsActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {user.IsActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.UserID, user.Name)}
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
                        Showing {filteredUsers.length} of {users.length} users
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
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? "Edit User" : "Add New User"}</h2>
                                <p className="text-sm text-slate-500 mt-1">{editingId ? "Modify the existing user details." : "Create a new admin or clerk account."}</p>
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            className="pastel-input pl-12"
                                            placeholder="e.g. John Doe"
                                            value={formData.Name}
                                            onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            className="pastel-input pl-12"
                                            placeholder="user@example.com"
                                            value={formData.Email}
                                            onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={editingId ? "col-span-2" : "col-span-1"}>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        {editingId ? "New Password (Leave blank to keep current)" : "Password"}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            className="pastel-input pl-12"
                                            placeholder="Min. 6 characters"
                                            value={formData.Password}
                                            onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                                            required={!editingId}
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                {(!editingId || editingId) && (
                                    <>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                                            <select
                                                className="pastel-input appearance-none"
                                                value={formData.RoleID}
                                                onChange={(e) => setFormData({ ...formData, RoleID: e.target.value })}
                                                required
                                            >
                                                {roles
                                                    .filter((role, index, self) => {
                                                        const normalizedName = role.RoleName.toLowerCase().replace(/\s+/g, '');
                                                        const currentUserRole = localStorage.getItem("userRole")?.toLowerCase().replace(/\s+/g, '');

                                                        // Deduplicate based on normalized name
                                                        const isFirst = self.findIndex(r => r.RoleName.toLowerCase().replace(/\s+/g, '') === normalizedName) === index;
                                                        if (!isFirst) return false;

                                                        if (currentUserRole === 'admin') {
                                                            return normalizedName !== 'superadmin';
                                                        }
                                                        return true;
                                                    })
                                                    .map(role => (
                                                        <option key={role.RoleID} value={role.RoleID}>
                                                            {role.RoleName.toLowerCase().replace(/\s+/g, '') === 'superadmin' ? 'Super Admin' : role.RoleName.charAt(0).toUpperCase() + role.RoleName.slice(1)}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-bold text-slate-700">Team</label>
                                                {localStorage.getItem("userRole")?.toLowerCase().replace(/\s+/g, '') === 'superadmin' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTeamForm(true)}
                                                        className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                        title="Create New Team"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <select
                                                className="pastel-input appearance-none"
                                                value={formData.TeamID}
                                                onChange={(e) => setFormData({ ...formData, TeamID: e.target.value })}
                                                required
                                            >
                                                {teams.length === 0 && <option value="">No teams available</option>}
                                                {teams.map(team => (
                                                    <option key={team.TeamID} value={team.TeamID}>
                                                        {team.TeamName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
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
                                    className="flex-[2] py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        editingId ? "Update User" : "Create User"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Team Creation Modal */}
            {showTeamForm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Create New Team</h2>
                            <button onClick={() => setShowTeamForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleAddTeam} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Team Name</label>
                                <input
                                    type="text"
                                    className="pastel-input"
                                    placeholder="e.g. Finance, HR, IT"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={addingTeam}
                                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {addingTeam ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Add Team"
                                )}
                            </button>
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
                                {Array.isArray(deletingItem?.id) ? "Delete Multiple Users?" : "Delete User?"}
                            </h2>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                This action cannot be undone. Are you sure you want to remove <span className="font-bold text-slate-900">"{deletingItem?.name}"</span> from the system?
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
