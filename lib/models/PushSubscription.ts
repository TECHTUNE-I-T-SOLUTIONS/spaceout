import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string; // Can be ObjectId string or anonymous ID like "anon_xxx"
  subscription: object; // PushSubscriptionJSON
  userRole?: 'user' | 'admin' | 'visitor'; // Role of the user
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.Mixed, // Accept both ObjectId strings and anonymous IDs
      required: true,
    },
    subscription: {
      type: Schema.Types.Mixed,
      required: true,
    },
    userRole: {
      type: String,
      enum: ['user', 'admin', 'visitor'],
      default: 'visitor',
    },
    userAgent: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PushSubscriptionSchema.index({ userId: 1 });
PushSubscriptionSchema.index({ isActive: 1 });
PushSubscriptionSchema.index({ userRole: 1 });

export default mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

