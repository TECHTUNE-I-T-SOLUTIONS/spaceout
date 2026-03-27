import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const Subscription = (await import('@/lib/models/Subscription')).default;
    const CheckIn = (await import('@/lib/models/CheckIn')).default;

    // Get active subscriptions for the user
    const subscriptions = await Subscription.find({
      userId: session.user.id,
      status: 'active',
      paymentStatus: 'paid',
      endDate: { $gte: new Date() }
    })
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 });

    // Get check-in records for these subscriptions
    const subscriptionIds = subscriptions.map(sub => sub._id);
    const checkIns = await CheckIn.find({
      subscriptionId: { $in: subscriptionIds }
    }).sort({ checkedInAt: 1 });

    // Attach check-ins to subscriptions
    const subscriptionsWithCheckIns = subscriptions.map(subscription => {
      const subscriptionCheckIns = checkIns.filter(
        checkIn => checkIn.subscriptionId.toString() === subscription._id.toString()
      );

      return {
        ...subscription.toObject(),
        checkIns: subscriptionCheckIns
      };
    });

    return NextResponse.json({
      subscriptions: subscriptionsWithCheckIns
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching active subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}