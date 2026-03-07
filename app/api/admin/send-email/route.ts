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

    // Validate email format
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and message are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address provided' },
        { status: 400 }
      );
    }

    await dbConnect();

    console.log(`Sending email to ${to} from admin ${adminId}`);

    // Create professional HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; font-size: 20px; margin-top: 0; margin-bottom: 20px; }
            .greeting { color: #4b5563; font-size: 16px; margin-bottom: 25px; }
            .message-box { 
              background-color: #f0f4ff; 
              border-left: 4px solid #667eea; 
              padding: 20px; 
              border-radius: 4px; 
              margin: 25px 0; 
              color: #1f2937;
              line-height: 1.8;
              font-size: 15px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer { background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 30px; text-align: center; }
            .footer p { margin: 8px 0; color: #6b7280; font-size: 13px; }
            .footer-link { color: #667eea; text-decoration: none; }
            .divider { height: 1px; background-color: #e5e7eb; margin: 20px 0; }
            .signature { color: #4b5563; font-size: 15px; margin-top: 25px; margin-bottom: 0; }
            .signature-strong { font-weight: 600; color: #1f2937; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>SpaceOut</h1>
              <p>Premium Workspace Solutions</p>
            </div>

            <!-- Content -->
            <div class="content">
              <h2>Hello ${userName || 'User'},</h2>
              <p class="greeting">You've received a message from the SpaceOut Admin Team.</p>

              <!-- Message Box -->
              <div class="message-box">${message.replace(/\n/g, '\n')}</div>

              <div class="divider"></div>

              <!-- Signature -->
              <p class="signature">
                <span class="signature-strong">SpaceOut Team</span><br/>
                <a href="spaces@spaceoutworkstation.com" class="footer-link" style="color: #667eea; text-decoration: none;">spaces@spaceoutworkstation.com</a>
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>© ${new Date().getFullYear()} SpaceOut. All rights reserved.</p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" class="footer-link">Privacy Policy</a> | 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" class="footer-link">Terms of Service</a> | 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" class="footer-link">Contact Us</a>
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                This is an official communication from SpaceOut. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to,
      subject,
      html: htmlContent,
    });

    return NextResponse.json(
      { success: true, message: `Email successfully sent to ${to}` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send email',
        details: 'Please check your SMTP configuration in .env.local'
      },
      { status: 500 }
    );
  }
}
