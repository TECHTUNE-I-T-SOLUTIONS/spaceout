'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HubHero } from './hub-hero';
import { HubAbout } from './hub-about';
import { HubPrograms } from './hub-programs';
import { HubHighlights } from './hub-highlights';
import { HubSchedule } from './hub-schedule';
import { HubGalleryPreview } from './hub-gallery-preview';
import { HubTestimonials } from './hub-testimonials';
import { HubCta } from './hub-cta';
import type { HubData } from './hub-types';

export default function HubPage() {
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/hub')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Error loading hub:', err))
      .finally(() => setLoading(false));
  }, []);

  const config = data?.config || {};

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {loading ? (
          <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <HubHero config={config} />
            <HubAbout config={config} />
            <HubPrograms config={config} programs={data?.programs} />
            <HubSchedule config={config} sessions={data?.sessions} />
            <HubHighlights config={config} />
            <HubGalleryPreview config={config} gallery={data?.gallery} />
            <HubTestimonials config={config} testimonials={data?.testimonials} />
            <HubCta config={config} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}