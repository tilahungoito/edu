import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    role: string;
    scopeType: string;
    scopeId: string | null;
    exp: number;
}

// Define route access permissions
// key = URL prefix, value = allowed roles
const routePermissions: Record<string, string[]> = {
    '/dashboard/admin': ['SYSTEM_ADMIN'],
    '/dashboard/region': ['SYSTEM_ADMIN', 'REGIONAL_ADMIN'],
    '/dashboard/zone': ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN'],
    '/dashboard/woreda': ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN'],
    '/dashboard/kebele': ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN'],
    '/dashboard/institution': ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN'],
    '/dashboard/registrar': ['SYSTEM_ADMIN', 'REGISTRAR'],
    '/dashboard/academic': ['SYSTEM_ADMIN', 'INSTRUCTOR', 'STUDENT'],
    '/dashboard/teacher': ['SYSTEM_ADMIN', 'INSTRUCTOR'],
    '/dashboard/student': ['SYSTEM_ADMIN', 'STUDENT'],
};

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Check if route is protected (starts with /dashboard)
    if (!pathname.startsWith('/dashboard')) {
        return NextResponse.next();
    }

    // 2. Get token from cookie
    const token = request.cookies.get('access_token')?.value;

    // 3. If no token, redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // 4. Decode and validate token
        const decoded = jwtDecode<DecodedToken>(token);

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            loginUrl.searchParams.set('expired', 'true');
            return NextResponse.redirect(loginUrl);
        }

        // 5. Check role-based route access
        const userRole = decoded.role;

        // SYSTEM_ADMIN has access to everything
        if (userRole === 'SYSTEM_ADMIN') {
            return NextResponse.next();
        }

        // Check specific route permissions
        for (const [route, allowedRoles] of Object.entries(routePermissions)) {
            if (pathname.startsWith(route)) {
                if (!allowedRoles.includes(userRole)) {
                    const unauthorizedUrl = new URL('/dashboard', request.url);
                    return NextResponse.redirect(unauthorizedUrl);
                }

                break; // Exit loop once we find matching route
            }
        }

        // Allow access
        return NextResponse.next();
    } catch (error) {
        // Invalid token, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: '/dashboard/:path*',
};
