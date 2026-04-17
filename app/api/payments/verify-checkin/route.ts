import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import axios from 'axios';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.data.status || !response.data.data.status) {
      return NextResponse.redirect(
        new URL(
          `/user/check-in?success=false&message=Payment not verified`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const paymentData = response.data.data;

    // Connect to database
    await dbConnect();

    // Dynamically import models
    const Payment = (await import('@/lib/models/Payment')).default;
    const CheckIn = (await import('@/lib/models/CheckIn')).default;
    const Subscription = (await import('@/lib/models/Subscription')).default;

    // Update payment record
    const payment = await Payment.findByIdAndUpdate(
      paymentData.metadata.paymentId,
      {
        status: 'completed',
        reference: paymentData.reference,
        paystackReference: paymentData.reference,
        amount: paymentData.amount / 100, // Paystack returns amount in kobo
        paidAt: new Date(paymentData.paid_at),
        verifiedAt: new Date(),
        metadata: {
          ...paymentData.metadata,
          paystackReference: paymentData.reference,
          authorization: paymentData.authorization,
        },
      },
      { new: true }
    );

    // Handle subscription or single check-in
    if (paymentData.metadata.isSubscription && paymentData.metadata.subscriptionId) {
      // Update subscription status
      await Subscription.findByIdAndUpdate(
        paymentData.metadata.subscriptionId,
        {
          paymentStatus: 'paid',
          status: 'active',
        },
        { new: true }
      );

      // For subscriptions, no check-in records are created upfront
      // Users will check in daily and records will be created then

      // Redirect to success page with subscription info
      return NextResponse.redirect(
        new URL(
          `/user/check-in?success=true&subscriptionId=${paymentData.metadata.subscriptionId}&selectedDays=${paymentData.metadata.selectedDays}`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    } else {
      // For single check-ins, create the record now that payment is verified
      // First check if check-in already exists
      const existingCheckIn = await CheckIn.findOne({
        userId: paymentData.metadata.userId,
        serviceId: paymentData.metadata.serviceId,
        checkedInAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
      });

      if (existingCheckIn) {
        // Check-in already exists, just update its status if needed
        if (existingCheckIn.paymentStatus !== 'completed') {
          await CheckIn.findByIdAndUpdate(
            existingCheckIn._id,
            {
              paymentStatus: 'completed',
              status: 'checked_in',
              paymentVerifiedAt: new Date(),
            },
            { new: true }
          );
        }

        // Redirect to success page
        return NextResponse.redirect(
          new URL(
            `/user/check-in?success=true&serviceId=${existingCheckIn.serviceId}&checkInId=${existingCheckIn._id}`,
            process.env.NEXT_PUBLIC_APP_URL
          )
        );
      }

      // Create new check-in record
      const checkIn = await CheckIn.create({
        userId: paymentData.metadata.userId,
        serviceId: paymentData.metadata.serviceId,
        serviceName: paymentData.metadata.serviceName,
        planName: paymentData.metadata.planName,
        planType: paymentData.metadata.planType,
        durationLabel: paymentData.metadata.durationLabel,
        durationInHours: paymentData.metadata.durationInHours,
        durationInDays: paymentData.metadata.durationInDays,
        selectedRate: paymentData.metadata.selectedRate,
        amount: paymentData.metadata.checkInAmount,
        wifiIncluded: paymentData.metadata.wifiIncluded,
        status: 'checked_in',
        checkedInAt: new Date(),
        paymentStatus: 'completed',
        paymentVerifiedAt: new Date(),
      });

      // Redirect to success page
      return NextResponse.redirect(
        new URL(
          `/user/check-in?success=true&serviceId=${checkIn.serviceId}&checkInId=${checkIn._id}`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(
      new URL(
        `/user/check-in?success=false&message=${encodeURIComponent(error.message)}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}

// Receive webhook from Paystack
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature (optional - if needed)
    // const signature = request.headers.get('x-paystack-signature');
    // const hash = crypto
    //   .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    //   .update(JSON.stringify(body))
    //   .digest('hex');

    const paymentData = body.data;

    // Only handle successful charge completion events
    if (body.event !== 'charge.success') {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Dynamically import models
    const Payment = (await import('@/lib/models/Payment')).default;
    const CheckIn = (await import('@/lib/models/CheckIn')).default;
    const Subscription = (await import('@/lib/models/Subscription')).default;

    // Update payment record
    await Payment.findByIdAndUpdate(
      paymentData.metadata.paymentId,
      {
        status: 'completed',
        reference: paymentData.reference,
        paidAt: new Date(paymentData.paid_at),
      },
      { new: true }
    );

    // Handle subscription or single check-in
    if (paymentData.metadata.isSubscription && paymentData.metadata.subscriptionId) {
      // Update subscription status
      await Subscription.findByIdAndUpdate(
        paymentData.metadata.subscriptionId,
        {
          paymentStatus: 'paid',
          status: 'active',
        },
        { new: true }
      );

      // For subscriptions, no check-in records are created upfront
    } else {
      // Update single check-in record
      await CheckIn.findByIdAndUpdate(
        paymentData.metadata.checkInId,
        {
          paymentStatus: 'completed',
          status: 'checked_in',
          paymentVerifiedAt: new Date(),
        },
        { new: true }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook verification error:', error);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 500 }
    );
  }
}
