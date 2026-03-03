import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import CheckIn from '@/lib/models/CheckIn';
import ErrorLog from '@/lib/models/ErrorLog';
import User from '@/lib/models/User';
import PushSubscription from '@/lib/models/PushSubscription';
import { sendCheckOutPushNotification } from '@/lib/push-notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;

    await dbConnect();

    const { checkInId } = await request.json();

    if (!checkInId) {
      return NextResponse.json(
        { message: 'Check-in ID is required' },
        { status: 400 }
      );
    }

    // Find active check-in
    const checkIn = await CheckIn.findById(checkInId);

    if (!checkIn) {
      return NextResponse.json(
        { message: 'Check-in record not found' },
        { status: 404 }
      );
    }

    if (checkIn.checkOutTime) {
      return NextResponse.json(
        { message: 'Already checked out' },
        { status: 400 }
      );
    }

    // Verify user owns this check-in
    if (checkIn.userId.toString() !== userId) {
      return NextResponse.json(
        { message: 'Forbidden: Invalid check-in' },
        { status: 403 }
      );
    }

    // Update check-out time
    checkIn.checkOutTime = new Date();
    await checkIn.save();

    // Send check-out notification to user
    try {
      const userSubscriptions = await PushSubscription.find({
        userId,
        isActive: true,
      });

      for (const sub of userSubscriptions) {
        try {
          const subscriptionJson = sub.subscription as any;
          await sendCheckOutPushNotification(subscriptionJson);
        } catch (err) {
          console.error('Failed to send check-out push notification:', err);
        }
      }
    } catch (err) {
      console.error('Failed to get user push subscriptions:', err);
    }

    return NextResponse.json(
      {
        message: 'Check-out successful',
        checkIn: {
          id: checkIn._id,
          checkInTime: checkIn.checkInTime,
          checkOutTime: checkIn.checkOutTime,
          duration: new Date(checkIn.checkOutTime).getTime() - new Date(checkIn.checkInTime).getTime(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const session = await getServerSession(authOptions) as any;
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/checkout',
      error: error instanceof Error ? error.message : 'Check-out failed',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Check-out failed' },
      { status: 500 }
    );
  }
}
