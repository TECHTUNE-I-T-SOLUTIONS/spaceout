import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import ActivityLog from '@/lib/models/ActivityLog';

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
    const adminFilter = url.searchParams.get('admin') || '';
    const categoryFilter = url.searchParams.get('category') || '';
    const actionFilter = url.searchParams.get('action') || '';
    const search = url.searchParams.get('search') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';

    // Build filter query
    const filter: Record<string, any> = {};

    if (adminFilter) {
      filter.adminEmail = adminFilter;
    }

    if (categoryFilter) {
      filter.category = categoryFilter;
    }

    if (actionFilter) {
      filter.action = actionFilter;
    }

    if (search) {
      filter.$or = [
        { adminName: { $regex: search, $options: 'i' } },
        { adminEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) {
        filter.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.timestamp.$lte = new Date(dateTo);
      }
    }

    // Fetch activity logs sorted by most recent first
    const activityLogs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await ActivityLog.countDocuments(filter);

    return NextResponse.json(
      {
        success: true,
        data: activityLogs,
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
    console.error('Error fetching admin activity logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin activity logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { action, details, category, metadata, adminId: logAdminId, adminEmail, adminName } = await request.json();

    if (!action || !details) {
      return NextResponse.json(
        { error: 'Action and details are required' },
        { status: 400 }
      );
    }

    await ActivityLog.create({
      adminId: logAdminId || admin._id,
      adminEmail: adminEmail || admin.email,
      adminName: adminName || admin.name,
      action,
      details,
      category: category || 'other',
      metadata,
      timestamp: new Date(),
    });

    return NextResponse.json(
      { success: true, message: 'Activity logged successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error logging admin activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log activity' },
      { status: 500 }
    );
  }
}
