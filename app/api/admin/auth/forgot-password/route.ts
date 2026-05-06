import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 });

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent' }, { status: 200 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    admin.resetToken = resetTokenHash;
    admin.resetTokenExpiry = resetTokenExpiry;
    await admin.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/auth/reset-password`;
    await sendPasswordResetEmail(email, resetToken, resetUrl);

    return NextResponse.json({ message: 'Password reset link sent to email' }, { status: 200 });
  } catch (error: any) {
    console.error('Admin forgot password error:', error);
    return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
  }
}
