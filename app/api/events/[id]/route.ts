import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/lib/models/Event';
import mongoose from 'mongoose';

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Try to find by ID first (if it's a valid ObjectId), then by slug
    let event: any = null;
    
    // Check if id is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
      event = await Event.findById(id).lean();
    }
    
    // If not found by ID, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: id }).lean();
    }
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Increment views if published
    if (event.status === 'published') {
      await Event.findByIdAndUpdate(event._id, { $inc: { views: 1 } });
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    const {
      title,
      slug,
      content,
      contentMarkdown,
      excerpt,
      eventType,
      status,
      featured,
      tags,
      seoTitle,
      seoDescription,
      schemaType,
      eventDate,
      eventEndDate,
      location,
      registrationUrl,
      contactEmail,
      contactPhone,
      featuredImage,
      mediaFiles,
      updatedBy,
    } = body;
    
    // Find event by ID or slug
    let event = await Event.findById(id);
    if (!event && /^[0-9a-fA-F]{24}$/.test(id)) {
      event = await Event.findOne({ slug: id });
    }
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if new slug already exists (if slug is being changed)
    if (slug && slug !== event.slug) {
      const existingEvent = await Event.findOne({ slug, _id: { $ne: event._id } });
      if (existingEvent) {
        return NextResponse.json(
          { error: 'An event with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update fields
    if (title) event.title = title;
    if (slug) event.slug = slug;
    if (content) event.content = content;
    if (contentMarkdown !== undefined) event.contentMarkdown = contentMarkdown;
    if (excerpt) event.excerpt = excerpt;
    if (eventType) event.eventType = eventType;
    if (status) event.status = status;
    if (featured !== undefined) event.featured = featured;
    if (tags) event.tags = tags;
    if (seoTitle !== undefined) event.seoTitle = seoTitle;
    if (seoDescription !== undefined) event.seoDescription = seoDescription;
    if (schemaType) event.schemaType = schemaType;
    if (eventDate !== undefined) event.eventDate = eventDate;
    if (eventEndDate !== undefined) event.eventEndDate = eventEndDate;
    if (location !== undefined) event.location = location;
    if (registrationUrl !== undefined) event.registrationUrl = registrationUrl;
    if (contactEmail !== undefined) event.contactEmail = contactEmail;
    if (contactPhone !== undefined) event.contactPhone = contactPhone;
    if (featuredImage !== undefined) event.featuredImage = featuredImage;
    if (mediaFiles) event.mediaFiles = mediaFiles;
    if (updatedBy) event.updatedBy = updatedBy;
    
    // Set publishedAt when status changes to published
    if (status === 'published' && event.status !== 'published') {
      event.publishedAt = new Date();
    }
    
    await event.save();
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Find event by ID or slug
    let event = await Event.findById(id);
    if (!event && /^[0-9a-fA-F]{24}$/.test(id)) {
      event = await Event.findOne({ slug: id });
    }
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    await Event.findByIdAndDelete(event._id);
    
    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}