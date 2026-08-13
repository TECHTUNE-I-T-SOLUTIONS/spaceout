export interface HubHighlight {
  title: string;
  description: string;
  icon?: string;
}

export interface HubStat {
  label: string;
  value: string;
}

export interface HubConfig {
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroSecondaryImage?: string;
  aboutTitle?: string;
  aboutText?: string;
  highlights?: HubHighlight[];
  stats?: HubStat[];
  programsTitle?: string;
  programsSubtitle?: string;
  scheduleTitle?: string;
  scheduleSubtitle?: string;
  galleryTitle?: string;
  gallerySubtitle?: string;
  testimonialsTitle?: string;
  testimonialsSubtitle?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButtonText?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  whatsappNumber?: string;
  defaultRegistrationUrl?: string;
}

export interface HubProgram {
  _id: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  order?: number;
  isActive?: boolean;
}

export interface HubSession {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed';
  startDate?: string;
  endDate?: string;
  time?: string;
  duration?: string;
  fee?: number;
  currency?: string;
  location?: string;
  capacity?: number;
  enrolled?: number;
  totalHours?: number;
  applicationFee?: number;
  ageRange?: string;
  coverImage?: string;
  registrationUrl?: string;
  courses?: string[];
  whyJoin?: string[];
  tags?: string[];
  featured?: boolean;
  isActive?: boolean;
}

export interface HubTestimonial {
  _id: string;
  name: string;
  role?: string;
  content: string;
  avatar?: string;
  rating?: number;
  featured?: boolean;
  isActive?: boolean;
}

export interface HubGalleryItem {
  _id: string;
  title: string;
  description?: string;
  image: string;
  category?: string;
  featured?: boolean;
  isActive?: boolean;
}

export interface HubData {
  success: boolean;
  config?: HubConfig;
  programs?: HubProgram[];
  sessions?: HubSession[];
  testimonials?: HubTestimonial[];
  gallery?: HubGalleryItem[];
}

// Format a fee like 50000 -> ₦50,000
export function formatFee(fee?: number, currency?: string): string {
  if (fee === undefined || fee === null) return 'Free';
  if (fee === 0) return 'Free';
  const num = new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 0,
  }).format(fee);
  if (currency === 'USD' || currency === '$') return `$${num}`;
  return `₦${num}`;
}

// Google Drive -> viewable image URL
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com');
}

export function getGoogleDriveImageUrl(url: string): string {
  if (url.includes('/file/d/')) {
    const fileId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
  }
  if (url.includes('id=')) {
    const fileId = url.match(/id=([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
  }
  return url;
}

export function resolveImageUrl(url?: string): string {
  if (!url) return '';
  return isGoogleDriveUrl(url) ? getGoogleDriveImageUrl(url) : url;
}

export function formatDate(date?: string): string {
  if (!date) return 'TBA';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'TBA';
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}