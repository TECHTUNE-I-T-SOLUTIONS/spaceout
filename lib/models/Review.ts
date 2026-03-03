import mongoose, { Schema, Document } from 'mongoose';
import './User'; // Ensure User model is registered
import './Branch'; // Ensure Branch model is registered

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  spaceName?: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
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
    spaceName: {
      type: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
