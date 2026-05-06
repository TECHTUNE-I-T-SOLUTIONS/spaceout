import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    const SiteConfig = (await import('@/lib/models/SiteConfig')).default;
    const cfg = await SiteConfig.findOne({}).lean();
    return NextResponse.json({ config: cfg || { maintenanceMode: false } });
  } catch (error: any) {
    console.error('Error fetching site config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // admin cookie fallback
    const adminId = request.cookies.get('admin_id')?.value;
    const adminEmail = request.cookies.get('admin_email')?.value;
    if (!adminId || !adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const Admin = (await import('@/lib/models/Admin')).default;
    const admin = await Admin.findById(adminId);
    if (!admin || admin.email !== adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { maintenanceMode, maintenanceMessage } = body;

    const SiteConfig = (await import('@/lib/models/SiteConfig')).default;
    const cfg = await SiteConfig.findOneAndUpdate({}, { maintenanceMode, maintenanceMessage }, { upsert: true, new: true, setDefaultsOnInsert: true });

    return NextResponse.json({ success: true, config: cfg });
  } catch (error: any) {
    console.error('Error updating site config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
