import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  role: 'user' | 'admin' | 'superadmin';
  branchId?: mongoose.Types.ObjectId;
  hasMembership: boolean;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  membershipType?: 'annual' | 'monthly' | 'lifetime';
  membershipActivatedAt?: Date;
  membershipExpiryDate?: Date;
  membershipExpiry?: Date;
  prepaidUntil?: Date;
  passportUrl?: string;
  signatureUrl?: string;
  emergencyContact: IEmergencyContact;
  profileImage?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    hasMembership: {
      type: Boolean,
      default: false,
    },
    membershipStatus: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
    },
    membershipType: {
      type: String,
      enum: ['annual', 'monthly', 'lifetime'],
    },
    membershipActivatedAt: {
      type: Date,
    },
    membershipExpiryDate: {
      type: Date,
    },
    membershipExpiry: {
      type: Date,
    },
    prepaidUntil: {
      type: Date,
    },
    passportUrl: {
      type: String,
    },
    signatureUrl: {
      type: String,
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required'],
      },
      phone: {
        type: String,
        required: [true, 'Emergency contact phone is required'],
      },
      relationship: {
        type: String,
        required: [true, 'Relationship is required'],
        enum: ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'],
      },
    },
    profileImage: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
