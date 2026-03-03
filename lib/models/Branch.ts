import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  location: string;
  phone: string;
  email: string;
  capacity: number;
  amenities: string[];
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a branch name'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide capacity'],
      min: 1,
    },
    amenities: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
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

export default mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
