'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { FileUpload } from '@/components/file-upload';

interface GalleryImage {
  _id: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  branchId: any;
  isActive: boolean;
  createdAt: string;
}

interface Branch {
  _id: string;
  name: string;
}

const CATEGORIES = ['facility', 'event', 'office', 'workspace', 'other'];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [editingItem, setEditingItem] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'workspace' });
  const [uploading, setUploading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    category: 'workspace',
  });

  useEffect(() => {
    fetchGallery();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
        if (data.length > 0) setSelectedBranch(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
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

  const handleUploadSuccess = async (file: any) => {
    try {
      setUploading(true);
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadFormData.title || file.fileName,
          description: uploadFormData.description,
          image: file.url,
          category: uploadFormData.category,
          branchId: selectedBranch,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setImages([data.item, ...images]);
        setIsUploadOpen(false);
        setUploadFormData({ title: '', description: '', category: 'workspace' });
        toast.success('Image Added', {
          description: 'Gallery image has been added successfully.',
        });
      }
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to Save Image', {
        description: 'Unable to save gallery image.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingItem(image);
    setEditForm({
      title: image.title,
      description: image.description || '',
      category: image.category,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingItem) return;
      
      const response = await fetch('/api/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingItem._id,
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setImages(images.map(img => img._id === editingItem._id ? data.item : img));
        setIsEditOpen(false);
        setEditingItem(null);
        toast.success('Image Updated', {
          description: 'Gallery image has been updated successfully.',
        });
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to Update Image', {
        description: 'Unable to update gallery image.',
      });
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: imageId }),
      });

      if (response.ok) {
        setImages(images.filter(img => img._id !== imageId));
        toast.success('Image Deleted', {
          description: 'Gallery image has been removed.',
        });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to Delete Image', {
        description: 'Unable to delete gallery image.',
      });
    } finally {
      setIsDeleting(false);
    }
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="branch">Branch</Label>
              <select
                id="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="title">Image Title</Label>
              <Input
                id="title"
                placeholder="e.g., Meeting Room 1"
                value={uploadFormData.title}
                onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Caption</Label>
              <Textarea
                id="description"
                placeholder="Add a caption for this image..."
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={uploadFormData.category}
                onChange={(e) => setUploadFormData({ ...uploadFormData, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <FileUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => {
                toast.error('Upload Failed', { description: error });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Gallery Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTitle">Image Title</Label>
              <Input
                id="editTitle"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="editDescription">Caption</Label>
              <Textarea
                id="editDescription"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="editCategory">Category</Label>
              <select
                id="editCategory"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
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
          <Button onClick={() => setIsUploadOpen(true)}>Upload First Image</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={image.image}
                  alt={image.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm">{image.title}</p>
                  {image.description && (
                    <p className="text-xs text-muted-foreground mt-1">{image.description}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                    {image.category}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-2 py-1 rounded">
                    {typeof image.branchId === 'string' ? image.branchId : image.branchId?.name || 'Unknown'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => handleEdit(image)}
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-2"
                    disabled={isDeleting}
                    onClick={() => handleDelete(image._id)}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
