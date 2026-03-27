import mongoose, { Schema, Document } from 'mongoose';
import './User'; // Ensure User model is registered
import './Branch'; // Ensure Branch model is registered
import './Service'; // Ensure Service model is registered

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  durationInDays: number;
  durationInHours?: number;
  selectedPlan: {
    planName: string;
    planType: string;
    durationLabel: string;
    memberPrice: number;
    nonMemberPrice: number;
    flatPrice?: number;
  };
  isMember: boolean;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked_in';
  notes?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  checkInRecords?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    durationInDays: {
      type: Number,
      required: true,
    },
    durationInHours: {
      type: Number,
    },
    selectedPlan: {
      planName: { type: String, required: true },
      planType: { type: String, required: true },
      durationLabel: { type: String, required: true },
      memberPrice: { type: Number, required: true },
      nonMemberPrice: { type: Number, required: true },
      flatPrice: { type: Number },
    },
    isMember: {
      type: Boolean,
      default: false,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'checked_in'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    notes: String,
    checkInRecords: [{
      type: Schema.Types.ObjectId,
      ref: 'CheckIn'
    }],
  },
  {
    timestamps: true,
  }
);

export { BookingSchema };
export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
