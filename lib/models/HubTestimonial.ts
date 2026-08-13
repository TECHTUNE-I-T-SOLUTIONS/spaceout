import mongoose, { Schema, Document } from 'mongoose';

export interface IHubTestimonial extends Document {
  name: string;
  role: string; // e.g. 'Student — Web Dev Cohort'
  content: string;
  avatar?: string;
  rating: number;
  featured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HubTestimonialSchema = new Schema<IHubTestimonial>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '' },
    content: { type: String, required: true },
    avatar: { type: String },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HubTestimonialSchema.index({ isActive: 1, featured: -1, createdAt: -1 });

export default mongoose.models.HubTestimonial ||
  mongoose.model<IHubTestimonial>('HubTestimonial', HubTestimonialSchema);