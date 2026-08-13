import mongoose, { Schema, Document } from 'mongoose';

export interface IHubSession extends Document {
  title: string;
  slug: string;
  description: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed';
  startDate?: Date;
  endDate?: Date;
  time?: string;
  duration?: string;
  ageRange?: string;
  fee?: number;
  applicationFee?: number;
  currency: string;
  location?: string;
  capacity?: number;
  enrolled?: number;
  totalHours?: number;
  coverImage?: string;
  registrationUrl?: string;
  courses: string[];
  whyJoin: string[];
  tags: string[];
  contactEmail?: string;
  contactPhone?: string;
  featured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HubSessionSchema = new Schema<IHubSession>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'ongoing', 'completed'],
      default: 'draft',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    time: { type: String, default: '' },
    duration: { type: String, default: '' },
    ageRange: { type: String, default: '' },
    fee: { type: Number, default: 0 },
    applicationFee: { type: Number, default: 0 },
    currency: { type: String, default: 'NGN' },
    location: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    enrolled: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    coverImage: { type: String },
    registrationUrl: { type: String },
    courses: [{ type: String, trim: true }],
    whyJoin: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true, lowercase: true }],
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HubSessionSchema.index({ status: 1, startDate: 1 });
HubSessionSchema.index({ isActive: 1, status: 1, startDate: -1 });
HubSessionSchema.index({ featured: 1, isActive: 1 });

// Auto-generate slug from title before saving
HubSessionSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export default mongoose.models.HubSession ||
  mongoose.model<IHubSession>('HubSession', HubSessionSchema);