import mongoose, { Schema, Document } from 'mongoose';
import './User'; // Ensure User model is registered
import './Service'; // Ensure Service model is registered
import './Payment'; // Ensure Payment model is registered

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId | string;
  serviceId: mongoose.Types.ObjectId | string;
  serviceName: string;
  planName: string;
  planType: string;
  durationLabel: string;
  durationInDays: number;
  selectedRate: string;
  amountPerDay: number;
  totalAmount: number;
  wifiIncluded: boolean;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  paymentStatus: 'pending' | 'completed' | 'failed';
  startDate: Date;
  endDate: Date;
  paymentId?: mongoose.Types.ObjectId;
  checkIns: mongoose.Types.ObjectId[]; // Array of CheckIn IDs for each day
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
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
    durationInDays: {
      type: Number,
      required: [true, 'Please provide duration in days'],
      min: 1,
    },
    selectedRate: {
      type: String,
      required: [true, 'Please provide selected rate'],
      enum: ['flat', 'member', 'nonMember', 'nonWifi', 'nonWifiMember', 'nonWifiNonMember'],
    },
    amountPerDay: {
      type: Number,
      required: [true, 'Please provide amount per day'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Please provide total amount'],
    },
    wifiIncluded: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    checkIns: [{
      type: Schema.Types.ObjectId,
      ref: 'CheckIn',
    }],
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
