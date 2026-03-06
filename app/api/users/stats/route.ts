import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Booking from '@/lib/models/Booking';
import Payment from '@/lib/models/Payment';
import Review from '@/lib/models/Review';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;

    await dbConnect();

    // Get user's total bookings
    const totalBookings = await Booking.countDocuments({ userId });

    // Get user's completed bookings
    const completedBookings = await Booking.countDocuments({ 
      userId, 
      status: 'confirmed' 
    });

    // Get user's upcoming bookings
    const upcomingBookings = await Booking.countDocuments({ 
      userId, 
      status: 'confirmed',
      checkinDate: { $gte: new Date() }
    });

    // Get user's pending bookings
    const pendingBookings = await Booking.countDocuments({ 
      userId, 
      status: 'pending' 
    });

    // Get user's total spent
    const paymentData = await Payment.aggregate([
      { $match: { userId: userId as any } },
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalSpent = paymentData[0]?.total || 0;

    // Get user's average rating given
    const userReviews = await Review.aggregate([
      { $match: { userId: userId as any } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const avgRatingGiven = userReviews[0]?.avg ? Math.round(userReviews[0].avg * 10) / 10 : 0;

    // Get user's reviews count
    const totalReviewsGiven = await Review.countDocuments({ userId });

    // Get user subscription status
    const userData = await User.findById(userId).select('subscription membershipStatus');
    const subscription = userData?.subscription || null;
    const membershipStatus = userData?.membershipStatus || 'none';

    // Get user's last booking
    const lastBooking = await Booking.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('branchId', 'name')
      .select('branchId checkinDate checkoutDate status');

    // Calculate completion rate
    const bookingCompletionRate = totalBookings > 0 
      ? Math.round((completedBookings / totalBookings) * 100) 
      : 0;

    const stats = {
      totalBookings,
      completedBookings,
      upcomingBookings,
      pendingBookings,
      totalSpent,
      avgRatingGiven,
      totalReviewsGiven,
      bookingCompletionRate,
      subscription,
      membershipStatus,
      lastBooking: lastBooking ? {
        id: lastBooking._id.toString(),
        branch: lastBooking.branchId?.name || 'Unknown',
        checkinDate: lastBooking.checkinDate,
        checkoutDate: lastBooking.checkoutDate,
        status: lastBooking.status,
      } : null,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: (error as any).message },
      { status: 500 }
    );
  }
}
