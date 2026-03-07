import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    const admin = await Admin.findById(adminId).select('-password -resetToken -resetTokenExpiry');

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: admin._id.toString(),
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      name: admin.name,
      role: admin.role,
      phone: admin.phone || null,
      profileImage: admin.profileImage || null,
      isActive: admin.isActive,
      isEmailVerified: admin.isEmailVerified,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching admin session:', error);
    return NextResponse.json(
      { message: 'Failed to fetch admin session' },
      { status: 500 }
    );
  }
}
