import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Feedback from '@/lib/models/Feedback';
import ErrorLog from '@/lib/models/ErrorLog';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    let query: any = {};

    if (userRole === 'user') {
      query.userId = userId;
    } else if (userRole === 'admin') {
      query.branchId = branchId;
    }

    const feedback = await Feedback.find(query)
      .populate('userId', 'name email')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(feedback, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);

    await ErrorLog.create({
      route: '/api/feedback',
      error: error.message || 'Failed to fetch feedback',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { message: 'Feedback message is required' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.create({
      userId,
      branchId,
      message,
      status: 'open',
    });

    return NextResponse.json(
      { message: 'Feedback submitted successfully', feedback },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating feedback:', error);

    const session = await auth();
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/feedback',
      error: error.message || 'Failed to create feedback',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;

    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { feedbackId, status } = await request.json();

    if (!feedbackId || !['open', 'resolved'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid feedbackId or status' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { status },
      { new: true }
    );

    if (!feedback) {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Feedback status updated successfully', feedback },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating feedback:', error);

    const session = await auth();
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/feedback',
      error: error.message || 'Failed to update feedback',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
