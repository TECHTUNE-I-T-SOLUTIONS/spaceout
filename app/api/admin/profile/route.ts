import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { firstName, lastName, email, phone } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists (and is not the current admin's email)
    const existingAdmin = await Admin.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: adminId }
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Email already in use by another admin' },
        { status: 400 }
      );
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : undefined,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password -resetToken -resetTokenExpiry');

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
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update admin profile' },
      { status: 500 }
    );
  }
}
