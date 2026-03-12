import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, normalizeRole, ROLES } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const action = searchParams.get("action");
        const tableName = searchParams.get("tableName");

        const where: any = {};

        // Data Isolation: Admins only see their team's logs
        if (role !== ROLES.SUPER_ADMIN) {
            where.TeamID = session.teamId;
        }

        if (action) where.Action = action;
        if (tableName) where.TableName = tableName;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            Name: true,
                            Email: true
                        }
                    },
                    team: {
                        select: {
                            TeamName: true
                        }
                    }
                },
                orderBy: { Created: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where })
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error: any) {
        await logAudit({
            tableName: "AuditLog",
            action: AuditAction.CRASH,
            details: `Audit Log API Error: ${error.message}`
        });
        console.error("Audit Log API Error:", error);
        return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }
}
