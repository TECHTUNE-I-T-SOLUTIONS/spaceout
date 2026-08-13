'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Users, Tag, ArrowRight } from 'lucide-react';
import type { HubConfig, HubSession } from './hub-types';
import { formatFee, formatDate, resolveImageUrl } from './hub-types';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'Upcoming', className: 'bg-primary/15 text-primary' },
  ongoing: { label: 'Ongoing', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
};

export function HubSchedule({ config, sessions }: { config: HubConfig; sessions: HubSession[] }) {
  const active = (sessions || []).filter((s) => s.status === 'ongoing');

  if (active.length === 0) return null;

  return (
    <section className="w-full bg-card">
      <div className="mx-auto w-full max-w-full px-4 py-16 md:px-6 lg:px-10 lg:py-24 xl:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Live schedule
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {config.scheduleTitle || 'Current training'}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {config.scheduleSubtitle || 'The ongoing bootcamp is shown here first so visitors can register or learn more.'}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {active.map((session, index) => {
            const status = STATUS_LABEL[session.status] || STATUS_LABEL.upcoming;
            const cover = resolveImageUrl(session.coverImage);
            const regUrl = session.registrationUrl || config.defaultRegistrationUrl || '/contact';

            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm transition hover:shadow-xl"
              >
                <div className="flex flex-col sm:flex-row">
                  {cover && (
                    <div className="relative h-44 w-full sm:h-auto sm:w-2/5">
                      <Image
                        src={cover}
                        alt={session.title}
                        fill
                        className="object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <Tag className="h-3.5 w-3.5" />
                        {formatFee(session.fee, session.currency)}
                      </span>
                    </div>

                    {session.slug ? (
                      <Link
                        href={`/hub/trainings/${session.slug}`}
                        className="mt-3 block text-xl font-semibold leading-snug hover:text-primary"
                      >
                        {session.title}
                      </Link>
                    ) : (
                      <h3 className="mt-3 text-xl font-semibold leading-snug">{session.title}</h3>
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {session.description}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      {session.startDate && (
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {formatDate(session.startDate)}
                        </span>
                      )}
                      {session.duration && (
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          {session.duration}
                          {session.time ? ` · ${session.time}` : ''}
                        </span>
                      )}
                      {session.location && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {session.location}
                        </span>
                      )}
                      {session.capacity ? (
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          {session.capacity} seats
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={regUrl}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      Register <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
