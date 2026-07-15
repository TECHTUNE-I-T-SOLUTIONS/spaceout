import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminEmail = cookieStore.get('admin_email')?.value;
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminEmail || !adminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin not logged in' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify admin is valid and active
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin account' },
        { status: 401 }
      );
    }

    const { checkInId } = await request.json();

    if (!checkInId) {
      return NextResponse.json(
        { error: 'Check-in ID is required' },
        { status: 400 }
      );
    }

    const CheckIn = (await import('@/lib/models/CheckIn')).default;

    const checkIn = await CheckIn.findById(checkInId);

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
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
        message: 'Successfully checked out user',
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
    console.error('Error checking out user:', error);
    return NextResponse.json(
      { error: 'Failed to checkout user', message: error.message },
      { status: 500 }
    );
  }
}
