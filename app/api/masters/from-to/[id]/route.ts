import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit, AuditAction } from "@/lib/audit";
import { getMasterFilter } from "@/lib/auth-server";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const entryId = parseInt(id);
        const body = await request.json();
        const filter = await getMasterFilter();

        const oldData = await prisma.inOutwardFromTo.findFirst({
            where: { InOutwardFromToID: entryId, ...filter }
        });

        const updatedEntry = await prisma.inOutwardFromTo.update({
            where: { InOutwardFromToID: entryId, ...filter },
            data: {
                InOutwardFromToName: body.InOutwardFromToName,
                PersonName: body.PersonName,
                Address: body.Address,
                Place: body.Place,
                IsActive: body.IsActive,
                Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
                Remarks: body.Remarks,
            },
        });

        await logAudit({
            tableName: "InOutwardFromTo",
            recordId: entryId,
            action: AuditAction.UPDATE,
            oldData,
            newData: updatedEntry
        });

        return NextResponse.json(updatedEntry);
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardFromTo",
            action: AuditAction.CRASH,
            details: `Dynamic PUT Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const entryId = parseInt(id);
        const filter = await getMasterFilter();

        const oldData = await prisma.inOutwardFromTo.findFirst({
            where: { InOutwardFromToID: entryId, ...filter }
        });

        await prisma.inOutwardFromTo.delete({
            where: { InOutwardFromToID: entryId, ...filter },
        });

        await logAudit({
            tableName: "InOutwardFromTo",
            recordId: entryId,
            action: AuditAction.DELETE,
            oldData
        });

        return NextResponse.json({ message: "Entry deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "InOutwardFromTo",
            action: AuditAction.CRASH,
            details: `Dynamic DELETE Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}
