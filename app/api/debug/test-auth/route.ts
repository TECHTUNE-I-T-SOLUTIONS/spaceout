import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyPassword } from '@/lib/auth';

/**
 * DEBUG ENDPOINT - Test authentication manually
 * POST with: { email: "test@example.com", password: "password123" }
 * Remove this after debugging is complete
 */
export async function POST(request: NextRequest) {
  try {
    // Check for debug header
    const debugHeader = request.headers.get('x-debug-key');
    if (debugHeader !== process.env.DEBUG_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('[Debug Auth] Searching for user:', normalizedEmail);
    
    // Step 1: Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail }).select('-password');
    if (!userExists) {
      console.log('[Debug Auth] User not found');
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          email: normalizedEmail,
          step: 'finding_user',
        },
        { status: 404 }
      );
    }

    console.log('[Debug Auth] User found:', userExists._id);

    // Step 2: Get user with password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      console.log('[Debug Auth] User not found when selecting password');
      return NextResponse.json(
        { success: false, error: 'User not found when selecting password' },
        { status: 404 }
      );
    }

    console.log('[Debug Auth] User retrieved with password field');

    // Step 3: Check if active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User account is deactivated' },
        { status: 403 }
      );
    }

    console.log('[Debug Auth] User is active');

    // Step 4: Verify password
    const isValid = await verifyPassword(password, user.password);
    console.log('[Debug Auth] Password verification result:', isValid);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Authentication successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Debug Auth] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Authentication test failed' },
      { status: 500 }
    );
  }
}
