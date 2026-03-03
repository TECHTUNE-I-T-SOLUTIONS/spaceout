import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';
import Payment from '@/lib/models/Payment';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    // Get user's payments
    const payments = await Payment.find({ userId: session.user.id })
      .populate('bookingId', 'bookingDate totalPrice')
      .sort({ createdAt: -1 })
      .lean();

    // Transform the response
    const formattedPayments = payments.map((payment: any) => ({
      id: payment._id.toString(),
      amount: payment.amount || 0,
      status: payment.status || 'pending',
      date: new Date(payment.createdAt).toLocaleDateString(),
      reference: payment.reference || payment._id.toString(),
      method: payment.method || 'card',
      _id: payment._id,
      ...payment,
    }));

    return NextResponse.json(formattedPayments, { status: 200 });
  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
