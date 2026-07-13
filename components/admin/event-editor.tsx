'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { InsertImageModal } from '@/components/admin/insert-image-modal';
import { InsertLinkModal } from '@/components/admin/insert-link-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Loader2,
  FileText,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image,
  Link as LinkIcon,
  Heading,
  MousePointer2,
  Calendar,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

interface EventEditorProps {
  adminId: string;
  eventId?: string;
  initialData?: any;
}

interface FormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  eventType: 'event' | 'news' | 'announcement';
  status: 'draft' | 'published';
  featured: boolean;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  schemaType: 'Article' | 'Event' | 'NewsArticle' | 'None';
  eventDate?: string;
  eventEndDate?: string;
  location?: string;
  registrationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  featuredImage?: string;
}

export default function EventEditor({ adminId, eventId, initialData }: EventEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    eventType: initialData?.eventType || "news",
    status: initialData?.status || "draft",
    featured: initialData?.featured || false,
    tags: initialData?.tags || [],
    seoTitle: initialData?.seoTitle || initialData?.seo_title || "",
    seoDescription: initialData?.seoDescription || initialData?.seo_description || "",
    slug: (initialData as any)?.slug || "",
    schemaType: "None",
    eventDate: initialData?.eventDate ? new Date(initialData.eventDate).toISOString().slice(0, 16) : "",
    eventEndDate: initialData?.eventEndDate ? new Date(initialData.eventEndDate).toISOString().slice(0, 16) : "",
    location: initialData?.location || "",
    registrationUrl: initialData?.registrationUrl || "",
    contactEmail: initialData?.contactEmail || "",
    contactPhone: initialData?.contactPhone || "",
    featuredImage: initialData?.featuredImage || "",
  });

  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  
  // Initialize contentEditable with initial content
  const [isInitialized, setIsInitialized] = useState(false);

  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>(initialData?.mediaFiles || []);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCtaModal, setShowCtaModal] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const contentIsEmpty = !formData.content || formData.content === "<p><br></p>" || formData.content === "";

  // Initialize contentEditable with initial content
  useEffect(() => {
    if (initialData?.content && contentEditableRef.current && !isInitialized) {
      contentEditableRef.current.innerHTML = initialData.content;
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Save cursor position before opening modal
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore selection and insert HTML at the saved cursor position
  const insertAtCursor = (html: string) => {
    const el = contentEditableRef.current;
    if (!el) return;

    el.focus();

    const sel = window.getSelection();
    if (!sel) { 
      el.innerHTML += html; 
      updateContent(); 
      return; 
    }

    // Restore the saved range
    if (savedRangeRef.current) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } catch (e) {
        // If restore fails, use current selection
        console.error('Failed to restore selection:', e);
      }
    }

    // Use execCommand which properly handles HTML insertion in contenteditable
    // This is the most reliable way to insert formatted HTML at cursor
    document.execCommand('insertHTML', false, html);

    savedRangeRef.current = null;
    updateContent();
  };

  const updateContent = () => {
    const html = contentEditableRef.current?.innerHTML || "";
    setFormData((prev) => ({ ...prev, content: html }));
  };

  const exec = (cmd: string, value?: string) => {
    contentEditableRef.current?.focus();
    document.execCommand(cmd, false, value || undefined);
    updateContent();
  };

  const handleSubmit = async (status: "draft" | "published") => {
    setIsLoading(true);
    try {
      const url = eventId ? `/api/admin/events/${eventId}` : "/api/admin/events";
      const method = eventId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status, mediaFiles: uploadedFiles, createdBy: adminId }),
      });
      if (response.ok) {
        toast({ title: `${eventId ? "Event updated" : "Event created"}`, description: `Successfully ${eventId ? "updated" : status === "published" ? "published" : "saved as draft"}.` });
        router.push("/admin/dashboard/events");
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${eventId ? "update" : "save"} event`);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          // Transform upload response to match mediaFiles schema
          const mediaFile = {
            id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file_url: data.url || data.file_url,
            file_type: data.mimeType || file.type,
            original_name: data.fileName || file.name,
            file_name: data.fileName || file.name,
            file_path: data.url || data.file_url,
            file_size: data.fileSize || file.size,
          };
          setUploadedFiles((prev) => [...prev, mediaFile]);
          toast({ title: "File uploaded", description: `${file.name} uploaded.` });
        }
      } catch {
        toast({ variant: "destructive", title: "Upload failed" });
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  // Modal handlers - save cursor before opening
  const openImageModal = () => {
    saveSelection();
    setShowImageModal(true);
  };

  const openLinkModal = () => {
    saveSelection();
    setShowLinkModal(true);
  };

  const openCtaModal = () => {
    saveSelection();
    setShowCtaModal(true);
  };

  const handleImageInsert = (url: string, alt?: string, size?: 'small' | 'medium' | 'large' | 'full') => {
    const sizeClasses = {
      small: 'max-w-[25%]',
      medium: 'max-w-[50%]',
      large: 'max-w-[75%]',
      full: 'max-w-full'
    };
    const sizeClass = size ? sizeClasses[size] : sizeClasses.medium;
    const html = `<img src="${url}" alt="${alt || 'Image'}" class="${sizeClass} h-auto rounded mx-auto" style="width: 100%" />`;
    insertAtCursor(html);
  };

  const handleLinkInsert = (html: string) => {
    // Add proper link styling classes for Tailwind typography
    const styledHtml = html.replace(
      /<a\s/g,
      '<a class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" '
    );
    insertAtCursor(styledHtml);
  };

  const handleCtaInsert = (text: string, href: string) => {
    const html = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">${text}</a>`;
    insertAtCursor(html);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold font-serif">{eventId ? "Edit Event" : "Create New Event"}</h1>
          <p className="text-muted-foreground">{eventId ? "Update event" : "Create a new event, news, or announcement"}</p>
        </div>
        <Select value={formData.eventType} onValueChange={(v: "event" | "news" | "announcement") => setFormData((prev) => ({ ...prev, eventType: v }))}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="event">📅 Event</SelectItem><SelectItem value="news">📰 News</SelectItem><SelectItem value="announcement">📢 Announcement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") }))} placeholder="Enter event title..." className="text-lg font-serif" />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "") }))} placeholder="clean-url-slug" />
                <p className="text-xs text-muted-foreground mt-1">Auto-generated from title. Edit for keywords if needed.</p>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-muted/30">
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('bold')} title="Bold"><Bold className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('italic')} title="Italic"><Italic className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('underline')} title="Underline"><Underline className="h-4 w-4" /></Button>
                <span className="w-px h-6 bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={openImageModal} title="Insert Image"><Image className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={openLinkModal} title="Insert Link"><LinkIcon className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={openCtaModal} title="Insert CTA Button"><MousePointer2 className="h-4 w-4" /></Button>
                <span className="w-px h-6 bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('formatBlock', 'H1')} title="Heading 1"><Heading className="h-4 w-4" /><span className="text-[10px]">1</span></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('formatBlock', 'H2')} title="Heading 2"><Heading className="h-4 w-4" /><span className="text-[10px]">2</span></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('formatBlock', 'H3')} title="Heading 3"><Heading className="h-4 w-4" /><span className="text-[10px]">3</span></Button>
                <span className="w-px h-6 bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyLeft')} title="Left"><AlignLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyCenter')} title="Center"><AlignCenter className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyRight')} title="Right"><AlignRight className="h-4 w-4" /></Button>
              </div>

              {/* Editor */}
              <div>
                <Label>Content</Label>
                <div className="relative border rounded-md overflow-hidden">
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={updateContent}
                    onKeyUp={updateContent}
                    className="min-h-[400px] p-4 text-foreground dark:text-white prose dark:prose-invert max-w-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {contentIsEmpty && (
                    <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none">Write your content here...</div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" value={formData.excerpt} onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))} placeholder="Brief description..." className="min-h-[100px] resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* Media Files */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Media Files</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*" onChange={handleFileUpload} className="hidden" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full"><Upload className="mr-2 h-4 w-4" />Upload Media</Button>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="relative group border rounded-lg p-2">
                      {file.file_type?.startsWith("image/") ? (
                        <img src={file.file_url || "/placeholder.svg"} alt={file.original_name} className="w-full h-32 object-cover rounded" />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded flex items-center justify-center"><FileText className="h-8 w-8 text-muted-foreground" /></div>
                      )}
                      <p className="text-sm font-medium truncate mt-2">{file.original_name}</p>
                      <Button size="sm" variant="destructive" className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {formData.eventType === 'event' && (
                <>
                  <div><Label htmlFor="eventDate">Event Date</Label><Input id="eventDate" type="datetime-local" value={formData.eventDate} onChange={(e) => setFormData((prev) => ({ ...prev, eventDate: e.target.value }))} /></div>
                  <div><Label htmlFor="eventEndDate">End Date</Label><Input id="eventEndDate" type="datetime-local" value={formData.eventEndDate} onChange={(e) => setFormData((prev) => ({ ...prev, eventEndDate: e.target.value }))} /></div>
                  <div><Label htmlFor="location">Location</Label><Input id="location" value={formData.location} onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))} placeholder="Event location..." /></div>
                  <div><Label htmlFor="registrationUrl">Registration URL</Label><Input id="registrationUrl" type="url" value={formData.registrationUrl} onChange={(e) => setFormData((prev) => ({ ...prev, registrationUrl: e.target.value }))} placeholder="https://..." /></div>
                </>
              )}
              <div><Label htmlFor="contactEmail">Contact Email</Label><Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))} placeholder="contact@example.com" /></div>
              <div><Label htmlFor="contactPhone">Contact Phone</Label><Input id="contactPhone" type="tel" value={formData.contactPhone} onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))} placeholder="+1234567890" /></div>
              <div>
                <Label>Featured Image</Label>
                <div className="space-y-3">
                  <Input type="url" value={formData.featuredImage} onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))} placeholder="https://example.com/image.jpg" />
                  <div>
                    <input type="file" accept="image/*" className="hidden" id="featured-image-upload" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      if (res.ok) {
                        const data = await res.json();
                        const imageUrl = data.url || data.file_url;
                        setFormData((prev) => ({ ...prev, featuredImage: imageUrl }));
                        setFeaturedImagePreview(imageUrl);
                        toast({ title: "Image uploaded" });
                      }
                    }} />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('featured-image-upload')?.click()} className="w-full"><Upload className="mr-2 h-4 w-4" />Upload Image</Button>
                  </div>
                  {(formData.featuredImage || featuredImagePreview) && (
                    <div className="relative border rounded-lg p-2">
                      <img src={featuredImagePreview || formData.featuredImage} alt="Preview" className="w-full h-48 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => { setFormData((prev) => ({ ...prev, featuredImage: '' })); setFeaturedImagePreview(null); }}><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Publish Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch id="featured" checked={formData.featured} onCheckedChange={(c) => setFormData((prev) => ({ ...prev, featured: c }))} />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                  <Button type="button" size="sm" onClick={addTag}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">{tag}<button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button></Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="seoTitle">SEO Title</Label><Input id="seoTitle" value={formData.seoTitle} onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))} placeholder="SEO title..." /></div>
              <div><Label htmlFor="seoDescription">SEO Description</Label><Textarea id="seoDescription" value={formData.seoDescription} onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))} placeholder="SEO meta description..." className="min-h-[80px] resize-none" /></div>
              <div>
                <Label>Schema Markup</Label>
                <Select value={formData.schemaType} onValueChange={(v: FormData["schemaType"]) => setFormData((prev) => ({ ...prev, schemaType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem><SelectItem value="Article">Article</SelectItem><SelectItem value="Event">Event</SelectItem><SelectItem value="NewsArticle">NewsArticle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button onClick={() => handleSubmit("published")} disabled={isLoading || !formData.title || !formData.content} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}{eventId ? "Update" : "Publish"} Event
            </Button>
            <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={isLoading || !formData.title} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save as Draft
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <InsertImageModal isOpen={showImageModal} onClose={() => setShowImageModal(false)} onInsert={handleImageInsert} />
      <InsertLinkModal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} onInsert={handleLinkInsert} />
      <InsertCtaModal isOpen={showCtaModal} onClose={() => setShowCtaModal(false)} onInsert={handleCtaInsert} />
    </div>
  );
}

function InsertCtaModal({ isOpen, onClose, onInsert }: { isOpen: boolean; onClose: () => void; onInsert: (text: string, url: string) => void }) {
  const [text, setText] = useState('Learn More');
  const [url, setUrl] = useState('');
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setText('Learn More'); setUrl(''); onClose(); }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Insert CTA Button</h2>
            <button onClick={() => { setText('Learn More'); setUrl(''); onClose(); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="space-y-4">
            <div><Label>Button Text</Label><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Learn More" /></div>
            <div><Label>Button URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" /></div>
            {text && url && (
              <div className="border rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">{text}</a>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => { setText('Learn More'); setUrl(''); onClose(); }} className="flex-1">Cancel</Button>
            <Button onClick={() => { if (text && url) { onInsert(text, url); setText('Learn More'); setUrl(''); onClose(); } }} disabled={!text || !url} className="flex-1">Insert Button</Button>
          </div>
        </div>
      </div>
    </>
  );
}