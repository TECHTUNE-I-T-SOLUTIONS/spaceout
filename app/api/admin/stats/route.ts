import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Booking from '@/lib/models/Booking';
import Payment from '@/lib/models/Payment';
import Review from '@/lib/models/Review';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get active users count
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get total revenue from completed payments
    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Get pending bookings count
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Get average rating
    const ratingData = await Review.aggregate([
      { $match: { approved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const avgRating = ratingData[0]?.avg ? Math.round(ratingData[0].avg * 10) / 10 : 0;

    // Get total bookings
    const totalBookings = await Booking.countDocuments();

    // Get confirmed bookings
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

    // Get cancelled bookings
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Get total reviews
    const totalReviews = await Review.countDocuments();

    // Calculate stats
    const stats = {
      activeUsers,
      totalRevenue,
      pendingBookings,
      avgRating,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalReviews,
      completionRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0,
      monthlyGrowth: 12.5, // Placeholder
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: (error as any).message },
      { status: 500 }
    );
  }
}
