import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubTestimonial from '@/lib/models/HubTestimonial';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// PUT /api/admin/hub/testimonials/[id]
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

    const testimonial = await HubTestimonial.findById(id);
    if (!testimonial) {
      return NextResponse.json(
        { success: false, message: 'Testimonial not found' },
        { status: 404 }
      );
    }

    if (body.name !== undefined) testimonial.name = body.name;
    if (body.role !== undefined) testimonial.role = body.role;
    if (body.content !== undefined) testimonial.content = body.content;
    if (body.avatar !== undefined) testimonial.avatar = body.avatar;
    if (body.rating !== undefined) testimonial.rating = Number(body.rating);
    if (body.featured !== undefined) testimonial.featured = !!body.featured;
    if (body.isActive !== undefined) testimonial.isActive = !!body.isActive;

    await testimonial.save();

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    console.error('Error updating hub testimonial:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hub/testimonials/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;

    const testimonial = await HubTestimonial.findById(id);
    if (!testimonial) {
      return NextResponse.json(
        { success: false, message: 'Testimonial not found' },
        { status: 404 }
      );
    }

    await HubTestimonial.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    console.error('Error deleting hub testimonial:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}