import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  planType?: string;
  coverageEndDate?: Date;
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed';
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
    planType: String,
    coverageEndDate: Date,
    paymentReference: {
      type: String,
      required: [true, 'Please provide a payment reference'],
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
