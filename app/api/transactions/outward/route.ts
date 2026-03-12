import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, getTeamFilter } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const requestedTeamId = searchParams.get("teamId") ? parseInt(searchParams.get("teamId")!) : undefined;

        const teamFilter = await getTeamFilter(requestedTeamId);
        const outwards = await prisma.outward.findMany({
            where: teamFilter as any,
            orderBy: { OutwardDate: "desc" },
            take: 100,
        });

        return NextResponse.json(outwards, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
        });
    } catch (error: any) {
        await logAudit({
            tableName: "Outward",
            action: AuditAction.CRASH,
            details: `Fetch Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to fetch outward entries", details: error?.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const outward = await prisma.outward.create({
            data: {
                OutwardNo: body.OutwardNo,
                OutwardDate: new Date(body.OutwardDate),
                Subject: body.Subject,
                Remarks: body.Remarks || body.Description,
                LetterNo: body.OutwardLetterNo,
                LetterDate: body.OutwardLetterDate ? new Date(body.OutwardLetterDate) : null,
                FromInwardOutwardOfficeID: parseInt(body.FromInwardOutwardOfficeID) || 1,
                InOutwardModeID: body.InOutwardModeID ? parseInt(body.InOutwardModeID) : null,
                InOutwardFromToID: body.InOutwardFromToID ? parseInt(body.InOutwardFromToID) : null,
                FinYearID: 1,
                UserID: session.userId,
                TeamID: session.teamId || null,
            },
        });

        await logAudit({
            tableName: "Outward",
            recordId: outward.OutwardID,
            action: AuditAction.CREATE,
            newData: outward
        });

        return NextResponse.json(outward);
    } catch (error: any) {
        await logAudit({
            tableName: "Outward",
            action: AuditAction.CRASH,
            details: `Create Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to create outward entry", details: error?.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teamFilter = await getTeamFilter() as any;
        const body = await request.json();
        const { OutwardID, ...updateData } = body;
        const id = parseInt(OutwardID);

        const oldData = await prisma.outward.findFirst({
            where: { OutwardID: id, ...teamFilter }
        });

        const outward = await prisma.outward.update({
            where: {
                OutwardID: id,
                ...teamFilter
            },
            data: {
                OutwardNo: updateData.OutwardNo,
                OutwardDate: new Date(updateData.OutwardDate),
                Subject: updateData.Subject,
                Remarks: updateData.Remarks || updateData.Description,
                LetterNo: updateData.OutwardLetterNo,
                LetterDate: updateData.OutwardLetterDate ? new Date(updateData.OutwardLetterDate) : null,
                FromInwardOutwardOfficeID: parseInt(updateData.FromInwardOutwardOfficeID),
                InOutwardModeID: updateData.InOutwardModeID ? parseInt(updateData.InOutwardModeID) : null,
                InOutwardFromToID: updateData.InOutwardFromToID ? parseInt(updateData.InOutwardFromToID) : null,
            },
        });

        await logAudit({
            tableName: "Outward",
            recordId: id,
            action: AuditAction.UPDATE,
            oldData,
            newData: outward
        });

        return NextResponse.json(outward);
    } catch (error: any) {
        await logAudit({
            tableName: "Outward",
            action: AuditAction.CRASH,
            details: `Update Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to update outward entry", details: error?.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teamFilter = await getTeamFilter() as any;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const idsString = searchParams.get("ids");

        if (idsString) {
            const ids = idsString.split(",").map((i: string) => parseInt(i)).filter((i: number) => !isNaN(i));

            const oldData = await prisma.outward.findMany({
                where: { OutwardID: { in: ids }, ...teamFilter }
            });

            const result = await prisma.outward.deleteMany({
                where: { OutwardID: { in: ids }, ...teamFilter },
            });

            await logAudit({
                tableName: "Outward",
                action: AuditAction.DELETE,
                oldData,
                details: `Bulk deleted ${result.count} outward entries`
            });

            return NextResponse.json({ message: `${result.count} outward entries deleted successfully` });
        }

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const oldRecord = await prisma.outward.findFirst({
            where: { OutwardID: parseInt(id), ...teamFilter }
        });

        await prisma.outward.delete({
            where: {
                OutwardID: parseInt(id),
                ...teamFilter
            },
        });

        await logAudit({
            tableName: "Outward",
            recordId: id,
            action: AuditAction.DELETE,
            oldData: oldRecord
        });

        return NextResponse.json({ message: "Outward entry deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "Outward",
            action: AuditAction.CRASH,
            details: `Delete Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to delete outward entry", details: error?.message }, { status: 500 });
    }
}
