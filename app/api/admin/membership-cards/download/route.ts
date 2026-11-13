import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import UserSubscription from '@/lib/models/UserSubscription';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('admin_id')?.value;
  const adminRole = cookieStore.get('admin_role')?.value;

  if (!adminId || !adminRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await dbConnect();

  const user = await User.findById(userId)
    .select('name email phone cardNumber cardIssuedAt hasMembership membershipStatus membershipType membershipExpiryDate')
    .lean();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const subscription = await UserSubscription.findOne({
    userId,
    isAccessCard: true,
    status: 'active',
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      cardNumber: user.cardNumber || 'SP-OUT-000000',
      cardIssuedAt: user.cardIssuedAt,
      hasMembership: user.hasMembership,
      membershipStatus: user.membershipStatus,
      membershipType: user.membershipType,
      membershipExpiry: user.membershipExpiryDate,
    },
    subscription: subscription ? {
      planName: subscription.planName,
      serviceName: subscription.serviceName,
      expiryDate: subscription.expiryDate,
      purchaseDate: subscription.purchaseDate,
    } : null,
  });
}
