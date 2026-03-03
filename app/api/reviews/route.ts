import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import Branch from '@/lib/models/Branch';
import ErrorLog from '@/lib/models/ErrorLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const approved = searchParams.get('approved') === 'true';

    let query: any = {};

    if (branchId) {
      query.branchId = branchId;
    }

    if (approved) {
      query.approved = true;
    }

    const reviews = await Review.find(query)
      .populate('userId', 'name email')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(reviews, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);

    await ErrorLog.create({
      route: '/api/reviews',
      error: error.message || 'Failed to fetch reviews',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch reviews' },
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

    const reviewUserId = (session.user as any)?.id;
    const branchId = (session.user as any)?.branchId;

    await dbConnect();

    const { rating, comment } = await request.json();

    // Validation
    if (!rating || !comment) {
      return NextResponse.json(
        { message: 'rating and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      userId: reviewUserId,
      branchId,
      rating,
      comment,
      approved: false, // Requires admin approval
    });

    return NextResponse.json(
      { message: 'Review submitted successfully. Pending admin approval', review },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating review:', error);

    const errorSession = await getServerSession(authOptions) as any;
    const errorUserId = (errorSession?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/reviews',
      error: error.message || 'Failed to create review',
      statusCode: 500,
      userId: errorUserId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to submit review' },
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

    const { reviewId, approved } = await request.json();

    if (!reviewId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid reviewId or approved status' },
        { status: 400 }
      );
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { approved },
      { new: true }
    );

    if (!review) {
      return NextResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: `Review ${approved ? 'approved' : 'rejected'} successfully`,
        review,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating review:', error);

    const errorSession = await getServerSession(authOptions) as any;
    const errorUserId = (errorSession?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/reviews',
      error: error.message || 'Failed to update review',
      statusCode: 500,
      userId: errorUserId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to update review' },
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

    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { message: 'Invalid reviewId' },
        { status: 400 }
      );
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return NextResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting review:', error);

    const errorSession = await getServerSession(authOptions) as any;
    const errorUserId = (errorSession?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/reviews',
      error: error.message || 'Failed to delete review',
      statusCode: 500,
      userId: errorUserId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
