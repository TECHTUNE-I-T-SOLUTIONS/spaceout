import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Session } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';

declare module 'next-auth' {
  interface User {
    id: string;
  }
  interface Session {
    user: User & {
      id: string;
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const limit = request.nextUrl.searchParams.get('limit') || '10';
    const page = request.nextUrl.searchParams.get('page') || '1';
    const status = request.nextUrl.searchParams.get('status');

    await dbConnect();

    const CheckIn = (await import('@/lib/models/CheckIn')).default;

    const query: any = { userId: session.user.id };

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await CheckIn.countDocuments(query);

    // Get check-in records sorted by date (newest first)
    const checkIns = await CheckIn.find(query)
      .select(
        'serviceId serviceName planName planType durationLabel amount selectedRate status paymentStatus checkedInAt checkedOutAt'
      )
      .sort({ checkedInAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean();

    return NextResponse.json(
      {
        checkIns,
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
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins', message: error.message },
      { status: 500 }
    );
  }
}
