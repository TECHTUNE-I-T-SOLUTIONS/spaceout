import mongoose, { Schema, Document } from 'mongoose';
import './User'; // Ensure User model is registered
import './Branch'; // Ensure Branch model is registered

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  category: string;
  status: 'open' | 'resolved';
  adminReply?: string;
  adminReplyDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'general',
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    adminReply: {
      type: String,
    },
    adminReplyDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
