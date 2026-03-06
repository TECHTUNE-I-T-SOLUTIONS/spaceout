import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { sendEmail } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { adminReply } = await request.json();

    if (!adminReply) {
      return NextResponse.json(
        { error: 'Reply message is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const contact = await Contact.findByIdAndUpdate(
      id,
      {
        adminReply,
        adminReplyDate: new Date(),
        status: 'replied',
      },
      { new: true }
    );

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Send reply email to user
    await sendEmail({
      to: contact.email,
      subject: `Re: ${contact.subject} - SpaceOut`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background-color: #f8f9fa; padding: 20px 0; text-align: center; border-bottom: 4px solid #3b82f6;">
                <h1 style="color: #1f2937; margin: 0; font-size: 24px;">SpaceOut</h1>
              </div>
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">We've Replied to Your Message</h2>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                  Hi ${contact.name},
                </p>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                  Thank you for reaching out to SpaceOut. Here's our response to your message:
                </p>
                <div style="background-color: #f3f4f6; padding: 20px; border-left: 4px solid #3b82f6; border-radius: 5px; margin: 25px 0;">
                  <p style="color: #1f2937; white-space: pre-wrap; line-height: 1.6; margin: 0;">${adminReply}</p>
                </div>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                  If you have any additional questions or concerns, please don't hesitate to reach out to us again.
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  Best regards,<br/>
                  SpaceOut Team
                </p>
              </div>
              <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                  © ${new Date().getFullYear()} SpaceOut. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      contact,
    });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await dbConnect();

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
