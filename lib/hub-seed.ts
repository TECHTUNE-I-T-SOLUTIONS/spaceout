import dbConnect from './db';
import HubConfig from './models/HubConfig';
import HubProgram from './models/HubProgram';
import HubSession from './models/HubSession';
import HubTestimonial from './models/HubTestimonial';

const DEFAULT_HIGHLIGHTS = [
  {
    title: 'Hands-on Learning',
    description: 'Real projects and practice from day one, not just theory.',
    icon: 'Wrench',
  },
  {
    title: 'Expert Instructors',
    description: 'Learn from practitioners who do this work every day.',
    icon: 'UserCheck',
  },
  {
    title: 'Small Groups',
    description: 'Focused classes so every learner gets attention and support.',
    icon: 'Users',
  },
  {
    title: 'Certificates',
    description: 'Walk away with credentials that reflect real skills.',
    icon: 'Award',
  },
  {
    title: 'Modern Facilities',
    description: 'Learn in a comfortable, well-equipped SpaceOut space.',
    icon: 'Building2',
  },
  {
    title: 'Career-Ready',
    description: 'Portfolio projects and guidance to help you launch.',
    icon: 'Rocket',
  },
];

const DEFAULT_STATS = [
  { label: 'Courses & Tracks', value: '8+' },
  { label: 'Trainings Held', value: '2' },
  { label: 'Learners Trained', value: '40+' },
  { label: 'Hours of Training', value: '300+' },
];

const DEFAULT_PROGRAMS = [
  {
    title: 'Programming & Web Development',
    description:
      'Learn to build websites and applications with HTML, CSS, JavaScript and modern frameworks.',
    icon: 'Code2',
    category: 'Programming',
    tags: ['web', 'javascript', 'coding', 'html', 'css'],
    featured: true,
    order: 1,
    isActive: true,
  },
  {
    title: 'Graphic Design',
    description:
      'Master visual design, from Canva and Figma to Photoshop, and create stunning branding.',
    icon: 'Palette',
    category: 'Design',
    tags: ['design', 'figma', 'canva', 'photoshop'],
    featured: true,
    order: 2,
    isActive: true,
  },
  {
    title: 'Social Media Marketing',
    description:
      'Grow brands on Instagram, TikTok and beyond with strategy, content and ad campaigns.',
    icon: 'Share2',
    category: 'Marketing',
    tags: ['marketing', 'social', 'content', 'ads'],
    featured: true,
    order: 3,
    isActive: true,
  },
  {
    title: 'Artificial Intelligence & AI Tools',
    description:
      'Use AI productively and responsibly, from prompting and automation to image and content generation.',
    icon: 'Bot',
    category: 'AI',
    tags: ['ai', 'automation', 'prompting'],
    featured: true,
    order: 4,
    isActive: true,
  },
  {
    title: 'Computer Literacy',
    description:
      'Master the essentials, including files, documents, spreadsheets, email and safe internet use.',
    icon: 'MonitorSmartphone',
    category: 'Basics',
    tags: ['computer', 'basics', 'office'],
    featured: false,
    order: 5,
    isActive: true,
  },
  {
    title: 'Photography & Videography',
    description:
      'Capture compelling photos and video with your phone or a camera, then edit like a pro.',
    icon: 'Camera',
    category: 'Media',
    tags: ['photography', 'video', 'editing'],
    featured: false,
    order: 6,
    isActive: true,
  },
  {
    title: 'Digital Marketing & E-Commerce',
    description:
      'Build sales funnels, run campaigns and sell online with proven digital marketing skills.',
    icon: 'Megaphone',
    category: 'Marketing',
    tags: ['marketing', 'ecommerce', 'funnels'],
    featured: false,
    order: 7,
    isActive: true,
  },
  {
    title: 'Microsoft Office & Productivity',
    description:
      'Excel, Word, PowerPoint and productivity skills for school and the workplace.',
    icon: 'FileSpreadsheet',
    category: 'Basics',
    tags: ['office', 'excel', 'word'],
    featured: false,
    order: 8,
    isActive: true,
  },
];

const DEFAULT_SESSION = {
  title: 'SPACEOUT Summer Tech Bootcamp 2026',
  description:
    'A 6-week, hands-on tech bootcamp for children ages 7-17. Students learn graphics design, web development, ICT, digital skills and project-based learning in a supportive environment.',
  status: 'upcoming',
  startDate: new Date('2026-07-27T09:00:00.000Z'),
  endDate: new Date('2026-09-04T14:00:00.000Z'),
  time: 'Monday - Friday, 9:00 AM - 2:00 PM',
  duration: '6 weeks',
  ageRange: 'Ages 7-17',
  fee: 30000,
  applicationFee: 3000,
  currency: 'NGN',
  location:
    'No. 2 Latbash Building, Emmanuel Baptist College Road, Tanke, Ilorin, Kwara State, Nigeria',
  capacity: 40,
  enrolled: 0,
  totalHours: 150,
  coverImage: '/assets/inside (2).jpeg',
  registrationUrl: 'https://bit.ly/SpaceOutSummerExperience',
  courses: [
    'Mobile Graphics Design (Canva, Figma, Photoshop)',
    'Content Creation & Video Editing',
    'Web Development (HTML, CSS, JavaScript)',
    'ICT & Computer Appreciation',
    'Digital Skills & Creativity',
    'Hands-on Projects & Portfolio',
  ],
  whyJoin: [
    'Learn from experienced instructors who work in tech',
    'Interactive, hands-on classes with practical projects',
    'Build real projects you can show and use',
    'Small groups so every learner is supported',
    'Certificate of Participation on completion',
    'Safe, kid-friendly learning environment',
    'Free internet, power and workspace',
  ],
  tags: ['summer 2026', 'kids program', 'tech training', 'bootcamp'],
  contactEmail: 'info@spaceoutworkstation.com',
  contactPhone: '08099885454 / 08034882447',
  featured: true,
  isActive: true,
  slug: 'spaceout-summer-tech-bootcamp-2026',
};

const DEFAULT_TESTIMONIALS = [
  {
    name: 'Tolu A.',
    role: 'Student - Web Development Training',
    content:
      'The SpaceOut Hub training completely changed how I see tech. I went from zero to building my own website in four weeks!',
    rating: 5,
    featured: true,
    isActive: true,
  },
  {
    name: 'Mrs. Bello',
    role: 'Parent',
    content:
      'My daughter loved every session. The instructors were patient and the environment made her excited to learn every day.',
    rating: 5,
    featured: true,
    isActive: true,
  },
  {
    name: 'Khadijah',
    role: 'Student - Social Media Marketing',
    content:
      'I now run the social media for my family business. The practical training made me confident to create content and ads.',
    rating: 5,
    featured: false,
    isActive: true,
  },
];

export { DEFAULT_HIGHLIGHTS, DEFAULT_STATS, DEFAULT_PROGRAMS };

const DEFAULT_HUB_CONFIG = {
  heroBadge: 'SPACEOUT TECH',
  heroTitle: 'Practical tech trainings for learners who want to build.',
  heroSubtitle:
    'SpaceOut Tech is the learning arm of SpaceOut. We run hands-on tech trainings for kids, teens, Interns (SIWES Students), Corp members and beginners across design, coding, AI, digital skills and more.',
  aboutTitle: 'What is SpaceOut Tech?',
  aboutText:
    'SpaceOut Tech is the learning arm of SpaceOut - a dedicated space for holiday bootcamps and practical tech trainings. Students and beginners learn hands-on from experienced instructors, complete real projects and leave with skills they can actually use.',
  programsTitle: 'Programs & Tracks',
  programsSubtitle: 'Choose a track and start building. New sessions open regularly.',
  scheduleTitle: 'Current & Upcoming Trainings',
  scheduleSubtitle: 'Tech trainings run in sessions. Join the next intake or follow the one already in progress.',
  galleryTitle: 'From Our Trainings',
  gallerySubtitle: 'A look inside our sessions, classrooms, learners and projects.',
  testimonialsTitle: 'What Learners Say',
  testimonialsSubtitle: 'Real people. Real skills. Real results.',
  ctaTitle: 'Ready to start your journey?',
  ctaSubtitle: 'Reserve your spot in the next SpaceOut Tech training.',
  ctaButtonText: 'Register Now',
  contactEmail: 'info@spaceoutworkstation.com',
  contactPhone: '08099885454/08034882447',
  location:
    'No. 2 Latbash Building, Emmanuel Baptist College Road, Tanke, Ilorin, Kwara State, Nigeria',
};

export async function ensureHubConfig() {
  await dbConnect();
  let configDoc = await HubConfig.findOne({ key: 'main' });
  let config = configDoc?.toObject?.() || configDoc;
  if (!configDoc) {
    configDoc = await HubConfig.create({
      key: 'main',
      ...DEFAULT_HUB_CONFIG,
      highlights: DEFAULT_HIGHLIGHTS,
      stats: DEFAULT_STATS,
      heroImage: '/assets/inside (2).jpeg',
      heroSecondaryImage: '/assets/inside (4).jpeg',
    });
    config = configDoc.toObject();
  } else {
    const needsSave = Object.entries(DEFAULT_HUB_CONFIG).some(([field, value]) => {
      const current = (config as any)[field];
      return !current || current === 'Learn. Build. Launch your future.' || current === 'SpaceOut, Tanke, Ilorin' || current === 'hello@spaceout.ng' || current !== value;
    });

    if (needsSave) {
      const update: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(DEFAULT_HUB_CONFIG)) {
        const current = (config as any)[field];
        if (
          !current ||
          current === 'Learn. Build. Launch your future.' ||
          current === 'SpaceOut, Tanke, Ilorin' ||
          current === 'hello@spaceout.ng' ||
          field === 'heroTitle' ||
          field === 'heroSubtitle' ||
          field === 'aboutTitle' ||
          field === 'aboutText' ||
          field === 'programsTitle' ||
          field === 'programsSubtitle' ||
          field === 'scheduleTitle' ||
          field === 'scheduleSubtitle' ||
          field === 'galleryTitle' ||
          field === 'gallerySubtitle' ||
          field === 'testimonialsTitle' ||
          field === 'testimonialsSubtitle' ||
          field === 'ctaTitle' ||
          field === 'ctaSubtitle' ||
          field === 'ctaButtonText' ||
          field === 'contactEmail' ||
          field === 'contactPhone' ||
          field === 'location'
        ) {
          update[field] = value;
        }
      }
      await HubConfig.updateOne({ key: 'main' }, { $set: update });
      configDoc = await HubConfig.findOne({ key: 'main' });
      config = configDoc?.toObject?.() || configDoc;
    }
  }
  return config;
}

export async function seedHubDefaults() {
  await dbConnect();

  const programCount = await HubProgram.countDocuments();
  if (programCount === 0) {
    await HubProgram.insertMany(DEFAULT_PROGRAMS);
  }

  const sessionCount = await HubSession.countDocuments();
  if (sessionCount === 0) {
    await HubSession.create({
      ...DEFAULT_SESSION,
      status: 'ongoing',
      featured: true,
    });
  }

  const testimonialCount = await HubTestimonial.countDocuments();
  if (testimonialCount === 0) {
    await HubTestimonial.insertMany(DEFAULT_TESTIMONIALS);
  }
}
