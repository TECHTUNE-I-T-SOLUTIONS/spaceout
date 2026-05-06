import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    // Validate email configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email configuration is missing. Please check your .env.local file.');
    }

    const info = await transporter.sendMail({
      from: `SpaceOut <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error occurred while sending email';
    console.error('Email sending error:', {
      error: errorMessage,
      code: error.code,
      response: error.response,
      to,
      timestamp: new Date().toISOString(),
    });
    return { 
      success: false, 
      error: errorMessage,
      details: error.code === 'EENVELOPE' ? 'Invalid recipient email address' : undefined
    };
  }
}

const emailHeader = `
  <div style="background-color: #f8f9fa; padding: 20px 0; text-align: center; border-bottom: 4px solid #586075;">
    <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-dark.png" alt="SpaceOut" style="height: 40px; margin-bottom: 10px;" />
    <h1 style="color: #1f2937; margin: 0; font-size: 24px;">SpaceOut</h1>
  </div>
`;

const emailFooter = `
  <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
    <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
      © ${new Date().getFullYear()} SpaceOut. All rights reserved.
    </p>
    <p style="color: #9ca3af; font-size: 11px; margin: 5px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #13151A; text-decoration: none;">Privacy Policy</a> | 
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color: #13151A; text-decoration: none;">Terms of Service</a>
    </p>
  </div>
`;

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  isDashboard: string
) {
  const assetBase = process.env.NEXT_PUBLIC_ASSET_URL || 'https://www.spaceoutworkstation.com/assets';
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || 'https://www.spaceoutworkstation.com/logo-dark.png';
  const asset = (name: string) => `${assetBase}/${encodeURIComponent(name)}`;
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.spaceoutworkstation.com';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">
          ${emailHeader}
          <div style="padding: 24px;">
            <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 10px;">Welcome aboard, ${firstName} 👋</h2>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">Thanks for joining SpaceOut — your new partner for professional workspaces, meeting rooms, and flexible memberships. This email gives you a guided tour of what you can do on the platform and how to get the best value from your membership.</p>

            <h3 style="color:#111827; font-size:16px; margin-top:18px;">What SpaceOut Offers</h3>
            <ul style="color:#374151; line-height:1.6; margin:8px 0 16px 20px;">
              <li><strong>Mini Office:</strong> Flexible day passes for individuals who need a reliable place to work.</li>
              <li><strong>Office Rooms:</strong> Book longer-term dedicated seats with storage and priority booking.</li>
              <li><strong>Meeting Rooms:</strong> Hourly bookings for client meetings, interviews and workshops.</li>
              <li><strong>Event & Private Spaces:</strong> Larger rooms for meetups, trainings and presentations.</li>
            </ul>

            <h3 style="color:#111827; font-size:16px;">Pricing & Plans</h3>
            <p style="color:#374151; margin-bottom:8px;">Rates vary by location, time and plan. Typical pricing brackets (refer to the website for exact branch prices):</p>
            <ul style="color:#374151; line-height:1.6; margin:8px 0 16px 20px;">
              <li><strong>Day Pass:</strong> From ₦2,000 — access to common areas and Wi‑Fi.</li>
              <li><strong>Hourly Meeting Room:</strong> From ₦2,500/hr — includes screen and refreshments on request.</li>
              <li><strong>Membership (Astronaut Card):</strong> Monthly benefits and discounted rates (see Astronaut Card section).</li>
            </ul>

            <h3 style="color:#111827; font-size:16px;">Astronaut Cards</h3>
            <p style="color:#374151; margin-bottom:8px;">Astronaut Cards are service-specific membership cards that are valid for one year. When you purchase an Astronaut Card for a given service, it entitles you to that service's member pricing during check-in for the duration of the card. You can view available Astronaut Cards on each service page.</p>

            <h3 style="color:#111827; font-size:16px;">Photos — A Quick Look</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
              <img src="${asset('IMG_8850.jpg')}" alt="SpaceOut space 1" style="width:160px; height:100px; object-fit:cover; border-radius:6px;" />
              <img src="${asset('IMG_8851.jpg')}" alt="SpaceOut space 2" style="width:160px; height:100px; object-fit:cover; border-radius:6px;" />
              <img src="${asset('IMG_8852.jpg')}" alt="SpaceOut space 3" style="width:160px; height:100px; object-fit:cover; border-radius:6px;" />
              <img src="${asset('inside (4).jpeg')}" alt="SpaceOut inside" style="width:160px; height:100px; object-fit:cover; border-radius:6px;" />
            </div>

            <details style="margin-bottom:16px;">
              <summary style="font-weight:600; color:#0f172a; cursor:pointer;">Show detailed services, rates and FAQ</summary>
              <div style="padding-top:8px; color:#374151; line-height:1.6;">
                <h4 style="margin:8px 0 4px;">Services & Add‑ons</h4>
                <p style="margin:0 0 8px;">Each booking lists what's included (Wi‑Fi, projector, whiteboard). Add‑ons such as catering or extended hours are billed separately — you can review these when making a booking.</p>
                <h4 style="margin:8px 0 4px;">Booking Rules</h4>
                <p style="margin:0 0 8px;">Bookings can be cancelled or rescheduled within the window shown at checkout. Certain promotional rates are non‑refundable — those terms are highlighted at checkout.</p>
                <h4 style="margin:8px 0 4px;">FAQ</h4>
                <p style="margin:0 0 8px;">For questions about billing, membership, or refunds, visit: <a href="${siteBase}/faq" style="color:#13151A; text-decoration:none;">SpaceOut FAQ</a></p>
              </div>
            </details>

            <div style="text-align:center; margin:20px 0;">
              <a href="${isDashboard}" style="display:inline-block; padding:12px 28px; background:#111827; color:#fff; border-radius:6px; text-decoration:none; font-weight:600;">Visit Your Dashboard</a>
            </div>

            <p style="color:#374151; margin-top:14px;">How to get started:</p>
            <ol style="color:#374151; margin:6px 0 16px 20px;">
              <li><strong>Check‑in:</strong> Use the <em>Check‑In</em> page in your dashboard to confirm daily attendance. For paid check‑ins, payment confirmation appears in your Payments list.</li>
              <li><strong>Book in advance:</strong> Search services on our <a href="https://www.spaceoutworkstation.com/services" style="color:#13151A;">Services</a> page, select dates and times, then complete booking from the dashboard.</li>
              <li><strong>Buy Astronaut Cards:</strong> Purchase membership (Astronaut) cards from the <em>Membership</em> section in your dashboard — this unlocks discounts and priority booking.</li>
              <li><strong>Profile & Payments:</strong> View full account details on your <a href="https://www.spaceoutworkstation.com/user/profile" style="color:#13151A;">Profile</a> page; payment history is under <a href="https://www.spaceoutworkstation.com/payments" style="color:#3b82f6;">Payments</a>.</li>
              <li><strong>Support:</strong> Click the floating support widget on any page to chat with our team for immediate help.</li>
            </ol>

            <p style="color:#6b7280; font-size:13px;">If you'd like a personal walkthrough or have special requirements (team bookings, events), reply to this email or contact support at <a href="mailto:${process.env.EMAIL_USER}" style="color:#3b82f6;">${process.env.EMAIL_USER}</a>.</p>
            <p style="color:#6b7280; font-size:13px; margin-top:8px;">Thanks again — we look forward to hosting you. <br/>— The SpaceOut Team</p>
          </div>
          ${emailFooter}
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to SpaceOut — Premium workspace solutions',
    html,
    text: `Welcome to SpaceOut, ${firstName}! Explore our workspaces, membership plans, and bookings at ${siteBase}`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${emailHeader}
          <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              You requested a password reset for your SpaceOut account. Click the button below to create a new password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}?token=${resetToken}" style="display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 20px 0;">Or copy and paste this link:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all; color: #374151; font-size: 12px; margin: 15px 0;">
              ${resetUrl}?token=${resetToken}
            </p>
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 5px; margin: 25px 0;">
              <p style="color: #991b1b; margin: 0; font-size: 13px;">
                <strong>🔒 Security Note:</strong> This link will expire in 24 hours. If you didn't request this, please ignore this email or contact support immediately.
              </p>
            </div>
          </div>
          ${emailFooter}
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'SpaceOut - Password Reset Request',
    html,
    text: `Reset your password at: ${resetUrl}?token=${resetToken}. This link expires in 24 hours.`,
  });
}

export async function sendAdminWelcomeEmail(
  email: string,
  adminName: string,
  loginUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${emailHeader}
          <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">Welcome to SpaceOut Admin Panel, ${adminName}! 👋</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              Your admin account has been successfully created. You now have access to the SpaceOut administrative dashboard.
            </p>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 25px 0;">
              <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">Your Admin Privileges:</h3>
              <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">User management and analytics</li>
                <li style="margin-bottom: 8px;">Booking and payment tracking</li>
                <li style="margin-bottom: 8px;">Gallery and content management</li>
                <li>Branch and branch settings</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 16px;">Access Admin Dashboard</a>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
              <strong>Email:</strong> ${email}
            </p>
          </div>
          ${emailFooter}
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to SpaceOut Admin Panel',
    html,
    text: `Welcome to SpaceOut Admin Panel, ${adminName}! Access your dashboard at: ${loginUrl}`,
  });
}

export async function sendNewUserSignupNotification(
  adminEmail: string,
  userDetails: {
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #f8f9fa; padding: 20px 0; text-align: center; border-bottom: 4px solid #10b981;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">SpaceOut - Admin Alert</h1>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">New User Registration 🎉</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              A new user has just signed up for SpaceOut. Here are their details:
            </p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 5px; margin: 25px 0;">
              <h3 style="color: #166534; margin-top: 0; font-size: 16px;">User Information</h3>
              <p style="color: #15803d; margin: 10px 0;"><strong>Name:</strong> ${userDetails.name}</p>
              <p style="color: #15803d; margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${userDetails.email}" style="color: #10b981;">${userDetails.email}</a></p>
              <p style="color: #15803d; margin: 10px 0;"><strong>Phone:</strong> ${userDetails.phone}</p>
              <p style="color: #15803d; margin: 10px 0;"><strong>Registered:</strong> ${userDetails.createdAt}</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              You can view this user's profile and manage their account from the SpaceOut admin dashboard.
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
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New User Signup - ${userDetails.name}`,
    html,
    text: `New user registered: ${userDetails.name} (${userDetails.email})`,
  });
}
