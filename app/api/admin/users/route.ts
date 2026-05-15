import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';
import { hashPassword } from '@/lib/auth';

function deriveMembershipState(user: any) {
  const now = new Date();
  const rawStatus = user.membershipStatus || 'inactive';
  const expiryValue = user.membershipExpiryDate || user.membershipExpiry;
  const expiryDate = expiryValue ? new Date(expiryValue) : null;
  const hasFutureExpiry = !!expiryDate && expiryDate > now;
  const hasMembership = !!(user.hasMembership || rawStatus !== 'inactive' || hasFutureExpiry);
  const membershipStatus = rawStatus === 'active' || hasFutureExpiry
    ? 'active'
    : rawStatus === 'expired'
      ? 'expired'
      : 'inactive';

  return {
    ...user,
    hasMembership,
    membershipStatus,
    membershipStatusRaw: user.membershipStatus || null,
    membershipNeedsRepair: hasMembership && rawStatus !== 'active' && hasFutureExpiry,
  };
}

export async function GET(request: NextRequest) {
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

    // Fetch all users excluding password field, including all membership fields
    let users = await User.find({})
      .select('-password -resetToken -resetTokenExpiry')
      .lean()
      .exec();

    // Compute hasMembership based on membershipStatus
    // If membershipStatus exists and is not null, user has/had membership
    users = users.map((user: any) => deriveMembershipState(user));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

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
    const admin = await Admin.findById(adminId);
    if (!admin) {
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

