'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Loader2, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { HubTestimonial } from '@/components/hub/hub-types';

const EMPTY_FORM = {
  name: '',
  role: '',
  content: '',
  rating: 5,
  featured: false,
  isActive: true,
};

export function HubTestimonialsTab({ adminId }: { adminId: string }) {
  const [items, setItems] = useState<HubTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/hub/testimonials');
      const json = await res.json();
      if (json.success) setItems(json.testimonials || []);
    } catch (e) {
      toast.error('Failed to load testimonials');
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

  const openEdit = (t: HubTestimonial) => {
    setEditingId(t._id);
    setForm({
      name: t.name,
      role: t.role || '',
      content: t.content,
      rating: t.rating ?? 5,
      featured: !!t.featured,
      isActive: t.isActive !== false,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error('Name and content are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/hub/testimonials/${editingId}`
        : '/api/admin/hub/testimonials';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, updatedBy: adminId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? 'Testimonial updated' : 'Testimonial created');
        setOpen(false);
        load();
      } else {
        toast.error(json.message || 'Failed to save testimonial');
      }
    } catch (e) {
      toast.error('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/admin/hub/testimonials/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Testimonial deleted');
        load();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch (e) {
      toast.error('Failed to delete testimonial');
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
          Learner and parent stories shown on the Hub page and gallery sub-page.
        </p>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Testimonial
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No testimonials yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t._id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                </div>
                {t.featured && <Badge variant="secondary">Featured</Badge>}
              </div>
              {t.rating ? (
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < t.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
              ) : null}
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(t)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(t._id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6">
            <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Tolu A."
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Input
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  placeholder="e.g. Student — Web Dev Cohort"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Testimonial</Label>
              <Textarea
                rows={3}
                value={form.content}
                onChange={(e) => update('content', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update('rating', r)}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        r <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
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
              {editingId ? 'Save Changes' : 'Add Testimonial'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}