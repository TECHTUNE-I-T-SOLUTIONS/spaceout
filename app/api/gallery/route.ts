import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return mock gallery images (in production, fetch from database)
    const images = [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
        alt: 'Modern Office Space',
        uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&h=300&fit=crop',
        alt: 'Collaborative Workspace',
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a5?w=500&h=300&fit=crop',
        alt: 'Meeting Room',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
        alt: 'Breakout Area',
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In production, save image metadata to database
    const image = {
      id: Date.now().toString(),
      url: body.url,
      alt: body.alt || 'Uploaded Image',
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error saving image:', error);
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
  }
}
