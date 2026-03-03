import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { message: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = params;

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return NextResponse.json({ message: 'Admin account not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Admin account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting admin account:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete admin account' },
      { status: 500 }
    );
  }
}
