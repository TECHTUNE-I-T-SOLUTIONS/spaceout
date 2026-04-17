import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status, paymentStatus, failureReason } = await request.json();

    if (!status && !paymentStatus) {
      return NextResponse.json(
        { error: 'Status or paymentStatus is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Dynamically import models
    const CheckIn = (await import('@/lib/models/CheckIn')).default;

    // Find and update the check-in record
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (failureReason) updateData.failureReason = failureReason;
    updateData.updatedAt = new Date();

    const checkIn = await CheckIn.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in record not found' },
        { status: 404 }
      );
    }

    // Verify the check-in belongs to the current user
    if (checkIn.userId.toString() !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      checkIn: {
        _id: checkIn._id,
        status: checkIn.status,
        paymentStatus: checkIn.paymentStatus,
        failureReason: checkIn.failureReason,
        updatedAt: checkIn.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating check-in status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update check-in status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}