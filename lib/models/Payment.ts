import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  type: 'membership' | 'service' | 'prepaid';
  amount: number;
  currency: string;
  planType?: string;
  membershipDays?: number;
  coverageEndDate?: Date;
  paymentReference: string;
  paystackReference?: string;
  paystackAccessCode?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'paystack' | 'card' | 'bank_transfer';
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
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Please provide a branch ID'],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    type: {
      type: String,
      enum: ['membership', 'service', 'prepaid'],
      required: true,
    },
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
    paymentReference: {
      type: String,
      required: [true, 'Please provide a payment reference'],
      unique: true,
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
