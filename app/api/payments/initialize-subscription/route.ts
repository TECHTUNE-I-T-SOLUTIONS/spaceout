import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import dbConnect from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get user from NextAuth session
    const session = (await getServerSession(authOptions)) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const {
      planId,
      planName,
      serviceName,
      serviceId,
      amount,
      duration,
      isAccessCard = false,
    } = await request.json();

    // Validate required fields
    if (!planName || !serviceName || !amount || !serviceId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user email
    const user = await User.findById(userId).select('email firstName lastName');
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Generate unique reference with retry logic to handle duplicate key errors
    let payment;
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        const reference = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Create payment record
        payment = new Payment({
          userId,
          serviceId,
          email: user.email,
          amount,
          reference,
          status: 'pending',
          paymentType: 'subscription',
          serviceName,
          planName,
          metadata: {
            planId,
            planName,
            serviceName,
            serviceId,
            duration,
            isAccessCard,
          },
        });

        await payment.save();
        break; // Success, exit retry loop
      } catch (err: any) {
        lastError = err;
        if (err.code === 11000 && retries > 1) {
          // Duplicate key error, retry with new reference
          retries--;
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!payment) {
      throw lastError || new Error('Failed to create payment record');
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Paystack expects amount in kobo
        reference: payment.reference,
        metadata: {
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          userId,
          serviceId,
          planId,
          planName,
          serviceName,
          duration,
          isAccessCard,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify-subscription`,
      }),
    });

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      console.error('Paystack error:', errorData);
      
      // Update payment status to failed
      await Payment.findByIdAndUpdate(payment._id, { status: 'failed' });

      return NextResponse.json(
        { message: errorData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      await Payment.findByIdAndUpdate(payment._id, { status: 'failed' });
      return NextResponse.json(
        { message: 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment initialized successfully',
      reference: payment.reference,
      paymentId: payment._id,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
    });
  } catch (error: any) {
    console.error('Subscription payment initialization error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
