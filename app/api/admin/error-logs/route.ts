import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import ErrorLog from '@/lib/models/ErrorLog';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication via cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch error logs sorted by most recent first
    const errorLogs = await ErrorLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .lean();

    // Get total count for pagination
    const total = await ErrorLog.countDocuments();

    return NextResponse.json(
      {
        success: true,
        data: errorLogs,
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
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear error logs
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication via cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }

    // Delete all error logs
    const result = await ErrorLog.deleteMany({});

    return NextResponse.json(
      { success: true, message: `Deleted ${result.deletedCount} error logs` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting error logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete error logs' },
      { status: 500 }
    );
  }
}
