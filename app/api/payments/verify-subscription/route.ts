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

    // Find payment by reference - try to get the full document, not lean
    let payment = await Payment.findOne({
      reference: reference,
    });

    if (!payment) {
      console.error('Payment not found for reference:', reference);
      
      // Log all payments for debugging
      const allPayments = await Payment.find({ status: 'pending' }).select('reference').limit(5);
      console.error('Sample pending payments:', allPayments);

      return NextResponse.redirect(
        new URL(
          `/user/astronaut-card?success=false&message=${encodeURIComponent('Payment not found')}`,
          process.env.NEXT_PUBLIC_APP_URL
        )
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
      return NextResponse.redirect(
        new URL(
          `/user/astronaut-card?success=false&message=Payment not verified`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Check if payment was successful
    if (paystackData.data.status !== 'success') {
      payment.status = paystackData.data.status;
      await payment.save();
      return NextResponse.redirect(
        new URL(
          `/user/astronaut-card?success=false&message=Payment ${paystackData.data.status}`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Update payment status
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.verifiedAt = new Date();
    await payment.save();

    // Create subscription record
    let subscriptionId = '';
    if (payment.metadata) {
      const { serviceName, serviceId: metadataServiceId, planName, duration, isAccessCard, planId } = payment.metadata as any;
      // Use metadata serviceId, fallback to payment.serviceId
      const serviceId = metadataServiceId || payment.serviceId;
      
      if (!serviceId) {
        throw new Error('Missing serviceId for subscription creation');
      }

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
      subscriptionId = subscription._id.toString();

      // Update user hasMembership if not an access card
      if (!isAccessCard) {
        await User.findByIdAndUpdate(payment.userId, {
          hasMembership: true,
          membershipStatus: 'active',
          membershipType: 'annual',
          membershipActivatedAt: purchaseDate,
          membershipExpiryDate: expiryDate,
          membershipExpiry: expiryDate,
        });
      }
    } else {
      throw new Error('Payment metadata is missing');
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

    return NextResponse.redirect(
      new URL(
        `/user/astronaut-card?success=true&subscriptionId=${subscriptionId}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  } catch (error: any) {
    console.error('Subscription payment verification error:', error);
    
    try {
      await dbConnect();
      const ErrorLog = (await import('@/lib/models/ErrorLog')).default;
      await ErrorLog.create({
        route: '/api/payments/verify-subscription',
        error: error.message || 'Unknown error',
        statusCode: 500,
        timestamp: new Date(),
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    return NextResponse.redirect(
      new URL(
        `/user/astronaut-card?success=false&message=${encodeURIComponent(error.message || 'Payment verification failed')}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}
