import { Suspense } from 'react';
import EventsList from '@/components/events/events-list';
import EventsHero from '@/components/events/events-hero';

export const metadata = {
  title: 'Events & News - SpaceOut',
  description: 'Stay updated with the latest events, news, and announcements from SpaceOut.',
}

export const revalidate = 60;

export default function EventsPage() {
  return (
    <div className="min-h-screen">
      <EventsHero />
      <section className="container py-16">
        <Suspense fallback={<EventsListSkeleton />}>
          <EventsList />
        </Suspense>
      </section>
    </div>
  );
}

function EventsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted/50 h-48 rounded-lg mb-4"></div>
          <div className="bg-muted/50 h-4 rounded mb-2"></div>
          <div className="bg-muted/50 h-4 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}