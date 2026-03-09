import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Feedback from '@/lib/models/Feedback';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all feedback with user details
    const feedback = await Feedback.find()
      .populate('userId', 'firstName lastName email')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback', message: (error as any).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const { feedbackId, adminReply, status } = await request.json();

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'feedbackId is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (adminReply !== undefined) {
      updateData.adminReply = adminReply;
      updateData.adminReplyDate = adminReply ? new Date() : null;
    }

    if (status && ['open', 'resolved'].includes(status)) {
      updateData.status = status;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateData,
      { new: true }
    );

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback', message: (error as any).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { feedbackId } = await request.json();

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'feedbackId is required' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback', message: (error as any).message },
      { status: 500 }
    );
  }
}
