import mongoose, { Schema, Document } from 'mongoose';
import './User'; // Ensure User model is registered
import './Service'; // Ensure Service model is registered

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId | string;
  serviceId?: mongoose.Types.ObjectId | string;
  checkInId?: mongoose.Types.ObjectId | string;
  type?: 'membership' | 'service' | 'prepaid' | 'checkin';
  email: string;
  serviceName: string;
  planName?: string;
  amount: number;
  currency?: string;
  planType?: string;
  membershipDays?: number;
  coverageEndDate?: Date;
  reference: string;
  paystackReference?: string;
  paystackAccessCode?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: 'paystack' | 'card' | 'bank_transfer';
  paidAt?: Date;
  verifiedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    checkInId: {
      type: Schema.Types.ObjectId,
      ref: 'CheckIn',
    },
    type: {
      type: String,
      enum: ['membership', 'service', 'prepaid', 'checkin'],
      default: 'checkin',
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
    },
    serviceName: {
      type: String,
      required: [true, 'Please provide service name'],
    },
    planName: String,
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    planType: String,
    membershipDays: Number,
    coverageEndDate: Date,
    reference: {
      type: String,
      required: [true, 'Please provide a payment reference'],
    },
    paystackReference: String,
    paystackAccessCode: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'card', 'bank_transfer'],
      default: 'paystack',
    },
    paidAt: Date,
    verifiedAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ paystackReference: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
