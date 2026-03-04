import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import UserSubscription from '@/lib/models/UserSubscription';
import Admin from '@/lib/models/Admin';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication via cookies
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;
    const adminEmail = cookieStore.get('admin_email')?.value;

    if (!adminId || !adminEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify admin
    const admin = await Admin.findById(adminId).select('email role isActive');
    
    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Admin access denied' },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // optional filter
    const serviceName = searchParams.get('serviceName'); // optional filter

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (serviceName) {
      filter.serviceName = { $regex: serviceName, $options: 'i' };
    }

    // Fetch subscriptions with user details
    const subscriptions = await UserSubscription.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await UserSubscription.countDocuments(filter);

    return NextResponse.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
