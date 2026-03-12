import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const results: any = {};

        const tables = [
            { name: 'inOutwardMode', idField: 'InOutwardModeID' },
            { name: 'inwardOutwardOffice', idField: 'InwardOutwardOfficeID' },
            { name: 'inOutwardFromTo', idField: 'InOutwardFromToID' },
            { name: 'courierCompany', idField: 'CourierCompanyID' }
        ];

        for (const table of tables) {
            const records = await (prisma as any)[table.name].findMany({
                where: { TeamID: null },
                include: { user: true }
            });

            results[table.name] = { found: records.length, fixed: 0, errors: 0 };

            for (const record of records) {
                if (record.user && record.user.TeamID) {
                    await (prisma as any)[table.name].update({
                        where: { [table.idField]: record[table.idField] },
                        data: { TeamID: record.user.TeamID }
                    });
                    results[table.name].fixed++;
                } else {
                    results[table.name].errors++;
                }
            }
        }

        return NextResponse.json({ message: "Fix completed", results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
