import { NextRequest } from 'next/server';
import dbConnect from './db';
import ActivityLog, { IActivityLog } from './models/ActivityLog';
import Admin from './models/Admin';
import { sendEmail } from './email';

export interface ClientInfo {
  ipAddress: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
}

export function getClientInfo(request: NextRequest): ClientInfo {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  let device = 'unknown';
  let browser = 'unknown';
  let os = 'unknown';

  if (userAgent !== 'unknown') {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet';
    } else {
      device = 'Desktop';
    }

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  }

  return { ipAddress, userAgent, device, browser, os };
}

export async function logActivity(
  adminId: string,
  action: string,
  details: string,
  category: IActivityLog['category'] = 'other',
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  try {
    await dbConnect();

    const admin = await Admin.findById(adminId).select('email name');
    if (!admin) return;

    await ActivityLog.create({
      adminId: admin._id,
      adminEmail: admin.email,
      adminName: admin.name,
      action,
      details,
      category,
      metadata,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Activity logging error:', error);
    // Never fail the main flow if activity logging fails
  }
}

export async function notifySuperAdminsOfLogin(
  adminEmail: string,
  adminName: string,
  ipAddress: string,
  device: string,
  browser: string,
  os: string,
): Promise<void> {
  try {
    await dbConnect();

    const superAdmins = await Admin.find({ role: 'superadmin', isActive: true }).select('email name');
    if (superAdmins.length === 0) return;

    const loginInfo = `${adminName} (${adminEmail}) just logged into the SpaceOut admin dashboard from ${device} (${browser} on ${os}) with IP address ${ipAddress}`;

    for (const superAdmin of superAdmins) {
      if (superAdmin.email === adminEmail) continue; // Don't notify the person logging in

      await sendEmail({
        to: superAdmin.email,
        subject: 'Admin Dashboard Login Alert',
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
                  <h1 style="color: #1f2937; margin: 0; font-size: 24px;">SpaceOut - Security Alert</h1>
                </div>
                <div style="padding: 40px 20px;">
                  <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">Admin Login Notification</h2>
                  <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                    A login was detected on the SpaceOut admin dashboard. Here are the details:
                  </p>
                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 5px; margin: 25px 0;">
                    <h3 style="color: #1d4ed8; margin-top: 0; font-size: 16px;">Login Details</h3>
                    <p style="color: #1e40af; margin: 10px 0;"><strong>Admin:</strong> ${adminName} (${adminEmail})</p>
                    <p style="color: #1e40af; margin: 10px 0;"><strong>Device:</strong> ${device}</p>
                    <p style="color: #1e40af; margin: 10px 0;"><strong>Browser:</strong> ${browser}</p>
                    <p style="color: #1e40af; margin: 10px 0;"><strong>Operating System:</strong> ${os}</p>
                    <p style="color: #1e40af; margin: 10px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
                    <p style="color: #1e40af; margin: 10px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                    If this was you or someone you authorized, no action is needed. If you did not authorize this login, please reset your password immediately and contact support.
                  </p>
                  <p style="color: #6b7280; font-size: 14px;">
                    This is an automated notification from SpaceOut. Do not reply to this email.
                  </p>
                </div>
                <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
                  <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                    &copy; ${new Date().getFullYear()} SpaceOut. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `Admin Login Alert: ${adminName} (${adminEmail}) logged in from ${device} (${browser} on ${os}) with IP ${ipAddress} at ${new Date().toLocaleString()}`,
      });
    }
  } catch (error) {
    console.error('Super admin login notification error:', error);
    // Never fail the main flow if email notification fails
  }
}
