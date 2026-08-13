import mongoose, { Schema, Document } from 'mongoose';

export interface IHubProgram extends Document {
  title: string;
  description: string;
  icon: string; // lucide icon name
  category?: string;
  tags: string[];
  featured: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HubProgramSchema = new Schema<IHubProgram>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Code2' },
    category: { type: String, default: '' },
    tags: [{ type: String, trim: true, lowercase: true }],
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HubProgramSchema.index({ isActive: 1, order: 1, createdAt: -1 });

export default mongoose.models.HubProgram ||
  mongoose.model<IHubProgram>('HubProgram', HubProgramSchema);