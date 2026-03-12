import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, getTeamFilter } from "@/lib/auth-server";
import { logAudit, AuditAction } from "@/lib/audit";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized - Please login again" },
                {
                    status: 401,
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    }
                }
            );
        }

        const { searchParams } = new URL(request.url);
        const requestedTeamId = searchParams.get("teamId") ? parseInt(searchParams.get("teamId")!) : undefined;

        let teamFilter = await getTeamFilter(requestedTeamId) as any;

        // Calculate date ranges for charts
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // groupBy does not support relation filters (like { user: { TeamID: ... } })
        // If we have a relation filter, we need to convert it to a list of User IDs
        let groupByFilter = { ...teamFilter } as any;
        if (teamFilter.user && teamFilter.user.TeamID) {
            const teamUsers = await prisma.user.findMany({
                where: { TeamID: teamFilter.user.TeamID },
                select: { UserID: true }
            });
            const userIds = teamUsers.map((u: { UserID: number }) => u.UserID);
            groupByFilter = { UserID: { in: userIds } };
        }

        const [
            totalInward,
            totalOutward,
            recentInwards,
            recentOutwards,
            activeOffices,
            inwardVolume,
            outwardVolume,
            modeStats
        ] = await Promise.all([
            prisma.inward.count({ where: teamFilter }),
            prisma.outward.count({ where: teamFilter }),
            prisma.inward.findMany({
                where: teamFilter,
                orderBy: { InwardDate: "desc" },
                take: 5,
            }),
            prisma.outward.findMany({
                where: teamFilter,
                orderBy: { OutwardDate: "desc" },
                take: 5,
            }),
            prisma.inwardOutwardOffice.count(), // Offices are always global count

            // Chart Data: Volume last 7 days
            prisma.inward.groupBy({
                by: ['InwardDate'],
                where: {
                    ...groupByFilter,
                    InwardDate: { gte: sevenDaysAgo }
                },
                _count: { InwardID: true },
            }),
            prisma.outward.groupBy({
                by: ['OutwardDate'],
                where: {
                    ...groupByFilter,
                    OutwardDate: { gte: sevenDaysAgo }
                },
                _count: { OutwardID: true },
            }),

            // Chart Data: Mode Distribution
            prisma.inward.groupBy({
                by: ['InOutwardModeID'],
                where: groupByFilter,
                _count: { InwardID: true },
            })
        ]);

        // Process Volume Data for Recharts
        // Create map of last 7 days
        const volumeMap = new Map<string, { date: string, inward: number, outward: number }>();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            volumeMap.set(dateStr, { date: d.toLocaleDateString('en-US', { weekday: 'short' }), inward: 0, outward: 0 });
        }

        inwardVolume.forEach((item: any) => {
            const dateStr = new Date(item.InwardDate).toISOString().split('T')[0];
            if (volumeMap.has(dateStr)) {
                volumeMap.get(dateStr)!.inward = item._count.InwardID;
            }
        });

        outwardVolume.forEach((item: any) => {
            const dateStr = new Date(item.OutwardDate).toISOString().split('T')[0];
            if (volumeMap.has(dateStr)) {
                volumeMap.get(dateStr)!.outward = item._count.OutwardID;
            }
        });

        const volumeChartData = Array.from(volumeMap.values()).reverse();

        // Process Mode Data
        // Needs mode names, so we fetch them first
        const modes = await prisma.inOutwardMode.findMany();
        const modeChartData = modeStats.map((stat: any) => {
            const modeName = modes.find((m: any) => m.InOutwardModeID === stat.InOutwardModeID)?.InOutwardModeName || "Unknown";
            return { name: modeName, value: stat._count.InwardID };
        });

        // Format recent traffic
        const recentTraffic = [
            ...recentInwards.map((i: any) => ({
                id: `in-${i.InwardID}`,
                type: "Inward",
                subject: i.Subject,
                time: new Date(i.Created).toLocaleTimeString(),
                status: "Completed",
            })),
            ...recentOutwards.map((o: any) => ({
                id: `out-${o.OutwardID}`,
                type: "Outward",
                subject: o.Subject,
                time: new Date(o.Created).toLocaleTimeString(),
                status: "Sent",
            })),
        ].sort((a: any, b: any) => b.id.localeCompare(a.id)).slice(0, 10);

        return NextResponse.json({
            stats: {
                totalInward,
                totalOutward,
                pendingItems: 0,
                activeOffices,
            },
            recentTraffic,
            charts: {
                volume: volumeChartData,
                distribution: modeChartData
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error: any) {
        await logAudit({
            tableName: "Dashboard",
            action: AuditAction.CRASH,
            details: `Dashboard API Error: ${error.message}\nStack: ${error.stack}`
        });
        console.error("Dashboard API Error:", error);
        console.error("Error details:", error?.message, error?.stack);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data", details: error?.message },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                }
            }
        );
    }
}
