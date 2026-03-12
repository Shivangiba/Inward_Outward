import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Paths to protect
    const protectedPaths = ['/dashboard', '/masters', '/transactions', '/profile'];
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    // Public paths (login, api/auth should be public)
    const isPublic = pathname === '/login' || pathname.startsWith('/api/auth');

    // Logic: 
    // 1. If trying to access protected route, check for token.
    // 2. If token valid, allow.
    // 3. If token invalid/missing, redirect to login.
    // 4. If on login page and token valid, redirect to dashboard (optional).

    const token = request.cookies.get('token')?.value;

    // Handle root path redirect
    if (pathname === '/') {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (err) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Protect routes
    if (isProtected) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            // Verify token
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);
            // Valid token
            return NextResponse.next();
        } catch (err) {
            // Invalid token
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect if already logged in (Optional, user asked for redirection on login page load?)
    // The login page itself handles redirection if user is already logged in? 
    // Maybe better to handle it here too for better UX.
    if (pathname === '/login' && token) {
        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (err) {
            // Token invalid, let them stay on login
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (except api/masters, api/transactions, api/profile if we want, but usually middleware protects pages)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
