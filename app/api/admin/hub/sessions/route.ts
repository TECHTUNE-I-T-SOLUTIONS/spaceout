import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubSession from '@/lib/models/HubSession';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/hub/sessions
export async function GET() {
  try {
    await dbConnect();
    const sessions = await HubSession.find()
      .sort({ startDate: -1, createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching hub sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/hub/sessions
export async function POST(request: NextRequest) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const existing = await HubSession.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A session with this slug already exists' },
        { status: 409 }
      );
    }

    const session = await HubSession.create({
      title: body.title,
      slug,
      description: body.description || '',
      status: body.status || 'draft',
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      time: body.time || '',
      duration: body.duration || '',
      ageRange: body.ageRange || '',
      fee: body.fee !== undefined ? Number(body.fee) : 0,
      applicationFee: body.applicationFee !== undefined ? Number(body.applicationFee) : 0,
      currency: body.currency || 'NGN',
      location: body.location || '',
      capacity: body.capacity !== undefined ? Number(body.capacity) : 0,
      enrolled: body.enrolled !== undefined ? Number(body.enrolled) : 0,
      totalHours: body.totalHours !== undefined ? Number(body.totalHours) : 0,
      coverImage: body.coverImage || '',
      registrationUrl: body.registrationUrl || '',
      courses: body.courses || [],
      whyJoin: body.whyJoin || [],
      tags: body.tags || [],
      contactEmail: body.contactEmail || '',
      contactPhone: body.contactPhone || '',
      featured: !!body.featured,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Error creating hub session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create session' },
      { status: 500 }
    );
  }
}