import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import Payment from '@/lib/models/Payment';
import Booking from '@/lib/models/Booking';
import CheckIn from '@/lib/models/CheckIn';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let dateQuery: any = {};
    if (dateFrom && dateTo) {
      dateQuery.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    }

    // Total revenue from all completed payments
    const paymentStats = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = paymentStats.length > 0 ? paymentStats[0].totalRevenue : 0;

    // Total bookings
    const totalBookings = await Booking.countDocuments({
      ...dateQuery,
    });

    // Total check-ins
    const totalCheckIns = await CheckIn.countDocuments({
      ...dateQuery,
    });

    // Total users
    const totalUsers = await User.countDocuments({});

    // Monthly trend data
    const monthlyData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get monthly bookings
    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          ...dateQuery,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Merge monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mergedMonthly = monthlyData.map((item) => {
      const [year, month] = item._id.split('-');
      const booking = monthlyBookings.find((b) => b._id === item._id);
      return {
        month: monthNames[parseInt(month) - 1],
        revenue: Math.round(item.revenue),
        bookings: booking?.count || 0,
      };
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalRevenue: Math.round(totalRevenue || 0),
      totalBookings: totalBookings || 0,
      totalCheckIns: totalCheckIns || 0,
      monthlyTrend: mergedMonthly.length > 0 ? mergedMonthly : [],
      lastUpdated: new Date(),
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch analytics', error: error.message },
      { status: 500 }
    );
  }
}
