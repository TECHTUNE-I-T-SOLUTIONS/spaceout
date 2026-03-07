import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication via cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;
    const adminRole = cookieStore.get('admin_role')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session not found' },
        { status: 401 }
      );
    }

    if (adminRole !== 'superadmin' && adminRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subject, message, userIds } = body;

    // Validation
    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users selected' },
        { status: 400 }
      );
    }

    // Fetch users from database
    let users: any[] = [];
    try {
      await dbConnect();
      users = await User.find({
        _id: { $in: userIds }
      }).select('-password -resetPasswordToken -resetPasswordExpires');
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No valid users found' },
        { status: 404 }
      );
    }

    // Send or queue emails
    let sentCount = 0;
    const errors: string[] = [];

    // Send emails immediately
    for (const user of users) {
      try {
        const firstName = user.firstName || 'User';
        const lastName = user.lastName || '';

        // Create personalized email body
        const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear ${firstName},</p>
  
  <div style="margin: 24px 0; line-height: 1.6;">
    ${message.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
  </div>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
    <p>Best regards,<br/>
    <strong>SpaceOut Team</strong><br/>
    SpaceOut Workspace Solutions</p>
    <p style="margin-top: 8px;">
      <a href="https://spaceoutworkstation.com" style="color: #3b82f6; text-decoration: none;">Visit our website</a> | 
      <a href="https://spaceoutworkstation.com/contact" style="color: #3b82f6; text-decoration: none;">Contact us</a>
    </p>
  </div>
</div>
        `.trim();

        const response = await sendEmail({
          to: user.email,
          subject,
          html: emailBody,
          text: `Dear ${firstName},\n\n${message}\n\nBest regards,\nSpaceOut Team`,
        });

        if (response.success) {
          sentCount++;
        } else {
          errors.push(`Failed to send to ${user.email}: ${response.error}`);
        }
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
        errors.push(`Error sending to ${user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: sentCount,
      totalAttempted: users.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${sentCount} of ${users.length} emails sent successfully`,
    });
  } catch (error) {
    console.error('Error in batch email handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
