import mongoose, { Schema, Document } from 'mongoose';

export interface IHubGalleryItem extends Document {
  title: string;
  description?: string;
  image: string;
  category: string; // session | cohort | classroom | student-work | graduation | event | other
  featured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HubGallerySchema = new Schema<IHubGalleryItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    category: {
      type: String,
      enum: ['session', 'training', 'classroom', 'student-work', 'graduation', 'event', 'other'],
      default: 'session',
    },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HubGallerySchema.index({ isActive: 1, createdAt: -1 });
HubGallerySchema.index({ category: 1, isActive: 1 });

export default mongoose.models.HubGalleryItem ||
  mongoose.model<IHubGalleryItem>('HubGalleryItem', HubGallerySchema);