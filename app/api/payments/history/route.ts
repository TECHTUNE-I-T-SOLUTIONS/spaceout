import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const limit = request.nextUrl.searchParams.get('limit') || '10';
    const page = request.nextUrl.searchParams.get('page') || '1';
    const type = request.nextUrl.searchParams.get('type'); // 'all', 'checkin', 'membership'
    const status = request.nextUrl.searchParams.get('status'); // 'completed', 'pending', etc

    await dbConnect();

    const Payment = (await import('@/lib/models/Payment')).default;

    const query: any = { userId: session.user.id };

    // Filter by type if provided
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Payment.countDocuments(query);

    // Get payment records sorted by date (newest first)
    const payments = await Payment.find(query)
      .select(
        'type email serviceName planName amount currency status reference paystackReference paidAt metadata createdAt'
      )
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean();

    return NextResponse.json(
      {
        payments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', message: error.message },
      { status: 500 }
    );
  }
}
