import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';
import Booking from '@/lib/models/Booking';
import Branch from '@/lib/models/Branch';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    // Get user's bookings
    const bookings = await Booking.find({ userId: session.user.id })
      .populate('serviceId', 'name price')
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 })
      .lean();

    // Transform the response
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking._id.toString(),
      spaceName: booking.serviceId?.name || 'Unknown Service',
      location: booking.branchId?.location || 'Unknown Location',
      date: new Date(booking.startDate).toLocaleDateString(),
      time: booking.startTime || 'All Day',
      duration: booking.durationInDays || 1,
      durationLabel: `${booking.durationInDays || 1} day${booking.durationInDays > 1 ? 's' : ''}`,
      status: booking.status || 'pending',
      price: booking.totalPrice || 0,
      selectedPlan: booking.selectedPlan,
      isMember: booking.isMember,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      _id: booking._id,
      serviceId: booking.serviceId,
      branchId: booking.branchId,
      paymentStatus: booking.paymentStatus,
      notes: booking.notes,
    }));

    return NextResponse.json(formattedBookings, { status: 200 });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
