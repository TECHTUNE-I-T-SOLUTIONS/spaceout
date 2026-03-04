import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  planName: string;
  serviceName: string;
  price: number;
  duration: number;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  paymentReference: string;
  isAccessCard: boolean;
  autoRenew: boolean;
  cancelledDate?: Date;
  cancelReason?: string;
}

const UserSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipPlan',
    },
    planName: {
      type: String,
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      description: 'Duration in days',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
      required: true,
      index: true,
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isAccessCard: {
      type: Boolean,
      default: false,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    cancelledDate: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
UserSubscriptionSchema.index({ userId: 1, status: 1 });
UserSubscriptionSchema.index({ userId: 1, serviceId: 1 });
UserSubscriptionSchema.index({ userId: 1, serviceId: 1, isAccessCard: 1 });
UserSubscriptionSchema.index({ expiryDate: 1, status: 1 });

// Method to check if subscription is still active
UserSubscriptionSchema.methods.isStillActive = function (): boolean {
  return this.status === 'active' && this.expiryDate > new Date();
};

// Method to cancel subscription
UserSubscriptionSchema.methods.cancel = async function (reason?: string): Promise<void> {
  this.status = 'cancelled';
  this.cancelledDate = new Date();
  this.cancelReason = reason;
  this.autoRenew = false;
  await this.save();
};

// Static method to find active subscriptions for a user
UserSubscriptionSchema.statics.findActiveForUser = async function (
  userId: string,
  serviceId?: string
) {
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
    expiryDate: { $gt: new Date() },
  };

  if (serviceId) {
    query.serviceId = new mongoose.Types.ObjectId(serviceId);
  }

  return this.find(query).sort({ expiryDate: -1 });
};

// Static method to find if user has access card for a service
UserSubscriptionSchema.statics.hasAccessCard = async function (
  userId: string,
  serviceId: string
) {
  const subscription = await this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    serviceId: new mongoose.Types.ObjectId(serviceId),
    isAccessCard: true,
    status: 'active',
    expiryDate: { $gt: new Date() },
  });

  return !!subscription;
};

export const UserSubscription: Model<IUserSubscription> =
  mongoose.models.UserSubscription ||
  mongoose.model<IUserSubscription>('UserSubscription', UserSubscriptionSchema);

export default UserSubscription;
