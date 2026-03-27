import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBookingCheckin extends Document {
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  bookingDetails: any; // Store a snapshot of the booking details at check-in
  checkedInAt: Date;
  checkedOutAt?: Date;
  checkedOut: boolean;
  checkinDay: number; // 1-based: which day of the booking this check-in is for
  totalBookingDays: number;
  totalCheckinDays: number;
}

const BookingCheckinSchema: Schema<IBookingCheckin> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  bookingDetails: { type: Schema.Types.Mixed, required: true },
  checkedInAt: { type: Date, required: true },
  checkedOutAt: { type: Date },
  checkedOut: { type: Boolean, default: false },
  checkinDay: { type: Number, required: true },
  totalBookingDays: { type: Number, required: true },
  totalCheckinDays: { type: Number, required: true },
});

// Ensure a user can only check in once per booking per day
BookingCheckinSchema.index({ userId: 1, bookingId: 1, checkinDay: 1 }, { unique: true });

const BookingCheckin: Model<IBookingCheckin> =
  mongoose.models.BookingCheckin || mongoose.model<IBookingCheckin>('BookingCheckin', BookingCheckinSchema);

export default BookingCheckin;
