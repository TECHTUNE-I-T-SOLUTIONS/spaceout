import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  content: string; // HTML content
  contentMarkdown?: string; // Original markdown (optional)
  excerpt: string;
  status: 'draft' | 'published';
  featured: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  schemaType?: 'Article' | 'Event' | 'NewsArticle' | 'None';
  
  // Event-specific fields
  eventType: 'event' | 'news' | 'announcement';
  eventDate?: Date;
  eventEndDate?: Date;
  location?: string;
  registrationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // Media
  featuredImage?: string;
  mediaFiles: Array<{
    id: string;
    file_url: string;
    file_type: string;
    original_name: string;
    file_name: string;
    file_path: string;
    file_size: number;
  }>;
  
  // Author info
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  
  // SEO and metadata
  canonicalUrl?: string;
  ogImage?: string;
  
  // Analytics
  views: number;
  likes: number;
  
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const MediaFileSchema = new Schema(
  {
    id: { type: String, required: true },
    file_url: { type: String, required: true },
    file_type: { type: String, required: true },
    original_name: { type: String, required: true },
    file_name: { type: String, required: true },
    file_path: { type: String, required: true },
    file_size: { type: Number, required: true },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Please provide a slug'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
    },
    contentMarkdown: {
      type: String,
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide an excerpt'],
      maxlength: [500, 'Excerpt cannot be more than 500 characters'],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    seoTitle: {
      type: String,
      maxlength: [60, 'SEO title cannot be more than 60 characters'],
    },
    seoDescription: {
      type: String,
      maxlength: [160, 'SEO description cannot be more than 160 characters'],
    },
    schemaType: {
      type: String,
      enum: ['Article', 'Event', 'NewsArticle', 'None'],
      default: 'None',
    },
    
    // Event-specific fields
    eventType: {
      type: String,
      enum: ['event', 'news', 'announcement'],
      required: [true, 'Please provide an event type'],
      default: 'news',
    },
    eventDate: {
      type: Date,
    },
    eventEndDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    registrationUrl: {
      type: String,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    
    // Media
    featuredImage: {
      type: String,
    },
    mediaFiles: [MediaFileSchema],
    
    // Author info
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Please provide a creator'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    
    // SEO and metadata
    canonicalUrl: {
      type: String,
    },
    ogImage: {
      type: String,
    },
    
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    minimize: false,
    strict: false,
  }
);

// Create indexes for better query performance
// Note: slug index is already created by unique: true in schema definition
EventSchema.index({ status: 1, createdAt: -1 });
EventSchema.index({ eventType: 1, status: 1 });
EventSchema.index({ featured: 1, status: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ publishedAt: -1 });
EventSchema.index({ createdAt: -1 });

// Auto-generate slug from title before saving
EventSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);