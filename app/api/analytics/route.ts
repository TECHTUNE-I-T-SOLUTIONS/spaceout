import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import CheckIn from '@/lib/models/CheckIn';
import Review from '@/lib/models/Review';
import Booking from '@/lib/models/Booking';
import User from '@/lib/models/User';
import ErrorLog from '@/lib/models/ErrorLog';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const branchId = (session.user as any)?.branchId;

    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const queryBranchId = searchParams.get('branchId') || branchId;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let dateQuery: any = {};
    if (dateFrom && dateTo) {
      dateQuery.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }

    const branchQuery = userRole === 'superadmin' ? (queryBranchId ? { branchId: queryBranchId } : {}) : { branchId };

    // Total revenue
    const paymentAgg = await Payment.aggregate([
      {
        $match: {
          ...branchQuery,
          status: 'completed',
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: '$branchId',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Revenue by service
    const serviceRevenue = await Payment.aggregate([
      {
        $match: {
          ...branchQuery,
          status: 'completed',
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: '$serviceId',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
    ]);

    // Active check-ins
    const activeCheckIns = await CheckIn.countDocuments({
      ...branchQuery,
      checkOutTime: null,
    });

    // Membership count
    const membershipCount = await User.countDocuments({
      branchId: branchQuery.branchId,
      membership: true,
    });

    // Average review rating
    const averageRating = await Review.aggregate([
      {
        $match: {
          ...branchQuery,
          approved: true,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // Booking statistics
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          ...branchQuery,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json(
      {
        totalRevenue: paymentAgg[0]?.totalRevenue || 0,
        paymentCount: paymentAgg[0]?.count || 0,
        serviceRevenue,
        activeCheckIns,
        membershipCount,
        averageRating: averageRating[0]?.avgRating || 0,
        totalReviews: averageRating[0]?.totalReviews || 0,
        bookingStats,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching analytics:', error);

    const session = await auth();
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/analytics',
      error: error.message || 'Failed to fetch analytics',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
