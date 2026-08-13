'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, Star, Quote, Play } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import type { HubData, HubGalleryItem, HubTestimonial } from './hub-types';
import { resolveImageUrl } from './hub-types';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'session', label: 'Sessions' },
  { value: 'cohort', label: 'Trainings' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'student-work', label: 'Student Work' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'event', label: 'Events' },
  { value: 'other', label: 'Other' },
];

const isVideoLike = (item: HubGalleryItem) => /\.(mp4|webm|mov)(\?|$)/i.test(item.image);

export default function HubGalleryPage() {
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<HubGalleryItem | null>(null);

  useEffect(() => {
    fetch('/api/public/hub')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Error loading hub gallery:', err))
      .finally(() => setLoading(false));
  }, []);

  const gallery = data?.gallery || [];
  const testimonials = data?.testimonials || [];
  const config = data?.config || {};

  const filtered = useMemo(
    () => (category === 'all' ? gallery : gallery.filter((item) => item.category === category)),
    [category, gallery]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full border-b border-border bg-card">
          <div className="mx-auto w-full max-w-full px-4 py-14 text-center sm:py-20 md:px-6 lg:px-10 xl:px-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              SpaceOut Hub
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {config.galleryTitle || 'From Our Trainings'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {config.gallerySubtitle || 'A look inside our sessions, classrooms, learners and projects.'}
            </p>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[40vh] w-full items-center justify-center px-4">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <section className="w-full">
              <div className="mx-auto w-full max-w-full px-4 py-12 md:px-6 lg:px-10 xl:px-16">
                <div className="flex flex-wrap justify-center gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        category === cat.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <p className="mt-16 text-center text-muted-foreground">No photos yet. Check back soon.</p>
                ) : (
                  <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
                    {filtered.map((item, index) => (
                      <motion.button
                        type="button"
                        key={item._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        onClick={() => setSelected(item)}
                        className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-border"
                      >
                        {isVideoLike(item) ? (
                          <div className="relative aspect-video bg-black">
                            <video src={item.image} muted loop playsInline className="h-full w-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
                                <Play className="ml-0.5 h-6 w-6" />
                              </span>
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={resolveImageUrl(item.image)}
                            alt={item.title}
                            width={800}
                            height={600}
                            className="w-full object-cover transition duration-500 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/image-placeholder.png';
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                        <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-4 text-left opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          {item.description && <p className="mt-0.5 text-xs text-white/80 line-clamp-2">{item.description}</p>}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {testimonials.length > 0 && (
              <section id="testimonials" className="w-full bg-card">
                <div className="mx-auto w-full max-w-full px-4 py-16 text-center md:px-6 lg:px-10 xl:px-16">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {config.testimonialsTitle || 'What Learners Say'}
                  </h2>
                  <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                    {config.testimonialsSubtitle || 'Real people. Real skills. Real results.'}
                  </p>
                  <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((item) => (
                      <TestimonialCard key={item._id} item={item} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="w-auto max-w-[94vw] border-0 bg-black/95 p-0 sm:max-w-4xl">
          <DialogTitle className="sr-only">{selected?.title || 'Image viewer'}</DialogTitle>
          <DialogClose className="absolute right-3 top-3 z-50 rounded-full bg-black/40 p-2 text-white hover:bg-black/70">
            <X className="h-5 w-5" />
          </DialogClose>
          {selected && (
            <div className="p-2">
              {isVideoLike(selected) ? (
                <video src={selected.image} controls className="mx-auto max-h-[80vh] w-full" />
              ) : (
                <Image
                  src={resolveImageUrl(selected.image)}
                  alt={selected.title}
                  width={1200}
                  height={800}
                  className="mx-auto max-h-[80vh] w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/image-placeholder.png';
                  }}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TestimonialCard({ item }: { item: HubTestimonial }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-background p-6 text-left">
      <Quote className="h-8 w-8 text-primary/30" />
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        &ldquo;{item.content}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {item.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{item.name}</div>
          {item.role && <div className="text-xs text-muted-foreground">{item.role}</div>}
        </div>
        {item.rating ? (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < item.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
