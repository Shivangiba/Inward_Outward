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

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const filter = await getMasterFilter();

        const where: any = {
            AND: [
                filter,
                { IsActive: true }
            ]
        };
        if (query) {
            where.AND.push({
                OR: [
                    { InOutwardFromToName: { contains: query, mode: 'insensitive' } },
                    { PersonName: { contains: query, mode: 'insensitive' } },
                    { Place: { contains: query, mode: 'insensitive' } },
                    { Address: { contains: query, mode: 'insensitive' } },
                ]
            });
        }

        const data = await prisma.inOutwardFromTo.findMany({
            where,
            orderBy: { Sequence: "asc" },
        });

        return NextResponse.json(data, { headers: CACHE_HEADERS });
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardFromTo",
            action: AuditAction.CRASH,
            details: `Fetch Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to fetch From/To entries", details: error?.message }, { status: 500 });
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
        const entry = await prisma.inOutwardFromTo.create({
            data: {
                InOutwardFromToName: body.InOutwardFromToName,
                PersonName: body.PersonName,
                Address: body.Address,
                Place: body.Place,
                IsActive: body.IsActive ?? true,
                Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
                Remarks: body.Remarks,
                UserID: session.userId,
                TeamID: session.teamId,
            },
        });

        await logAudit({
            tableName: "InOutwardFromTo",
            recordId: entry.InOutwardFromToID,
            action: AuditAction.CREATE,
            newData: entry
        });

        return NextResponse.json(entry);
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardFromTo",
            action: AuditAction.CRASH,
            details: `Create Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to create entry", details: error?.message }, { status: 500 });
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

            const oldData = await prisma.inOutwardFromTo.findMany({
                where: { InOutwardFromToID: { in: ids }, ...filter }
            });

            const result = await prisma.inOutwardFromTo.deleteMany({
                where: {
                    InOutwardFromToID: { in: ids },
                    ...filter
                },
            });

            await logAudit({
                tableName: "InOutwardFromTo",
                action: AuditAction.DELETE,
                oldData,
                details: `Bulk deleted ${result.count} entries`
            });

            return NextResponse.json({ message: `${result.count} entries deleted successfully` });
        }

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const oldRecord = await prisma.inOutwardFromTo.findFirst({
            where: { InOutwardFromToID: parseInt(id), ...filter }
        });

        await prisma.inOutwardFromTo.delete({
            where: {
                InOutwardFromToID: parseInt(id),
                ...filter
            },
        });

        await logAudit({
            tableName: "InOutwardFromTo",
            recordId: id,
            action: AuditAction.DELETE,
            oldData: oldRecord
        });

        return NextResponse.json({ message: "Entry deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardFromTo",
            action: AuditAction.CRASH,
            details: `Delete Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to delete entries", details: error?.message }, { status: 500 });
    }
}
