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

    const paymentData = response.data.data;

    if (!response.data.status || !paymentData.status) {
      const isAdminInitiated = paymentData.metadata?.adminInitiated;
      const redirectPath = isAdminInitiated ? '/admin/dashboard/checkins' : '/user/check-in';
      return NextResponse.redirect(
        new URL(
          `${redirectPath}?success=false&message=Payment not verified`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }

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
          paymentStatus: 'completed',
          status: 'active',
        },
        { new: true }
      );

      // For subscriptions, no check-in records are created upfront
      // Users will check in daily and records will be created then

      // Redirect to success page with subscription info
      const isAdminInitiated = paymentData.metadata?.adminInitiated;
      const redirectPath = isAdminInitiated ? '/admin/dashboard/checkins' : '/user/check-in';
      return NextResponse.redirect(
        new URL(
          `${redirectPath}?success=true&subscriptionId=${paymentData.metadata.subscriptionId}&selectedDays=${paymentData.metadata.selectedDays}`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    } else {
        // Handle explicit membership purchases for monthly/yearly plans
        const meta: any = paymentData.metadata || {};
        if (meta.membershipFee && meta.membershipFee > 0) {
          // If a subscription record exists, update it; otherwise create one
          let subscriptionId = meta.subscriptionId || null;

            if (subscriptionId) {
            await Subscription.findByIdAndUpdate(
              subscriptionId,
              { paymentStatus: 'completed', status: 'active' },
              { new: true }
            );
          } else {
            // Create subscription for membership plan
            const start = new Date();
            // Normalize duration into days (metadata may be days, months, or years in some callers)
            const normalize = (d: any, planName?: string, durationLabel?: string) => {
              let days = Number(d) || 0;
              const name = ((planName || '') + ' ' + (durationLabel || '')).toLowerCase();
              if (days > 0 && days < 31) {
                if (name.includes('year') || name.includes('annual') || name.includes('yr')) return days * 365;
                if (name.includes('month') || name.includes('mo')) return days * 30;
                return days;
              }
              if (days > 0 && days <= 12 && (name.includes('month') || name.includes('mo'))) return days * 30;
              if (days >= 31 && days <= 365 * 20) return days;
              if (days === 1 && (name.includes('year') || name.includes('annual') || name.includes('yr'))) return 365;
              return 365;
            };

            const durationDays = normalize(meta.durationInDays || meta.duration || meta.selectedDays, meta.planName, meta.durationLabel);
            const end = new Date(start.getTime());
            end.setDate(end.getDate() + durationDays);

            const newSub = await Subscription.create({
              userId: meta.userId,
              serviceId: meta.serviceId,
              serviceName: meta.serviceName,
              planName: meta.planName,
              planType: meta.planType,
              durationLabel: meta.durationLabel,
              durationInDays: durationDays,
              durationInHours: meta.durationInHours || meta.selectedHours || undefined,
              selectedRate: meta.selectedRate,
              amountPerDay: meta.checkInAmount || 0,
              totalAmount: meta.membershipFee || meta.totalAmount || 0,
              wifiIncluded: meta.wifiIncluded,
              status: 'active',
              paymentStatus: 'completed',
              startDate: start,
              endDate: end,
              checkIns: [],
            });

            subscriptionId = newSub._id.toString();
            // Also create UserSubscription record for membership UI
            try {
              const UserSubscription = (await import('@/lib/models/UserSubscription')).default;
              const User = (await import('@/lib/models/User')).default;

              const userSub = new UserSubscription({
                userId: meta.userId,
                serviceId: meta.serviceId,
                planName: meta.planName || meta.durationLabel || 'Membership',
                serviceName: meta.serviceName,
                price: meta.membershipFee || meta.totalAmount || 0,
                duration: durationDays,
                purchaseDate: start,
                expiryDate: end,
                status: 'active',
                paymentReference: paymentData.reference,
                isAccessCard: true,
                autoRenew: false,
              });

              await userSub.save();

              await User.findByIdAndUpdate(meta.userId, {
                hasMembership: true,
                membershipStatus: 'active',
                membershipActivatedAt: start,
                membershipExpiryDate: end,
                membershipExpiry: end,
              });
            } catch (err) {
              console.error('Failed to create UserSubscription for membership (webhook):', err);
            }
            // Also create a UserSubscription record so membership UI/controllers find it
            try {
              const UserSubscription = (await import('@/lib/models/UserSubscription')).default;
              const User = (await import('@/lib/models/User')).default;

              const userSub = new UserSubscription({
                userId: meta.userId,
                serviceId: meta.serviceId,
                planName: meta.planName || meta.durationLabel || 'Membership',
                serviceName: meta.serviceName,
                price: meta.membershipFee || meta.totalAmount || 0,
                duration: durationDays,
                purchaseDate: start,
                expiryDate: end,
                status: 'active',
                paymentReference: paymentData.reference,
                isAccessCard: true,
                autoRenew: false,
              });

              await userSub.save();

              // Update user's membership flags
              await User.findByIdAndUpdate(meta.userId, {
                hasMembership: true,
                membershipStatus: 'active',
                membershipActivatedAt: start,
                membershipExpiryDate: end,
                membershipExpiry: end,
              });
            } catch (err) {
              console.error('Failed to create UserSubscription for membership:', err);
            }
          }

          // If user also paid for an immediate check-in (checkInAmount), create check-in record
          if (meta.checkInAmount && meta.checkInAmount > 0) {
            const checkIn = await CheckIn.create({
              userId: meta.userId,
              serviceId: meta.serviceId,
              serviceName: meta.serviceName,
              planName: meta.planName,
              planType: meta.planType,
              durationLabel: meta.durationLabel,
              durationInHours: meta.durationInHours,
              durationInDays: meta.durationInDays,
              selectedRate: meta.selectedRate,
              amount: meta.checkInAmount,
              wifiIncluded: meta.wifiIncluded,
              status: 'checked_in',
              checkedInAt: new Date(),
              paymentStatus: 'completed',
              paymentVerifiedAt: new Date(),
              subscriptionId: subscriptionId,
            });

            const isAdminInitiated = paymentData.metadata?.adminInitiated;
            const redirectPath = isAdminInitiated ? '/admin/dashboard/checkins' : '/user/check-in';
            return NextResponse.redirect(
              new URL(
                `${redirectPath}?success=true&subscriptionId=${subscriptionId}&checkInId=${checkIn._id}`,
                process.env.NEXT_PUBLIC_APP_URL
              )
            );
          }

          const isAdminInitiated = paymentData.metadata?.adminInitiated;
          const redirectPath = isAdminInitiated ? '/admin/dashboard/checkins' : '/user/check-in';
          return NextResponse.redirect(
            new URL(
              `${redirectPath}?success=true&subscriptionId=${subscriptionId}`,
              process.env.NEXT_PUBLIC_APP_URL
            )
          );
        }
      // For single check-ins, create the record now that payment is verified
      // First check if check-in already exists with this payment reference
      const existingCheckIn = await CheckIn.findOne({
        userId: paymentData.metadata.userId,
        serviceId: paymentData.metadata.serviceId,
        paymentStatus: 'pending',
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
        const isAdminInitiated = paymentData.metadata?.adminInitiated;
        const redirectPath = isAdminInitiated ? '/admin/dashboard/checkins' : '/user/check-in';
        return NextResponse.redirect(
          new URL(
            `${redirectPath}?success=true&serviceId=${existingCheckIn.serviceId}&checkInId=${existingCheckIn._id}`,
            process.env.NEXT_PUBLIC_APP_URL
          )
        );
      }

      // Create new check-in record
      const checkInAmount = paymentData.metadata.checkInAmount || paymentData.metadata.totalPrice || paymentData.metadata.price || (paymentData.amount / 100);
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
        amount: checkInAmount,
        wifiIncluded: paymentData.metadata.wifiIncluded || false,
        status: 'checked_in',
        checkedInAt: new Date(),
        paymentStatus: 'completed',
        paymentVerifiedAt: new Date(),
      });

      // Update payment record with check-in ID
      await Payment.findByIdAndUpdate(
        paymentData.metadata.paymentId,
        { checkInId: checkIn._id },
        { new: true }
      );

      // Redirect to success page
      const isAdminInitiated = paymentData.metadata?.adminInitiated;
      const redirectPath = isAdminInitiated ? '/admin/dashboard/checkins' : '/user/check-in';
      return NextResponse.redirect(
        new URL(
          `${redirectPath}?success=true&serviceId=${checkIn.serviceId}&checkInId=${checkIn._id}`,
          process.env.NEXT_PUBLIC_APP_URL
        )
      );
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    // Try to get reference from URL to determine admin context
    const reference = request.nextUrl.searchParams.get('reference');
    let isAdminInitiated = false;
    
    if (reference) {
      try {
        await dbConnect();
        const Payment = (await import('@/lib/models/Payment')).default;
        const payment = await Payment.findOne({ reference });
        if (payment?.metadata?.adminInitiated) {
          isAdminInitiated = true;
        }
      } catch (err) {
        console.error('Error checking payment metadata:', err);
      }
    }
    
    const redirectPath = isAdminInitiated ? '/admin/dashboard/checkins' : '/user/check-in';
    return NextResponse.redirect(
      new URL(
        `${redirectPath}?success=false&message=${encodeURIComponent(error.message)}`,
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
          paymentStatus: 'completed',
          status: 'active',
        },
        { new: true }
      );

      // For subscriptions, no check-in records are created upfront
    } else if (paymentData.metadata.membershipFee && paymentData.metadata.membershipFee > 0) {
      // Handle membership purchases (monthly/yearly)
      const meta: any = paymentData.metadata || {};
      let subscriptionId = meta.subscriptionId || null;

      if (subscriptionId) {
        await Subscription.findByIdAndUpdate(
          subscriptionId,
          { paymentStatus: 'completed', status: 'active' },
          { new: true }
        );
      } else {
        const start = new Date();
        // Determine duration: prefer explicit days; if hours present, treat as 1-day hourly subscription
        const durationDays = meta.durationInDays || (meta.selectedDays && meta.selectedDays > 1 ? meta.selectedDays : (meta.durationInHours ? 1 : 30));
        const end = new Date(start.getTime());
        end.setDate(end.getDate() + durationDays);

        const newSub = await Subscription.create({
          userId: meta.userId,
          serviceId: meta.serviceId,
          serviceName: meta.serviceName,
          planName: meta.planName,
          planType: meta.planType,
          durationLabel: meta.durationLabel,
          durationInDays: durationDays,
          durationInHours: meta.durationInHours || meta.selectedHours || undefined,
          selectedRate: meta.selectedRate,
          amountPerDay: meta.checkInAmount || 0,
          totalAmount: meta.membershipFee || meta.totalAmount || 0,
          wifiIncluded: meta.wifiIncluded,
          status: 'active',
          paymentStatus: 'completed',
          startDate: start,
          endDate: end,
          checkIns: [],
        });

        subscriptionId = newSub._id.toString();
      }

      // If user also paid for an immediate check-in, create it
      if (meta.checkInAmount && meta.checkInAmount > 0) {
        await CheckIn.create({
          userId: meta.userId,
          serviceId: meta.serviceId,
          serviceName: meta.serviceName,
          planName: meta.planName,
          planType: meta.planType,
          durationLabel: meta.durationLabel,
          durationInHours: meta.durationInHours,
          durationInDays: meta.durationInDays,
          selectedRate: meta.selectedRate,
          amount: meta.checkInAmount,
          wifiIncluded: meta.wifiIncluded,
          status: 'checked_in',
          checkedInAt: new Date(),
          paymentStatus: 'completed',
          paymentVerifiedAt: new Date(),
          subscriptionId: subscriptionId,
        });
      }
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
