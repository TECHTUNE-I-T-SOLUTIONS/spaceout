import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

/**
 * Guards admin-only API routes for the Hub admin resources.
 * Uses the admin_role cookie set at login, falling back to the NextAuth
 * admin session — matching the pattern used by other admin APIs.
 */
export async function requireHubAdmin(
  request: NextRequest
): Promise<{ userRole: string; error: NextResponse | null }> {
  const cookieRole = request.cookies.get('admin_role')?.value;
  let role = cookieRole;

  if (!role) {
    try {
      const session = (await getServerSession(authOptions)) as any;
      if (session?.user) {
        role = session.user.role;
      }
    } catch {
      role = undefined;
    }
  }

  if (!role || !['admin', 'superadmin'].includes(role)) {
    return {
      userRole: '',
      error: NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { userRole: role, error: null };
}