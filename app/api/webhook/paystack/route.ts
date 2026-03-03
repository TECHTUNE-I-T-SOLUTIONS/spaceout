import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import ErrorLog from '@/lib/models/ErrorLog';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { data } = body;

    if (!data || !data.reference) {
      return NextResponse.json(
        { message: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const { reference, status, amount } = data;

    // Find payment
    const payment = await Payment.findOne({ paymentReference: reference });

    if (!payment) {
      console.warn(`Payment not found for reference: ${reference}`);
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify amount matches
    if (payment.amount !== amount) {
      await ErrorLog.create({
        route: '/api/webhook/paystack',
        error: `Amount mismatch for reference ${reference}: expected ${payment.amount}, got ${amount}`,
        statusCode: 400,
        userId: payment.userId,
      }).catch((err) => console.error('Error logging error:', err));

      return NextResponse.json(
        { message: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Update payment status
    payment.status = status === 'success' ? 'completed' : 'failed';
    await payment.save();

    // If successful, update user details
    if (status === 'success') {
      if (payment.type === 'prepaid' && payment.coverageEndDate) {
        await User.findByIdAndUpdate(
          payment.userId,
          { prepaidUntil: payment.coverageEndDate },
          { new: true }
        );

        console.log(
          `Prepaid coverage updated for user ${payment.userId} until ${payment.coverageEndDate}`
        );
      }

      if (payment.type === 'membership') {
        const membershipExpiry = new Date();
        membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1);

        await User.findByIdAndUpdate(
          payment.userId,
          {
            membership: true,
            membershipExpiry,
          },
          { new: true }
        );

        console.log(`Membership activated for user ${payment.userId}`);
      }
    }

    return NextResponse.json(
      {
        message: 'Webhook processed successfully',
        paymentStatus: payment.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Paystack webhook error:', error);

    await ErrorLog.create({
      route: '/api/webhook/paystack',
      error: error.message || 'Webhook processing failed',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    // Always return 200 to Paystack to prevent retries
    return NextResponse.json(
      { message: 'Webhook received' },
      { status: 200 }
    );
  }
}
