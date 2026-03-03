import mongoose, { Schema, Document } from 'mongoose';
import './User'; // Ensure User model is registered
import './Service'; // Ensure Service model is registered
import './Payment'; // Ensure Payment model is registered

export interface ICheckIn extends Document {
  userId: mongoose.Types.ObjectId | string;
  serviceId: mongoose.Types.ObjectId | string;
  serviceName: string;
  planName: string;
  planType: string;
  durationLabel: string;
  durationInHours?: number;
  durationInDays?: number;
  selectedRate: string;
  amount: number;
  wifiIncluded: boolean;
  status: 'pending' | 'pending_payment' | 'checked_in' | 'checked_out' | 'expired';
  paymentStatus: 'pending' | 'completed' | 'failed';
  checkedInAt: Date;
  checkedOutAt?: Date;
  paymentVerifiedAt?: Date;
  paymentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Please provide a service ID'],
    },
    serviceName: {
      type: String,
      required: [true, 'Please provide service name'],
    },
    planName: {
      type: String,
      required: [true, 'Please provide plan name'],
    },
    planType: {
      type: String,
      required: [true, 'Please provide plan type'],
    },
    durationLabel: {
      type: String,
      required: [true, 'Please provide duration label'],
    },
    durationInHours: {
      type: Number,
    },
    durationInDays: {
      type: Number,
    },
    selectedRate: {
      type: String,
      required: [true, 'Please provide selected rate'],
      enum: ['flat', 'member', 'nonMember', 'nonWifi', 'nonWifiMember', 'nonWifiNonMember'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide amount'],
    },
    wifiIncluded: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'pending_payment', 'checked_in', 'checked_out', 'expired'],
      default: 'pending_payment',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
    },
    checkedOutAt: {
      type: Date,
    },
    paymentVerifiedAt: {
      type: Date,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CheckIn || mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
