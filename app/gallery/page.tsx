'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface GalleryImage {
  _id: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  branchId: any;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  facility: '🏢 Facility',
  event: '🎉 Event',
  office: '🏛️ Office',
  workspace: '💼 Workspace',
  other: '📷 Other',
};

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const categories = ['all', 'facility', 'event', 'office', 'workspace', 'other'];

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredImages(images);
    } else {
      setFilteredImages(images.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory, images]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/gallery');
      if (response.ok) {
        const data = await response.json();
        setImages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="relative overflow-hidden py-20 md:py-32 bg-card border-b border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Gallery</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Explore our workspace facilities and events
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading gallery...</div>
          ) : images.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>No images available yet.</p>
            </div>
          ) : (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat === 'all' ? '📷 All' : CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Gallery Grid */}
              {filteredImages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <p>No images found in this category.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredImages.map((image) => (
                    <motion.div
                      key={image._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative aspect-video bg-muted overflow-hidden group">
                          <Image
                            src={image.image}
                            alt={image.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">{image.title}</h3>
                          {image.description && (
                            <p className="text-sm text-muted-foreground mb-3">{image.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="bg-muted px-2 py-1 rounded">
                              {typeof image.branchId === 'string' ? image.branchId : image.branchId?.name || 'Unknown'}
                            </span>
                            <span>
                              {new Date(image.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
