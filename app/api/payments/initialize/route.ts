import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import CheckIn from '@/lib/models/CheckIn';
import ErrorLog from '@/lib/models/ErrorLog';
import Service from '@/lib/models/Service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    const {
      serviceId,
      type,
      amount,
      durationDays,
      planType,
    } = await request.json();

    // Validation
    if (!serviceId || !type || !amount) {
      return NextResponse.json(
        { message: 'serviceId, type, and amount are required' },
        { status: 400 }
      );
    }

    // Verify user and service exist
    const user = await User.findById(userId);
    const service = await Service.findById(serviceId);

    if (!user || !service) {
      return NextResponse.json(
        { message: 'User or service not found' },
        { status: 404 }
      );
    }

    // Calculate coverage end date
    let coverageEndDate = null;
    if (durationDays && ['prepaid', 'membership'].includes(type)) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      coverageEndDate = endDate;
    }

    // Create payment record with REFERENCE (payment will be confirmed via webhook)
    const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payment = await Payment.create({
      userId,
      branchId,
      serviceId,
      type,
      amount,
      planType,
      paymentReference,
      coverageEndDate,
      status: 'pending',
    });

    return NextResponse.json(
      {
        message: 'Payment initialized. Please complete payment on Paystack',
        payment: {
          id: payment._id,
          reference: paymentReference,
          amount,
        },
        paystackInitUrl: `/api/payments/paystack?ref=${paymentReference}&amount=${amount}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment initialization error:', error);

    const session = await auth();
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/payments/initialize',
      error: error.message || 'Failed to initialize payment',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
