import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Feedback from '@/lib/models/Feedback';
import Branch from '@/lib/models/Branch';
import ErrorLog from '@/lib/models/ErrorLog';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let userRole = '';
    let userId = '';
    let branchId = '';

    // Check for NextAuth session (user authentication)
    const session = await getServerSession(authOptions) as any;
    
    if (session?.user) {
      userRole = (session.user as any)?.role;
      userId = (session.user as any)?.id;
      branchId = (session.user as any)?.branchId;
    } else {
      // Check for admin cookie authentication
      const adminId = cookieStore.get('admin_id')?.value;
      const adminRole = cookieStore.get('admin_role')?.value;
      
      if (!adminId || !adminRole) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      
      userRole = adminRole;
      userId = '';
      branchId = '';
    }

    if (!userRole) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let query: any = {};

    if (userRole === 'user') {
      query.userId = userId;
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      // Admin can see all feedback or filtered by branch
      // If admin has branchId, filter by that
      if (branchId) {
        query.branchId = branchId;
      }
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
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const feedbackUserId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    const { message: feedbackMessage } = await request.json();

    if (!feedbackMessage || feedbackMessage.trim().length === 0) {
      return NextResponse.json(
        { message: 'Feedback message is required' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.create({
      userId: feedbackUserId,
      branchId,
      message: feedbackMessage,
      status: 'open',
    });

    return NextResponse.json(
      { message: 'Feedback submitted successfully', feedback },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating feedback:', error);

    const errorSession = await getServerSession(authOptions) as any;
    const errorUserId = (errorSession?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/feedback',
      error: error.message || 'Failed to create feedback',
      statusCode: 500,
      userId: errorUserId,
    });

    return NextResponse.json(
      { message: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check for admin session from cookies (admin login uses custom cookies)
    const adminRole = request.cookies.get('admin_role')?.value;
    const adminId = request.cookies.get('admin_id')?.value;

    // Also check NextAuth session as fallback
    let userRole = adminRole;
    if (!userRole) {
      const patchSession = await getServerSession(authOptions) as any;
      
      if (!patchSession?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      
      userRole = (patchSession.user as any)?.role;
    }

    if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { feedbackId, status, adminReply } = await request.json();

    if (!feedbackId) {
      return NextResponse.json(
        { message: 'Invalid feedbackId' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (status && ['open', 'resolved'].includes(status)) {
      updateData.status = status;
    }
    
    if (adminReply !== undefined) {
      updateData.adminReply = adminReply;
      updateData.adminReplyDate = adminReply ? new Date() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No updates provided' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateData,
      { new: true }
    );

    if (!feedback) {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Feedback updated successfully', feedback },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating feedback:', error);

    const errorSession = await getServerSession(authOptions) as any;
    const errorUserId = (errorSession?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/feedback',
      error: error.message || 'Failed to update feedback',
      statusCode: 500,
      userId: errorUserId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check for admin session from cookies (admin login uses custom cookies)
    const adminRole = request.cookies.get('admin_role')?.value;
    const adminId = request.cookies.get('admin_id')?.value;

    // Also check NextAuth session as fallback
    let userRole = adminRole;
    if (!userRole) {
      const deleteSession = await getServerSession(authOptions) as any;
      
      if (!deleteSession?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      
      userRole = (deleteSession.user as any)?.role;
    }

    if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { feedbackId } = await request.json();

    if (!feedbackId) {
      return NextResponse.json(
        { message: 'Invalid feedbackId' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Feedback deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting feedback:', error);

    const errorSession = await getServerSession(authOptions) as any;
    const errorUserId = (errorSession?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/feedback',
      error: error.message || 'Failed to delete feedback',
      statusCode: 500,
      userId: errorUserId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
