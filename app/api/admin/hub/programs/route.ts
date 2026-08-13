import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubProgram from '@/lib/models/HubProgram';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/hub/programs
export async function GET() {
  try {
    await dbConnect();
    const programs = await HubProgram.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, programs });
  } catch (error) {
    console.error('Error fetching hub programs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/hub/programs
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

    const nextOrder = await HubProgram.countDocuments();

    const program = await HubProgram.create({
      title: body.title,
      description: body.description || '',
      icon: body.icon || 'Code2',
      category: body.category || '',
      tags: body.tags || [],
      featured: !!body.featured,
      order: body.order !== undefined ? body.order : nextOrder + 1,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, program }, { status: 201 });
  } catch (error) {
    console.error('Error creating hub program:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create program' },
      { status: 500 }
    );
  }
}