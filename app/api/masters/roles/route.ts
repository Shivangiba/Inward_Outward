import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit, AuditAction } from "@/lib/audit";

export async function GET() {
    try {
        const roles = await prisma.role.findMany({
            orderBy: { RoleName: "asc" },
        });
        return NextResponse.json(roles);
    } catch (error: any) {
        await logAudit({
            tableName: "Role",
            action: AuditAction.CRASH,
            details: `Fetch Roles Error: ${error.message}`
        });
        console.error("Error fetching roles:", error);
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
}
