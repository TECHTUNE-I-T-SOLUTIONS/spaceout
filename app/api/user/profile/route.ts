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

    // Return all fields from the User model if present
    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      sex: user.sex,
      dateOfBirth: user.dateOfBirth,
      houseAddress: user.houseAddress,
      phone: user.phone,
      role: user.role,
      branchId: user.branchId,
      hasMembership: user.hasMembership,
      membershipStatus: user.membershipStatus,
      membershipType: user.membershipType,
      membershipActivatedAt: user.membershipActivatedAt,
      membershipExpiryDate: user.membershipExpiryDate,
      membershipExpiry: user.membershipExpiry,
      prepaidUntil: user.prepaidUntil,
      passportUrl: user.passportUrl,
      passportPhotoUrl: user.passportPhotoUrl,
      signatureUrl: user.signatureUrl,
      isStudent: user.isStudent,
      educationalInfo: user.educationalInfo,
      businessInfo: user.businessInfo,
      servicePreferences: user.servicePreferences,
      emergencyContact: user.emergencyContact,
      profileImage: user.profileImage,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      documentsUploaded: user.documentsUploaded,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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

    // Enforce all model fields in the collection
    const allFields = {
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      name: body.name ?? (body.firstName && body.lastName ? `${body.firstName} ${body.lastName}` : ''),
      sex: body.sex ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      houseAddress: body.houseAddress ?? '',
      phone: body.phone ?? '',
      passportUrl: body.passportUrl ?? '',
      passportPhotoUrl: body.passportPhotoUrl ?? '',
      signatureUrl: body.signatureUrl ?? '',
      isStudent: body.isStudent ?? false,
      educationalInfo: body.educationalInfo ?? {},
      businessInfo: body.businessInfo ?? {},
      servicePreferences: body.servicePreferences ?? {},
      emergencyContact: body.emergencyContact ?? { name: '', phone: '', relationship: '' },
      profileImage: body.profileImage ?? '',
    };

    if (!allFields.firstName || !allFields.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Update all fields, ensuring all are present in the document
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: allFields },
      { new: true, runValidators: true, upsert: false }
    ).lean();

    // Populate any missing fields in the returned object for consistency
    const populatedUser = {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      name: updatedUser.name,
      sex: updatedUser.sex,
      dateOfBirth: updatedUser.dateOfBirth,
      houseAddress: updatedUser.houseAddress,
      phone: updatedUser.phone,
      role: updatedUser.role,
      branchId: updatedUser.branchId,
      hasMembership: updatedUser.hasMembership,
      membershipStatus: updatedUser.membershipStatus,
      membershipType: updatedUser.membershipType,
      membershipActivatedAt: updatedUser.membershipActivatedAt,
      membershipExpiryDate: updatedUser.membershipExpiryDate,
      membershipExpiry: updatedUser.membershipExpiry,
      prepaidUntil: updatedUser.prepaidUntil,
      passportUrl: updatedUser.passportUrl,
      passportPhotoUrl: updatedUser.passportPhotoUrl,
      signatureUrl: updatedUser.signatureUrl,
      isStudent: updatedUser.isStudent,
      educationalInfo: updatedUser.educationalInfo,
      businessInfo: updatedUser.businessInfo,
      servicePreferences: updatedUser.servicePreferences,
      emergencyContact: updatedUser.emergencyContact,
      profileImage: updatedUser.profileImage,
      isActive: updatedUser.isActive,
      isEmailVerified: updatedUser.isEmailVerified,
      documentsUploaded: updatedUser.documentsUploaded,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: populatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    const body = await request.json();
    const { documentsUploaded } = body;

    if (typeof documentsUploaded !== 'boolean') {
      return NextResponse.json(
        { error: 'documentsUploaded must be a boolean' },
        { status: 400 }
      );
    }

    console.log('[Profile] Updating documentsUploaded to:', documentsUploaded);

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { documentsUploaded },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[Profile] documentsUploaded updated successfully for user:', updatedUser.email);

    return NextResponse.json({
      message: 'Documents flag updated successfully',
      documentsUploaded: updatedUser.documentsUploaded,
    });
  } catch (error) {
    console.error('Error updating documents flag:', error);
    return NextResponse.json(
      { error: 'Failed to update documents flag' },
      { status: 500 }
    );
  }
}

