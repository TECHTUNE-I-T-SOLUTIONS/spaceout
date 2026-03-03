import mongoose, { Schema, Document } from 'mongoose';

export interface IPricing extends Document {
  name: string;
  description: string;
  price: number;
  billingPeriod: 'hourly' | 'daily' | 'monthly' | 'yearly';
  features: string[];
  icon?: string;
  isFeatured?: boolean;
  branchId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PricingSchema = new Schema<IPricing>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a plan name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    billingPeriod: {
      type: String,
      enum: ['hourly', 'daily', 'monthly', 'yearly'],
      default: 'monthly',
    },
    features: [{
      type: String,
    }],
    icon: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Pricing || mongoose.model<IPricing>('Pricing', PricingSchema);
