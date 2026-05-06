import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import UserSubscription from '@/lib/models/UserSubscription';
import Payment from '@/lib/models/Payment';
import Service from '@/lib/models/Service';

async function requireAdminCookie() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('admin_id')?.value;
  const adminRole = cookieStore.get('admin_role')?.value;
  return !!adminId && !!adminRole;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const cards = await UserSubscription.find({ isAccessCard: true })
    .populate('userId', 'name email firstName lastName')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ cards });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const body = await request.json();
  const { userId, serviceId, planName, price, duration } = body;

  if (!userId || !serviceId || !planName || !price || !duration) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const user = await User.findById(userId);
  const service = await Service.findById(serviceId);
  if (!user || !service) {
    return NextResponse.json({ message: 'User or service not found' }, { status: 404 });
  }

  const purchaseDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + Number(duration));
  const reference = `MANUAL-MEM-${Date.now()}`;

  const subscription = await UserSubscription.create({
    userId,
    serviceId,
    planName,
    serviceName: service.name,
    price: Number(price),
    duration: Number(duration),
    purchaseDate,
    expiryDate,
    status: 'active',
    paymentReference: reference,
    isAccessCard: true,
    autoRenew: false,
  });

  await Payment.create({
    userId,
    serviceId,
    type: 'membership',
    email: user.email,
    serviceName: service.name,
    planName,
    amount: Number(price),
    currency: 'NGN',
    reference,
    paystackReference: reference,
    status: 'completed',
    paymentMethod: 'manual',
    paidAt: new Date(),
    verifiedAt: new Date(),
    metadata: { manual: true, createdByAdmin: true, subscriptionId: subscription._id },
  });

  await User.findByIdAndUpdate(userId, {
    hasMembership: true,
    membershipExpiry: expiryDate,
  });

  return NextResponse.json({ message: 'Membership card created', subscription }, { status: 201 });
}
