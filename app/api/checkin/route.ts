import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import CheckIn from '@/lib/models/CheckIn';
import Subscription from '@/lib/models/Subscription';
import User from '@/lib/models/User';
import Service from '@/lib/models/Service';
import ErrorLog from '@/lib/models/ErrorLog';
import PushSubscription from '@/lib/models/PushSubscription';
import { sendCheckInPushNotification, sendAdminNotificationOnCheckIn } from '@/lib/push-notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    const { serviceId, subscriptionId, bookingId } = await request.json();

    if (!serviceId && !subscriptionId && !bookingId) {
      return NextResponse.json(
        { message: 'Either Service ID, Subscription ID, or Booking ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists and has active account
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: 'User account is inactive' },
        { status: 403 }
      );
    }

    let serviceIdToUse = serviceId;
    let service;

    if (bookingId) {
      // Handle booking check-in
      const Booking = (await import('@/lib/models/Booking')).default;
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return NextResponse.json(
          { message: 'Booking not found' },
          { status: 404 }
        );
      }

      if (booking.userId.toString() !== userId) {
        return NextResponse.json(
          { message: 'Unauthorized access to booking' },
          { status: 403 }
        );
      }

      if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
        return NextResponse.json(
          { message: 'Booking is not confirmed or payment not completed' },
          { status: 400 }
        );
      }

      // Check if booking is within date range
      const now = new Date();
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      if (now < startDate || now > endDate) {
        return NextResponse.json(
          { message: 'Booking is not valid for today' },
          { status: 400 }
        );
      }

      // Check if user has already checked in for this booking today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingCheckIn = await CheckIn.findOne({
        bookingId: bookingId,
        userId: userId,
        checkedInAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (existingCheckIn) {
        if (existingCheckIn.status === 'checked_in') {
          return NextResponse.json(
            { message: 'Already checked in for this booking today' },
            { status: 400 }
          );
        }
        // If it exists but not checked in, update it
        checkIn = await CheckIn.findByIdAndUpdate(
          existingCheckIn._id,
          {
            status: 'checked_in',
            checkedInAt: new Date(),
          },
          { new: true }
        ).populate('serviceId', 'name');
      } else {
        // Create new check-in record for today
        checkIn = await CheckIn.create({
          userId,
          serviceId: booking.serviceId,
          serviceName: booking.selectedPlan?.planName || 'Booked Service',
          planName: booking.selectedPlan?.planName || 'Booking',
          planType: booking.selectedPlan?.planType || 'booking',
          durationLabel: `${booking.durationInDays} Day${booking.durationInDays > 1 ? 's' : ''} Booking`,
          selectedRate: booking.isMember ? 'member' : 'nonMember',
          amount: booking.totalPrice / booking.durationInDays, // Daily rate
          wifiIncluded: false, // Bookings don't include wifi by default
          status: 'checked_in',
          paymentStatus: 'completed', // Already paid for booking
          checkedInAt: new Date(),
          bookingId: bookingId,
        });

        // Add this check-in to the booking's checkInRecords array
        await Booking.findByIdAndUpdate(bookingId, {
          $push: { checkInRecords: checkIn._id }
        });
      }
    } else if (subscriptionId) {
      // Handle subscription check-in
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return NextResponse.json(
          { message: 'Subscription not found' },
          { status: 404 }
        );
      }

      if (subscription.userId.toString() !== userId) {
        return NextResponse.json(
          { message: 'Unauthorized access to subscription' },
          { status: 403 }
        );
      }

      if (subscription.status !== 'active' || subscription.paymentStatus !== 'completed') {
        return NextResponse.json(
          { message: 'Subscription is not active or payment not completed' },
          { status: 400 }
        );
      }

      // Check if subscription has expired
      const now = new Date();
      if (subscription.endDate < now) {
        return NextResponse.json(
          { message: 'Subscription has expired' },
          { status: 400 }
        );
      }

      // Use service from subscription
      serviceIdToUse = subscription.serviceId;
      service = await Service.findById(serviceIdToUse);
    } else {
      // Handle single service check-in
      service = await Service.findById(serviceIdToUse);
    }

    // Verify service exists
    if (!service || !service.isActive) {
      return NextResponse.json(
        { message: 'Service not found or inactive' },
        { status: 404 }
      );
    }

    let checkIn;

    if (subscriptionId) {
      // Handle subscription check-in
      const subscription = await Subscription.findById(subscriptionId);

      // Check if user has already checked in today for this subscription
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isHourlySub = !!subscription.durationInHours;

      if (isHourlySub) {
        // For hourly subscriptions allow multiple check-ins per day up to durationInHours
        const usedHoursToday = await CheckIn.countDocuments({
          subscriptionId: subscriptionId,
          userId: userId,
          checkedInAt: { $gte: today, $lt: tomorrow }
        });

        if (usedHoursToday >= (subscription.durationInHours || 0)) {
          return NextResponse.json(
            { message: 'All subscription hours have been used for today' },
            { status: 400 }
          );
        }

        // Create a new hourly check-in record for today
        const hourIndex = usedHoursToday + 1;
        checkIn = await CheckIn.create({
          userId,
          serviceId: serviceIdToUse,
          serviceName: subscription.serviceName,
          planName: subscription.planName,
          planType: subscription.planType,
          durationLabel: `${subscription.durationInHours} Hour${(subscription.durationInHours || 0) > 1 ? 's' : ''} (Subscription)`,
          durationInHours: 1,
          selectedRate: subscription.selectedRate,
          amount: subscription.amountPerDay || 0,
          wifiIncluded: subscription.wifiIncluded,
          status: 'checked_in',
          paymentStatus: 'completed',
          checkedInAt: new Date(),
          subscriptionId: subscriptionId,
          subscriptionDay: hourIndex,
        });

        // Add this check-in to the subscription's checkIns array
        await Subscription.findByIdAndUpdate(subscriptionId, {
          $push: { checkIns: checkIn._id }
        });
      } else {
        const existingCheckIn = await CheckIn.findOne({
          subscriptionId: subscriptionId,
          userId: userId,
          checkedInAt: {
            $gte: today,
            $lt: tomorrow
          }
        });

        if (existingCheckIn) {
          if (existingCheckIn.status === 'checked_in') {
            return NextResponse.json(
              { message: 'Already checked in for today' },
              { status: 400 }
            );
          }
          // If it exists but not checked in, update it
          checkIn = await CheckIn.findByIdAndUpdate(
            existingCheckIn._id,
            {
              status: 'checked_in',
              checkedInAt: new Date(),
            },
            { new: true }
          ).populate('serviceId', 'name');
        } else {
          // Count all used days (include checked_out as used)
          const usedDays = await CheckIn.countDocuments({
            subscriptionId: subscriptionId,
            userId: userId,
            checkedInAt: { $lt: tomorrow }
          });

          // Check if subscription has remaining days
          if (usedDays >= subscription.durationInDays) {
            return NextResponse.json(
              { message: 'All subscription days have been used' },
              { status: 400 }
            );
          }

          // Calculate which day this is in the subscription
          const subscriptionDay = usedDays + 1;

          // Create new check-in record for today
          checkIn = await CheckIn.create({
            userId,
            serviceId: serviceIdToUse,
            serviceName: subscription.serviceName,
            planName: subscription.planName,
            planType: subscription.planType,
            durationLabel: '1 Day (Subscription)',
            selectedRate: subscription.selectedRate,
            amount: subscription.amountPerDay,
            wifiIncluded: subscription.wifiIncluded,
            status: 'checked_in',
            paymentStatus: 'completed', // Already paid for subscription
            checkedInAt: new Date(),
            subscriptionId: subscriptionId,
            subscriptionDay: subscriptionDay,
          });

          // Add this check-in to the subscription's checkIns array
          await Subscription.findByIdAndUpdate(subscriptionId, {
            $push: { checkIns: checkIn._id }
          });
        }
      }
    } else {
      // Handle single service check-in (legacy support)
      // Check if user already checked in today for this service
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingCheckIn = await CheckIn.findOne({
        userId,
        serviceId: serviceIdToUse,
        checkedInAt: {
          $gte: today,
          $lt: tomorrow
        },
        status: 'checked_in'
      });

      if (existingCheckIn) {
        return NextResponse.json(
          { message: 'Already checked in for this service today' },
          { status: 400 }
        );
      }

      // Create new check-in record (this shouldn't happen in normal flow, but for legacy support)
      checkIn = await CheckIn.create({
        userId,
        serviceId: serviceIdToUse,
        serviceName: service.name,
        planName: 'Walk-in',
        planType: 'walk-in',
        durationLabel: 'Walk-in',
        selectedRate: 'nonMember',
        amount: 0,
        wifiIncluded: false,
        status: 'checked_in',
        paymentStatus: 'completed',
        checkedInAt: new Date(),
      });
    }

    // Send check-in notification to user
    try {
      const userSubscriptions = await PushSubscription.find({
        userId,
        isActive: true,
      });

      for (const sub of userSubscriptions) {
        try {
          const subscriptionJson = sub.subscription as any;
          await sendCheckInPushNotification(subscriptionJson);
        } catch (err) {
          console.error('Failed to send check-in push notification:', err);
        }
      }
    } catch (err) {
      console.error('Failed to get user push subscriptions:', err);
    }

    // Notify admins about user check-in
    try {
      const adminSubscriptions = await PushSubscription.find({
        userRole: 'admin',
        isActive: true,
      });

      const subscriptionJsons = adminSubscriptions.map((sub) => sub.subscription as any);

      if (subscriptionJsons.length > 0) {
        await sendAdminNotificationOnCheckIn(subscriptionJsons, user.name);
      }
    } catch (err) {
      console.error('Failed to notify admins about check-in:', err);
    }

    return NextResponse.json(
      {
        message: 'Check-in successful',
        checkIn,
        subscriptionId: subscriptionId || null,
        isSubscriptionCheckIn: !!subscriptionId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Check-in error:', error);

    // Log error to database
    try {
      await ErrorLog.create({
        message: 'Check-in API error',
        error: error.message,
        stack: error.stack,
        userId: (await getServerSession(authOptions) as any)?.user?.id,
        endpoint: '/api/checkin',
        method: 'POST',
        timestamp: new Date(),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
