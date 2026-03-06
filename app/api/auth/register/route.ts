import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import PushSubscription from '@/lib/models/PushSubscription';
import { hashPassword, isValidEmail } from '@/lib/auth';
import { sendWelcomeEmail, sendAdminWelcomeEmail, sendNewUserSignupNotification } from '@/lib/email';
import {
  sendWelcomePushNotification,
  sendAdminNotificationOnSignup,
  sendAdminWelcomePushNotification,
} from '@/lib/push-notification';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const {
      firstName,
      lastName,
      name,
      email,
      password,
      phone,
      branchId,
      emergencyContact,
    } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Accept either firstName/lastName or name
    const fullName = name || `${firstName} ${lastName}`;
    if (!fullName) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!branchId || branchId.trim() === '') {
      return NextResponse.json(
        { message: 'Branch selection is required' },
        { status: 400 }
      );
    }

    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { message: 'Phone number is required' },
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

    console.log('[Register] Creating user with data:', {
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone,
      branchId,
      hasBranchId: !!branchId,
    });

    // Create user
    const user = await User.create({
      firstName: firstName || fullName.split(' ')[0],
      lastName: lastName || fullName.split(' ').slice(1).join(' '),
      email: email.toLowerCase(),
      password: hashedPassword,
      name: fullName,
      phone,
      branchId,
      emergencyContact: emergencyContact || { name: '', phone: '', relationship: '' },
      role: 'user',
      hasMembership: false,
      isActive: true,
    });

    console.log('[Register] User created successfully:', {
      id: user._id,
      email: user.email,
      name: user.name,
    });

    // Verify user was saved by finding it again
    const verifyUser = await User.findById(user._id);
    if (!verifyUser) {
      console.error('[Register] User verification failed - user not found after creation');
    } else {
      console.log('[Register] User verification successful');
    }

    // Send welcome email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;
    await sendWelcomeEmail(user.email, user.name, loginUrl);
    
    // Send admin notification about new user signup
    try {
      await sendNewUserSignupNotification('spaceout.workstation@gmail.com', {
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: new Date(user.createdAt).toLocaleString(),
      });
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }
    
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
    console.error('Register error:', error.message);
    
    // Log validation errors if any
    if (error.errors) {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
      })));
    }

    // Determine the best error message for the user
    let errorMessage = 'Registration failed';
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      errorMessage = `${field} is already in use`;
    } else if (error.errors) {
      const firstError = Object.values(error.errors)[0] as any;
      errorMessage = firstError?.message || 'Registration failed';
    } else {
      errorMessage = error.message || 'Registration failed';
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
