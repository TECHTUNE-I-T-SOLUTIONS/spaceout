import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import Payment from '@/lib/models/Payment';
import { verifyAndSyncPayment } from '@/lib/paystack';

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('admin_id')?.value;
  const adminEmail = cookieStore.get('admin_email')?.value;
  if (!adminId || !adminEmail) return null;

  await dbConnect();
  const admin = await Admin.findById(adminId).select('isActive role email');
  if (!admin || !admin.isActive) return null;
  return admin;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const { paymentId, reference } = await request.json();
  if (!paymentId && !reference) {
    return NextResponse.json({ message: 'paymentId or reference is required' }, { status: 400 });
  }

  const payment = paymentId
    ? await Payment.findById(paymentId)
    : await Payment.findOne({ $or: [{ reference }, { paystackReference: reference }] });

  if (!payment) {
    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  }

  const lookup = payment.paystackReference || payment.reference || reference;
  const result = await verifyAndSyncPayment(lookup);

  return NextResponse.json({
    success: result.success,
    message: result.message || 'Payment reviewed',
    payment: result.payment,
  });
}
