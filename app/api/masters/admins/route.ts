import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaseFilter, getServerSession } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const baseFilter = await getBaseFilter();
        const users = await prisma.user.findMany({
            where: baseFilter,
            include: {
                role: true,
                team: true
            },
            orderBy: { Created: "desc" },
        });
        return NextResponse.json(users);
    } catch (error: any) {
        await logAudit({
            tableName: "User",
            action: AuditAction.CRASH,
            details: `Fetch Users Error: ${error.message}`
        });
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const body = await request.json();
        let { Email, Password, Name, RoleID, TeamID } = body;
        const roleName = session.role.toLowerCase().replace(/\s+/g, '');

        // Team admin can only create users in their own team
        if (roleName === 'admin') {
            if (!session.teamId) {
                return NextResponse.json({ error: "Your account has no team assigned. Contact Super Admin." }, { status: 403 });
            }
            TeamID = session.teamId;
        }

        if (Password && Password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { Email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                Email,
                Password,
                Name,
                RoleID: Number(RoleID),
                TeamID: TeamID ? Number(TeamID) : null,
            },
            include: { role: true, team: true }
        });

        await logAudit({
            tableName: "User",
            recordId: user.UserID,
            action: AuditAction.CREATE,
            newData: user
        });

        return NextResponse.json(user);
    } catch (error: any) {
        await logAudit({
            tableName: "User",
            action: AuditAction.CRASH,
            details: `Create User Error: ${error.message}`
        });
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const body = await request.json();
        const { UserID, Email, Password, Name, RoleID, TeamID, IsActive } = body;
        const roleName = session.role.toLowerCase().replace(/\s+/g, '');

        if (Password && Password.length > 0 && Password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
        }

        const updateData: any = {
            Email,
            Name,
            RoleID: Number(RoleID),
            TeamID: TeamID ? Number(TeamID) : null,
            IsActive: IsActive !== undefined ? IsActive : true
        };
        if (roleName === 'admin' && session.teamId) {
            updateData.TeamID = session.teamId;
        }
        if (Password) {
            updateData.Password = Password;
        }

        const oldUser = await prisma.user.findUnique({
            where: { UserID: Number(UserID) }
        });

        const user = await prisma.user.update({
            where: { UserID: Number(UserID) },
            data: updateData,
            include: { role: true, team: true }
        });

        await logAudit({
            tableName: "User",
            recordId: UserID,
            action: AuditAction.UPDATE,
            oldData: oldUser,
            newData: user
        });

        return NextResponse.json(user);
    } catch (error: any) {
        await logAudit({
            tableName: "User",
            action: AuditAction.CRASH,
            details: `Update User Error: ${error.message}`
        });
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const baseFilter = await getBaseFilter();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const idsString = searchParams.get("ids");

        if (idsString) {
            const ids = idsString.split(",").map((i: string) => parseInt(i)).filter((i: number) => !isNaN(i));
            if (ids.length === 0) {
                return NextResponse.json({ error: "Valid IDs are required" }, { status: 400 });
            }

            const oldData = await prisma.user.findMany({
                where: { UserID: { in: ids }, ...baseFilter }
            });

            const result = await prisma.user.deleteMany({
                where: { UserID: { in: ids }, ...baseFilter },
            });

            await logAudit({
                tableName: "User",
                action: AuditAction.DELETE,
                oldData,
                details: `Bulk deleted ${result.count} users`
            });

            return NextResponse.json({ message: `${result.count} users deleted successfully` });
        }

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
        const existing = await prisma.user.findFirst({
            where: { UserID: parseInt(id), ...baseFilter },
        });
        if (!existing) {
            return NextResponse.json({ error: "Forbidden - user not in your scope" }, { status: 403 });
        }

        await prisma.user.delete({
            where: { UserID: parseInt(id) },
        });

        await logAudit({
            tableName: "User",
            recordId: id,
            action: AuditAction.DELETE,
            oldData: existing
        });

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "User",
            action: AuditAction.CRASH,
            details: `Delete User Error: ${error.message}`
        });
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
