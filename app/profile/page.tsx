"use client";

import { useEffect, useState } from "react";
import {
    User,
    Mail,
    Shield,
    Calendar,
    MapPin,
    CheckCircle2,
    Clock,
    Camera,
    Settings,
    Bell,
    AlertTriangle,
    Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import UserAvatar from "../components/Avatar";




export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState({
        id: null,
        name: "Loading...",
        email: "loading@example.com",
        role: "user",
        joinedDate: null,
        profilePath: null
    });
    const [stats, setStats] = useState({
        totalInward: 0,
        totalOutward: 0,
        totalMasters: 0,
        pendingTasks: 0
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        Email: "",
        Name: "",
        Password: "",
        ConfirmPassword: "",
        JoinedAt: ""
    });
    const [error, setError] = useState("");

    const fetchUserProfile = async (email: string) => {
        try {
            const res = await fetch(`/api/profile?email=${email}&t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await res.json();
            if (res.ok && data) {
                setUser(prev => ({
                    ...prev,
                    id: data.UserID,
                    name: data.Name || data.Email?.split('@')[0] || "User",
                    email: data.Email || email,
                    role: data.role?.RoleName || "User",
                    profilePath: data.ProfilePath,
                    joinedDate: data.JoinedAt
                }));
            } else if (res.status === 404) {
                console.warn("User not found in DB, using local storage defaults");
                const storedName = localStorage.getItem("userName");
                setUser(prev => ({
                    ...prev,
                    name: storedName || email.split('@')[0],
                    email: email
                }));
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    };

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64String = await resizeImage(file);

            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentEmail: user.email,
                    ProfilePath: base64String
                })
            });

            if (res.ok) {
                fetchUserProfile(user.email);
                window.dispatchEvent(new Event("profile-updated"));
            } else {
                const errorText = await res.text();
                console.error("Image upload failed status:", res.status);
                console.error("Image upload failed body:", errorText);
            }
        } catch (err) {
            console.error("Image upload error:", err);
        }
    };

    const handleRemovePhoto = async () => {
        if (!confirm("Are you sure you want to remove your profile photo?")) return;

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentEmail: user.email,
                    ProfilePath: null
                })
            });

            if (res.ok) {
                fetchUserProfile(user.email);
                window.dispatchEvent(new Event("profile-updated"));
                if (showEditModal) setShowEditModal(false); // Close modal if removal happened from inside
            }
        } catch (err) {
            console.error("Remove photo error:", err);
        }
    };

    // Fetch real stats from Prisma via our new API, filtered by user
    const fetchStats = async (email: string) => {
        try {
            const res = await fetch(`/api/profile/stats?email=${email}&t=${Date.now()}`);
            const data = await res.json();
            if (data.stats) setStats(data.stats);
        } catch (err) {
            console.error("Failed to fetch profile stats:", err);
        }
    };

    useEffect(() => {
        const storedRole = localStorage.getItem("userRole");
        const storedEmail = localStorage.getItem("userEmail");

        if (!storedRole || !storedEmail) {
            router.push("/login");
            return;
        }

        const loadAllData = () => {
            const latestEmail = localStorage.getItem("userEmail") || storedEmail;
            fetchUserProfile(latestEmail);
            fetchStats(latestEmail);
        };

        loadAllData();

        // Listen for profile updates from this or other components in the same tab
        const handleGlobalUpdate = () => {
            loadAllData();
        };

        // Listen for profile updates from other tabs
        const profileChannel = new BroadcastChannel('profile_sync_channel');
        profileChannel.onmessage = (event) => {
            if (event.data === 'profile-updated') {
                loadAllData();
            }
        };

        window.addEventListener('profile-updated', handleGlobalUpdate);

        // Also broadcast to other tabs when we dispatch locally
        const originalDispatchEvent = window.dispatchEvent;
        window.dispatchEvent = function (event: Event) {
            if (event.type === 'profile-updated') {
                profileChannel.postMessage('profile-updated');
            }
            return originalDispatchEvent.apply(this, [event]);
        };

        return () => {
            window.removeEventListener('profile-updated', handleGlobalUpdate);
            profileChannel.close();
            window.dispatchEvent = originalDispatchEvent;
        };

    }, [router]);

    const handleOpenEdit = () => {
        setEditFormData({
            Email: user.email,
            Name: user.name === "Loading..." ? "" : user.name,
            Password: "",
            ConfirmPassword: "",
            JoinedAt: user.joinedDate ? new Date(user.joinedDate).toISOString().substring(0, 10) : ""
        });
        setError("");
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editFormData.Password && editFormData.Password !== editFormData.ConfirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setUpdateLoading(true);
        setError("");

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Email: editFormData.Email,
                    Name: editFormData.Name,
                    Password: editFormData.Password,
                    currentEmail: user.email,
                    JoinedAt: editFormData.JoinedAt
                })
            });

            const responseData = await res.json().catch(() => ({}));

            if (res.ok) {
                localStorage.setItem("userEmail", editFormData.Email);
                setShowEditModal(false);
                fetchUserProfile(editFormData.Email);
                window.dispatchEvent(new Event("profile-updated"));
            } else {
                console.error("Update failed status:", res.status);
                console.error("Update failed data:", responseData);

                // Show clean error from server
                setError(responseData.error || "Something went wrong while saving your changes. Please try again.");
            }
        } catch (err) {
            console.error("Update networking error:", err);
            setError("A networking error occurred. Please check your internet connection.");
        } finally {
            setUpdateLoading(false);
        }
    };

    return (
        <div className="p-10 space-y-10 font-sans max-w-6xl mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <User size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary-foreground)]/60">Account Center</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">My Profile</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage your personal information and preferences.</p>
                </div>
                <div className="flex gap-3">
                    <button className="p-3 border border-[var(--border)] rounded-2xl hover:bg-[var(--secondary)] transition-all text-[var(--primary-foreground)]">
                        <Bell size={20} />
                    </button>
                    <button
                        onClick={handleOpenEdit}
                        className="pastel-button flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-3.5 shadow-lg shadow-slate-100"
                    >
                        <Settings size={20} />
                        Edit Settings
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar and Quick Info */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm relative group">
                        <div className="h-32 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] absolute top-0 left-0 right-0" />
                        <div className="pt-16 pb-10 px-8 relative flex flex-col items-center">
                            <div className="relative mb-6">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1 shadow-xl">
                                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
                                        <UserAvatar
                                            name={user.name}
                                            src={user.profilePath}
                                            size="xl"
                                            borderRadius="rounded-[2.2rem]"
                                        />
                                    </div>

                                </div>
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                    {user.profilePath && (
                                        <button
                                            onClick={handleRemovePhoto}
                                            className="w-10 h-10 rounded-2xl bg-white border border-rose-50 shadow-lg flex items-center justify-center text-rose-400 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 cursor-pointer"
                                            title="Remove Photo"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <label className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 cursor-pointer">
                                        <Camera size={18} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                            <p className="text-sm font-bold text-[var(--primary-foreground)] bg-[var(--primary)] px-4 py-1 rounded-full mt-2 uppercase tracking-wide">
                                {user.role}
                            </p>

                            <div className="w-full mt-10 pt-8 border-t border-slate-50 space-y-4">
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <Mail size={18} className="text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                        <p className="text-sm font-semibold truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <Calendar size={18} className="text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined On</p>
                                        <p className="text-sm font-semibold truncate">
                                            {user.joinedDate
                                                ? new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                                : 'Not Set'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                                        <p className="text-sm font-semibold truncate">Regional Headquarters</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <h3 className="text-lg font-bold mb-4 relative z-10">Account Status</h3>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm relative z-10 border border-white/10">
                            <CheckCircle2 className="text-emerald-400" size={24} />
                            <div>
                                <p className="text-sm font-bold">Verified Account</p>
                                <p className="text-xs text-slate-400 italic">Security checks complete</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-6 leading-relaxed">
                            Your account is fully active. You have permissions to manage masters and transactions based on your assigned role.
                        </p>
                    </div>
                </div>

                {/* Right Column: Detailed Info and Activity */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-50 bg-[var(--secondary)]/30">
                            <h2 className="text-xl font-bold text-slate-900">Security & Roles</h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                <Shield className="text-[var(--primary-foreground)] mb-4" size={28} />
                                <h4 className="font-bold text-slate-900 mb-2">Role Permissions</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Inward/Outward Log Access
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Masters Visibility
                                    </li>
                                    {user.role === 'admin' && (
                                        <li className="flex items-center gap-2 text-sm text-slate-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Admin Management
                                        </li>
                                    )}
                                </ul>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                <Clock className="text-[var(--primary-foreground)] mb-4" size={28} />
                                <h4 className="font-bold text-slate-900 mb-2">Session Info</h4>
                                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                    Your session is active. For security, remember to sign out when using shared devices.
                                </p>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
                                <p className="text-xs font-bold text-emerald-600 mt-1 uppercase">Live Now</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-50 bg-[var(--secondary)]/30">
                            <h2 className="text-xl font-bold text-slate-900">Information Summary</h2>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Inward", value: stats.totalInward, color: "bg-blue-50 text-blue-600" },
                                    { label: "Total Outward", value: stats.totalOutward, color: "bg-purple-50 text-purple-600" },
                                    { label: "Masters Managed", value: stats.totalMasters, color: "bg-emerald-50 text-emerald-600" },
                                    { label: "Pending Tasks", value: stats.pendingTasks, color: "bg-orange-50 text-orange-600" },
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className={`text-2xl font-black ${stat.color.split(' ')[1]}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-indigo-900">Account Control</h4>
                                    <p className="text-sm text-indigo-600/70 py-1">Keep your credentials secure and update them regularly.</p>
                                </div>
                                <button onClick={handleOpenEdit} className="text-indigo-600 font-bold hover:underline text-sm">Update Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Settings Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-[var(--secondary)]/30 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                                <p className="text-[var(--primary-foreground)]/60 text-sm font-medium">Update your account credentials</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900 text-2xl font-light">&times;</button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8 space-y-6">
                            {error && (
                                <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-2xl border border-rose-100 flex items-center gap-2">
                                    <AlertTriangle size={18} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Full Name</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        className="pastel-input py-3.5 flex-1"
                                        value={editFormData.Name || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, Name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                    {user.profilePath && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all flex items-center gap-2 text-sm font-bold shrink-0"
                                        >
                                            <Trash2 size={18} />
                                            <span>No Photo</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Email Address</label>
                                <input
                                    type="email"
                                    className="pastel-input py-3.5"
                                    value={editFormData.Email || ""}
                                    onChange={(e) => setEditFormData({ ...editFormData, Email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Joined Date</label>
                                <input
                                    type="date"
                                    className="pastel-input py-3.5"
                                    value={editFormData.JoinedAt || ""}
                                    onChange={(e) => setEditFormData({ ...editFormData, JoinedAt: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        className="pastel-input py-3.5"
                                        value={editFormData.Password || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, Password: e.target.value })}
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 px-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="pastel-input py-3.5"
                                        value={editFormData.ConfirmPassword || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, ConfirmPassword: e.target.value })}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-4 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="flex-[2] py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all disabled:opacity-50"
                                >
                                    {updateLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
