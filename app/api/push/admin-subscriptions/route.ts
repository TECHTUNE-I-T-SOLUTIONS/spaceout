import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get all active admin subscriptions
    const subscriptions = await PushSubscription.find({
      isActive: true,
      userRole: 'admin', // This requires adding userRole to PushSubscription model
    });

    const parsedSubscriptions = subscriptions.map((sub) => sub.subscription);

    return NextResponse.json(
      { success: true, subscriptions: parsedSubscriptions },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admin subscriptions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
