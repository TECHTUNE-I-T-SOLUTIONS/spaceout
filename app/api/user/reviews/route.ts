import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';
import Review from '@/lib/models/Review';
import Branch from '@/lib/models/Branch';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    // Get user's reviews
    const reviews = await Review.find({ userId: session.user.id })
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Transform the response
    const formattedReviews = reviews.map((review: any) => ({
      id: review._id.toString(),
      spaceName: review.branchId?.name || 'Unknown Space',
      rating: review.rating || 0,
      comment: review.comment || '',
      date: new Date(review.createdAt).toLocaleDateString(),
      status: review.status || 'published',
      _id: review._id,
      ...review,
    }));

    return NextResponse.json(formattedReviews, { status: 200 });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    const { spaceName, branchId, rating, comment } = await req.json();

    if (!spaceName || !rating || !comment) {
      return NextResponse.json(
        { message: 'Space name, rating, and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const review = new Review({
      userId: session.user.id,
      branchId: branchId || undefined,
      spaceName,
      rating,
      comment,
      approved: false,
    });

    await review.save();

    return NextResponse.json(
      { message: 'Review submitted successfully', review },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json(
      { message: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
