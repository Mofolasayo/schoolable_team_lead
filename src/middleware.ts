import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware to protect Team Lead dashboard routes
 * Checks for auth-token cookie and validates team lead role
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/api'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // Check for auth token
    const authToken = request.cookies.get('auth-token')?.value;
    const userInfo = request.cookies.get('user-info')?.value;

    // Redirect to login if accessing protected route without token
    if (!isPublicPath && !authToken) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Additional role check for team lead
    if (!isPublicPath && authToken && userInfo) {
        try {
            const user = JSON.parse(userInfo);
            // Only allow team leads and admins
            if (!user.isTeamLead && user.role !== 'admin') {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('error', 'Access denied. Team Leads only.');
                // Clear invalid cookies
                const response = NextResponse.redirect(loginUrl);
                response.cookies.delete('auth-token');
                response.cookies.delete('user-info');
                return response;
            }
        } catch {
            // Invalid user info, redirect to login
            const loginUrl = new URL('/login', request.url);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete('auth-token');
            response.cookies.delete('user-info');
            return response;
        }
    }

    // Redirect to dashboard if accessing login with valid token
    if (pathname === '/login' && authToken) {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    // Redirect root to dashboard or login
    if (pathname === '/') {
        if (authToken) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - static assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
