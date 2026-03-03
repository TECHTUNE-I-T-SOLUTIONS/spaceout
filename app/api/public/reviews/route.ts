import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await dbConnect();

    // Fetch only approved reviews with user details
    const reviews = await Review.find({ approved: true })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    // Transform data for frontend
    const formattedReviews = reviews.map((review) => ({
      id: review._id.toString(),
      author: review.userId?.name || 'Anonymous',
      email: review.userId?.email || '',
      rating: review.rating,
      content: review.comment,
      createdAt: review.createdAt,
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
