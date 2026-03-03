import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorLog extends Document {
  route: string;
  error: string;
  statusCode: number;
  userId?: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
}

const ErrorLogSchema = new Schema<IErrorLog>(
  {
    route: {
      type: String,
      required: true,
    },
    error: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ErrorLog || mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema);
