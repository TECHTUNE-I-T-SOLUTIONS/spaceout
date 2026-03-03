import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import ErrorLog from '@/lib/models/ErrorLog';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;

    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { message: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const errorLogs = await ErrorLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    const totalCount = await ErrorLog.countDocuments();

    return NextResponse.json(
      {
        errorLogs,
        pagination: {
          total: totalCount,
          page,
          pages: Math.ceil(totalCount / limit),
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching error logs:', error);

    return NextResponse.json(
      { message: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;

    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { message: 'Forbidden: SuperAdmin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { errorLogId } = await request.json();

    if (!errorLogId) {
      return NextResponse.json(
        { message: 'Error log ID is required' },
        { status: 400 }
      );
    }

    const result = await ErrorLog.findByIdAndDelete(errorLogId);

    if (!result) {
      return NextResponse.json(
        { message: 'Error log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Error log deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting error log:', error);

    return NextResponse.json(
      { message: 'Failed to delete error log' },
      { status: 500 }
    );
  }
}
