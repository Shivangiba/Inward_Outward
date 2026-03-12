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
        const inwards = await prisma.inward.findMany({
            where: teamFilter as any,
            orderBy: { InwardDate: "desc" },
            take: 100,
        });

        return NextResponse.json(inwards, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
        });
    } catch (error: any) {
        await logAudit({
            tableName: "Inward",
            action: AuditAction.CRASH,
            details: `Fetch Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to fetch inward entries", details: error?.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const inward = await prisma.inward.create({
            data: {
                InwardNo: body.InwardNo,
                InwardDate: new Date(body.InwardDate),
                Subject: body.Subject,
                Description: body.Description || body.Remarks,
                CourierCompanyName: body.CourierCompanyName,
                InwardLetterNo: body.InwardLetterNo,
                InwardLetterDate: body.InwardLetterDate ? new Date(body.InwardLetterDate) : null,
                ToInwardOutwardOfficeID: parseInt(body.ToInwardOutwardOfficeID) || 1,
                InOutwardModeID: body.InOutwardModeID ? parseInt(body.InOutwardModeID) : null,
                InOutwardFromToID: body.InOutwardFromToID ? parseInt(body.InOutwardFromToID) : null,
                FinYearID: 1,
                UserID: session.userId,
                TeamID: session.teamId || null, // SuperAdmin can create global entries if teamId is null
            },
        });

        await logAudit({
            tableName: "Inward",
            recordId: inward.InwardID,
            action: AuditAction.CREATE,
            newData: inward
        });

        return NextResponse.json(inward);
    } catch (error: any) {
        await logAudit({
            tableName: "Inward",
            action: AuditAction.CRASH,
            details: `Create Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to create inward entry", details: error?.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teamFilter = await getTeamFilter() as any;
        const body = await request.json();
        const { InwardID, ...updateData } = body;
        const id = parseInt(InwardID);

        const oldData = await prisma.inward.findFirst({
            where: { InwardID: id, ...teamFilter }
        });

        const inward = await prisma.inward.update({
            where: {
                InwardID: id,
                ...teamFilter // Strict scope check
            },
            data: {
                InwardNo: updateData.InwardNo,
                InwardDate: new Date(updateData.InwardDate),
                Subject: updateData.Subject,
                Description: updateData.Description || updateData.Remarks,
                CourierCompanyName: updateData.CourierCompanyName,
                InwardLetterNo: updateData.InwardLetterNo,
                InwardLetterDate: updateData.InwardLetterDate ? new Date(updateData.InwardLetterDate) : null,
                ToInwardOutwardOfficeID: parseInt(updateData.ToInwardOutwardOfficeID),
                InOutwardModeID: updateData.InOutwardModeID ? parseInt(updateData.InOutwardModeID) : null,
                InOutwardFromToID: updateData.InOutwardFromToID ? parseInt(updateData.InOutwardFromToID) : null,
            },
        });

        await logAudit({
            tableName: "Inward",
            recordId: id,
            action: AuditAction.UPDATE,
            oldData,
            newData: inward
        });

        return NextResponse.json(inward);
    } catch (error: any) {
        await logAudit({
            tableName: "Inward",
            action: AuditAction.CRASH,
            details: `Update Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to update inward entry", details: error?.message }, { status: 500 });
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

            const oldData = await prisma.inward.findMany({
                where: { InwardID: { in: ids }, ...teamFilter }
            });

            const result = await prisma.inward.deleteMany({
                where: { InwardID: { in: ids }, ...teamFilter },
            });

            await logAudit({
                tableName: "Inward",
                action: AuditAction.DELETE,
                oldData,
                details: `Bulk deleted ${result.count} inward entries`
            });

            return NextResponse.json({ message: `${result.count} inward entries deleted successfully` });
        }

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const oldRecord = await prisma.inward.findFirst({
            where: { InwardID: parseInt(id), ...teamFilter }
        });

        await prisma.inward.delete({
            where: {
                InwardID: parseInt(id),
                ...teamFilter
            },
        });

        await logAudit({
            tableName: "Inward",
            recordId: id,
            action: AuditAction.DELETE,
            oldData: oldRecord
        });

        return NextResponse.json({ message: "Inward entry deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "Inward",
            action: AuditAction.CRASH,
            details: `Delete Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to delete inward entry", details: error?.message }, { status: 500 });
    }
}

