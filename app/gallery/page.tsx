'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Eye, X, HouseWifi, Calendars, LampDesk, Briefcase, WashingMachine, LoaderPinwheel } from 'lucide-react';

interface GalleryImage {
  _id: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  branchId: any;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  facility: { label: 'Facility', icon: <HouseWifi className="w-4 h-4" /> },
  event: { label: 'Event', icon: <Calendars className="w-4 h-4" /> },
  office: { label: 'Office', icon: <LampDesk className="w-4 h-4" /> },
  workspace: { label: 'Workspace', icon: <Briefcase className="w-4 h-4" /> },
  other: { label: 'Other', icon: <WashingMachine className="w-4 h-4" /> },
};

const isGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com');
};

const getGoogleDriveImageUrl = (url: string): string => {
  if (url.includes('/file/d/')) {
    const fileId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
    }
  }
  if (url.includes('id=')) {
    const fileId = url.match(/id=([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
    }
  }
  return url;
};

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
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
                    {cat === 'all' ? (
                      <span className="flex items-center gap-2">
                      <LoaderPinwheel className="w-4 h-4" />
                      All
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                      {CATEGORY_LABELS[cat].icon}
                      {CATEGORY_LABELS[cat].label}
                      </span>
                    )}
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
                            src={isGoogleDriveUrl(image.image) ? getGoogleDriveImageUrl(image.image) : image.image}
                            alt={image.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/assets/image-placeholder.png';
                            }}
                          />
                          {/* View Button Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex items-center gap-2"
                              onClick={() => setSelectedImage(image)}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </div>
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

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-auto w-auto p-0 bg-black/95 border-0">
          <DialogTitle className="sr-only">{selectedImage?.title || 'Image Viewer'}</DialogTitle>
          <DialogClose className="absolute top-1 right-2 z-50 rounded-full p-2 hover:bg-muted/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </DialogClose>
          {selectedImage && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative w-xs md:w-lg sm:w-auto max-h-[70vh] bg-black">
                <Image
                  src={isGoogleDriveUrl(selectedImage.image) ? getGoogleDriveImageUrl(selectedImage.image) : selectedImage.image}
                  alt={selectedImage.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/assets/image-placeholder.png';
                  }}
                />
              </div>
              <div className="w-full px-6 pb-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-gray-300 mb-4">{selectedImage.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="bg-gray-700 px-3 py-1 rounded">
                    {typeof selectedImage.branchId === 'string'
                      ? selectedImage.branchId
                      : selectedImage.branchId?.name || 'Unknown'}
                  </span>
                  <span>{new Date(selectedImage.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
