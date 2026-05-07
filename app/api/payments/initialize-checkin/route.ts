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
  selectedDays?: number;
  selectedHours?: number;
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
    const Subscription = (await import('@/lib/models/Subscription')).default;

    // Do NOT activate membership yet — activation should occur after successful payment verification

    // Handle single-day vs multi-day subscriptions
    let checkInRecord;
    let subscriptionRecord;
    let checkInRecords = [];

    if (data.selectedDays && data.selectedDays > 1) {
      // Create subscription for multi-day booking
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + data.selectedDays);

      subscriptionRecord = await Subscription.create({
        userId: data.userId,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        planName: data.planName,
        planType: data.planType,
        durationLabel: `${data.selectedDays} Days`,
        durationInDays: data.selectedDays,
        selectedRate: data.selectedRate,
        amountPerDay: data.price,
        totalAmount: data.totalPrice || data.price,
        wifiIncluded: data.wifiIncluded,
        status: 'active',
        paymentStatus: 'pending',
        startDate: new Date(),
        endDate: endDate,
        checkIns: [], // Will be populated as users check in daily
      });

      // For subscriptions, we don't create check-in records upfront
      // Users will check in daily and records will be created then
      checkInRecord = null; // No primary check-in for subscriptions

    } else {
      // For single check-ins, don't create the record yet
      // It will be created only after successful payment verification
      checkInRecord = null;
    }

    // Create payment record
    const paymentRecord = await Payment.create({
      userId: data.userId,
      checkInId: checkInRecord?._id || null, // May be null for subscriptions
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
        selectedDays: data.selectedDays || 1,
        selectedHours: (data as any).selectedHours || null,
        isSubscription: (data.selectedDays && data.selectedDays > 1) || false,
        subscriptionId: subscriptionRecord?._id,
        checkInIds: checkInRecords.map(c => c._id), // Will be empty for subscriptions
      },
    });

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: data.email,
        amount: data.amount,
        reference: paymentRecord.reference,
        metadata: {
          checkInId: checkInRecord?._id?.toString() || null,
          paymentId: paymentRecord._id.toString(),
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          planName: data.planName,
          planType: data.planType,
          selectedRate: data.selectedRate,
          durationLabel: data.durationLabel,
          durationInHours: data.durationInHours,
          durationInDays: data.durationInDays,
          selectedHours: (data as any).selectedHours || null,
          userId: data.userId,
          isMembershipPayment: data.requiresMembership,
          membershipFee: data.membershipFee,
          selectedDays: data.selectedDays || 1,
          isSubscription: (data.selectedDays && data.selectedDays > 1) || false,
          subscriptionId: subscriptionRecord?._id?.toString(),
          checkInIds: checkInRecords.map(c => c._id.toString()),
          checkInAmount: data.totalPrice || data.price,
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

    // Update payment record with Paystack reference
    await Payment.findByIdAndUpdate(
      paymentRecord._id,
      {
        paystackReference: paystackResponse.data.data.reference,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        checkInId: checkInRecord?._id || null,
        paymentId: paymentRecord._id,
        subscriptionId: subscriptionRecord?._id,
        checkInIds: checkInRecords.map(c => c._id),
        selectedDays: data.selectedDays || 1,
        isSubscription: (data.selectedDays && data.selectedDays > 1) || false,
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
