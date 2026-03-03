import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized - admin not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }

    // Await params to get the id
    const { id } = await params;

    // Delete the user from User collection
    const result = await User.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
