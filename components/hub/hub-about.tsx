'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import type { HubConfig } from './hub-types';
import { resolveImageUrl } from './hub-types';

export function HubAbout({ config }: { config: HubConfig }) {
  const stats = config.stats || [];
  const image = resolveImageUrl(config.heroImage);

  return (
    <section className="w-full bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-10 px-4 py-16 lg:flex-row lg:items-center lg:gap-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex-1"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <GraduationCap className="h-4 w-4" /> The Learning Arm of SpaceOut
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {config.aboutTitle || 'What is SpaceOut Tech?'}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {config.aboutText ||
              'SpaceOut Tech is the learning arm of SpaceOut — a dedicated space for summer bootcamps and hands-on tech trainings. Students, beginners and enthusiasts learn from real instructors in a focused environment, complete projects and walk away ready to create.'}
          </p>

          {stats.length > 0 && (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border bg-background p-4 text-center"
                >
                  <div className="text-2xl font-bold text-primary sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full flex-1"
          >
            <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
              <Image
                src={image}
                alt={config.aboutTitle || 'SpaceOut Tech'}
                width={900}
                height={600}
                className="aspect-[16/11] w-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}