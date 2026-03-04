import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import ErrorLog from '@/lib/models/ErrorLog';
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
      paystackReference: reference,
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

    // Update user membership if this is a membership payment
    if (payment.membershipDays) {
      const membershipExpiry = new Date();
      membershipExpiry.setDate(membershipExpiry.getDate() + payment.membershipDays);

      await User.findByIdAndUpdate(payment.userId, {
        hasMembership: true,
        membershipExpiry,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        membershipDays: payment.membershipDays,
      },
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

// POST endpoint for webhook and legacy verification
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { reference, status, paystackReference } = await request.json();

    // Support both legacy paystackReference and reference
    let payment = null;
    if (paystackReference) {
      payment = await Payment.findOne({ paystackReference });
    } else if (reference) {
      payment = await Payment.findOne({
        $or: [
          { reference: reference },
          { paystackReference: reference },
        ],
      });
    }

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status
    payment.status = status === 'success' ? 'completed' : 'failed';
    if (status === 'success') {
      payment.paidAt = new Date();
      payment.verifiedAt = new Date();
    }
    await payment.save();

    // If successful, update user's prepaid coverage
    if (status === 'success' && payment.type === 'prepaid' && payment.coverageEndDate) {
      await User.findByIdAndUpdate(
        payment.userId,
        { prepaidUntil: payment.coverageEndDate }
      );
    }

    // If membership payment, update membership status
    if (status === 'success') {
      if (payment.membershipDays) {
        // New membership system
        const membershipExpiry = new Date();
        membershipExpiry.setDate(membershipExpiry.getDate() + payment.membershipDays);

        await User.findByIdAndUpdate(payment.userId, {
          hasMembership: true,
          membershipExpiry,
        });
      } else if (payment.type === 'membership') {
        // Legacy membership system
        const membershipExpiry = new Date();
        membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1);

        await User.findByIdAndUpdate(payment.userId, {
          membership: true,
          membershipExpiry,
        });
      }
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
