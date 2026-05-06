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
  // Fetch all access-card subscriptions and only include those with completed payments
  const allCards = await UserSubscription.find({ isAccessCard: true })
    .populate('userId', 'name email firstName lastName')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const cards: any[] = [];

  for (const card of allCards) {
    // Try to find a completed payment linked to this subscription
    const payment = await Payment.findOne({
      $and: [
        { status: 'completed' },
        {
          $or: [
            { reference: card.paymentReference },
            { paystackReference: card.paymentReference },
            { 'metadata.subscriptionId': card._id },
          ],
        },
      ],
    }).lean();

    if (payment) {
      cards.push({ ...card, payment });
    }
  }

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

export async function DELETE(request: NextRequest) {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { subscriptionId } = await request.json();
    if (!subscriptionId) {
      return NextResponse.json({ message: 'subscriptionId is required' }, { status: 400 });
    }

    const subscription = await UserSubscription.findById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
    }

    // Remove payment records that reference this subscription (metadata.subscriptionId)
    await Payment.deleteMany({ 'metadata.subscriptionId': subscription._id.toString() });

    // Remove the subscription
    await UserSubscription.findByIdAndDelete(subscription._id);

    // If user has no other active subscriptions, clear membership flags
    const otherActive = await UserSubscription.findOne({ userId: subscription.userId, status: 'active' });
    if (!otherActive) {
      await User.findByIdAndUpdate(subscription.userId, { hasMembership: false, membershipExpiry: null });
    }

    return NextResponse.json({ message: 'Subscription deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ message: 'Failed to delete subscription' }, { status: 500 });
  }
}
