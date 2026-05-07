import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import UserSubscription from '@/lib/models/UserSubscription';
import Subscription from '@/lib/models/Subscription';
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

    // Create subscription and user-subscription records
    let subscriptionId = '';
    if (payment.metadata) {
      const { serviceName, serviceId: metadataServiceId, planName, duration, isAccessCard, planId, durationLabel } = payment.metadata as any;
      const serviceId = metadataServiceId || payment.serviceId;

      if (!serviceId) {
        throw new Error('Missing serviceId for subscription creation');
      }

      const purchaseDate = new Date();

      // Normalize duration into days. Metadata `duration` is expected to be days,
      // but some callers may provide months/years (e.g. 1 for 1 year). Detect and
      // convert conservatively using planName/durationLabel hints.
      const normalizeDurationToDays = (d: any, planName?: string, durationLabel?: string) => {
        let days = Number(d) || 0;
        const name = (planName || '') + ' ' + (durationLabel || '');
        const lower = name.toLowerCase();

        if (days > 0 && days < 31) {
          // Could be days, or could be months/years. Heuristics:
          if (lower.includes('year') || lower.includes('annual') || lower.includes('yr')) {
            return days * 365;
          }
          if (lower.includes('month') || lower.includes('mo')) {
            return days * 30;
          }
          // If small (<31) and no hint, assume days.
          return days;
        }

        // If days looks like months expressed (<=12) treat as months
        if (days > 0 && days <= 12 && (lower.includes('month') || lower.includes('mo'))) return days * 30;

        // If days is already large (>=31 and reasonable), assume days
        if (days >= 31 && days <= 365 * 20) return days;

        // Fallback: if value is tiny (1) but name suggests year, treat as 1 year
        if (days === 1 && (lower.includes('year') || lower.includes('annual') || lower.includes('yr'))) return 365;

        // As a last resort, default to 365 days for unknown large-length subscriptions
        return 365;
      };

      const durationDays = normalizeDurationToDays(duration, planName, durationLabel);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + durationDays);

      // Create a Subscription document (used by check-in gating/history)
      try {
        const sub = await Subscription.create({
          userId: payment.userId,
          serviceId,
          serviceName,
          planName,
          planId,
          durationLabel,
          durationInDays: durationDays,
          status: 'active',
          paymentStatus: 'completed',
          startDate: purchaseDate,
          endDate: expiryDate,
          checkIns: [],
        });

        subscriptionId = sub._id.toString();
      } catch (err) {
        console.error('Failed to create Subscription record:', err);
      }

      // Create UserSubscription record for membership UI
      try {
        const userSub = new UserSubscription({
          userId: payment.userId,
          serviceId,
          planId,
          planName,
          serviceName,
          price: payment.amount,
          duration: durationDays,
          purchaseDate,
          expiryDate,
          status: 'active',
          paymentReference: reference,
          isAccessCard,
          autoRenew: false,
        });

        await userSub.save();

        // Update user membership flags if not an access card
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
      } catch (err) {
        console.error('Failed to create UserSubscription:', err);
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
