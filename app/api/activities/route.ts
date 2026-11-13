import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import ActivityLog from '@/lib/models/ActivityLog';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import CheckIn from '@/lib/models/CheckIn';
import Booking from '@/lib/models/Booking';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication via cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 401 });
    }

    // Get pagination and filter parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const typeFilter = url.searchParams.get('type') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';

    // Aggregate events from multiple sources into a unified timeline
    const events: any[] = [];

    // 1. User signups
    let userQuery = User.find({}).select('name email createdAt isActive').lean();
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, any> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      userQuery = userQuery.where('createdAt').gte(dateFilter.$gte || new Date(0)).lte(dateFilter.$lte || new Date());
    }
    const users = await userQuery.sort({ createdAt: -1 }).limit(limit * 3).lean();
    users.forEach((u) => {
      events.push({
        type: 'user_signup',
        date: u.createdAt,
        title: 'New User Registered',
        name: u.name,
        email: u.email,
        status: u.isActive ? 'Active' : 'Inactive',
        metadata: { userId: u._id },
      });
    });

    // 2. Admin activity logs (non-auth category for activities page)
    const activityLogs = await ActivityLog.find({
      category: { $ne: 'auth' },
    })
      .sort({ timestamp: -1 })
      .limit(limit * 3)
      .lean();
    activityLogs.forEach((log) => {
      events.push({
        type: 'admin_activity',
        date: log.timestamp,
        title: log.action,
        details: log.details,
        adminName: log.adminName,
        adminEmail: log.adminEmail,
        category: log.category,
        metadata: log.metadata,
      });
    });

    // 3. Completed payments
    const payments = await Payment.find({ status: 'completed' })
      .select('amount email serviceName createdAt reference status')
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .lean();
    payments.forEach((p) => {
      events.push({
        type: 'payment',
        date: p.createdAt,
        title: 'Payment Completed',
        amount: p.amount,
        email: p.email,
        serviceName: p.serviceName,
        reference: p.reference,
        status: 'Completed',
        metadata: { paymentId: p._id },
      });
    });

    // 4. Check-ins (recent)
    const checkins = await CheckIn.find({})
      .select('userName userEmail serviceName planName createdAt status')
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .lean();
    checkins.forEach((c) => {
      events.push({
        type: 'checkin',
        date: c.createdAt,
        title: 'Check-In',
        userName: c.userName,
        userEmail: c.userEmail,
        serviceName: c.serviceName,
        planName: c.planName,
        status: c.status,
        metadata: { checkInId: c._id },
      });
    });

    // 5. Bookings (recent)
    const bookings = await Booking.find({})
      .select('userName userEmail serviceName status createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .lean();
    bookings.forEach((b) => {
      events.push({
        type: 'booking',
        date: b.createdAt,
        title: 'New Booking',
        userName: b.userName,
        userEmail: b.userEmail,
        serviceName: b.serviceName,
        status: b.status,
        metadata: { bookingId: b._id },
      });
    });

    // Filter by type if specified
    let filtered = events;
    if (typeFilter) {
      filtered = events.filter((e) => e.type === typeFilter);
    }

    // Sort all events by date (most recent first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginated,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
