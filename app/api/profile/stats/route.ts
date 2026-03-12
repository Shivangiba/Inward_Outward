import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, getTeamFilter, getMasterFilter } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamFilter = await getTeamFilter() as any;
        const masterFilter = await getMasterFilter() as any;

        // Clerk / own scope: counts for current user only. Admin/Super Admin: counts for their scope (team or all).
        const [totalInward, totalOutward, fromToCount, officeCount, courierCount, modeCount] = await Promise.all([
            prisma.inward.count({ where: teamFilter }),
            prisma.outward.count({ where: teamFilter }),
            prisma.inOutwardFromTo.count({ where: masterFilter }),
            prisma.inwardOutwardOffice.count({ where: masterFilter }),
            prisma.courierCompany.count({ where: masterFilter }),
            prisma.inOutwardMode.count({ where: masterFilter })
        ]);

        const totalMasters = fromToCount + officeCount + courierCount + modeCount;

        return NextResponse.json({
            stats: {
                totalInward,
                totalOutward,
                totalMasters,
                pendingTasks: 0
            }
        });
    } catch (error) {
        console.error("Error fetching profile stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}

