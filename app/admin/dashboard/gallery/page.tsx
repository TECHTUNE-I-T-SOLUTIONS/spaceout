'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Edit2, X } from 'lucide-react';
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

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [editingItem, setEditingItem] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'workspace' });
  const [uploading, setUploading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    category: 'workspace',
    imageUrl: '', // URL for Google Drive or other sources
    useUrl: false, // Toggle between file upload and URL
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
      const imageUrl = uploadFormData.useUrl ? uploadFormData.imageUrl : file.url;
      
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadFormData.title || (uploadFormData.useUrl ? 'Image' : file.fileName),
          description: uploadFormData.description,
          image: imageUrl,
          category: uploadFormData.category,
          branchId: selectedBranch,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setImages([data.item, ...images]);
        setIsUploadOpen(false);
        setUploadFormData({ title: '', description: '', category: 'workspace', imageUrl: '', useUrl: false });
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

            <div className="flex items-center gap-4 py-2 border-y">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  checked={!uploadFormData.useUrl}
                  onChange={() => setUploadFormData({ ...uploadFormData, useUrl: false })}
                />
                <span className="text-sm">Upload File</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  checked={uploadFormData.useUrl}
                  onChange={() => setUploadFormData({ ...uploadFormData, useUrl: true })}
                />
                <span className="text-sm">Use URL</span>
              </label>
            </div>

            {uploadFormData.useUrl ? (
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://drive.google.com/... or any image URL"
                  value={uploadFormData.imageUrl}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, imageUrl: e.target.value })}
                  className="mt-1"
                />
                <Button
                  className="w-full mt-4"
                  onClick={() => handleUploadSuccess({ url: uploadFormData.imageUrl })}
                  disabled={!uploadFormData.imageUrl || !uploadFormData.title}
                >
                  {uploading ? 'Adding...' : 'Add Image'}
                </Button>
              </div>
            ) : (
              <FileUpload
                accept="image/*"
                maxSize={5 * 1024 * 1024}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(error) => {
                  toast.error('Upload Failed', { description: error });
                }}
              />
            )}
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
            {editingItem && (
              <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={isGoogleDriveUrl(editingItem.image) ? getGoogleDriveImageUrl(editingItem.image) : editingItem.image}
                  alt={editingItem.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/assets/image-placeholder.png';
                  }}
                />
              </div>
            )}
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
                  src={isGoogleDriveUrl(image.image) ? getGoogleDriveImageUrl(image.image) : image.image}
                  alt={image.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/assets/image-placeholder.png';
                  }}
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
                  <span className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-2 py-1 rounded">
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
                    onClick={() => setSelectedImage(image)}
                  >
                    View
                  </Button>
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

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-0">
          <DialogTitle className="sr-only">{selectedImage?.title || 'Image Viewer'}</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-50 rounded-full p-2 hover:bg-muted/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </DialogClose>
          
          {selectedImage && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-full max-h-96 aspect-video mb-4">
                <Image
                  src={selectedImage && (isGoogleDriveUrl(selectedImage.image) ? getGoogleDriveImageUrl(selectedImage.image) : selectedImage.image)}
                  alt={selectedImage?.title || 'Image'}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/assets/image-placeholder.png';
                  }}
                />
              </div>
              <div className="w-full px-6 text-white text-center">
                <h3 className="text-xl font-semibold mb-2">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-muted mb-4">{selectedImage.description}</p>
                )}
                <div className="flex justify-center gap-4 text-sm">
                  <span className="bg-muted/30 px-3 py-1 rounded">
                    {selectedImage.category}
                  </span>
                  <span className="bg-muted/30 px-3 py-1 rounded">
                    {typeof selectedImage.branchId === 'string' ? selectedImage.branchId : selectedImage.branchId?.name || 'Unknown'}
                  </span>
                  <span className="bg-muted/30 px-3 py-1 rounded">
                    {new Date(selectedImage.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
