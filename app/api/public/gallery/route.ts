import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GalleryItem from '@/lib/models/Gallery';
import Branch from '@/lib/models/Branch';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let query: any = { isActive: true };
    if (category) {
      query.category = category;
    }

    const galleryItems = await GalleryItem.find(query)
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: galleryItems },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch gallery items' },
      { status: 500 }
    );
  }
}
