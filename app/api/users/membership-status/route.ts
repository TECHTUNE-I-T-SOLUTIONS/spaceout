import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';

let authOptions: any;

async function getAuthOptions() {
  if (!authOptions) {
    authOptions = (await import('@/auth')).authOptions;
  }
  return authOptions;
}

export async function GET(request: NextRequest) {
  try {
    const options = await getAuthOptions();
    const session = await getServerSession(options);

    // If no session, return false for hasMembership (guest user)
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          hasMembership: false, 
          membershipStatus: 'inactive',
          userId: null,
          email: null,
        },
        { status: 200 }
      );
    }

    await dbConnect();

    const { default: User } = await import('@/lib/models/User');

    const user = await User.findById(session.user.id).select(
      'email hasMembership membershipExpiry'
    ).lean();

    if (!user) {
      return NextResponse.json(
        { 
          hasMembership: false,
          membershipStatus: 'inactive',
          userId: session.user.id,
          email: session.user.email,
        },
        { status: 200 }
      );
    }

    // Check if user has active membership
    const now = new Date();
    const hasMembership =
      user.hasMembership === true &&
      (!user.membershipExpiry || new Date(user.membershipExpiry) > now);

    return NextResponse.json(
      {
        userId: user._id,
        email: user.email,
        hasMembership,
        membershipStatus: hasMembership ? 'active' : 'inactive',
        membershipExpiryDate: user.membershipExpiry,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error checking membership status:', error);
    return NextResponse.json(
      { 
        hasMembership: false,
        membershipStatus: 'inactive',
        error: 'Failed to check membership status',
        message: error.message 
      },
      { status: 200 } // Return 200 with hasMembership: false for graceful degradation
    );
  }
}
