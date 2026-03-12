import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CheckIn from '@/lib/models/CheckIn';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import Service from '@/lib/models/Service';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const {
      userId,
      serviceId,
      planName,
      planType,
      durationLabel,
      durationInHours,
      durationInDays,
      selectedRate,
      amount,
      wifiIncluded,
    } = await request.json();

    // Validation
    if (!userId || !serviceId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, serviceId, amount' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Create CheckIn record
    const checkIn = await CheckIn.create({
      userId,
      serviceId,
      serviceName: service.name,
      planName: planName || 'Manual Check-In',
      planType: planType || 'manual',
      durationLabel: durationLabel || 'Manual Entry',
      durationInHours,
      durationInDays,
      selectedRate: selectedRate || 'flat',
      amount,
      wifiIncluded: wifiIncluded || false,
      status: 'checked_in',
      paymentStatus: 'completed',
      checkedInAt: new Date(),
      paymentVerifiedAt: new Date(),
    });

    // Create Payment record linked to CheckIn
    const payment = await Payment.create({
      userId,
      serviceId,
      checkInId: checkIn._id,
      type: 'checkin',
      email: user.email,
      serviceName: service.name,
      planName: planName || 'Manual Check-In',
      planType: planType || 'manual',
      amount,
      currency: 'NGN',
      reference: `ADMIN-${checkIn._id}`,
      status: 'completed',
      paymentMethod: 'admin',
      paidAt: new Date(),
      verifiedAt: new Date(),
      metadata: {
        adminCreated: true,
        createdAt: new Date(),
        selectedRate,
        durationLabel,
      },
    });

    // Update CheckIn with payment ID
    await CheckIn.findByIdAndUpdate(checkIn._id, {
      paymentId: payment._id,
    });

    return NextResponse.json(
      {
        message: 'Manual check-in created successfully',
        checkIn,
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating manual check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create manual check-in', message: (error as any).message },
      { status: 500 }
    );
  }
}
