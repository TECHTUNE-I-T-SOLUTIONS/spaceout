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
import { Plus, Edit2, Trash2, Loader2, X, CalendarDays, MapPin, Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { HubSession } from '@/components/hub/hub-types';
import { formatFee } from '@/components/hub/hub-types';
import { FileUpload } from '@/components/file-upload';

const STATUSES = ['draft', 'upcoming', 'ongoing', 'completed'] as const;

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'upcoming',
  startDate: '',
  endDate: '',
  time: '',
  duration: '',
  fee: 0,
  currency: 'NGN',
  location: '',
  capacity: 0,
  enrolled: 0,
  coverImage: '',
  registrationUrl: '',
  featured: false,
  isActive: true,
};

const STATUS_STYLES: Record<string, string> = {
  upcoming: 'bg-primary/15 text-primary',
  ongoing: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-muted text-muted-foreground',
  draft: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

export function HubSessionsTab({ adminId }: { adminId: string }) {
  const [sessions, setSessions] = useState<HubSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const toDateInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  const load = async () => {
    try {
      const res = await fetch('/api/admin/hub/sessions');
      const json = await res.json();
      if (json.success) setSessions(json.sessions || []);
    } catch (e) {
      toast.error('Failed to load schedule');
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

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/hub/sessions/${editingId}`
        : '/api/admin/hub/sessions';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, updatedBy: adminId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? 'Session updated' : 'Session created');
        setOpen(false);
        load();
      } else {
        toast.error(json.message || 'Failed to save session');
      }
    } catch (e) {
      toast.error('Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    try {
      const res = await fetch(`/api/admin/hub/sessions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Session deleted');
        load();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch (e) {
      toast.error('Failed to delete session');
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
          The cohort schedules shown on the Hub page. Set dates, fees and status.
        </p>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No sessions yet.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Card key={s._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{s.title}</h3>
                    <Badge className={STATUS_STYLES[s.status] || ''}>{s.status}</Badge>
                    {s.featured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {s.startDate && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(s.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {s.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {s.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> {formatFee(s.fee, s.currency)}
                    </span>
                    {s.capacity ? <span>{s.capacity} seats</span> : null}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(s._id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6">
            <DialogTitle>{editingId ? 'Edit Session' : 'Add Session'}</DialogTitle>
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
                placeholder="e.g. Summer Tech Bootcamp 2026"
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
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Input
                  value={form.duration}
                  onChange={(e) => update('duration', e.target.value)}
                  placeholder="e.g. 4 weeks"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Time</Label>
              <Input
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                placeholder="e.g. Mon – Fri, 9:00 AM – 2:00 PM"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Fee</Label>
                <Input
                  type="number"
                  value={form.fee}
                  onChange={(e) => update('fee', Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Input
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="e.g. SpaceOut, Tanke, Ilorin"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => update('capacity', Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Enrolled</Label>
                <Input
                  type="number"
                  value={form.enrolled}
                  onChange={(e) => update('enrolled', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Cover Image</Label>
              <Input
                value={form.coverImage}
                onChange={(e) => update('coverImage', e.target.value)}
                placeholder="Paste image URL or upload"
              />
              <FileUpload accept="image/*" onUploadSuccess={(file) => update('coverImage', file.url)} />
            </div>
            <div className="grid gap-2">
              <Label>Registration URL (leave blank to use default)</Label>
              <Input
                value={form.registrationUrl}
                onChange={(e) => update('registrationUrl', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => update('featured', v)}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => update('isActive', v)}
                />
                <Label>Active</Label>
              </div>
            </div>
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Session'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}