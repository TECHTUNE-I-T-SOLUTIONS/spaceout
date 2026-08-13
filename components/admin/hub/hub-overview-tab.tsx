'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { FileUpload } from '@/components/file-upload';
import type { HubConfig } from '@/components/hub/hub-types';
import { HUB_HIGHLIGHT_ICONS } from '@/components/hub/hub-icons';

type Highlight = { title: string; description: string; icon: string };
type Stat = { label: string; value: string };

export function HubOverviewTab({ adminId }: { adminId: string }) {
  const [config, setConfig] = useState<Partial<HubConfig>>({});
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/hub/config')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.config) {
          const c = json.config;
          setConfig(c);
          setHighlights(c.highlights || []);
          setStats(c.stats || []);
        }
      })
      .catch(() => toast.error('Failed to load hub settings'))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: unknown) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const addHighlight = () =>
    setHighlights((prev) => [...prev, { title: '', description: '', icon: 'Sparkles' }]);
  const updateHighlight = (index: number, field: keyof Highlight, value: string) =>
    setHighlights((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  const removeHighlight = (index: number) =>
    setHighlights((prev) => prev.filter((_, i) => i !== index));

  const addStat = () => setStats((prev) => [...prev, { label: '', value: '' }]);
  const updateStat = (index: number, field: keyof Stat, value: string) =>
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  const removeStat = (index: number) =>
    setStats((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hub/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, highlights, stats, updatedBy: adminId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Hub settings saved');
      } else {
        toast.error(json.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save hub settings');
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      {/* Hero */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Badge</Label>
            <Input
              value={config.heroBadge || ''}
              onChange={(e) => update('heroBadge', e.target.value)}
              placeholder="SPACEOUT TECH"
            />
          </div>
          <div className="grid gap-2">
            <Label>Hero Title</Label>
            <Input
              value={config.heroTitle || ''}
              onChange={(e) => update('heroTitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Hero Subtitle</Label>
            <Textarea
              rows={3}
              value={config.heroSubtitle || ''}
              onChange={(e) => update('heroSubtitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Hero Image</Label>
            <Input
              value={config.heroImage || ''}
              onChange={(e) => update('heroImage', e.target.value)}
              placeholder="Paste an image URL (e.g. Google Drive) or upload"
            />
            <FileUpload accept="image/*" onUploadSuccess={(file) => update('heroImage', file.url)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Secondary Image</Label>
            <Input
              value={config.heroSecondaryImage || ''}
              onChange={(e) => update('heroSecondaryImage', e.target.value)}
            />
            <FileUpload accept="image/*" onUploadSuccess={(file) => update('heroSecondaryImage', file.url)} />
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About Section</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>About Title</Label>
            <Input
              value={config.aboutTitle || ''}
              onChange={(e) => update('aboutTitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>About Text</Label>
            <Textarea
              rows={4}
              value={config.aboutText || ''}
              onChange={(e) => update('aboutText', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Stats</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addStat}>
            <Plus className="h-4 w-4" /> Add Stat
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <div className="grid gap-1.5">
                <Label>Label</Label>
                <Input
                  value={stat.label}
                  onChange={(e) => updateStat(index, 'label', e.target.value)}
                  placeholder="e.g. Learners Trained"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Value</Label>
                <Input
                  value={stat.value}
                  onChange={(e) => updateStat(index, 'value', e.target.value)}
                  placeholder="e.g. 120+"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStat(index)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {stats.length === 0 && (
            <p className="text-sm text-muted-foreground">No stats yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Why SpaceOut Tech (Highlights)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
            <Plus className="h-4 w-4" /> Add Highlight
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {highlights.map((item, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-end gap-2">
                <div className="grid flex-1 gap-2">
                  <Label>Title</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                    placeholder="e.g. Hands-on Learning"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHighlight(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Icon</Label>
                <Select value={item.icon} onValueChange={(v) => updateHighlight(index, 'icon', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {HUB_HIGHLIGHT_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {highlights.length === 0 && (
            <p className="text-sm text-muted-foreground">No highlights yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Section titles */}
      <Card>
        <CardHeader>
          <CardTitle>Section Headings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Programs Title</Label>
            <Input
              value={config.programsTitle || ''}
              onChange={(e) => update('programsTitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Programs Subtitle</Label>
            <Input
              value={config.programsSubtitle || ''}
              onChange={(e) => update('programsSubtitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Schedule Title</Label>
            <Input
              value={config.scheduleTitle || ''}
              onChange={(e) => update('scheduleTitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Schedule Subtitle</Label>
            <Input
              value={config.scheduleSubtitle || ''}
              onChange={(e) => update('scheduleSubtitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Gallery Title</Label>
            <Input
              value={config.galleryTitle || ''}
              onChange={(e) => update('galleryTitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Gallery Subtitle</Label>
            <Input
              value={config.gallerySubtitle || ''}
              onChange={(e) => update('gallerySubtitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Testimonials Title</Label>
            <Input
              value={config.testimonialsTitle || ''}
              onChange={(e) => update('testimonialsTitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Testimonials Subtitle</Label>
            <Input
              value={config.testimonialsSubtitle || ''}
              onChange={(e) => update('testimonialsSubtitle', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Call-to-Action</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>CTA Title</Label>
            <Input
              value={config.ctaTitle || ''}
              onChange={(e) => update('ctaTitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>CTA Subtitle</Label>
            <Input
              value={config.ctaSubtitle || ''}
              onChange={(e) => update('ctaSubtitle', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>CTA Button Text</Label>
            <Input
              value={config.ctaButtonText || ''}
              onChange={(e) => update('ctaButtonText', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Registration */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Registration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Contact Email</Label>
            <Input
              value={config.contactEmail || ''}
              onChange={(e) => update('contactEmail', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Contact Phone</Label>
            <Input
              value={config.contactPhone || ''}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <Input
              value={config.location || ''}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>WhatsApp Number</Label>
            <Input
              value={config.whatsappNumber || ''}
              onChange={(e) => update('whatsappNumber', e.target.value)}
              placeholder="e.g. 2348012345678"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Default Registration URL (page/course link)</Label>
            <Input
              value={config.defaultRegistrationUrl || ''}
              onChange={(e) => update('defaultRegistrationUrl', e.target.value)}
              placeholder="https://... or /contact"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}