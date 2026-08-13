'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import type { HubProgram } from '@/components/hub/hub-types';
import { HUB_PROGRAM_ICONS } from '@/components/hub/hub-icons';

const EMPTY_FORM = {
  title: '',
  description: '',
  icon: 'Code2',
  category: '',
  order: 1,
  featured: false,
  isActive: true,
};

export function HubProgramsTab({ adminId }: { adminId: string }) {
  const [programs, setPrograms] = useState<HubProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/hub/programs');
      const json = await res.json();
      if (json.success) setPrograms(json.programs || []);
    } catch (e) {
      toast.error('Failed to load courses');
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

  const openEdit = (p: HubProgram) => {
    setEditingId(p._id);
    setForm({
      title: p.title,
      description: p.description,
      icon: p.icon || 'Code2',
      category: p.category || '',
      order: p.order ?? 1,
      featured: !!p.featured,
      isActive: p.isActive !== false,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/hub/programs/${editingId}`
        : '/api/admin/hub/programs';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, updatedBy: adminId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? 'Course updated' : 'Course created');
        setOpen(false);
        load();
      } else {
        toast.error(json.message || 'Failed to save course');
      }
    } catch (e) {
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      const res = await fetch(`/api/admin/hub/programs/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Course deleted');
        load();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch (e) {
      toast.error('Failed to delete course');
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
          The courses/tracks shown on the Hub page.
        </p>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>

      {programs.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No courses yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <Card key={p._id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold leading-snug">{p.title}</h3>
                  {p.category && (
                    <Badge variant="outline" className="mt-1">
                      {p.category}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(p._id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {p.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Switch checked={p.featured} disabled /> Featured
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Switch checked={p.isActive} disabled /> Active
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6">
            <DialogTitle>{editingId ? 'Edit Course' : 'Add Course'}</DialogTitle>
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
                placeholder="e.g. Programming & Web Development"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={(v) => update('icon', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HUB_PROGRAM_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  placeholder="e.g. Programming"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 items-end gap-3">
              <div className="grid gap-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => update('order', Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => update('featured', v)}
                />
                <Label>Featured</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => update('isActive', v)}
              />
              <Label>Active (visible on page)</Label>
            </div>
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Course'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}