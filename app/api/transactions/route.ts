import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, getTeamFilter } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const teamFilter = await getTeamFilter();
        const [inwardLogs, outwardLogs] = await Promise.all([
            prisma.inward.findMany({
                where: teamFilter,
                orderBy: { InwardDate: 'desc' },
                take: 100 // Limit for performance, can be expanded with pagination later
            }),
            prisma.outward.findMany({
                where: teamFilter,
                orderBy: { OutwardDate: 'desc' },
                take: 100
            })
        ]);

        const mergedTransactions = [
            ...inwardLogs.map((item: any) => ({
                id: `in-${item.InwardID}`,
                type: "Inward",
                subject: item.Subject || item.InwardNo,
                date: item.InwardDate,
                senderReceiver: item.LetterFromName || "N/A",
                status: "Received",
                no: item.InwardNo
            })),
            ...outwardLogs.map((item: any) => ({
                id: `out-${item.OutwardID}`,
                type: "Outward",
                subject: item.Subject || item.OutwardNo,
                date: item.OutwardDate,
                senderReceiver: item.LetterForwardedToName || "N/A",
                status: "Dispatched",
                no: item.OutwardNo
            }))
        ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(mergedTransactions);
    } catch (error: any) {
        await logAudit({
            tableName: "Transactions",
            action: AuditAction.CRASH,
            details: `Fetch All Transactions Error: ${error.message}`
        });
        console.error("Error fetching all transactions:", error);
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}
