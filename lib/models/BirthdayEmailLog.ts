import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBirthdayEmailLog extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  kind: 'birthday-reminder' | 'birthday-day';
  scheduledFor: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BirthdayEmailLogSchema = new Schema<IBirthdayEmailLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    kind: { type: String, enum: ['birthday-reminder', 'birthday-day'], required: true },
    scheduledFor: { type: Date, required: true },
    sentAt: { type: Date },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    lastError: { type: String },
  },
  {
    timestamps: true,
  }
);

BirthdayEmailLogSchema.index({ userId: 1, kind: 1, scheduledFor: 1 }, { unique: true });

const BirthdayEmailLog: Model<IBirthdayEmailLog> =
  mongoose.models.BirthdayEmailLog || mongoose.model<IBirthdayEmailLog>('BirthdayEmailLog', BirthdayEmailLogSchema);

export default BirthdayEmailLog;