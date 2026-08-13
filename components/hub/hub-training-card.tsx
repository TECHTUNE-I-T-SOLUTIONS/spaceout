'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CalendarDays, Tag, ArrowRight } from 'lucide-react';
import type { HubConfig, HubSession } from './hub-types';
import { resolveImageUrl, formatFee, formatDate } from './hub-types';

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

const STATUS_CLASS: Record<string, string> = {
  upcoming: 'bg-primary/15 text-primary',
  ongoing: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-muted text-muted-foreground',
};

export function HubTrainingCard({
  config,
  session,
  index,
}: {
  config: HubConfig;
  session: HubSession;
  index: number;
}) {
  const cover = resolveImageUrl(session.coverImage);
  const status = session.status;
  const label = STATUS_LABEL[status] || 'Training';
  const badge = STATUS_CLASS[status] || 'bg-muted text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl"
    >
      <Link href={`/hub/trainings/${session.slug}`} className="flex-1">
        <span className="absolute top-3 right-3 z-10 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur">
          {label}
        </span>

        {cover ? (
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={cover}
              alt={session.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted/40">
            <span className="sr-only">No image</span>
          </div>
        )}

        <div className="flex-1 p-5">
          <h3 className="text-lg font-semibold leading-snug">{session.title}</h3>
          {session.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {session.description}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {session.startDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {formatDate(session.startDate)}
              </span>
            )}
            {session.duration && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {session.duration}
              </span>
            )}
            {session.tags && session.tags.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                {session.tags.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
          {session.fee !== undefined && (
            <div className="mt-4 text-sm font-semibold text-primary">
              {formatFee(session.fee, session.currency)}
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between border-t border-border p-4 text-sm font-semibold">
        <span className={badge}>{label}</span>
        <Link
          href={`/hub/trainings/${session.slug}`}
          className="inline-flex items-center gap-1 text-primary"
        >
          View details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
