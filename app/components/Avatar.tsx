"use client";

import React from "react";

interface UserAvatarProps {
    name: string;
    src?: string | null;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    borderRadius?: string;
}

const colors = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
];

const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function UserAvatar({
    name,
    src,
    size = "md",
    className = "",
    borderRadius = "rounded-xl",
}: UserAvatarProps) {
    const [imageError, setImageError] = React.useState(false);

    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-32 h-32 text-4xl",
    };

    const initials = getInitials(name);
    const colorClass = getColorFromName(name);

    return (
        <div
            className={`${sizeClasses[size]} ${borderRadius} overflow-hidden flex items-center justify-center shrink-0 border border-white shadow-sm ${className} ${!src || imageError ? colorClass : "bg-slate-100"
                }`}
        >
            {src && !imageError ? (
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <span className="font-bold text-white tracking-wider">{initials}</span>
            )}
        </div>
    );
}
