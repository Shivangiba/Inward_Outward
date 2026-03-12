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
        const offices = await prisma.inwardOutwardOffice.findMany({
            where: filter as any,
            orderBy: { Created: "desc" },
        });

        return NextResponse.json(offices, { headers: CACHE_HEADERS });
    } catch (error: any) {
        await logAudit({
            tableName: "InwardOutwardOffice",
            action: AuditAction.CRASH,
            details: `Fetch Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to fetch offices", details: error?.message }, { status: 500 });
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
        const office = await prisma.inwardOutwardOffice.create({
            data: {
                OfficeName: body.OfficeName,
                InstituteID: Number(body.InstituteID) || 1,
                DepartmentID: body.DepartmentID ? Number(body.DepartmentID) : null,
                OpeningDate: new Date(body.OpeningDate),
                OpeningInwardNo: Number(body.OpeningInwardNo) || 1,
                OpeningOutwardNo: Number(body.OpeningOutwardNo) || 1,
                UserID: session.userId,
                TeamID: session.teamId,
            },
        });

        await logAudit({
            tableName: "InwardOutwardOffice",
            recordId: office.InwardOutwardOfficeID,
            action: AuditAction.CREATE,
            newData: office
        });

        return NextResponse.json(office);
    } catch (error: any) {
        await logAudit({
            tableName: "InwardOutwardOffice",
            action: AuditAction.CRASH,
            details: `Create Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to create office", details: error?.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden: Clerks cannot modify master records" }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...data } = body;
        const filter = await getMasterFilter();

        const oldData = await prisma.inwardOutwardOffice.findFirst({
            where: { InwardOutwardOfficeID: Number(id), ...filter }
        });

        const office = await prisma.inwardOutwardOffice.update({
            where: {
                InwardOutwardOfficeID: Number(id),
                ...filter
            },
            data: {
                OfficeName: data.OfficeName,
                InstituteID: Number(data.InstituteID) || 1,
                DepartmentID: data.DepartmentID ? Number(data.DepartmentID) : null,
                OpeningDate: new Date(data.OpeningDate),
                OpeningInwardNo: Number(data.OpeningInwardNo) || 1,
                OpeningOutwardNo: Number(data.OpeningOutwardNo) || 1,
            },
        });

        await logAudit({
            tableName: "InwardOutwardOffice",
            recordId: id,
            action: AuditAction.UPDATE,
            oldData,
            newData: office
        });

        return NextResponse.json(office);
    } catch (error: any) {
        await logAudit({
            tableName: "InwardOutwardOffice",
            action: AuditAction.CRASH,
            details: `Update Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to update office", details: error?.message }, { status: 500 });
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

            const oldData = await prisma.inwardOutwardOffice.findMany({
                where: { InwardOutwardOfficeID: { in: ids }, ...filter }
            });

            const result = await prisma.inwardOutwardOffice.deleteMany({
                where: {
                    InwardOutwardOfficeID: { in: ids },
                    ...filter
                },
            });

            await logAudit({
                tableName: "InwardOutwardOffice",
                action: AuditAction.DELETE,
                oldData,
                details: `Bulk deleted ${result.count} offices`
            });

            return NextResponse.json({ message: `${result.count} offices deleted successfully` });
        }

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const oldRecord = await prisma.inwardOutwardOffice.findFirst({
            where: { InwardOutwardOfficeID: parseInt(id), ...filter }
        });

        await prisma.inwardOutwardOffice.delete({
            where: {
                InwardOutwardOfficeID: parseInt(id),
                ...filter
            },
        });

        await logAudit({
            tableName: "InwardOutwardOffice",
            recordId: id,
            action: AuditAction.DELETE,
            oldData: oldRecord
        });

        return NextResponse.json({ message: "Office deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "InwardOutwardOffice",
            action: AuditAction.CRASH,
            details: `Delete Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to delete office", details: error?.message }, { status: 500 });
    }
}
