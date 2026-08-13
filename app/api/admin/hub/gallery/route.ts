import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubGalleryItem from '@/lib/models/HubGallery';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/hub/gallery
export async function GET() {
  try {
    await dbConnect();
    const gallery = await HubGalleryItem.find()
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    console.error('Error fetching hub gallery:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

// POST /api/admin/hub/gallery
export async function POST(request: NextRequest) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    if (!body.title || !body.image) {
      return NextResponse.json(
        { success: false, message: 'Title and image are required' },
        { status: 400 }
      );
    }

    const item = await HubGalleryItem.create({
      title: body.title,
      description: body.description || '',
      image: body.image,
      category: body.category || 'session',
      featured: !!body.featured,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error('Error creating hub gallery item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create gallery item' },
      { status: 500 }
    );
  }
}