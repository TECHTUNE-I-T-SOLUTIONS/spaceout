import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import Booking from '@/lib/models/Booking';
import User from '@/lib/models/User';
import ErrorLog from '@/lib/models/ErrorLog';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;

    await dbConnect();

    const { bookingId } = await request.json();

    // Validation
    if (!bookingId) {
      return NextResponse.json(
        { message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.userId.toString() !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized access to booking' },
        { status: 403 }
      );
    }

    if (booking.paymentStatus === 'paid') {
      return NextResponse.json(
        { message: 'Booking is already paid' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    try {
      console.log('Initializing Paystack payment for booking:', bookingId);
      console.log('Paystack secret key exists:', !!PAYSTACK_SECRET_KEY);
      console.log('Paystack secret key value:', PAYSTACK_SECRET_KEY ? 'Set' : 'Not set');
      console.log('Booking total price:', booking.totalPrice);

      if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key is not configured');
      }

      if (!booking.totalPrice || booking.totalPrice <= 0) {
        throw new Error(`Invalid booking total price: ${booking.totalPrice}`);
      }

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email || session.user?.email,
          amount: booking.totalPrice * 100, // Paystack uses kobo (1/100 of Naira)
          callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/user/bookings`,
          metadata: {
            userId,
            bookingId: booking._id,
            type: 'booking',
          },
        }),
      });

      console.log('Paystack API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Paystack API error:', errorText);
        throw new Error(`Paystack API error: ${response.status} - ${errorText}`);
      }

      const paystackData = await response.json();
      console.log('Paystack response data:', paystackData);

      if (!paystackData.status) {
        throw new Error(paystackData.message || 'Paystack initialization failed');
      }

      // Create payment record
      const payment = await Payment.create({
        userId,
        bookingId: booking._id,
        serviceId: booking.serviceId,
        type: 'booking',
        email: user.email || session.user?.email,
        serviceName: booking.selectedPlan?.planName || 'Booking',
        planName: booking.selectedPlan?.planName,
        planType: booking.selectedPlan?.planType,
        amount: booking.totalPrice,
        currency: 'NGN',
        reference: `booking-${booking._id}-${Date.now()}`,
        paystackReference: paystackData.data.reference,
        paystackAccessCode: paystackData.data.access_code,
        status: 'pending',
        paymentMethod: 'paystack',
        metadata: {
          bookingId: booking._id,
          serviceId: booking.serviceId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          durationInDays: booking.durationInDays,
          durationInHours: booking.durationInHours,
        },
      });

      return NextResponse.json({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
        paymentId: payment._id,
      });
    } catch (paystackError: any) {
      console.error('Paystack error:', paystackError);

      await ErrorLog.create({
        route: '/api/payments/initialize-booking',
        error: paystackError.message || 'Paystack initialization failed',
        statusCode: 500,
        userId,
      }).catch((err) => console.error('Error logging error:', err));

      return NextResponse.json(
        { message: 'Payment initialization failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error initializing booking payment:', error);

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/payments/initialize-booking',
      error: error.message || 'Failed to initialize booking payment',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}