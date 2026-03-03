import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication via cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, subject, message, userName } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Send the email using the email service
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Hello ${userName || 'User'},</p>
        <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-left: 4px solid #007bff;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
        <p>Best regards,<br/>SpaceOut Admin Team</p>
      </div>
    `;

    await sendEmail({
      to,
      subject,
      html: htmlContent,
    });

    return NextResponse.json(
      { success: true, message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
