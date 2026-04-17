import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';

export async function GET(
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

    const checkIn = await CheckIn.findById(id).select(
      'userId serviceId serviceName planName planType durationLabel durationInHours durationInDays selectedRate amount wifiIncluded status paymentStatus checkedInAt checkedOutAt paymentVerifiedAt'
    ).lean() as any;

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

    return NextResponse.json(checkIn, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching check-in details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in details', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Find the check-in first to verify ownership
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
        { status: 403 }
      );
    }

    // Only allow deletion of pending or failed check-ins
    if (checkIn.status === 'checked_in' && checkIn.paymentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete completed check-ins' },
        { status: 400 }
      );
    }

    // Delete the check-in
    await CheckIn.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: 'Check-in deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting check-in:', error);
    return NextResponse.json(
      { error: 'Failed to delete check-in', message: error.message },
      { status: 500 }
    );
  }
}
