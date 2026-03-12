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
        const couriers = await prisma.courierCompany.findMany({
            where: filter as any,
            orderBy: { Created: "desc" },
        });
        return NextResponse.json(couriers, { headers: CACHE_HEADERS });
    } catch (error: any) {
        await logAudit({
            tableName: "CourierCompany",
            action: AuditAction.CRASH,
            details: `Fetch Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to fetch couriers", details: error?.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden: Clerks cannot create couriers" }, { status: 403 });
        }

        const body = await request.json();
        if (body.PhoneNo && !/^[0-9]{10}$/.test(body.PhoneNo)) {
            return NextResponse.json({ error: "Phone number must be exactly 10 digits" }, { status: 400 });
        }

        const courier = await prisma.courierCompany.create({
            data: {
                CourierCompanyName: body.CourierCompanyName,
                ContactPersonName: body.ContactPersonName,
                DefaultRate: body.DefaultRate ? parseFloat(body.DefaultRate) : null,
                PhoneNo: body.PhoneNo,
                Email: body.Email,
                Address: body.Address,
                UserID: session.userId,
                TeamID: session.teamId,
            },
        });

        await logAudit({
            tableName: "CourierCompany",
            recordId: courier.CourierCompanyID,
            action: AuditAction.CREATE,
            newData: courier
        });

        return NextResponse.json(courier);
    } catch (error: any) {
        await logAudit({
            tableName: "CourierCompany",
            action: AuditAction.CRASH,
            details: `Create Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to create courier", details: error?.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden: Clerks cannot update couriers" }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...data } = body;
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const filter = await getMasterFilter();

        const oldData = await prisma.courierCompany.findFirst({
            where: { CourierCompanyID: parseInt(id), ...filter }
        });

        const courier = await prisma.courierCompany.update({
            where: {
                CourierCompanyID: parseInt(id),
                ...filter
            },
            data: {
                CourierCompanyName: data.CourierCompanyName,
                ContactPersonName: data.ContactPersonName,
                DefaultRate: data.DefaultRate ? parseFloat(data.DefaultRate) : null,
                PhoneNo: data.PhoneNo,
                Email: data.Email,
                Address: data.Address,
            },
        });

        await logAudit({
            tableName: "CourierCompany",
            recordId: id,
            action: AuditAction.UPDATE,
            oldData,
            newData: courier
        });

        return NextResponse.json(courier);
    } catch (error: any) {
        await logAudit({
            tableName: "CourierCompany",
            action: AuditAction.CRASH,
            details: `Update Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to update courier", details: error?.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = normalizeRole(session.role);
        if (role === ROLES.CLERK) {
            return NextResponse.json({ error: "Forbidden: Clerks cannot delete couriers" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const idsString = searchParams.get("ids");
        const filter = await getMasterFilter();

        if (idsString) {
            const ids = idsString.split(",").map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));

            const oldData = await prisma.courierCompany.findMany({
                where: { CourierCompanyID: { in: ids }, ...filter }
            });

            const result = await prisma.courierCompany.deleteMany({
                where: {
                    CourierCompanyID: { in: ids },
                    ...filter
                },
            });

            await logAudit({
                tableName: "CourierCompany",
                action: AuditAction.DELETE,
                oldData,
                details: `Bulk deleted ${result.count} couriers`
            });

            return NextResponse.json({ message: `${result.count} couriers deleted successfully` });
        }

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const oldRecord = await prisma.courierCompany.findFirst({
            where: { CourierCompanyID: parseInt(id), ...filter }
        });

        await prisma.courierCompany.delete({
            where: {
                CourierCompanyID: parseInt(id),
                ...filter
            },
        });

        await logAudit({
            tableName: "CourierCompany",
            recordId: id,
            action: AuditAction.DELETE,
            oldData: oldRecord
        });

        return NextResponse.json({ message: "Courier deleted successfully" });
    } catch (error: any) {
        await logAudit({
            tableName: "CourierCompany",
            action: AuditAction.CRASH,
            details: `Delete Error: ${error.message}`
        });
        return NextResponse.json({ error: "Failed to delete courier", details: error?.message }, { status: 500 });
    }
}
