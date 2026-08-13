'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HubTrainingCard } from '@/components/hub/hub-training-card';
import type { HubConfig, HubData, HubSession } from '@/components/hub/hub-types';

export default function HubTrainingsPage() {
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/hub')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Error loading hub trainings:', err))
      .finally(() => setLoading(false));
  }, []);

  const config: HubConfig = data?.config || {};
  const sessions: HubSession[] = (data?.sessions || []).filter(
    (s) => s.status === 'ongoing' && s.isActive !== false && Boolean(s.slug)
  );
  const featured = sessions.filter((s) => s.featured);
  const display = featured.length > 0 ? featured : sessions;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full border-b border-border bg-card">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 text-center sm:py-20">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              SpaceOut Hub
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Current Training
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {config.heroSubtitle ||
                'SpaceOut Hub is the learning arm of SpaceOut offering practical tech trainings in programming, design, social media marketing, AI, computer literacy, photography and more.'}
            </p>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[50vh] w-full items-center justify-center py-12">
            <span className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : display.length === 0 ? (
          <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center">
            <p className="text-muted-foreground">
              No ongoing training is available right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-7xl px-4 py-12">
            <SectionTitle title="Featured Training" subtitle="The ongoing bootcamp is shown here." />
            <Cards rows={display.slice(0, 1)} config={config} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Cards({ rows, config }: { rows: HubSession[]; config: HubConfig }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((s, i) => (
        <HubTrainingCard key={s._id} config={config} session={s} index={i} />
      ))}
    </div>
  );
}
