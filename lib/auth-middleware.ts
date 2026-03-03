import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import dbConnect from './db';
import Admin from './models/Admin';
import { authOptions } from '@/auth';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/login');
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const userRole = (session.user as any)?.role;
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/unauthorized');
  }
  
  return session;
}

export async function requireAdminAuth() {
  const cookieStore = await cookies();
  const adminEmail = cookieStore.get('admin_email')?.value;
  const adminId = cookieStore.get('admin_id')?.value;

  if (!adminEmail || !adminId) {
    redirect('/admin/auth/login');
  }

  try {
    await dbConnect();
    const admin = await Admin.findById(adminId);

    if (!admin || !admin.isActive) {
      redirect('/admin/auth/login');
    }

    return {
      user: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  } catch (error) {
    redirect('/admin/auth/login');
  }
}

export async function requireAdmin() {
  return requireAdminAuth();
}

export async function requireSuperAdmin() {
  const adminSession = await requireAdminAuth();
  const adminRole = (adminSession.user as any)?.role;

  if (adminRole !== 'superadmin') {
    redirect('/admin/dashboard');
  }

  return adminSession;
}

export async function requireUser() {
  return requireRole(['user']);
}

export async function withBranchAccess(requiredRole?: string[]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as any)?.role;
  const userBranchId = (session.user as any)?.branchId;

  if (requiredRole && !requiredRole.includes(userRole)) {
    return null;
  }

  return { session, userRole, userBranchId };
}
