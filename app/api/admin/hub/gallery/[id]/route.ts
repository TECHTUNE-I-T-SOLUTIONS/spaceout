import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubGalleryItem from '@/lib/models/HubGallery';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// PUT /api/admin/hub/gallery/[id]
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

    const item = await HubGalleryItem.findById(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Gallery item not found' },
        { status: 404 }
      );
    }

    if (body.title !== undefined) item.title = body.title;
    if (body.description !== undefined) item.description = body.description;
    if (body.image !== undefined) item.image = body.image;
    if (body.category !== undefined) item.category = body.category;
    if (body.featured !== undefined) item.featured = !!body.featured;
    if (body.isActive !== undefined) item.isActive = !!body.isActive;

    await item.save();

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error updating hub gallery item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update gallery item' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hub/gallery/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;

    const item = await HubGalleryItem.findById(id);
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Gallery item not found' },
        { status: 404 }
      );
    }

    await HubGalleryItem.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Gallery item deleted' });
  } catch (error) {
    console.error('Error deleting hub gallery item:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete gallery item' },
      { status: 500 }
    );
  }
}