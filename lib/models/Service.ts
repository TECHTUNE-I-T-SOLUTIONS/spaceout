import mongoose, { Schema, Document } from 'mongoose';
import './Branch'; // Ensure Branch model is registered

export interface IPricingPlan extends Document {
  planName: string;
  planType: string;
  durationLabel: string;
  durationInDays?: number;
  durationInHours?: number;
  isPerHead: boolean;
  memberPrice: number;
  nonMemberPrice: number;
  flatPrice?: number;
  nonWifiPrice?: number;
  nonWifiPriceMember?: number;
  nonWifiPriceNonMember?: number;
  requiresMembershipCard: boolean;
  accessCardFee?: number;
}

export interface IService extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  description: string;
  pricingPlans: IPricingPlan[];
  membershipPlans: IMembershipPlan[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembershipPlan extends Document {
  name: string;
  duration: number; // in days
  price: number;
  description?: string;
  features?: string[];
  isActive: boolean;
}

const PricingPlanSchema = new Schema<IPricingPlan>(
  {
    planName: { type: String, required: true },
    planType: { type: String, required: true },
    durationLabel: { type: String, required: true },
    durationInDays: { type: Number },
    durationInHours: { type: Number },
    isPerHead: { type: Boolean, default: false },
    memberPrice: { type: Number },
    nonMemberPrice: { type: Number },
    flatPrice: { type: Number },
    nonWifiPrice: { type: Number },
    nonWifiPriceMember: { type: Number },
    nonWifiPriceNonMember: { type: Number },
    requiresMembershipCard: { type: Boolean, default: false },
    accessCardFee: { type: Number },
  },
  { _id: true, strict: false, minimize: false }
);

const MembershipPlanSchema = new Schema<IMembershipPlan>(
  {
    name: { type: String, required: true },
    duration: { type: Number, required: true }, // in days
    price: { type: Number, required: true },
    description: { type: String },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { _id: true, strict: false, minimize: false }
);

const ServiceSchema = new Schema<IService>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Please provide a branch ID'],
    },
    name: {
      type: String,
      required: [true, 'Please provide a service name'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    pricingPlans: [PricingPlanSchema],
    membershipPlans: [MembershipPlanSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    minimize: false,  // Don't remove empty fields
    strict: false,    // Allow additional fields
  }
);

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
