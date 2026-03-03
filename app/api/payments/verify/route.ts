import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import ErrorLog from '@/lib/models/ErrorLog';
import PushSubscription from '@/lib/models/PushSubscription';
import { sendPaymentPushNotification } from '@/lib/push-notification';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { reference, status } = await request.json();

    if (!reference || !status) {
      return NextResponse.json(
        { message: 'reference and status are required' },
        { status: 400 }
      );
    }

    // Find payment by reference
    const payment = await Payment.findOne({ paymentReference: reference });

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status
    payment.status = status === 'success' ? 'completed' : 'failed';
    await payment.save();

    // If successful, update user's prepaid coverage
    if (status === 'success' && payment.type === 'prepaid' && payment.coverageEndDate) {
      await User.findByIdAndUpdate(
        payment.userId,
        { prepaidUntil: payment.coverageEndDate }
      );
    }

    // If membership payment, update membership status
    if (status === 'success' && payment.type === 'membership') {
      const membershipExpiry = new Date();
      membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1); // 1 year validity

      await User.findByIdAndUpdate(
        payment.userId,
        {
          membership: true,
          membershipExpiry,
        }
      );
    }

    // Send payment notification if payment was successful
    if (status === 'success') {
      try {
        const userSubscriptions = await PushSubscription.find({
          userId: payment.userId,
          isActive: true,
        });

        for (const sub of userSubscriptions) {
          try {
            const subscriptionJson = sub.subscription as any;
            await sendPaymentPushNotification(
              subscriptionJson,
              payment.amount,
              reference
            );
          } catch (err) {
            console.error('Failed to send payment push notification:', err);
          }
        }
      } catch (err) {
        console.error('Failed to get user push subscriptions:', err);
      }
    }

    return NextResponse.json(
      {
        message: `Payment ${status === 'success' ? 'verified' : 'failed'}`,
        payment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);

    await ErrorLog.create({
      route: '/api/payments/verify',
      error: error.message || 'Failed to verify payment',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
