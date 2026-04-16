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

        const targetIds = idsString 
            ? idsString.split(",").map(i => parseInt(i)).filter(i => !isNaN(i))
            : id ? [parseInt(id)] : [];

        if (targetIds.length === 0) {
            return NextResponse.json({ error: "Valid IDs are required" }, { status: 400 });
        }

        // Verify scope before starting deletion
        const existingUsers = await prisma.user.findMany({
            where: { UserID: { in: targetIds }, ...baseFilter }
        });

        if (existingUsers.length === 0) {
            return NextResponse.json({ error: "Forbidden - no valid users in your scope" }, { status: 403 });
        }

        const validIds = existingUsers.map(u => u.UserID);

        // Perform Deep Cleanup in a Transaction
        await prisma.$transaction([
            // 1. Delete transactions
            prisma.inward.deleteMany({ where: { UserID: { in: validIds } } }),
            prisma.outward.deleteMany({ where: { UserID: { in: validIds } } }),
            
            // 2. Delete masters created by these users
            prisma.inwardOutwardOffice.deleteMany({ where: { UserID: { in: validIds } } }),
            prisma.inOutwardFromTo.deleteMany({ where: { UserID: { in: validIds } } }),
            prisma.inOutwardMode.deleteMany({ where: { UserID: { in: validIds } } }),
            prisma.courierCompany.deleteMany({ where: { UserID: { in: validIds } } }),
            
            // 3. Clear audit logs
            prisma.auditLog.deleteMany({ where: { UserID: { in: validIds } } }),
            
            // 4. Finally delete the users
            prisma.user.deleteMany({ where: { UserID: { in: validIds } } })
        ]);

        await logAudit({
            tableName: "User",
            action: AuditAction.DELETE,
            oldData: existingUsers,
            details: `Successfully performed deep delete on ${validIds.length} users and all their associated records.`
        });

        return NextResponse.json({ message: `${validIds.length} users and all their associated records deleted successfully.` });

    } catch (error: any) {
        await logAudit({
            tableName: "User",
            action: AuditAction.CRASH,
            details: `Cascade Delete Error: ${error.message}`
        });
        console.error("Error during cascade delete:", error);
        return NextResponse.json({ error: "Failed to delete user and records", details: error.message }, { status: 500 });
    }
}
