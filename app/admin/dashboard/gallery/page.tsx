'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { FileUpload } from '@/components/file-upload';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  uploadedAt: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
        toast.success('Gallery Loaded', {
          description: `Found ${data.length} images.`,
        });
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
      toast.error('Failed to Load Gallery', {
        description: 'Unable to fetch gallery images.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (file: any) => {
    const newImage: GalleryImage = {
      id: Date.now().toString(),
      url: file.url,
      alt: file.fileName,
      uploadedAt: new Date().toISOString(),
    };
    setImages([newImage, ...images]);
    setIsUploadOpen(false);
    toast.success('Image Uploaded', {
      description: `${file.fileName} added to gallery.`,
    });
  };

  const handleDelete = (imageId: string) => {
    setImages(images.filter(img => img.id !== imageId));
    toast.success('Image Deleted', {
      description: 'Gallery image has been removed.',
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <Button className="flex items-center gap-2" onClick={() => setIsUploadOpen(true)}>
          <Plus size={18} />
          Upload Image
        </Button>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Image to Gallery</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FileUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => {
                toast.error('Upload Failed', {
                  description: error,
                });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading gallery...</p>
        </Card>
      ) : images.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Images Yet</h2>
          <p className="text-muted-foreground mb-6">Upload images to showcase your branches.</p>
          <Button>Upload First Image</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  {new Date(image.uploadedAt).toLocaleDateString()}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleDelete(image.id)}
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
