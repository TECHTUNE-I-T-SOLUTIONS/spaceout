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
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
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
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
