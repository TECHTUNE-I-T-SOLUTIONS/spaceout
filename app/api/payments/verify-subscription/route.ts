import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import UserSubscription from '@/lib/models/UserSubscription';
import PushSubscription from '@/lib/models/PushSubscription';
import { sendPaymentPushNotification } from '@/lib/push-notification';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// GET endpoint for Paystack verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find payment by Paystack reference
    const payment = await Payment.findOne({
      reference: reference,
      paymentType: 'subscription',
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment with Paystack');
    }

    const paystackData = await response.json();

    if (!paystackData.status) {
      return NextResponse.json(
        { error: 'Payment verification failed', payment: payment.toObject() },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (paystackData.data.status !== 'success') {
      payment.status = paystackData.data.status;
      await payment.save();
      return NextResponse.json(
        {
          error: `Payment ${paystackData.data.status}`,
          payment: payment.toObject(),
        },
        { status: 400 }
      );
    }

    // Update payment status
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.verifiedAt = new Date();
    await payment.save();

    // Create subscription record
    if (payment.metadata) {
      const { serviceName, serviceId, planName, duration, isAccessCard, planId } = payment.metadata as any;
      
      const purchaseDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);

      const subscription = new UserSubscription({
        userId: payment.userId,
        serviceId,
        planId,
        planName,
        serviceName,
        price: payment.amount,
        duration,
        purchaseDate,
        expiryDate,
        status: 'active',
        paymentReference: reference,
        isAccessCard,
        autoRenew: false,
      });

      await subscription.save();

      // Update user hasMembership if not an access card
      if (!isAccessCard) {
        await User.findByIdAndUpdate(payment.userId, {
          hasMembership: true,
          membershipExpiry: expiryDate,
        });
      }
    }

    // Send push notification
    const user = await User.findById(payment.userId);
    if (user) {
      const pushSub = await PushSubscription.findOne({ userId: payment.userId });
      if (pushSub) {
        await sendPaymentPushNotification(pushSub.subscription, {
          title: 'Payment Successful',
          body: `Your subscription payment of ₦${payment.amount.toLocaleString()} has been confirmed. Your subscription is now active.`,
        }).catch(err => console.log('Push notification error:', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription payment verified successfully',
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
      },
    });
  } catch (error: any) {
    console.error('Subscription payment verification error:', error);
    
    await dbConnect();
    await ErrorLog.create({
      component: 'verify-subscription',
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
    });

    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
