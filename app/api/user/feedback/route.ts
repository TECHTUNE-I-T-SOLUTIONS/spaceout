import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';
import Feedback from '@/lib/models/Feedback';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    // Get user's feedback
    const feedbacks = await Feedback.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Transform the response
    const formattedFeedbacks = feedbacks.map((feedback: any) => ({
      id: feedback._id.toString(),
      title: feedback.title || 'Feedback',
      message: feedback.message || '',
      category: feedback.category || 'general',
      date: new Date(feedback.createdAt).toLocaleDateString(),
      status: feedback.status || 'open',
      adminReply: feedback.adminReply,
      adminReplyDate: feedback.adminReplyDate ? new Date(feedback.adminReplyDate).toLocaleDateString() : undefined,
      _id: feedback._id,
      ...feedback,
    }));

    return NextResponse.json(formattedFeedbacks, { status: 200 });
  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    await dbConnect();

    const { title, message, category, branchId } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { message: 'Title and message are required' },
        { status: 400 }
      );
    }

    const feedback = new Feedback({
      userId: session.user.id,
      branchId: branchId || undefined,
      title,
      message,
      category: category || 'general',
      status: 'open',
    });

    await feedback.save();

    return NextResponse.json(
      { message: 'Feedback submitted successfully', feedback },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submit error:', error);
    return NextResponse.json(
      { message: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
