import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface UserSession {
    userId: number;
    username: string;
    role: string;
    teamId: number | null;
}

export async function getServerSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        // console.log('[AUTH] No token found in cookies');
        return null;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        // console.log('[AUTH] Raw decoded token:', JSON.stringify(decoded));

        let teamId: number | null = null;
        // Try all common variations of teamId key
        const rawTeamId = decoded.teamId ?? decoded.TeamID ?? decoded.team_id;

        if (rawTeamId !== undefined && rawTeamId !== null) {
            const parsed = parseInt(String(rawTeamId), 10);
            if (!isNaN(parsed)) {
                teamId = parsed;
            }
        }

        const session = {
            userId: parseInt(String(decoded.userId ?? decoded.UserID ?? decoded.sub), 10),
            username: decoded.username ?? decoded.email ?? decoded.Name,
            role: decoded.role,
            teamId: teamId,
        };

        console.log('[AUTH] Session validated:', {
            userId: session.userId,
            role: session.role,
            teamId: session.teamId,
            identity: session.username
        });

        return session;
    } catch (error: any) {
        console.error('[AUTH] Token verification failed:', error.message);
        return null;
    }
}

export async function getBaseFilter() {
    const session = await getServerSession();

    if (!session) {
        return { UserID: -1 };
    }

    const normalizedRole = session.role.toUpperCase().replace(/\s+/g, '_');

    // Global access for SUPER_ADMIN
    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPERADMIN') {
        return {};
    }

    // Strict team-based filtering for ADMIN and CLERK
    if (!session.teamId) {
        // If they are not Super Admin and have no team, they should only see their own data
        return { UserID: session.userId };
    }

    return { TeamID: session.teamId };
}

export async function getTeamFilter(requestedTeamId?: number) {
    const session = await getServerSession();
    if (!session) return { UserID: -1 };

    const normalizedRole = session.role.toUpperCase().replace(/\s+/g, '_');

    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPERADMIN') {
        // Super admin can filter by team if requestedTeamId is provided
        if (requestedTeamId && !isNaN(requestedTeamId)) {
            return { TeamID: requestedTeamId };
        }
        return {}; // Global view
    }

    // For ADMIN and CLERK: forced to their own team, no exceptions
    if (!session.teamId) return { UserID: session.userId };
    return { TeamID: session.teamId };
}

export async function getMasterFilter() {
    const session = await getServerSession();
    if (!session) return { UserID: -1 };

    const normalizedRole = session.role.toUpperCase().replace(/\s+/g, '_');

    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPERADMIN') {
        return {}; // Super admin sees all masters
    }

    if (!session.teamId) return { UserID: -1 };

    // Admin/Clerk: only masters scoped to their team
    return { TeamID: session.teamId };
}

export async function checkRole(requiredRoles: string[]) {
    const session = await getServerSession();
    if (!session) return false;

    const normalizedRole = session.role.toUpperCase().replace(/\s+/g, '_');
    const normalizedRequired = requiredRoles.map(r => r.toUpperCase().replace(/\s+/g, '_'));

    return normalizedRequired.includes(normalizedRole);
}

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    CLERK: 'CLERK'
};

export async function getSessionOrThrow() {
    const session = await getServerSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}

export function normalizeRole(role: string) {
    return role.toUpperCase().replace(/\s+/g, '_');
}

