import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return default user profile
    const profile = {
      name: 'User',
      email: 'user@example.com',
      phone: '',
      address: '',
      profileImage: null,
      joinDate: new Date().toLocaleDateString(),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Save profile (mock implementation)
    // In production, save to database here
    console.log('Profile updated:', body);

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: body,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
