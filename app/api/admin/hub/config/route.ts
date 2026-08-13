import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubConfig from '@/lib/models/HubConfig';
import { requireHubAdmin } from '@/lib/hub-admin-auth';
import { ensureHubConfig } from '@/lib/hub-seed';

export const dynamic = 'force-dynamic';

const CONFIG_FIELDS = [
  'heroBadge',
  'heroTitle',
  'heroSubtitle',
  'heroImage',
  'heroSecondaryImage',
  'aboutTitle',
  'aboutText',
  'highlights',
  'stats',
  'programsTitle',
  'programsSubtitle',
  'scheduleTitle',
  'scheduleSubtitle',
  'galleryTitle',
  'gallerySubtitle',
  'testimonialsTitle',
  'testimonialsSubtitle',
  'ctaTitle',
  'ctaSubtitle',
  'ctaButtonText',
  'contactEmail',
  'contactPhone',
  'location',
  'whatsappNumber',
  'defaultRegistrationUrl',
];

// GET /api/admin/hub/config
export async function GET() {
  try {
    await dbConnect();
    const config = await ensureHubConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching hub config:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch hub config' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/hub/config
export async function PUT(request: NextRequest) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    let config = await HubConfig.findOne({ key: 'main' });
    if (!config) {
      config = await ensureHubConfig();
      config = (await HubConfig.findOne({ key: 'main' })) as any;
    }

    if (!config) {
      return NextResponse.json(
        { success: false, message: 'Config not found' },
        { status: 404 }
      );
    }

    CONFIG_FIELDS.forEach((field) => {
      if (body[field] !== undefined) {
        (config as any)[field] = body[field];
      }
    });

    if (body.updatedBy) {
      (config as any).updatedBy = body.updatedBy;
    }

    await config.save();

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error updating hub config:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update hub config' },
      { status: 500 }
    );
  }
}