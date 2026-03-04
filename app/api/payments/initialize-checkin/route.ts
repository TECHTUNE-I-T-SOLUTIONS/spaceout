import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import axios from 'axios';

interface CheckInData {
  amount: number;
  email: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  planName: string;
  planType: string;
  durationLabel: string;
  durationInHours?: number;
  durationInDays?: number;
  selectedRate: string;
  price: number;
  wifiIncluded: boolean;
  requiresMembership?: boolean;
  membershipFee?: number;
  totalPrice?: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: CheckInData = await request.json();

    // Validate required fields
    if (!data.amount || !data.email || !data.userId || !data.serviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Dynamically import models to avoid build issues
    const CheckIn = (await import('@/lib/models/CheckIn')).default;
    const Payment = (await import('@/lib/models/Payment')).default;
    const User = (await import('@/lib/models/User')).default;

    // If user is getting membership, activate it first
    if (data.requiresMembership && data.membershipFee) {
      await User.findByIdAndUpdate(
        data.userId,
        {
          membershipStatus: 'active',
          membershipType: 'annual',
          membershipActivatedAt: new Date(),
          // Set expiry to 1 year from now
          membershipExpiryDate: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000),
        },
        { new: true }
      );
    }

    // Create check-in record first
    const checkInRecord = await CheckIn.create({
      userId: data.userId,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      planName: data.planName,
      planType: data.planType,
      durationLabel: data.durationLabel,
      durationInHours: data.durationInHours,
      durationInDays: data.durationInDays,
      selectedRate: data.selectedRate,
      amount: data.price,
      wifiIncluded: data.wifiIncluded,
      status: 'pending', // pending_payment, checked_in, checked_out, expired
      checkedInAt: new Date(),
      paymentStatus: 'pending',
    });

    // Create payment record
    const paymentRecord = await Payment.create({
      userId: data.userId,
      checkInId: checkInRecord._id,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      planName: data.planName,
      amount: data.totalPrice || data.price,
      email: data.email,
      status: 'pending',
      paymentMethod: 'paystack',
      reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, // Generate unique reference
      metadata: {
        planType: data.planType,
        selectedRate: data.selectedRate,
        wifiIncluded: data.wifiIncluded,
        durationLabel: data.durationLabel,
        checkInAmount: data.price,
        membershipFee: data.membershipFee || 0,
        totalAmount: data.totalPrice || data.price,
        requiresMembership: data.requiresMembership,
      },
    });

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: data.email,
        amount: data.amount,
        reference: paymentRecord._id.toString(),
        metadata: {
          checkInId: checkInRecord._id.toString(),
          paymentId: paymentRecord._id.toString(),
          serviceName: data.serviceName,
          planName: data.planName,
          planType: data.planType,
          selectedRate: data.selectedRate,
          durationLabel: data.durationLabel,
          userId: data.userId,
          isMembershipPayment: data.requiresMembership,
          membershipFee: data.membershipFee,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify-checkin`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!paystackResponse.data.status) {
      throw new Error('Failed to initialize Paystack transaction');
    }

    return NextResponse.json(
      {
        success: true,
        checkInId: checkInRecord._id,
        paymentId: paymentRecord._id,
        authorization_url: paystackResponse.data.data.authorization_url,
        access_code: paystackResponse.data.data.access_code,
        reference: paystackResponse.data.data.reference,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Check-in initialization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize check-in',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
