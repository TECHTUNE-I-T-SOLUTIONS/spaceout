'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Images } from 'lucide-react';
import type { HubConfig, HubGalleryItem } from './hub-types';
import { resolveImageUrl } from './hub-types';

export function HubGalleryPreview({
  config,
  gallery,
}: {
  config: HubConfig;
  gallery: HubGalleryItem[];
}) {
  const items = gallery || [];
  if (items.length === 0) return null;
  const preview = items.slice(0, 6);
  // Distribute images across a masonry-like grid
  const heights = ['row-span-2', '', '', 'row-span-2', '', ''];

  return (
    <section className="w-full bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 lg:py-24">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Images className="h-4 w-4" /> Moments
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {config.galleryTitle || 'From Our Cohorts'}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {config.gallerySubtitle ||
                'A look inside our sessions, classrooms and graduates.'}
            </p>
          </div>
          <Link
            href="/hub/gallery"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            View Gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-4">
          {preview.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className={`group relative overflow-hidden rounded-2xl ${heights[index % heights.length]}`}
            >
              <Image
                src={resolveImageUrl(item.image)}
                alt={item.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-sm font-semibold text-white">{item.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}