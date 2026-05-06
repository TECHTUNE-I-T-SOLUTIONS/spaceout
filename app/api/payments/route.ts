import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get('page') || '1';
    const limit = request.nextUrl.searchParams.get('limit') || '20';
    const status = request.nextUrl.searchParams.get('status');
    const search = request.nextUrl.searchParams.get('search');
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || '-1';

    await dbConnect();

    const Payment = (await import('@/lib/models/Payment')).default;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query: any = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by reference, email, or service name
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await Payment.countDocuments(query);

    // Get payments with sorting
    const payments = await Payment.find(query)
      .select('reference paystackReference amount status email serviceName userId createdAt paymentVerifiedAt')
      .sort({ [sortBy]: parseInt(sortOrder) })
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
