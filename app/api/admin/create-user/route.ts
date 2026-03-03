import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Verify admin exists
    await dbConnect();
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin not found or insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      branchId,
      emergencyContact,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !branchId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'firstName, lastName, email, password, phone, and branchId are required',
        },
        { status: 400 }
      );
    }

    // Validate emergency contact
    if (
      !emergencyContact ||
      !emergencyContact.name ||
      !emergencyContact.phone ||
      !emergencyContact.relationship
    ) {
      return NextResponse.json(
        {
          error: 'Invalid emergency contact',
          details: 'Emergency contact must include name, phone, and relationship',
        },
        { status: 400 }
      );
    }

    // Validate relationship enum
    const validRelationships = [
      'Spouse',
      'Parent',
      'Child',
      'Sibling',
      'Friend',
      'Other',
    ];
    if (!validRelationships.includes(emergencyContact.relationship)) {
      return NextResponse.json(
        {
          error: 'Invalid relationship value',
          details: `Relationship must be one of: ${validRelationships.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      branchId,
      emergencyContact: {
        name: emergencyContact.name,
        phone: emergencyContact.phone,
        relationship: emergencyContact.relationship,
      },
      role: 'user',
      isActive: true,
      isEmailVerified: false,
    });

    const savedUser = await newUser.save();

    console.log(`[Admin] User created: ${email} by admin ${adminId}`);

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: savedUser._id,
          email: savedUser.email,
          name: savedUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin] Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}
