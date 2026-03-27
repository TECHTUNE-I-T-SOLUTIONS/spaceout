import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import Booking from '@/lib/models/Booking';
import User from '@/lib/models/User';
import ErrorLog from '@/lib/models/ErrorLog';
import PushSubscription from '@/lib/models/PushSubscription';
import { sendPaymentPushNotification } from '@/lib/push-notification';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// GET endpoint for Paystack verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find payment by Paystack reference
    const payment = await Payment.findOne({
      paystackReference: reference,
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment with Paystack');
    }

    const paystackData = await response.json();

    if (!paystackData.status) {
      return NextResponse.json(
        { error: 'Payment verification failed', payment: payment.toObject() },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (paystackData.data.status !== 'success') {
      payment.status = paystackData.data.status;
      await payment.save();
      return NextResponse.json(
        {
          error: `Payment ${paystackData.data.status}`,
          payment: payment.toObject(),
        },
        { status: 400 }
      );
    }

    // Update payment status
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.verifiedAt = new Date();
    await payment.save();

    // Update booking status if this is a booking payment
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed', // Auto-confirm when payment is successful
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        bookingId: payment.bookingId,
      },
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);

    await ErrorLog.create({
      route: '/api/payments/verify-booking',
      error: error.message || 'Failed to verify payment',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}