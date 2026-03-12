import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, getMasterFilter, normalizeRole, ROLES } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
};

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const filter = await getMasterFilter();
        const modes = await prisma.inOutwardMode.findMany({
            where: filter as any,
            orderBy: { Sequence: "asc" },
        });

        return NextResponse.json(modes, { headers: CACHE_HEADERS });
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardMode",
            action: AuditAction.CRASH,
            details: `Fetch Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to fetch modes", details: error?.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden: Clerks cannot create master records" }, { status: 403 });
        }

        const body = await request.json();
        const mode = await prisma.inOutwardMode.create({
            data: {
                InOutwardModeName: body.InOutwardModeName,
                IsActive: body.IsActive ?? true,
                Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
                Remarks: body.Remarks,
                UserID: session.userId,
                TeamID: session.teamId,
            },
        });

        await logAudit({
            tableName: "InOutwardMode",
            recordId: mode.InOutwardModeID,
            action: AuditAction.CREATE,
            newData: mode
        });

        return NextResponse.json(mode);
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardMode",
            action: AuditAction.CRASH,
            details: `Create Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to create mode", details: error?.message }, { status: 500 });
    }
}


export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden: Clerks cannot update master records" }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...data } = body;
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const filter = await getMasterFilter();

        const oldMode = await prisma.inOutwardMode.findFirst({
            where: { InOutwardModeID: parseInt(id), ...filter }
        });

        const mode = await prisma.inOutwardMode.update({
            where: {
                InOutwardModeID: parseInt(id),
                ...filter
            },
            data: {
                InOutwardModeName: data.InOutwardModeName,
                IsActive: data.IsActive,
                Sequence: data.Sequence ? parseFloat(data.Sequence) : null,
                Remarks: data.Remarks,
            },
        });

        await logAudit({
            tableName: "InOutwardMode",
            recordId: id,
            action: AuditAction.UPDATE,
            oldData: oldMode,
            newData: mode
        });

        return NextResponse.json(mode);
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardMode",
            action: AuditAction.CRASH,
            details: `Update Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to update mode", details: error?.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden: Clerks cannot delete master records" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const idsString = searchParams.get("ids");
        const filter = await getMasterFilter();

        if (idsString) {
            const ids = idsString.split(",").map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));

            const oldModes = await prisma.inOutwardMode.findMany({
                where: { InOutwardModeID: { in: ids }, ...filter }
            });

            const result = await prisma.inOutwardMode.deleteMany({
                where: {
                    InOutwardModeID: { in: ids },
                    ...filter
                },
            });

            await logAudit({
                tableName: "InOutwardMode",
                action: AuditAction.DELETE,
                oldData: oldModes,
                details: `Bulk deleted ${result.count} modes`
            });

            return NextResponse.json({ message: `${result.count} modes deleted successfully` });
        }

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const oldMode = await prisma.inOutwardMode.findFirst({
            where: { InOutwardModeID: parseInt(id), ...filter }
        });

        await prisma.inOutwardMode.delete({
            where: {
                InOutwardModeID: parseInt(id),
                ...filter
            },
        });

        await logAudit({
            tableName: "InOutwardMode",
            recordId: id,
            action: AuditAction.DELETE,
            oldData: oldMode
        });

        return NextResponse.json({ message: "Mode deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardMode",
            action: AuditAction.CRASH,
            details: `Delete Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to delete mode", details: error?.message }, { status: 500 });
    }
}

