import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';
import webpush from 'web-push';
import crypto from 'crypto';

// Configure web-push with VAPID keys
const vapidSubject = process.env.VAPID_SUBJECT || '';
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

console.log('[Push] VAPID Configuration:', {
  subject: vapidSubject ? '✓ set' : '✗ missing',
  publicKey: vapidPublicKey ? `✓ set (${vapidPublicKey.length} chars)` : '✗ missing',
  privateKey: vapidPrivateKey ? `✓ set (${vapidPrivateKey.length} chars)` : '✗ missing',
});

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export async function POST(req: NextRequest) {
  try {
    // Generate unique ID from IP + User-Agent (works for all visitors)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const anonymousId = crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 24);
    const userId = `anon_${anonymousId}`;
    const userRole = 'visitor';

    console.log('[Push] Subscription for visitor:', userId);

    await dbConnect();

    const { subscription } = await req.json();

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription is required' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      userId: userId,
      'subscription.endpoint': subscription.endpoint,
    }).lean();

    if (existingSubscription) {
      return NextResponse.json(
        { message: 'Subscription already exists' },
        { status: 200 }
      );
    }

    // Create new subscription
    const newSubscription = new PushSubscription({
      userId: userId,
      subscription,
      userRole,
      userAgent: req.headers.get('user-agent'),
    });

    await newSubscription.save();

    console.log('[Push] Subscription saved, sending welcome message');
    console.log('[Push] Subscription object:', JSON.stringify(subscription).slice(0, 100));

    // Send welcome notification directly
    try {
      const notificationPayload = {
        title: 'Welcome to SpaceOut! 🎉',
        body: 'You will now receive notifications about bookings, messages, and updates.',
        icon: '/logo-dark.png',
        badge: '/favicon.png',
        tag: 'welcome-notification',
        data: {
          url: '/',
        },
      };

      console.log('[Push] Sending welcome notification with payload:', notificationPayload.title);

      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify(notificationPayload)
      );

      console.log('[Push] Welcome notification sent successfully, result:', result);
    } catch (welcomeError: any) {
      console.error('[Push] Error sending welcome notification:', {
        message: welcomeError.message,
        statusCode: welcomeError.statusCode,
        endpoint: (subscription as any).endpoint ? (subscription as any).endpoint.slice(0, 50) : 'unknown',
      });
      // Don't fail the subscription if welcome message fails
    }

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
    // Generate unique ID from IP + User-Agent (same as POST)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const anonymousId = crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 24);
    const userId = `anon_${anonymousId}`;

    await dbConnect();

    const { subscription } = await req.json();

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription is required' },
        { status: 400 }
      );
    }

    await PushSubscription.deleteOne({
      userId: userId,
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
