import mongoose, { Schema, Document } from 'mongoose';

export interface IHubHighlight {
  title: string;
  description: string;
  icon: string; // lucide icon name
}

export interface IHubStat {
  label: string;
  value: string;
}

export interface IHubConfig extends Document {
  key: string;

  // Hero
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  heroSecondaryImage?: string;
  aboutImage?: string;

  // About
  aboutTitle: string;
  aboutText: string;

  // Highlights (why spaceout tech)
  highlights: IHubHighlight[];

  // Stats
  stats: IHubStat[];

  // Programs section
  programsTitle: string;
  programsSubtitle: string;

  // Schedule section
  scheduleTitle: string;
  scheduleSubtitle: string;

  // Gallery section
  galleryTitle: string;
  gallerySubtitle: string;

  // Testimonials section
  testimonialsTitle: string;
  testimonialsSubtitle: string;

  // CTA
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;

  // Contact / registration
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  whatsappNumber?: string;
  defaultRegistrationUrl?: string;

  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const HubHighlightSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Rocket' },
  },
  { _id: false }
);

const HubStatSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const HubConfigSchema = new Schema<IHubConfig>(
  {
    key: { type: String, default: 'main', unique: true },
    heroBadge: { type: String, default: 'SPACEOUT TECH' },
    heroTitle: {
      type: String,
      default: 'Tech trainings that build real, practical skills.',
    },
    heroSubtitle: {
      type: String,
      default:
        'SpaceOut Tech runs hands-on trainings for kids and teens — graphics design, web development, ICT & computer appreciation, digital skills, AI and more. Small groups, experienced instructors and real projects from day one.',
    },
    heroImage: { type: String },
    heroSecondaryImage: { type: String },
    aboutImage: { type: String },

    aboutTitle: { type: String, default: 'What is SpaceOut Tech?' },
    aboutText: {
      type: String,
      default:
        'SpaceOut Tech is the training arm of SpaceOut — a dedicated space for holiday bootcamps and practical tech trainings. Students and beginners learn hands-on from experienced instructors, complete real projects and leave with skills they can actually use.',
    },
    highlights: [HubHighlightSchema],
    stats: [HubStatSchema],

    programsTitle: { type: String, default: 'Programs & Tracks' },
    programsSubtitle: {
      type: String,
      default: 'Choose a track and start building. New sessions open regularly.',
    },
    scheduleTitle: { type: String, default: 'Current & Upcoming Trainings' },
    scheduleSubtitle: {
      type: String,
      default: 'Tech trainings run in sessions. Join the next intake.',
    },
    galleryTitle: { type: String, default: 'From Our Tech Trainings' },
    gallerySubtitle: {
      type: String,
      default: 'A look inside our sessions, classrooms and graduates.',
    },
    testimonialsTitle: { type: String, default: 'What Learners Say' },
    testimonialsSubtitle: {
      type: String,
      default: 'Real people. Real skills. Real results.',
    },
    ctaTitle: { type: String, default: 'Ready to start your journey?' },
    ctaSubtitle: {
      type: String,
      default: 'Reserve your spot in the next SpaceOut Tech training.',
    },
    ctaButtonText: { type: String, default: 'Register Now' },

    contactEmail: { type: String, default: 'info@spaceoutworkstation.com' },
    contactPhone: { type: String, default: '0809 988 5454' },
    location: {
      type: String,
      default: 'No. 2 Latbash Building, Emmanuel Baptist College Road, Tanke, Ilorin',
    },
    whatsappNumber: { type: String },
    defaultRegistrationUrl: { type: String },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.models.HubConfig ||
  mongoose.model<IHubConfig>('HubConfig', HubConfigSchema);