import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HubConfig from '@/lib/models/HubConfig';
import HubProgram from '@/lib/models/HubProgram';
import HubSession from '@/lib/models/HubSession';
import HubTestimonial from '@/lib/models/HubTestimonial';
import HubGalleryItem from '@/lib/models/HubGallery';
import { ensureHubConfig, seedHubDefaults } from '@/lib/hub-seed';

export const dynamic = 'force-dynamic';

// GET /api/public/hub - Everything the public Hub pages need
export async function GET() {
  try {
    await dbConnect();

    // Seed friendly defaults the first time the Hub is opened
    const [config] = await Promise.all([ensureHubConfig(), seedHubDefaults()]);

    const [programs, sessions, testimonials, gallery] = await Promise.all([
      HubProgram.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean(),
      HubSession.find({
        isActive: true,
        status: { $in: ['upcoming', 'ongoing', 'completed'] },
      })
        .sort({ startDate: -1 })
        .lean(),
      HubTestimonial.find({ isActive: true })
        .sort({ featured: -1, createdAt: -1 })
        .lean(),
      HubGalleryItem.find({ isActive: true })
        .sort({ featured: -1, createdAt: -1 })
        .lean(),
    ]);

    // Derive live numbers from the database so the hero stats reflect real data.
    const liveSessions = sessions.filter(
      (s: any) => s.status === 'ongoing' || s.status === 'completed'
    );
    const learnersTrained = liveSessions.reduce(
      (sum: number, s: any) => sum + (Number(s.enrolled) || 0),
      0
    );
    const totalHours = liveSessions.reduce(
      (sum: number, s: any) => sum + (Number(s.totalHours) || 0),
      0
    );

    const computedStats: { label: string; value: string }[] = [
      { label: 'Courses & Tracks', value: `${programs.length + 1}+` },
      { label: 'Trainings Held', value: `${sessions.length}` },
      {
        label: 'Learners Trained',
        value: learnersTrained > 0 ? `${learnersTrained}+` : '0',
      },
      {
        label: 'Hours of Training',
        value: totalHours > 0 ? `${totalHours}+` : '—',
      },
    ];

    function mergeStats(configStats: any[], computed: any[]) {
      const norm = (s: string) =>
        (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const map = new Map<string, any>();
      (computed || []).forEach((s) =>
        map.set(norm(s.label), { ...s })
      );
      const out: any[] = [];
      let computedUsed = new Set<string>();
      (configStats || []).forEach((s) => {
        const n = norm(s.label);
        if (map.has(n)) {
          out.push(map.get(n));
          computedUsed.add(n);
        } else {
          out.push(s);
        }
      });
      // Append any computed stats not already represented
      (computed || []).forEach((s) => {
        const n = norm(s.label);
        if (!computedUsed.has(n) && !configStats?.some((c) => norm(c.label) === n)) {
          out.push(s);
          computedUsed.add(n);
        }
      });
      return out;
    }

    const stats = mergeStats(config?.stats, computedStats);

    return NextResponse.json({
      success: true,
      config,
      programs,
      sessions,
      testimonials,
      gallery,
      stats,
      computedStats,
    });
  } catch (error) {
    console.error('Error fetching hub data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch hub data' },
      { status: 500 }
    );
  }
}