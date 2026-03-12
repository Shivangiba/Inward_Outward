import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email") || session.username;

        // Users can only fetch their own profile (by email) unless admin fetching a team member
        if (email !== session.username) {
            const roleName = session.role.toLowerCase().replace(/\s+/g, '');
            if (roleName !== 'superadmin' && roleName !== 'admin') {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            if (roleName === 'admin') {
                const targetUser = await prisma.user.findUnique({ where: { Email: email }, select: { TeamID: true } });
                if (!targetUser || targetUser.TeamID !== session.teamId) {
                    return NextResponse.json({ error: "Forbidden - user not in your team" }, { status: 403 });
                }
            }
        }

        const user = await prisma.user.findUnique({
            where: { Email: email },
            include: { role: true, team: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        await logAudit({
            tableName: "User",
            action: AuditAction.CRASH,
            details: `Fetch Profile Error: ${error.message}`
        });
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const body = await request.json();
        const { Email, Name, Password, currentEmail, ProfilePath, JoinedAt } = body;

        if (Password && Password.length > 0 && Password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
        }

        if (!currentEmail) {
            return NextResponse.json({ error: "Current email is required" }, { status: 400 });
        }

        if (currentEmail !== session.username) {
            return NextResponse.json({ error: "You can only update your own profile" }, { status: 403 });
        }

        if (Email && Email !== currentEmail) {
            const existingUser = await prisma.user.findUnique({
                where: { Email }
            });
            if (existingUser) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (Email) updateData.Email = Email;
        if (Name !== undefined) updateData.Name = Name;
        if (Password) updateData.Password = Password;
        if (ProfilePath !== undefined) updateData.ProfilePath = ProfilePath;
        if (JoinedAt !== undefined) updateData.JoinedAt = JoinedAt ? new Date(JoinedAt) : null;

        try {
            const updatedUser = await prisma.user.update({
                where: { Email: currentEmail },
                data: updateData
            });

            await logAudit({
                tableName: "User",
                recordId: updatedUser.UserID,
                action: AuditAction.UPDATE,
                details: `Profile updated by user: ${currentEmail}`,
                newData: updatedUser
            });

            return NextResponse.json(updatedUser);
        } catch (prismaError: any) {
            if (prismaError.code === 'P2025') {
                return NextResponse.json({
                    error: "User account not found in database",
                    details: `The user '${currentEmail}' does not exist in the database. Please try logging in again.`
                }, { status: 404 });
            }
            throw prismaError;
        }
    } catch (error: any) {
        await logAudit({
            tableName: "User",
            action: AuditAction.CRASH,
            details: `Profile Update Error: ${error.message}`
        });
        console.error("Profile update error details:", error);
        // ... rest of the catch block
        let friendlyMessage = "We couldn't update your profile right now.";

        if (error.code === 'P2002') {
            friendlyMessage = "This email is already being used by another account.";
        } else if (error.code === 'P1001') {
            friendlyMessage = "We're having trouble reaching our database. Please try again in a moment.";
        }

        return NextResponse.json({
            error: friendlyMessage
        }, { status: 500 });
    }
}
