import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubSession from '@/lib/models/HubSession';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/hub/sessions/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const session = await HubSession.findById(id).lean();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error fetching hub session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/hub/sessions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const session = await HubSession.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    if (body.title !== undefined) session.title = body.title;
    if (body.slug !== undefined) session.slug = body.slug;
    if (body.description !== undefined) session.description = body.description;
    if (body.status !== undefined) session.status = body.status;
    if (body.startDate !== undefined)
      session.startDate = body.startDate ? new Date(body.startDate) : undefined;
    if (body.endDate !== undefined)
      session.endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (body.time !== undefined) session.time = body.time;
    if (body.duration !== undefined) session.duration = body.duration;
    if (body.ageRange !== undefined) session.ageRange = body.ageRange;
    if (body.fee !== undefined) session.fee = Number(body.fee);
    if (body.applicationFee !== undefined)
      session.applicationFee = Number(body.applicationFee);
    if (body.currency !== undefined) session.currency = body.currency;
    if (body.location !== undefined) session.location = body.location;
    if (body.capacity !== undefined) session.capacity = Number(body.capacity);
    if (body.enrolled !== undefined) session.enrolled = Number(body.enrolled);
    if (body.totalHours !== undefined) session.totalHours = Number(body.totalHours);
    if (body.coverImage !== undefined) session.coverImage = body.coverImage;
    if (body.registrationUrl !== undefined)
      session.registrationUrl = body.registrationUrl;
    if (body.courses !== undefined) session.courses = body.courses;
    if (body.whyJoin !== undefined) session.whyJoin = body.whyJoin;
    if (body.tags !== undefined) session.tags = body.tags;
    if (body.contactEmail !== undefined) session.contactEmail = body.contactEmail;
    if (body.contactPhone !== undefined) session.contactPhone = body.contactPhone;
    if (body.featured !== undefined) session.featured = !!body.featured;
    if (body.isActive !== undefined) session.isActive = !!body.isActive;

    await session.save();

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error updating hub session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hub/sessions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;

    const session = await HubSession.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    await HubSession.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting hub session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete session' },
      { status: 500 }
    );
  }
}