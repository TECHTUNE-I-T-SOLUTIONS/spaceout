import mongoose, { Schema, Document } from 'mongoose';

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
  requiresMembershipCard: boolean;
  accessCardFee?: number;
}

export interface IService extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  description: string;
  pricingPlans: IPricingPlan[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PricingPlanSchema = new Schema<IPricingPlan>(
  {
    planName: String,
    planType: String,
    durationLabel: String,
    durationInDays: Number,
    durationInHours: Number,
    isPerHead: Boolean,
    memberPrice: Number,
    nonMemberPrice: Number,
    flatPrice: Number,
    requiresMembershipCard: Boolean,
    accessCardFee: Number,
  },
  { _id: true }
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
