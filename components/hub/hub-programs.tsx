'use client';

import { motion } from 'framer-motion';
import { getHubIcon } from './hub-icons';
import type { HubConfig, HubProgram } from './hub-types';

export function HubPrograms({
  config,
  programs,
}: {
  config: HubConfig;
  programs: HubProgram[];
}) {
  if (!programs || programs.length === 0) return null;

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {config.programsTitle || 'Programs & Tracks'}
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {config.programsSubtitle ||
              'Choose a track and start building. New cohorts open regularly.'}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program, index) => {
            const Icon = getHubIcon(program.icon);
            return (
              <motion.div
                key={program._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold leading-snug">{program.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {program.description}
                </p>
                {program.category && (
                  <span className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {program.category}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}