import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import UserSubscription from '@/lib/models/UserSubscription';

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get all subscriptions for the user
    const subscriptions = await UserSubscription.find({
      userId: session.user.id,
      status: { $in: ['active', 'expired'] }
    })
      .select('serviceName planName expiryDate status isAccessCard')
      .sort({ expiryDate: -1 })
      .lean();

    return NextResponse.json({
      subscriptions: subscriptions,
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
