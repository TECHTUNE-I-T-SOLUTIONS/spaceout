import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    console.log('Verifying payment with reference:', reference);
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    console.log('Paystack response status:', response.status);
    console.log('Paystack response data:', response.data);

    if (!response.data.status) {
      // Paystack returned an error
      const errorMessage = response.data.message || 'Payment verification failed';
      return NextResponse.json(
        { 
          error: errorMessage,
          status: 'error',
          paystackStatus: response.data.status 
        },
        { status: 400 }
      );
    }

    const paymentData = response.data.data;

    // Determine status based on Paystack response
    let status = 'unknown';
    if (paymentData.status === 'success') {
      status = 'success';
    } else if (paymentData.status === 'failed') {
      status = 'failed';
    } else if (paymentData.status === 'abandoned') {
      status = 'failed'; // Treat abandoned as failed
    } else {
      status = 'pending';
    }

    return NextResponse.json({
      success: true,
      status,
      paystackStatus: paymentData.status,
      reference: paymentData.reference,
      amount: paymentData.amount / 100, // Convert from kobo
      paidAt: paymentData.paid_at,
      gatewayResponse: paymentData.gateway_response,
    });
  } catch (error: any) {
    console.error('Error verifying payment status:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify payment status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}