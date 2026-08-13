'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, MapPin, Phone, Mail, CalendarDays } from 'lucide-react';
import type { HubConfig } from './hub-types';
import { resolveImageUrl } from './hub-types';

export function HubHero({ config }: { config: HubConfig }) {
  const heroImage = resolveImageUrl(config.heroImage);
  const secondaryImage = resolveImageUrl(config.heroSecondaryImage);
  const cTAHref = config.defaultRegistrationUrl || '/hub/trainings';

  return (
    <section className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-[78vh] w-full max-w-full flex-col items-center gap-12 px-4 py-16 md:px-6 lg:flex-row lg:px-10 lg:py-24 xl:px-16">
        <div className="flex-1 text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {config.heroBadge || 'SPACEOUT TECH'}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            {config.heroTitle || 'Practical tech trainings for learners who want to build.'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-auto text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            {config.heroSubtitle ||
              'Hands-on tech trainings for kids, teens, Interns (SIWES Students), Corp members and beginners across design, coding, AI, digital skills and more.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link
              href={cTAHref}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
            >
              Register Interest <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hub/trainings"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              View Trainings
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground lg:justify-start"
          >
            {config.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {config.location}
              </span>
            )}
            {config.contactPhone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> {config.contactPhone}
              </span>
            )}
            {config.contactEmail && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" /> {config.contactEmail}
              </span>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative w-full max-w-xl flex-1"
        >
          {heroImage ? (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <Image
                src={heroImage}
                alt={config.heroTitle || 'SpaceOut Tech'}
                width={900}
                height={700}
                className="aspect-[4/3] w-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt="SpaceOut Tech session"
                  width={400}
                  height={300}
                  className="absolute -bottom-6 -left-6 hidden w-40 rounded-2xl border-4 border-background object-cover shadow-xl sm:block"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
            </div>
          ) : (
            <div className="relative flex aspect-[4/3] w-full items-end justify-center overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-2xl">
              <Sparkles className="h-24 w-24 text-primary/30" />
              <span className="sr-only">Hero image placeholder</span>
            </div>
          )}
          <div className="absolute -top-4 -right-2 flex items-center gap-2 rounded-2xl border border-border bg-background/90 px-4 py-2 shadow-lg backdrop-blur">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Hands-on tech trainings</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
