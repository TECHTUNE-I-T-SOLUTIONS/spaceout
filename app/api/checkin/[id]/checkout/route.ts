import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    await dbConnect();

    const CheckIn = (await import('@/lib/models/CheckIn')).default;
    const User = (await import('@/lib/models/User')).default;

    // Check if user has uploaded verification documents
    const user = await User.findById(session.user.id).select('passportUrl signatureUrl');

    if (!user?.passportUrl || !user?.signatureUrl) {
      return NextResponse.json(
        { 
          error: 'Verification documents required', 
          message: 'Please upload your passport and signature documents before checking out'
        },
        { status: 422 }
      );
    }

    const checkIn = await CheckIn.findById(id);

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      );
    }

    // Verify the check-in belongs to the current user
    if (checkIn.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if already checked out
    if (checkIn.checkedOutAt) {
      return NextResponse.json(
        { error: 'Already checked out' },
        { status: 400 }
      );
    }

    // Update the check-in with checked-out timestamp
    checkIn.checkedOutAt = new Date();
    checkIn.status = 'checked_out';
    await checkIn.save();

    return NextResponse.json(
      {
        message: 'Successfully checked out',
        checkIn: {
          _id: checkIn._id,
          serviceName: checkIn.serviceName,
          planName: checkIn.planName,
          checkedInAt: checkIn.checkedInAt,
          checkedOutAt: checkIn.checkedOutAt,
          amount: checkIn.amount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error checking out:', error);
    return NextResponse.json(
      { error: 'Failed to checkout', message: error.message },
      { status: 500 }
    );
  }
}
