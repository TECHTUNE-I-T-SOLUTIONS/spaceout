import axios from 'axios';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';
import PushSubscription from '@/lib/models/PushSubscription';
import { sendPaymentPushNotification } from '@/lib/push-notification';

export type SyncedPaymentStatus = 'completed' | 'failed' | 'pending';

export interface SyncedPaymentResult {
  success: boolean;
  payment?: any;
  paystackStatus?: string;
  status?: SyncedPaymentStatus;
  message?: string;
}

export async function verifyAndSyncPayment(reference: string): Promise<SyncedPaymentResult> {
  await dbConnect();

  const payment = await Payment.findOne({
    $or: [{ reference }, { paystackReference: reference }],
  });

  if (!payment) {
    return { success: false, message: 'Payment not found' };
  }

  const candidates = [
    payment.paystackReference,
    reference,
    payment.reference,
  ].filter(Boolean) as string[];

  const uniqueCandidates = Array.from(new Set(candidates));
  if (uniqueCandidates.length === 0) {
    return {
      success: false,
      payment: payment.toObject(),
      message: 'Paystack reference not available for this payment',
    };
  }

  let response;
  let lastError: any = null;
  try {
    for (const candidate of uniqueCandidates) {
      try {
        response = await axios.get(
          `https://api.paystack.co/transaction/verify/${candidate}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );
        break;
      } catch (error: any) {
        lastError = error;
        const paystackMessage = error?.response?.data?.message || '';
        if (paystackMessage !== 'Transaction reference not found.') {
          throw error;
        }
      }
    }
  } catch (error: any) {
    lastError = error;
  }

  if (!response) {
    const status = lastError?.response?.status;
    const data = lastError?.response?.data;
    const message = data?.message || lastError?.message || 'Paystack verification failed';

    // If Paystack explicitly says transaction reference not found, mark payment as failed
    if (message === 'Transaction reference not found.') {
      payment.status = 'failed';
      payment.verifiedAt = new Date();
      await payment.save();

      return {
        success: false,
        payment: payment.toObject(),
        message,
        paystackStatus: data?.status ? data?.data?.status : undefined,
        status: 'failed',
      };
    }

    return {
      success: false,
      payment: payment.toObject(),
      message,
      paystackStatus: data?.status ? data?.data?.status : undefined,
      status: status === 400 ? 'pending' : 'failed',
    };
  }

  if (!response.data?.status) {
    return {
      success: false,
      payment: payment.toObject(),
      message: response.data?.message || 'Payment verification failed',
    };
  }

  const paystackData = response.data.data;
  const paystackStatus = paystackData.status;

  if (paystackStatus === 'success') {
    payment.status = 'completed';
    payment.paidAt = payment.paidAt || new Date(paystackData.paid_at || Date.now());
    payment.verifiedAt = new Date();
    payment.paystackReference = paystackData.reference || payment.paystackReference || reference;
    await payment.save();

    if (payment.membershipDays) {
      const membershipExpiry = new Date();
      membershipExpiry.setDate(membershipExpiry.getDate() + payment.membershipDays);
      await User.findByIdAndUpdate(payment.userId, {
        hasMembership: true,
        membershipExpiry,
      });
    }

    if (payment.status === 'completed') {
      const userSubscriptions = await PushSubscription.find({
        userId: payment.userId,
        isActive: true,
      });

      for (const sub of userSubscriptions) {
        try {
          await sendPaymentPushNotification(sub.subscription as any, payment.amount, payment.paystackReference || reference);
        } catch (err) {
          console.error('Failed to send payment push notification:', err);
        }
      }
    }

    return { success: true, status: 'completed', paystackStatus, payment: payment.toObject() };
  }

  const nextStatus: SyncedPaymentStatus = paystackStatus === 'pending' ? 'pending' : 'failed';
  payment.status = nextStatus;
  payment.verifiedAt = new Date();
  await payment.save();

  return { success: false, status: nextStatus, paystackStatus, payment: payment.toObject() };
}
