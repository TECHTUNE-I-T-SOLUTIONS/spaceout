import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteConfig extends Document {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String },
  },
  { timestamps: true }
);

const SiteConfig: Model<ISiteConfig> = mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);

export default SiteConfig;
