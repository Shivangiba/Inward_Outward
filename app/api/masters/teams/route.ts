import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = session.role.toLowerCase().replace(/\s+/g, '');

        let teams;
        if (role === 'superadmin') {
            // Super Admin sees all teams
            teams = await prisma.team.findMany({
                where: { IsActive: true },
                orderBy: { TeamName: "asc" },
            });
        } else if (role === 'admin') {
            // Admin only sees their own team
            if (!session.teamId) {
                return NextResponse.json([]);
            }
            teams = await prisma.team.findMany({
                where: {
                    TeamID: session.teamId,
                    IsActive: true
                },
            });
        } else {
            // Clerks don't need this typically, but return empty or own team
            return NextResponse.json([]);
        }

        return NextResponse.json(teams);
    } catch (error: any) {
        await logAudit({
            tableName: "Team",
            action: AuditAction.CRASH,
            details: `Fetch Teams Error: ${error.message}`
        });
        console.error("Error fetching teams:", error);
        return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = session.role.toLowerCase().replace(/\s+/g, '');
        if (role !== 'superadmin') {
            return NextResponse.json({ error: "Only Super Admins can create teams" }, { status: 403 });
        }

        const body = await request.json();
        const { TeamName } = body;

        if (!TeamName) {
            return NextResponse.json({ error: "Team name is required" }, { status: 400 });
        }

        const existingTeam = await prisma.team.findUnique({
            where: { TeamName }
        });

        if (existingTeam) {
            return NextResponse.json({ error: "Team with this name already exists" }, { status: 400 });
        }

        const team = await prisma.team.create({
            data: {
                TeamName,
                IsActive: true
            }
        });

        await logAudit({
            tableName: "Team",
            recordId: team.TeamID,
            action: AuditAction.CREATE,
            newData: team
        });

        return NextResponse.json(team);
    } catch (error: any) {
        await logAudit({
            tableName: "Team",
            action: AuditAction.CRASH,
            details: `Create Team Error: ${error.message}`
        });
        console.error("Error creating team:", error);
        return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }
}
