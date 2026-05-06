import { NextRequest, NextResponse } from 'next/server';
import { verifyAndSyncPayment } from '@/lib/paystack';
import ErrorLog from '@/lib/models/ErrorLog';

// GET endpoint for Paystack verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const paystackReference = searchParams.get('paystackReference');
    const lookupReference = paystackReference || reference;

    if (!lookupReference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    const result = await verifyAndSyncPayment(lookupReference);
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || `Payment ${result.paystackStatus || 'failed'}`, payment: result.payment },
        { status: result.status === 'pending' ? 202 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: result.payment,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

// POST endpoint for webhook and legacy verification
export async function POST(request: NextRequest) {
  try {
    const { reference, status, paystackReference } = await request.json();
    if (reference || paystackReference) {
      const result = await verifyAndSyncPayment(paystackReference || reference);
      return NextResponse.json(
        { message: result.success ? 'Payment verified' : 'Payment updated', payment: result.payment },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Payment verification error:', error);

    await ErrorLog.create({
      route: '/api/payments/verify',
      error: error.message || 'Failed to verify payment',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
