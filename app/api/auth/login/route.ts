import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { logAudit, AuditAction } from '@/lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { Name, Password } = body;

        if (!Name || !Password) {
            return NextResponse.json(
                { error: 'Name and Password are required' },
                { status: 400 }
            );
        }

        // Find user by Name OR Email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { Name: Name },
                    { Email: Name }
                ]
            },
            include: { role: true },
        });

        if (!user || user.Password !== Password) {
            await logAudit({
                tableName: 'User',
                action: AuditAction.LOGIN,
                details: `Failed login attempt for name: ${Name}`,
            });
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        if (!user.IsActive) {
            await logAudit({
                tableName: 'User',
                userId: user.UserID,
                teamId: user.TeamID || undefined,
                action: AuditAction.LOGIN,
                details: `Inactive account login attempt: ${user.Email}`,
            });
            return NextResponse.json(
                { error: 'Account is inactive. Please contact administrator.' },
                { status: 403 }
            );
        }

        // Create Token
        const token = jwt.sign(
            {
                userId: user.UserID,
                username: user.Email,
                role: user.role.RoleName,
                teamId: user.TeamID,
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        await logAudit({
            tableName: 'User',
            userId: user.UserID,
            teamId: user.TeamID || undefined,
            action: AuditAction.LOGIN,
            details: `Successful login: ${user.Email}`,
        });

        // Determine redirect URL
        let redirectUrl = '/dashboard';
        const roleName = user.role.RoleName.toLowerCase().replace(/\s+/g, '');
        if (roleName === 'superadmin' || roleName === 'admin') {
            redirectUrl = '/masters/admins';
        } else {
            redirectUrl = '/dashboard';
        }

        // Return success with token and user info
        const response = NextResponse.json({
            message: 'Login successful',
            token,
            user: {
                id: user.UserID,
                name: user.Name,
                username: user.Email,
                role: user.role.RoleName,
                teamId: user.TeamID,
            },
            redirectUrl,
        });

        // Set cookie
        response.cookies.set('token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 8
        });

        return response;

    } catch (error: any) {
        await logAudit({
            tableName: 'User',
            action: AuditAction.CRASH,
            details: `Login System Error: ${error.message}`,
        });
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
