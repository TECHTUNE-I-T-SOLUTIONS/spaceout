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
  const { userId, serviceId, planName, price, duration, startDate } = body;

  if (!userId || !serviceId || !planName || !price || !duration) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const user = await User.findById(userId);
  const service = await Service.findById(serviceId);
  if (!user || !service) {
    return NextResponse.json({ message: 'User or service not found' }, { status: 404 });
  }

  let purchaseDate = new Date();
  if (startDate) {
    const parsed = new Date(startDate);
    if (!isNaN(parsed.getTime())) {
      purchaseDate = parsed;
    }
  }
  const expiryDate = new Date(purchaseDate);
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
    paidAt: purchaseDate,
    verifiedAt: purchaseDate,
    metadata: { manual: true, createdByAdmin: true, subscriptionId: subscription._id },
  });

  await User.findByIdAndUpdate(userId, {
    hasMembership: true,
    membershipStatus: 'active',
    membershipType: Number(duration) >= 365 ? 'annual' : 'monthly',
    membershipExpiry: expiryDate,
    membershipActivatedAt: purchaseDate,
    membershipExpiryDate: expiryDate,
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
      await User.findByIdAndUpdate(subscription.userId, {
        hasMembership: false,
        membershipStatus: 'inactive',
        membershipExpiry: null,
      });
    }

    return NextResponse.json({ message: 'Subscription deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ message: 'Failed to delete subscription' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await request.json();
    const { subscriptionId, userId, serviceId, planName, price, duration, startDate, expiryDate, status } = body;
    if (!subscriptionId) return NextResponse.json({ message: 'subscriptionId is required' }, { status: 400 });

    const subscription = await UserSubscription.findById(subscriptionId);
    if (!subscription) return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });

    // Update subscription fields
    if (userId) subscription.userId = userId;
    if (serviceId) {
      subscription.serviceId = serviceId;
      const svc = await Service.findById(serviceId);
      if (svc) subscription.serviceName = svc.name;
    }
    if (planName) subscription.planName = planName;
    if (price !== undefined) subscription.price = Number(price);
    if (duration !== undefined) subscription.duration = Number(duration);

    let purchase = subscription.purchaseDate ? new Date(subscription.purchaseDate) : new Date();
    if (startDate) {
      const p = new Date(startDate);
      if (!isNaN(p.getTime())) purchase = p;
    }

    let expiry = subscription.expiryDate ? new Date(subscription.expiryDate) : new Date(purchase);
    if (expiryDate) {
      const ex = new Date(expiryDate);
      if (!isNaN(ex.getTime())) expiry = ex;
    } else if (duration) {
      expiry = new Date(purchase);
      expiry.setDate(expiry.getDate() + Number(duration));
    }

    subscription.purchaseDate = purchase;
    subscription.expiryDate = expiry;
    if (status) subscription.status = status;

    await subscription.save();

    // Update related payment(s)
    await Payment.updateMany(
      { 'metadata.subscriptionId': subscription._id.toString() },
      {
        $set: {
          amount: Number(price || subscription.price || 0),
          serviceName: subscription.serviceName,
          planName: subscription.planName,
          paidAt: purchase,
          verifiedAt: purchase,
          status: status === 'active' ? 'completed' : (status === 'inactive' ? 'failed' : 'completed'),
        },
      }
    );

    // Update user membership fields
    if (subscription.userId) {
      await User.findByIdAndUpdate(subscription.userId, {
        hasMembership: true,
        membershipStatus: status || 'active',
        membershipType: Number(duration || subscription.duration) >= 365 ? 'annual' : 'monthly',
        membershipActivatedAt: purchase,
        membershipExpiryDate: expiry,
        membershipExpiry: expiry,
      });
    }

    return NextResponse.json({ message: 'Subscription updated', subscription }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ message: 'Failed to update subscription' }, { status: 500 });
  }
}
