import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

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
    ).lean();

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
