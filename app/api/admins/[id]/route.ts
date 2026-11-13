import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;
    const adminRole = cookieStore.get('admin_role')?.value;

    if (!adminId || !adminRole) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (adminRole !== 'superadmin') {
      return NextResponse.json(
        { message: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const admin = await Admin.findById(id);
    if (!admin) {
      return NextResponse.json({ message: 'Admin account not found' }, { status: 404 });
    }

    // Prevent deleting self
    if (adminId === id) {
      return NextResponse.json(
        { message: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    await Admin.findByIdAndDelete(id);

    try {
      await logActivity(adminId, 'Delete Admin', `Admin ${admin.name} (${admin.email}) was deleted`, 'auth', {
        targetAdminId: id,
        targetAdminEmail: admin.email,
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({ message: 'Admin account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting admin account:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete admin account' },
      { status: 500 }
    );
  }
}
