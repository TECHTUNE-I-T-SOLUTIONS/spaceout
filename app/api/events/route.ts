import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/lib/models/Event';

// GET /api/events - List published events
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // event, news, announcement
    const featured = searchParams.get('featured');
    const tags = searchParams.get('tags');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    const query: any = { status: 'published' };
    
    if (type) {
      query.eventType = type;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }
    
    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort(featured === 'true' ? { featured: -1, publishedAt: -1 } : { publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
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
      createdBy,
    } = body;
    
    // Validate required fields
    if (!title || !content || !excerpt || !eventType || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists
    const existingEvent = await Event.findOne({ slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
    if (existingEvent) {
      return NextResponse.json(
        { error: 'An event with this slug already exists' },
        { status: 409 }
      );
    }
    
    const event = new Event({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content,
      contentMarkdown,
      excerpt,
      eventType,
      status: status || 'draft',
      featured: featured || false,
      tags: tags || [],
      seoTitle,
      seoDescription,
      schemaType: schemaType || 'None',
      eventDate,
      eventEndDate,
      location,
      registrationUrl,
      contactEmail,
      contactPhone,
      featuredImage,
      mediaFiles: mediaFiles || [],
      createdBy,
    });
    
    await event.save();
    
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}