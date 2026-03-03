import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Booking from '@/lib/models/Booking';
import Service from '@/lib/models/Service';
import ErrorLog from '@/lib/models/ErrorLog';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    let query: any = {};

    if (userRole === 'user') {
      query.userId = userId;
    } else if (userRole === 'admin') {
      query.branchId = branchId;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('serviceId', 'name category')
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);

    await ErrorLog.create({
      route: '/api/bookings',
      error: error.message || 'Failed to fetch bookings',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    const { serviceId, startDate, endDate, notes } = await request.json();

    // Validation
    if (!serviceId || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'serviceId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    const booking = await Booking.create({
      userId,
      branchId,
      serviceId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes,
      status: 'pending',
    });

    return NextResponse.json(
      { message: 'Booking created successfully', booking },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);

    const session = await auth();
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/bookings',
      error: error.message || 'Failed to create booking',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;

    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { bookingId, status } = await request.json();

    if (!bookingId || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid bookingId or status' },
        { status: 400 }
      );
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Booking updated successfully', booking },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating booking:', error);

    const session = await auth();
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/bookings',
      error: error.message || 'Failed to update booking',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
