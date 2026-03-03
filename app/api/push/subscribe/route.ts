import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';
import { getServerSession } from 'next-auth/next';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { subscription } = await req.json();

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription is required' },
        { status: 400 }
      );
    }

    // Get user role
    const user = await User.findById((session.user as any).id);
    const userRole = user?.role || 'user';

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      userId: (session.user as any).id,
      'subscription.endpoint': subscription.endpoint,
    });

    if (existingSubscription) {
      return NextResponse.json(
        { message: 'Subscription already exists' },
        { status: 200 }
      );
    }

    // Create new subscription
    const newSubscription = new PushSubscription({
      userId: (session.user as any).id,
      subscription,
      userRole,
      userAgent: req.headers.get('user-agent'),
    });

    await newSubscription.save();

    return NextResponse.json(
      { message: 'Subscription saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { message: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { subscription } = await req.json();

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription is required' },
        { status: 400 }
      );
    }

    await PushSubscription.deleteOne({
      userId: (session.user as any).id,
      'subscription.endpoint': subscription.endpoint,
    });

    return NextResponse.json(
      { message: 'Subscription removed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { message: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
