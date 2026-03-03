import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import PushSubscription from '@/lib/models/PushSubscription';
import { hashPassword, isValidEmail } from '@/lib/auth';
import { sendWelcomeEmail, sendAdminWelcomeEmail } from '@/lib/email';
import {
  sendWelcomePushNotification,
  sendAdminNotificationOnSignup,
  sendAdminWelcomePushNotification,
} from '@/lib/push-notification';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, password, name, phone, branchId } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      branchId,
      role: 'user',
      membership: false,
      isActive: true,
    });

    // Send welcome email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;
    await sendWelcomeEmail(user.email, user.name, loginUrl);

    // Get user's push subscriptions and send welcome notification
    const userSubscriptions = await PushSubscription.find({
      userId: user._id,
      isActive: true,
    });

    for (const sub of userSubscriptions) {
      try {
        const subscriptionJson = sub.subscription as any;
        await sendWelcomePushNotification(subscriptionJson, user.name);
      } catch (err) {
        console.error('Failed to send welcome push notification:', err);
      }
    }

    // Notify admins about new user signup
    try {
      const adminSubscriptions = await PushSubscription.find({
        userRole: 'admin',
        isActive: true,
      });

      const subscriptionJsons = adminSubscriptions.map(
        (sub) => sub.subscription as any
      );

      if (subscriptionJsons.length > 0) {
        await sendAdminNotificationOnSignup(subscriptionJsons, user.name, user.email);
      }
    } catch (err) {
      console.error('Failed to notify admins:', err);
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
