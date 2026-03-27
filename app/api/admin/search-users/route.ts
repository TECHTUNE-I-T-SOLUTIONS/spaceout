import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import UserSubscription from '@/lib/models/UserSubscription';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build search query
    const query: any = { isActive: true };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('_id firstName lastName email phone hasMembership membershipStatus membershipExpiryDate')
      .limit(limit)
      .sort({ firstName: 1 });

    // Check for active user subscriptions and update membership status
    const userIds = users.map(user => user._id);
    const activeSubscriptions = await UserSubscription.find({
      userId: { $in: userIds },
      status: 'active',
      expiryDate: { $gt: new Date() }
    }).select('userId');

    const usersWithActiveSubscriptions = new Set(
      activeSubscriptions.map(sub => sub.userId.toString())
    );

    // Update users with active subscription status
    const enrichedUsers = users.map(user => {
      const hasActiveSubscription = usersWithActiveSubscriptions.has(user._id.toString());
      return {
        ...user.toObject(),
        hasMembership: user.hasMembership || hasActiveSubscription,
        membershipStatus: hasActiveSubscription ? 'active' : user.membershipStatus,
        membershipExpiryDate: hasActiveSubscription ? null : user.membershipExpiryDate // Will be updated to show subscription expiry if needed
      };
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: (error as any).message },
      { status: 500 }
    );
  }
}
