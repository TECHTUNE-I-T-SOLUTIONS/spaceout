import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubProgram from '@/lib/models/HubProgram';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/hub/programs/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const program = await HubProgram.findById(id).lean();
    if (!program) {
      return NextResponse.json(
        { success: false, message: 'Program not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error('Error fetching hub program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/hub/programs/[id]
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

    const program = await HubProgram.findById(id);
    if (!program) {
      return NextResponse.json(
        { success: false, message: 'Program not found' },
        { status: 404 }
      );
    }

    if (body.title !== undefined) program.title = body.title;
    if (body.description !== undefined) program.description = body.description;
    if (body.icon !== undefined) program.icon = body.icon;
    if (body.category !== undefined) program.category = body.category;
    if (body.tags !== undefined) program.tags = body.tags;
    if (body.featured !== undefined) program.featured = !!body.featured;
    if (body.order !== undefined) program.order = body.order;
    if (body.isActive !== undefined) program.isActive = !!body.isActive;

    await program.save();

    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error('Error updating hub program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update program' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hub/programs/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;

    const program = await HubProgram.findById(id);
    if (!program) {
      return NextResponse.json(
        { success: false, message: 'Program not found' },
        { status: 404 }
      );
    }

    await HubProgram.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Program deleted' });
  } catch (error) {
    console.error('Error deleting hub program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete program' },
      { status: 500 }
    );
  }
}