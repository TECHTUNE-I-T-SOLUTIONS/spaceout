import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubTestimonial from '@/lib/models/HubTestimonial';
import { requireHubAdmin } from '@/lib/hub-admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/hub/testimonials
export async function GET() {
  try {
    await dbConnect();
    const testimonials = await HubTestimonial.find()
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error('Error fetching hub testimonials:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

// POST /api/admin/hub/testimonials
export async function POST(request: NextRequest) {
  const { error } = await requireHubAdmin(request);
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    if (!body.name || !body.content) {
      return NextResponse.json(
        { success: false, message: 'Name and content are required' },
        { status: 400 }
      );
    }

    const testimonial = await HubTestimonial.create({
      name: body.name,
      role: body.role || '',
      content: body.content,
      avatar: body.avatar || '',
      rating: body.rating !== undefined ? Number(body.rating) : 5,
      featured: !!body.featured,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, testimonial }, { status: 201 });
  } catch (error) {
    console.error('Error creating hub testimonial:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}