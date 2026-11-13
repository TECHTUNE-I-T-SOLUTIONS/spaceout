import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import User from '@/lib/models/User';
import UserSubscription from '@/lib/models/UserSubscription';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activity-logger';

function deriveMembershipState(user: any) {
  const now = new Date();
  const rawStatus = user.membershipStatus || 'inactive';
  const expiryValue = user.membershipExpiryDate || user.membershipExpiry;
  const expiryDate = expiryValue ? new Date(expiryValue) : null;
  const hasFutureExpiry = !!expiryDate && expiryDate > now;
  const hasMembership = !!(user.hasMembership || rawStatus !== 'inactive' || hasFutureExpiry);
  const membershipStatus = rawStatus === 'active' || hasFutureExpiry
    ? 'active'
    : rawStatus === 'expired'
      ? 'expired'
      : 'inactive';

  return {
    ...user,
    hasMembership,
    membershipStatus,
    membershipStatusRaw: user.membershipStatus || null,
    membershipNeedsRepair: hasMembership && rawStatus !== 'active' && hasFutureExpiry,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized - admin not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch the specific user with all membership fields
    let user = await User.findById(id)
      .select('-password -resetToken -resetTokenExpiry')
      .lean()
      .exec();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Compute hasMembership based on membershipStatus
    const userAny = user as any;
    const userNameForLog = userAny.name;
    const userEmailForLog = userAny.email;
    const userIdForLog = userAny._id;
    user = deriveMembershipState(user);

    try {
      await logActivity(admin._id.toString(), 'View User', `Admin viewed user details: ${userEmailForLog || userNameForLog}`, 'user_management', {
        targetUserId: userIdForLog.toString(),
        targetUserEmail: userEmailForLog || undefined,
      });
    } catch { /* non-blocking */ }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized - admin not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const desiredStatus = body.membershipStatus || 'active';

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const subscription = await UserSubscription.findOne({
      userId: user._id,
      isAccessCard: true,
    }).sort({ createdAt: -1 });

    const now = new Date();
    const activatedAt = user.membershipActivatedAt || subscription?.purchaseDate || now;
    const expiryDate = user.membershipExpiryDate || user.membershipExpiry || subscription?.expiryDate || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (subscription) {
      subscription.status = desiredStatus;
      subscription.purchaseDate = activatedAt;
      subscription.expiryDate = expiryDate;
      await subscription.save();
    }

    await User.findByIdAndUpdate(user._id, {
      hasMembership: true,
      membershipStatus: desiredStatus,
      membershipType: user.membershipType || 'annual',
      membershipActivatedAt: activatedAt,
      membershipExpiryDate: expiryDate,
      membershipExpiry: expiryDate,
    });

    const updatedUser = await User.findById(user._id)
      .select('-password -resetToken -resetTokenExpiry')
      .lean()
      .exec();

    const targetUserEmail = user.email;
    const targetUserName = user.name;
    const targetUserId = user._id;

    try {
      await logActivity(admin._id.toString(), 'Update User Membership', `Admin updated membership status for ${targetUserEmail || targetUserName} to ${desiredStatus}`, 'user_management', {
        targetUserId: targetUserId.toString(),
        targetUserEmail: targetUserEmail || undefined,
        newStatus: desiredStatus,
      });
    } catch { /* non-blocking */ }

    return NextResponse.json(
      {
        message: 'Membership status updated',
        user: updatedUser ? deriveMembershipState(updatedUser) : null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating user membership:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update membership status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized - admin not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      );
    }

    // Await params to get the id
    const { id } = await params;

    // Delete the user from User collection
    const result = await User.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const deletedUserEmail = result.email;
    const deletedUserName = result.name;
    const deletedUserId = result._id;

    try {
      await logActivity(admin._id.toString(), 'Delete User', `Admin deleted user: ${deletedUserEmail || deletedUserName}`, 'user_management', {
        targetUserId: deletedUserId.toString(),
        targetUserEmail: deletedUserEmail || undefined,
      });
    } catch { /* non-blocking */ }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
