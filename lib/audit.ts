import { prisma } from "./prisma";
import { getServerSession } from "./auth-server";
import { headers } from "next/headers";

export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    CRASH = "CRASH",
    ACCESS = "ACCESS"
}

interface AuditConfig {
    tableName: string;
    recordId?: string | number;
    action: AuditAction;
    oldData?: any;
    newData?: any;
    details?: string;
    userId?: number; // Optional override
    teamId?: number; // Optional override
}

export async function logAudit(config: AuditConfig) {
    try {
        const session = await getServerSession();
        const headerList = await headers();

        const ip = headerList.get("x-forwarded-for") || "unknown";
        const userAgent = headerList.get("user-agent") || "unknown";

        return await prisma.auditLog.create({
            data: {
                TableName: config.tableName,
                RecordID: config.recordId?.toString(),
                Action: config.action,
                OldData: config.oldData || null,
                NewData: config.newData || null,
                UserID: config.userId || session?.userId || null,
                TeamID: config.teamId || session?.teamId || null,
                IPAddress: ip,
                UserAgent: userAgent,
                Details: config.details || null,
            },
        });
    } catch (error) {
        // Fallback logging if database audit fails
        console.error("[AUDIT LOG ERROR]:", error);
        // We don't want audit logging failure to crash the main application logic
        return null;
    }
}

/**
 * Higher-order function to wrap any async operation with error auditing
 */
export async function withAudit<T>(
    tableName: string,
    action: AuditAction,
    operation: () => Promise<T>,
    recordId?: string | number
): Promise<T> {
    try {
        const result = await operation();

        // If it's a create/update/delete, we might want to log it
        // However, usually we log success explicitly where we have access to old/new data
        return result;
    } catch (error: any) {
        // Automatically log crashes/errors
        await logAudit({
            tableName,
            recordId: recordId?.toString(),
            action: AuditAction.CRASH,
            details: `Error: ${error.message}\nStack: ${error.stack}`,
        });
        throw error;
    }
}
