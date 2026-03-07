import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      branchId,
      emergencyContact,
      passportUrl,
      signatureUrl,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !branchId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!emergencyContact?.name || !emergencyContact?.phone || !emergencyContact?.relationship) {
      return NextResponse.json(
        { message: 'Emergency contact information is incomplete' },
        { status: 400 }
      );
    }

    // Validate relationship enum
    const validRelationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];
    if (!validRelationships.includes(emergencyContact.relationship)) {
      return NextResponse.json(
        {
          message: 'Invalid relationship value',
          details: `Relationship must be one of: ${validRelationships.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!passportUrl || !signatureUrl) {
      return NextResponse.json(
        { message: 'Passport and signature uploads are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Check if both documents are uploaded
    const documentsUploaded = !!(passportUrl && signatureUrl);
    
    console.log('[Register-Enhanced] Documents uploaded check:', {
      passportUrl: !!passportUrl,
      signatureUrl: !!signatureUrl,
      documentsUploaded,
    });

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      branchId,
      emergencyContact: {
        name: emergencyContact.name,
        phone: emergencyContact.phone,
        relationship: emergencyContact.relationship,
      },
      passportPhotoUrl: passportUrl,
      signatureUrl,
      role: 'user',
      isActive: true,
      documentsUploaded,
    });

    // Return success without password
    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
