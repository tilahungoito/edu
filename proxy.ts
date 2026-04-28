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
    '/dashboard/institution': ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN'],
    '/dashboard/registrar': ['SYSTEM_ADMIN', 'REGISTRAR'],
    '/dashboard/academic': ['SYSTEM_ADMIN', 'INSTRUCTOR', 'STUDENT', 'REGISTRAR', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN'],
    '/dashboard/teacher': ['SYSTEM_ADMIN', 'INSTRUCTOR'],
    '/dashboard/student': ['SYSTEM_ADMIN', 'STUDENT'],
    '/students': ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN', 'REGISTRAR'],
    '/academic': ['SYSTEM_ADMIN', 'REGIONAL_ADMIN',  'INSTRUCTOR', 'STUDENT', 'REGISTRAR', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN'],
    '/hr': ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN', 'REGISTRAR'],
    '/finance': ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN'],
    '/inventory': ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN', 'REGISTRAR'],
    '/management': ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN', 'SCHOOL_ADMIN'],
};

// Public paths that don't require authentication
const publicPaths = ['/login', '/forgot-password', '/reset-password'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow root path (it redirects to /dashboard anyway)
    if (pathname === '/') {
        return NextResponse.next();
    }

    // 2. Allow public paths
    if (publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next();
    }

    // 3. Allow Next.js internals and static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 4. Get token from cookie
    const token = request.cookies.get('access_token')?.value;

    // 5. If no token, redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // 6. Decode and validate token
        const decoded = jwtDecode<DecodedToken>(token);

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('access_token');
            return response;
        }

        // 7. Check role-based route access
        const userRole = (decoded.role || '').toUpperCase();

        // SYSTEM_ADMIN has access to everything
        if (userRole === 'SYSTEM_ADMIN') {
            return NextResponse.next();
        }

        // Check specific route permissions
        for (const [route, allowedRoles] of Object.entries(routePermissions)) {
            if (pathname.startsWith(route)) {
                if (!allowedRoles.includes(userRole)) {
                    // Redirect to general dashboard if unauthorized
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
                return NextResponse.next();
            }
        }

        // Default: Allow access if no specific rule matches (might be a common dashboard subpage)
        return NextResponse.next();
    } catch (error) {
        // Invalid token
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT Next.js internals and static files.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
