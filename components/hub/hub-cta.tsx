'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PhoneCall, MessageCircle } from 'lucide-react';
import type { HubConfig } from './hub-types';

export function HubCta({ config }: { config: HubConfig }) {
  const ctaHref = config.defaultRegistrationUrl || '/contact';
  const whatsapp = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`
    : '';

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background to-background p-8 text-center ring-1 ring-primary/20 sm:p-14"
        >
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            {config.ctaTitle || 'Ready to start your journey?'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {config.ctaSubtitle || 'Reserve your spot in the next SpaceOut Hub cohort.'}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
            >
              {config.ctaButtonText || 'Register Now'} <ArrowRight className="h-4 w-4" />
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4 text-primary" /> Chat on WhatsApp
              </a>
            )}
            {config.contactPhone && !whatsapp && (
              <a
                href={`tel:${config.contactPhone}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                <PhoneCall className="h-4 w-4 text-primary" /> Call Us
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}