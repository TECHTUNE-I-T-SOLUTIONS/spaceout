import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CheckIn from '@/lib/models/CheckIn';
import Subscription from '@/lib/models/Subscription';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id: checkInId } = await params;

    // Find the check-in with populated user
    const checkIn = await CheckIn.findById(checkInId)
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    let subscriptionDetails = null;

    // If this check-in is part of a subscription, fetch subscription details
    if (checkIn.subscriptionId) {
      const subscription = await Subscription.findById(checkIn.subscriptionId)
        .populate('userId', 'firstName lastName email')
        .lean();

      if (subscription) {
        // Get all check-ins for this subscription
        const subscriptionCheckIns = await CheckIn.find({
          subscriptionId: checkIn.subscriptionId
        })
          .select('checkedInAt checkedOutAt paymentStatus subscriptionDay')
          .sort({ checkedInAt: 1 })
          .lean();

        // Count days used (completed check-ins)
        const daysUsed = subscriptionCheckIns.filter(ci => ci.paymentStatus === 'completed').length;

        subscriptionDetails = {
          subscription,
          checkIns: subscriptionCheckIns,
          daysUsed
        };
      }
    } else {
      // Check if this check-in ID exists in any subscription's checkIns array
      const subscription = await Subscription.findOne({
        checkIns: checkIn._id
      })
        .populate('userId', 'firstName lastName email')
        .lean();

      if (subscription) {
        // Get all check-ins for this subscription
        const subscriptionCheckIns = await CheckIn.find({
          _id: { $in: subscription.checkIns }
        })
          .select('checkedInAt checkedOutAt paymentStatus subscriptionDay')
          .sort({ checkedInAt: 1 })
          .lean();

        // Count days used (completed check-ins)
        const daysUsed = subscriptionCheckIns.filter(ci => ci.paymentStatus === 'completed').length;

        subscriptionDetails = {
          subscription,
          checkIns: subscriptionCheckIns,
          daysUsed
        };
      } else {
        // Try to find subscription by user and date range (fallback)
        const checkInDate = new Date(checkIn.checkedInAt);
        const subscriptionFallback = await Subscription.findOne({
          userId: checkIn.userId,
          serviceId: checkIn.serviceId,
          startDate: { $lte: checkInDate },
          endDate: { $gte: checkInDate },
          status: 'active'
        })
          .populate('userId', 'firstName lastName email')
          .lean();

        if (subscriptionFallback) {
          // Get all check-ins for this subscription
          const subscriptionCheckIns = await CheckIn.find({
            _id: { $in: subscriptionFallback.checkIns }
          })
            .select('checkedInAt checkedOutAt paymentStatus subscriptionDay')
            .sort({ checkedInAt: 1 })
            .lean();

          // Count days used (completed check-ins)
          const daysUsed = subscriptionCheckIns.filter(ci => ci.paymentStatus === 'completed').length;

          subscriptionDetails = {
            subscription: subscriptionFallback,
            checkIns: subscriptionCheckIns,
            daysUsed
          };
        }
      }
    }

    return NextResponse.json({
      checkIn,
      subscription: subscriptionDetails?.subscription || null,
      checkIns: subscriptionDetails?.checkIns || [],
      daysUsed: subscriptionDetails?.daysUsed || 0
    });
  } catch (error: any) {
    console.error('Error fetching check-in details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in details', message: error.message },
      { status: 500 }
    );
  }
}