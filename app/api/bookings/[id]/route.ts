import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Booking from '@/lib/models/Booking';
import ErrorLog from '@/lib/models/ErrorLog';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const userRole = (session.user as any)?.role;

    await dbConnect();

    const { id } = await params;
    const bookingId = id;

    if (!bookingId) {
      return NextResponse.json(
        { message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking or is admin
    if (userRole !== 'admin' && userRole !== 'superadmin' && booking.userId.toString() !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized access to booking' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled (not completed or checked in)
    if (booking.status === 'completed' || booking.status === 'checked_in') {
      return NextResponse.json(
        { message: 'Cannot cancel a completed or checked-in booking' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    return NextResponse.json(
      { message: 'Booking cancelled successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error cancelling booking:', error);

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/bookings/[id]',
      error: error.message || 'Failed to cancel booking',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}