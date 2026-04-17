import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function PATCH(
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

    const { id } = await params;
    const { status, paidAt, amount } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Dynamically import models
    const Payment = (await import('@/lib/models/Payment')).default;

    // Find and update the payment record
    const updateData: any = { status };
    if (paidAt) updateData.paidAt = new Date(paidAt);
    if (amount !== undefined) updateData.amount = amount;
    updateData.updatedAt = new Date();

    const payment = await Payment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

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
        status: payment.status,
        paidAt: payment.paidAt,
        amount: payment.amount,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update payment status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}