import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Admin cookie fallback auth
    const adminId = request.cookies.get('admin_id')?.value;
    const adminEmail = request.cookies.get('admin_email')?.value;
    if (!adminId || !adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const Admin = (await import('@/lib/models/Admin')).default;
    const admin = await Admin.findById(adminId);
    if (!admin || admin.email !== adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, paidAt, amount } = await request.json();
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const Payment = (await import('@/lib/models/Payment')).default;
    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    payment.status = status;
    if (paidAt) payment.paidAt = new Date(paidAt);
    if (amount !== undefined) payment.amount = amount;
    payment.verifiedAt = new Date();
    await payment.save();

    return NextResponse.json({ success: true, payment: payment.toObject() });
  } catch (error: any) {
    console.error('Admin update payment status error:', error);
    return NextResponse.json({ error: 'Failed to update payment status', message: error.message }, { status: 500 });
  }
}
