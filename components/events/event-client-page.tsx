'use client';

import { Calendar, MapPin, Eye, Tag, Share2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';


interface Event {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  eventType: 'event' | 'news' | 'announcement';
  tags: string[];
  eventDate?: string;
  eventEndDate?: string;
  location?: string;
  registrationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  views: number;
  publishedAt: string;
  featuredImage?: string;
}

interface EventClientPageProps {
  event: Event;
}

export default function EventClientPage({ event }: EventClientPageProps) {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'news':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'announcement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '📅';
      case 'news':
        return '📰';
      case 'announcement':
        return '📢';
      default:
        return '📄';
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <Header />
      <div className="container py-4 md:py-8">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Back Button */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 bg-background outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-md px-3 py-1 hover:bg-muted shadow-md"
          >
            <span>←</span>
            <span>Back to Events</span>
          </Link>

          {/* Event Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.eventType)}`}>
                {getEventTypeIcon(event.eventType)}
                <span className="ml-1 capitalize">{event.eventType}</span>
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {event.title}
            </h1>

            <p className="text-xl text-muted-foreground mb-6">
              {event.excerpt}
            </p>

            {/* Event Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
              {event.eventDate && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-2 break-words">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {event.views} views
              </span>
            </div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm bg-muted px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              {event.registrationUrl && (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Register
                </a>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {event.featuredImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={event.featuredImage}
                alt={event.title}
                className="w-full h-auto max-h-auto object-cover"
              />
            </div>
          )}

          {/* Event Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
            <div dangerouslySetInnerHTML={{ __html: event.content }} />
          </div>

          {/* Contact Information */}
          {(event.contactEmail || event.contactPhone) && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <div className="space-y-2">
                {event.contactEmail && (
                  <p className="text-muted-foreground">
                    Email: <a href={`mailto:${event.contactEmail}`} className="text-primary hover:underline">{event.contactEmail}</a>
                  </p>
                )}
                {event.contactPhone && (
                  <p className="text-muted-foreground">
                    Phone: <a href={`tel:${event.contactPhone}`} className="text-primary hover:underline">{event.contactPhone}</a>
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </motion.div>
  );
}

