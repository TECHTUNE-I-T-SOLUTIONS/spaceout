import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import CheckIn from '@/lib/models/CheckIn';
import Branch from '@/lib/models/Branch';
import User from '@/lib/models/User';
import Service from '@/lib/models/Service';
import ErrorLog from '@/lib/models/ErrorLog';
import PushSubscription from '@/lib/models/PushSubscription';
import { sendCheckInPushNotification, sendAdminNotificationOnCheckIn } from '@/lib/push-notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    const { serviceId } = await request.json();

    if (!serviceId) {
      return NextResponse.json(
        { message: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists and has active account
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'User account is inactive' },
        { status: 403 }
      );
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return NextResponse.json(
        { message: 'Service not found or inactive' },
        { status: 404 }
      );
    }

    // Check prepaid coverage
    const now = new Date();
    const prepaidAvailable = user.prepaidUntil && user.prepaidUntil > now;

    // Create check-in record
    const checkIn = await CheckIn.create({
      userId,
      branchId,
      serviceId,
      checkInTime: new Date(),
      prepaidUsed: prepaidAvailable,
    });

    // Send check-in notification to user
    try {
      const userSubscriptions = await PushSubscription.find({
        userId,
        isActive: true,
      });

      for (const sub of userSubscriptions) {
        try {
          const subscriptionJson = sub.subscription as any;
          await sendCheckInPushNotification(subscriptionJson);
        } catch (err) {
          console.error('Failed to send check-in push notification:', err);
        }
      }
    } catch (err) {
      console.error('Failed to get user push subscriptions:', err);
    }

    // Notify admins about user check-in
    try {
      const adminSubscriptions = await PushSubscription.find({
        userRole: 'admin',
        isActive: true,
      });

      const subscriptionJsons = adminSubscriptions.map((sub) => sub.subscription as any);

      if (subscriptionJsons.length > 0) {
        await sendAdminNotificationOnCheckIn(subscriptionJsons, user.name);
      }
    } catch (err) {
      console.error('Failed to notify admins about check-in:', err);
    }

    return NextResponse.json(
      {
        message: 'Check-in successful',
        checkIn,
        prepaidUsed: prepaidAvailable,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Check-in error:', error);

    const session = await getServerSession(authOptions) as any;
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/checkin',
      error: error.message || 'Check-in failed',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Check-in failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;

    await dbConnect();

    const checkIns = await CheckIn.find({ userId })
      .populate('serviceId', 'name category')
      .populate('branchId', 'name location')
      .sort({ checkInTime: -1 });

    return NextResponse.json(checkIns, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching check-ins:', error);

    await ErrorLog.create({
      route: '/api/checkin',
      error: error.message || 'Failed to fetch check-ins',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}
