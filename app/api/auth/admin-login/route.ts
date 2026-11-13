import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import ErrorLog from '@/lib/models/ErrorLog';
import { verifyPassword } from '@/lib/auth';
import { getClientInfo, logActivity, notifySuperAdminsOfLogin } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      await ErrorLog.create({
        route: '/api/auth/admin-login',
        error: 'Email and password required',
        statusCode: 400,
      }).catch(() => {});
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      await ErrorLog.create({
        route: '/api/auth/admin-login',
        error: 'Admin not found',
        statusCode: 401,
      }).catch(() => {});
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, admin.password);

    if (!isPasswordValid) {
      await ErrorLog.create({
        route: '/api/auth/admin-login',
        error: 'Invalid password',
        statusCode: 401,
        userId: admin._id,
      }).catch(() => {});
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!admin.isActive) {
      await ErrorLog.create({
        route: '/api/auth/admin-login',
        error: 'Account deactivated',
        statusCode: 403,
        userId: admin._id,
      }).catch(() => {});
      return NextResponse.json(
        { message: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    // Get client info for logging
    const clientInfo = getClientInfo(request);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Log the successful admin login
    await logActivity(
      admin._id.toString(),
      'Admin Login',
      `Admin logged in from ${clientInfo.device} (${clientInfo.browser} on ${clientInfo.os}) via ${clientInfo.ipAddress}`,
      'auth',
      {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        device: clientInfo.device,
        browser: clientInfo.browser,
        os: clientInfo.os,
        email: admin.email,
      }
    );

    // Notify all super admins about this login (non-blocking, in background)
    notifySuperAdminsOfLogin(
      admin.email,
      admin.name,
      clientInfo.ipAddress,
      clientInfo.device,
      clientInfo.browser,
      clientInfo.os
    ).catch(() => {}); // Never fail login for email failures

    const response = NextResponse.json(
      {
        message: 'Admin login successful',
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
      { status: 200 }
    );

    // Set cookies for admin session (httpOnly for security)
    response.cookies.set('admin_email', admin.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('admin_id', admin._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('admin_role', admin.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);

    await ErrorLog.create({
      route: '/api/auth/admin-login',
      error: error.message || 'Admin login failed',
      statusCode: 500,
    }).catch(() => {});

    return NextResponse.json(
      { message: 'Admin login failed' },
      { status: 500 }
    );
  }
}
