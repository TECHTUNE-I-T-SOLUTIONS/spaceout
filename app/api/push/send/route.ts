import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import dbConnect from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || '',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { userId, title, body, icon, badge, tag } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { message: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    // Find user subscriptions
    const subscriptions = await PushSubscription.find({
      userId: userId,
      isActive: true,
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No active subscriptions found for this user' },
        { status: 404 }
      );
    }

    // Send notification to all subscriptions
    const results = [];
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify({
          title,
          body,
          icon: icon || '/logo-dark.png',
          badge: badge || '/favicon.png',
          tag: tag || 'spaceout-notification',
          data: {
            url: '/',
          },
        }));

        results.push({
          endpoint: (sub.subscription as any).endpoint,
          status: 'sent',
        });

        console.log('[Push] Notification sent to:', (sub.subscription as any).endpoint);
      } catch (error: any) {
        console.error('[Push] Failed to send notification:', error);

        // If subscription is no longer valid, mark as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          await PushSubscription.updateOne(
            { _id: sub._id },
            { isActive: false }
          );
          console.log('[Push] Marked invalid subscription as inactive:', (sub.subscription as any).endpoint);
        }

        results.push({
          endpoint: (sub.subscription as any).endpoint,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Notifications sent',
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Push] Send error:', error);
    return NextResponse.json(
      { message: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
