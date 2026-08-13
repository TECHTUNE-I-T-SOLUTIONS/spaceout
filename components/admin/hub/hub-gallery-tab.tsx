'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { HubGalleryItem } from '@/components/hub/hub-types';
import { resolveImageUrl } from '@/components/hub/hub-types';
import { FileUpload } from '@/components/file-upload';

const CATEGORIES = [
  { value: 'session', label: 'Session' },
  { value: 'cohort', label: 'Cohort' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'student-work', label: 'Student Work' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  image: '',
  category: 'session',
  featured: false,
  isActive: true,
};

export function HubGalleryTab({ adminId }: { adminId: string }) {
  const [items, setItems] = useState<HubGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/hub/gallery');
      const json = await res.json();
      if (json.success) setItems(json.gallery || []);
    } catch (e) {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (item: HubGalleryItem) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      description: item.description || '',
      image: item.image,
      category: item.category || 'session',
      featured: !!item.featured,
      isActive: item.isActive !== false,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.image.trim()) {
      toast.error('Title and image are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/hub/gallery/${editingId}` : '/api/admin/hub/gallery';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, updatedBy: adminId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? 'Image updated' : 'Image added');
        setOpen(false);
        load();
      } else {
        toast.error(json.message || 'Failed to save image');
      }
    } catch (e) {
      toast.error('Failed to save image');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetch(`/api/admin/hub/gallery/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Image deleted');
        load();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch (e) {
      toast.error('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Photos from sessions and cohorts shown on the Hub page and gallery sub-page.
        </p>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Image
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No gallery images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <div className="relative h-36">
                <Image
                  src={resolveImageUrl(item.image)}
                  alt={item.title}
                  fill
                  className="object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                </p>
                <div className="mt-2 flex gap-1">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(item._id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6">
            <DialogTitle>{editingId ? 'Edit Image' : 'Add Image'}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Cohort 3 Graduation Day"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => update('image', e.target.value)}
                placeholder="Paste image URL (e.g. Google Drive) or upload"
              />
              <FileUpload accept="image/*" onUploadSuccess={(file) => update('image', file.url)} />
            </div>
            {form.image && (
              <div className="relative h-40 overflow-hidden rounded-xl border border-border">
                <Image
                  src={resolveImageUrl(form.image)}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Switch checked={form.featured} onCheckedChange={(v) => update('featured', v)} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => update('isActive', v)} />
                <Label>Active</Label>
              </div>
            </div>
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Add Image'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}