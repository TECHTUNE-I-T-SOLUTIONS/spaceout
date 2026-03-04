import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get('page') || '1';
    const limit = request.nextUrl.searchParams.get('limit') || '20';
    const status = request.nextUrl.searchParams.get('status');
    const date = request.nextUrl.searchParams.get('date');
    const search = request.nextUrl.searchParams.get('search');
    const checkedOut = request.nextUrl.searchParams.get('checkedOut');
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'checkedInAt';
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || '-1';

    await dbConnect();

    const CheckIn = (await import('@/lib/models/CheckIn')).default;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query: any = {};

    // Filter by checked-out status
    if (checkedOut === 'true') {
      query.checkedOutAt = { $exists: true, $ne: null };
    } else if (checkedOut === 'false') {
      query.checkedOutAt = { $exists: false };
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by date (for that day's check-ins)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.checkedInAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // Search by service name, user email, or plan name
    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { planName: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await CheckIn.countDocuments(query);

    // Get check-ins with sorting
    let checkInsQuery = CheckIn.find(query)
      .select('userId serviceName serviceName planName planType durationLabel amount selectedRate status paymentStatus checkedInAt checkedOutAt')
      .populate('userId', 'email firstName lastName')
      .sort({ [sortBy]: parseInt(sortOrder) })
      .limit(limitNum)
      .skip(skip)
      .lean();

    let checkIns = await checkInsQuery;

    // Filter by user search (firstName, lastName, email) after population
    if (search) {
      checkIns = checkIns.filter((checkIn: any) => {
        const user = checkIn.userId as any;
        if (!user) return false;
        
        const searchLower = search.toLowerCase();
        return (
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchLower))
        );
      });
    }

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
