import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/auth';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Check for admin session from cookies (admin login uses custom cookies)
    const adminRole = request.cookies.get('admin_role')?.value;
    const adminId = request.cookies.get('admin_id')?.value;

    // Also check NextAuth session as fallback
    let userRole = adminRole;
    if (!userRole) {
      const session = await getServerSession(authOptions) as any;
      userRole = session?.user?.role;
    }

    if (!adminId || !userRole) {
      console.log('No admin session found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching admins - Admin ID:', adminId, 'Role:', userRole);

    if (!['admin', 'superadmin'].includes(userRole)) {
      console.log('Permission denied - Role:', userRole);
      return NextResponse.json(
        { message: 'Forbidden: Admin or Superadmin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const admins = await Admin.find()
      .select('-password -resetToken -resetTokenExpiry')
      .sort({ createdAt: -1 });

    return NextResponse.json(admins);
  } catch (error: any) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { message: 'Failed to fetch admin accounts' },
      { status: 500 }
    );
  }
}
