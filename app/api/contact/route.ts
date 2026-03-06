import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create contact submission
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      status: 'new',
    });

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'We received your message - SpaceOut',
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
                <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">Thank You, ${name}!</h2>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                  We've received your message and appreciate you reaching out to SpaceOut.
                </p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 25px 0;">
                  <h3 style="color: #1f2937; margin-top: 0; font-size: 14px;">Your Message Details:</h3>
                  <p style="color: #6b7280; margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
                  <p style="color: #6b7280; margin: 8px 0;"><strong>Submitted on:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
                  Our team will review your inquiry and get back to you as soon as possible. We typically respond within 24-48 business hours.
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  If you need immediate assistance, feel free to call us at +234 809 988 5454 or message us on WhatsApp.
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

    // Send admin notification
    await sendEmail({
      to: 'spaceout.workstation@gmail.com',
      subject: `New Contact Submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background-color: #f8f9fa; padding: 20px 0; text-align: center; border-bottom: 4px solid #ef4444;">
                <h1 style="color: #1f2937; margin: 0; font-size: 24px;">SpaceOut - Admin Alert</h1>
              </div>
              <div style="padding: 40px 20px;">
                <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">New Contact Form Submission</h2>
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #7f1d1d; margin-top: 0; font-size: 16px;">Contact Information:</h3>
                  <p style="color: #1f2937; margin: 8px 0;"><strong>Name:</strong> ${name}</p>
                  <p style="color: #1f2937; margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #ef4444;">${email}</a></p>
                  <p style="color: #1f2937; margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
                  <p style="color: #1f2937; margin: 8px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Message:</h3>
                  <p style="color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/feedback?tab=contacts" style="display: inline-block; padding: 12px 30px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 16px;">View in Admin Panel</a>
                </div>
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

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!',
        contactId: contact._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to submit contact form',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    await dbConnect();

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
