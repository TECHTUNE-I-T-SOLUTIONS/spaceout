import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      profileImage: user.profileImage || null,
      passportUrl: user.passportUrl || null,
      signatureUrl: user.signatureUrl || null,
      emergencyContact: user.emergencyContact || { name: '', phone: '', relationship: '' },
      hasMembership: user.hasMembership || false,
      membershipExpiry: user.membershipExpiry || null,
      prepaidUntil: user.prepaidUntil || null,
      isEmailVerified: user.isEmailVerified || false,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    const body = await request.json();
    const { firstName, lastName, phone, emergencyContact, passportUrl, signatureUrl } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: phone || '',
        emergencyContact: emergencyContact || {},
        passportUrl: passportUrl || undefined,
        signatureUrl: signatureUrl || undefined,
      },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedUser._id.toString(),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        emergencyContact: updatedUser.emergencyContact,
        passportUrl: updatedUser.passportUrl,
        signatureUrl: updatedUser.signatureUrl,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

