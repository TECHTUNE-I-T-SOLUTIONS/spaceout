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
      spaceName: booking.branchId?.name || 'Unknown Space',
      location: booking.branchId?.location || 'Unknown Location',
      date: new Date(booking.bookingDate).toLocaleDateString(),
      time: booking.startTime || 'N/A',
      duration: booking.duration || 0,
      status: booking.status || 'pending',
      price: booking.totalPrice || 0,
      _id: booking._id,
      ...booking,
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
