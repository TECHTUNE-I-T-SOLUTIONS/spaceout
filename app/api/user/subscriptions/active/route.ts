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
      // include both legacy 'paid' and current 'completed' values for robustness
      paymentStatus: { $in: ['completed', 'paid'] },
      endDate: { $gte: new Date() }
    })
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 });

    // Get check-in records for these subscriptions
    const subscriptionIds = subscriptions.map(sub => sub._id);
    const checkIns = await CheckIn.find({
      subscriptionId: { $in: subscriptionIds }
    }).sort({ checkedInAt: 1 });

    // Attach check-ins to subscriptions and compute remaining units
    const subscriptionsWithCheckIns = subscriptions.map(subscription => {
      const subscriptionCheckIns = checkIns.filter(
        checkIn => checkIn.subscriptionId.toString() === subscription._id.toString()
      );

      // Compute used and remaining counts. Count all checkIns (including checked_out)
      const isHourly = !!subscription.durationInHours;
      let usedCount = subscriptionCheckIns.length;
      let remaining = 0;
      let unit = 'days';

      if (isHourly) {
        unit = 'hours';
        const allowed = subscription.durationInHours || 0;
        remaining = Math.max(0, allowed - usedCount);
      } else {
        const allowed = subscription.durationInDays || 0;
        remaining = Math.max(0, allowed - usedCount);
      }

      return {
        ...subscription.toObject(),
        checkIns: subscriptionCheckIns,
        usage: {
          unit,
          usedCount,
          remaining,
        }
      };
    });

    return NextResponse.json({ subscriptions: subscriptionsWithCheckIns }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching active subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}