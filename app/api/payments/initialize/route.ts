import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
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

    const {
      amount,
      membershipDays,
      paymentType = 'membership', // 'membership' or 'service'
      serviceId,
      type,
      durationDays,
      planType,
    } = await request.json();

    // Validation
    if (!amount) {
      return NextResponse.json(
        { message: 'Amount is required' },
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

    // Handle membership payments (new Paystack integration)
    if (paymentType === 'membership' && membershipDays) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email || session.user?.email,
            amount: amount * 100, // Paystack uses kobo (1/100 of Naira)
            metadata: {
              userId,
              membershipDays,
              type: 'membership',
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize Paystack payment');
        }

        const paystackData = await response.json();

        if (!paystackData.status) {
          throw new Error(paystackData.message || 'Paystack initialization failed');
        }

        // Create payment record
        const payment = await Payment.create({
          userId,
          amount,
          currency: 'NGN',
          membershipDays,
          paymentMethod: 'paystack',
          status: 'pending',
          paystackReference: paystackData.data.reference,
          paystackAccessCode: paystackData.data.access_code,
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
        throw paystackError;
      }
    }

    // Handle service payments (legacy)
    if (serviceId && type) {
      const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const payment = await Payment.create({
        userId,
        serviceId,
        type,
        amount,
        planType,
        paymentReference,
        status: 'pending',
      });

      return NextResponse.json({
        message: 'Payment initialized. Please complete payment on Paystack',
        payment: {
          id: payment._id,
          reference: paymentReference,
          amount,
        },
        paystackInitUrl: `/api/payments/paystack?ref=${paymentReference}&amount=${amount}`,
      });
    }

    return NextResponse.json(
      { message: 'Invalid payment type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Payment initialization error:', error);

    const session = await getServerSession(authOptions);
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
