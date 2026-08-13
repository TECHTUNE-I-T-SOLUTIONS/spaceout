import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubConfig from '@/lib/models/HubConfig';
import HubSession from '@/lib/models/HubSession';
import HubProgram from '@/lib/models/HubProgram';
import { ensureHubConfig } from '@/lib/hub-seed';

export const dynamic = 'force-dynamic';

// GET /api/public/hub/trainings/[slug]
// Returns a single active training (+ config + program tracks) for the dedicated
// training detail page. 404 for drafts / inactive / missing slugs.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const [config, session, programs] = await Promise.all([
      ensureHubConfig(),
      HubSession.findOne({
        slug,
        isActive: true,
        status: { $ne: 'draft' },
      }).lean(),
      HubProgram.find({ isActive: true }).sort({ order: 1 }).lean(),
    ]);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Training not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
      session,
      programs,
    });
  } catch (error) {
    console.error('Error fetching hub training:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch training' },
      { status: 500 }
    );
  }
}
