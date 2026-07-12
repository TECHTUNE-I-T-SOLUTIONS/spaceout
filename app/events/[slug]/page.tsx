import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import EventClientPage from '@/components/events/event-client-page';

function buildJsonLd(event: any) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spaceout.com';
  const url = `${siteUrl}/events/${event.slug || event._id}`;
  
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': event.schemaType === 'Event' ? 'Event' : event.schemaType === 'NewsArticle' ? 'NewsArticle' : 'Article',
    headline: event.title,
    description: event.seoDescription || event.excerpt || '',
    url,
    datePublished: event.publishedAt || event.createdAt,
    author: {
      '@type': 'Organization',
      name: 'SpaceOut',
    },
  };

  if (event.schemaType === 'Event' && event.eventDate) {
    return {
      ...baseSchema,
      '@type': 'Event',
      startDate: event.eventDate,
      endDate: event.eventEndDate || event.eventDate,
      location: event.location ? {
        '@type': 'Place',
        name: event.location,
      } : undefined,
      organizer: {
        '@type': 'Organization',
        name: 'SpaceOut',
        email: event.contactEmail,
      },
    };
  }

  return baseSchema;
}

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

async function getEvent(slugOrId: string) {
  try {
    // Use environment variable in production, relative URL in development
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const apiUrl = baseUrl 
      ? `${baseUrl}/api/events/${slugOrId}`
      : `/api/events/${slugOrId}`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const event = await response.json();
    return { event, jsonLd: buildJsonLd(event) };
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getEvent(slug);
  const event = result?.event;

  if (!event || event.status !== 'published') {
    return {};
  }

  return {
    title: `${event.seoTitle || event.title} - SpaceOut`,
    description: event.seoDescription || event.excerpt || '',
    openGraph: {
      title: event.seoTitle || event.title,
      description: event.seoDescription || event.excerpt || '',
      images: event.featuredImage ? [event.featuredImage] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.seoTitle || event.title,
      description: event.seoDescription || event.excerpt || '',
      images: event.featuredImage ? [event.featuredImage] : [],
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const result = await getEvent(slug);
  const event = result?.event;
  const jsonLd = result?.jsonLd;

  if (!event || event.status !== 'published') {
    return notFound();
  }

  return (
    <>
      {jsonLd && (
        <script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventClientPage event={event} />
    </>
  );
}