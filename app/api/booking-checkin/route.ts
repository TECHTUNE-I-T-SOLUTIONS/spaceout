import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import BookingCheckin from '@/lib/models/BookingCheckin';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) {
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
    }

    const checkins = await BookingCheckin.find({ bookingId, userId }).sort({ checkinDay: 1 });
    if (!checkins || checkins.length === 0) {
      // Try to resolve totalBookingDays from booking if available
      const Booking = (await import('@/lib/models/Booking')).default;
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return NextResponse.json({ totalCheckinDays: 0, totalBookingDays: 0, daysRemaining: 0, exhausted: false });
      }
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const totalBookingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return NextResponse.json({ totalCheckinDays: 0, totalBookingDays, daysRemaining: totalBookingDays, exhausted: false });
    }

    const totalCheckinDays = checkins.length;
    const totalBookingDays = checkins[0]?.totalBookingDays || 0;
    const exhausted = totalCheckinDays >= totalBookingDays;
    return NextResponse.json({
      totalCheckinDays,
      totalBookingDays,
      daysRemaining: Math.max(0, totalBookingDays - totalCheckinDays),
      exhausted,
    });
  } catch (error) {
    console.error('Booking check-in GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    await dbConnect();
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
    }
    // Find user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'User account is inactive' }, { status: 403 });
    }
    // Find booking
    const Booking = (await import('@/lib/models/Booking')).default;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    if (booking.userId.toString() !== userId) {
      return NextResponse.json({ message: 'Unauthorized access to booking' }, { status: 403 });
    }
    if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
      return NextResponse.json({ message: 'Booking is not confirmed or payment not completed' }, { status: 400 });
    }
    // Check if already checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Calculate booking days
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        const totalBookingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // Find all check-ins for this booking
        const allCheckins = await BookingCheckin.find({ bookingId, userId });
        const totalCheckinDays = allCheckins.length;
        // Check if already checked in today
        const existingCheckIn = await BookingCheckin.findOne({
          bookingId,
          userId,
          checkedInAt: { $gte: today, $lt: tomorrow },
        });
        if (existingCheckIn) {
          return NextResponse.json({ message: 'Already checked in for this booking today' }, { status: 400 });
        }
        // Determine which day of the booking this is
        const checkinDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // Create check-in record
        const bookingCheckin = await BookingCheckin.create({
          userId,
          bookingId,
          bookingDetails: booking.toObject ? booking.toObject() : booking,
          checkedInAt: new Date(),
          checkedOut: false,
          checkinDay,
          totalBookingDays,
          totalCheckinDays: totalCheckinDays + 1,
        });
        // Optionally update booking status
        booking.status = 'checked_in';
        await booking.save();
        return NextResponse.json({ message: 'Checked in successfully', checkIn: bookingCheckin });
  } catch (error) {
    console.error('Booking check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // For checkout
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any)?.id;
    await dbConnect();
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
    }
    // Find check-in for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const bookingCheckin = await BookingCheckin.findOne({
          bookingId,
          userId,
          checkedInAt: { $gte: today, $lt: tomorrow },
          checkedOut: false,
        });
        if (!bookingCheckin) {
          return NextResponse.json({ message: 'No active check-in found for this booking today' }, { status: 404 });
        }
        bookingCheckin.checkedOut = true;
        bookingCheckin.checkedOutAt = new Date();
        await bookingCheckin.save();
        // Optionally update booking status
        const Booking = (await import('@/lib/models/Booking')).default;
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.status = 'completed';
          await booking.save();
        }
        return NextResponse.json({ message: 'Checked out successfully', checkIn: bookingCheckin });
  } catch (error) {
    console.error('Booking checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
