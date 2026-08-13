'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Quote, Star, ArrowRight } from 'lucide-react';
import type { HubConfig, HubTestimonial } from './hub-types';
import { resolveImageUrl } from './hub-types';

export function HubTestimonials({
  config,
  testimonials,
}: {
  config: HubConfig;
  testimonials: HubTestimonial[];
}) {
  const items = (testimonials || []).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {config.testimonialsTitle || 'What Learners Say'}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {config.testimonialsSubtitle ||
              'Real people. Real skills. Real results.'}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <Quote className="h-8 w-8 text-primary/30" />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{item.content}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                {item.avatar ? (
                  <Image
                    src={resolveImageUrl(item.avatar)}
                    alt={item.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  {item.role && (
                    <div className="text-xs text-muted-foreground">{item.role}</div>
                  )}
                </div>
                {item.rating ? (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < item.rating!
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>

        {testimonials && testimonials.length > 6 && (
          <div className="mt-8 text-center">
            <Link
              href="/hub/gallery#testimonials"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Read more stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}