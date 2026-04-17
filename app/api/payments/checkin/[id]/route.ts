import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: checkInId } = await params;

    await dbConnect();

    // Dynamically import models
    const Payment = (await import('@/lib/models/Payment')).default;

    // Find payment record by checkInId
    const payment = await Payment.findOne({ checkInId });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Verify the payment belongs to the current user
    if (payment.userId.toString() !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id,
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payment by check-in ID:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payment',
        message: error.message,
      },
      { status: 500 }
    );
  }
}