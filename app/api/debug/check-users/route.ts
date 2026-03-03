import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * DEBUG ENDPOINT - Check all users in database
 * Remove this after debugging is complete
 */
export async function GET(request: NextRequest) {
  try {
    // Check for debug header
    const debugHeader = request.headers.get('x-debug-key');
    if (debugHeader !== process.env.DEBUG_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all users (without password)
    const users = await User.find().select('-password').lean();
    
    // Get count
    const totalUsers = await User.countDocuments();

    return NextResponse.json(
      {
        success: true,
        totalUsers,
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          createdAt: user.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Debug] Error checking users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check users' },
      { status: 500 }
    );
  }
}
