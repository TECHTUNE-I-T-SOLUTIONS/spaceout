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
} from 'lucide-react';
import { toast } from 'sonner';

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
  const initialContent = initialData?.content || "";

  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || "",
    content: initialContent || "",
    excerpt: initialData?.excerpt || "",
    eventType: initialData?.eventType || "news",
    status: initialData?.status || "draft",
    featured: initialData?.featured || false,
    tags: initialData?.tags || [],
    seoTitle: initialData?.seo_title || "",
    seoDescription: initialData?.seo_description || "",
    slug: (initialData as any)?.slug || "",
    schemaType: "None",
    eventDate: initialData?.eventDate || "",
    eventEndDate: initialData?.eventEndDate || "",
    location: initialData?.location || "",
    registrationUrl: initialData?.registrationUrl || "",
    contactEmail: initialData?.contactEmail || "",
    contactPhone: initialData?.contactPhone || "",
    featuredImage: initialData?.featuredImage || "",
  });

  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>(initialData?.mediaFiles || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const exec = (command: string, value?: string) => {
    contentRef.current?.focus();
    try {
      document.execCommand(command, false, value);
    } catch (e) {
      // ignore
    }
    const html = contentRef.current?.innerHTML || "";
    setFormData((prev) => ({ ...prev, content: html }));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    setIsLoading(true);
    try {
      const url = eventId ? `/api/admin/events/${eventId}` : "/api/admin/events";
      const method = eventId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status,
          mediaFiles: uploadedFiles,
          createdBy: adminId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: `${eventId ? "Event updated" : "Event created"}`,
          description: `Your event has been successfully ${eventId ? "updated" : status === "published" ? "published" : "saved as draft"}.`,
        });
        router.push("/admin/events");
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${eventId ? "update" : "save"} event`);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${eventId ? "update" : "save"} the event. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setUploadedFiles((prev) => [...prev, data]);
          toast({
            title: "File uploaded",
            description: `${file.name} has been uploaded successfully.`,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: `Failed to upload ${file.name}.`,
        });
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove),
    }));
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const alt = prompt("Enter image alt text:", "Image") || "Image";
      exec('insertHTML', `<img src="${url}" alt="${alt}" class="max-w-full h-auto rounded" style="width: 100%" />`);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const text = prompt("Enter link text:", url) || url;
      exec('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
    }
  };

  const insertCtaButton = () => {
    const text = prompt("Enter button text:", "Click Here");
    const url = prompt("Enter button URL:");
    if (text && url) {
      exec('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">${text}</a>`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">
            {eventId ? "Edit Event" : "Create New Event"}
          </h1>
          <p className="text-muted-foreground">
            {eventId ? "Update your event or news article" : "Create a new event, news, or announcement"}
          </p>
        </div>
        <Select
          value={formData.eventType}
          onValueChange={(value: "event" | "news" | "announcement") =>
            setFormData((prev) => ({ ...prev, eventType: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event">📅 Event</SelectItem>
            <SelectItem value="news">📰 News</SelectItem>
            <SelectItem value="announcement">📢 Announcement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                      slug: prev.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                    }))
                  }
                  placeholder="Enter event title..."
                  className="text-lg font-serif"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, ""),
                    }))
                  }
                  placeholder="clean-url-slug"
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-generated from title. Edit for keywords if needed.</p>
              </div>

              {/* Formatting toolbar */}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" onClick={() => exec('bold')}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('italic')}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('underline')}>
                  <Underline className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={insertImage}>
                  <Image className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={insertLink}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyLeft')}>
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyCenter')}>
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyRight')}>
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyFull')}>
                  <AlignJustify className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('formatBlock', 'H1')}>
                  <Heading className="h-4 w-4" />1
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('formatBlock', 'H2')}>
                  <Heading className="h-4 w-4" />2
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('formatBlock', 'H3')}>
                  <Heading className="h-4 w-4" />3
                </Button>
                <Button type="button" variant="ghost" onClick={insertCtaButton}>
                  <MousePointer2 className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <div className="relative">
                  <div
                    id="content"
                    ref={contentRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() =>
                      setFormData((prev) => ({ ...prev, content: contentRef.current?.innerHTML || "" }))
                    }
                    className="min-h-[400px] p-3 text-black dark:text-white border rounded prose dark:prose-invert max-w-none"
                    aria-label="Content editor"
                  />
                  {(!formData.content || formData.content === "<p><br></p>") && (
                    <span className="absolute top-3 left-3 text-muted-foreground pointer-events-none select-none">
                      Write your content here...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description or preview..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Media Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload media files"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Media
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group border rounded-lg p-4">
                      {file.file_type?.startsWith("image/") ? (
                        <img
                          src={file.file_url || "/placeholder.svg"}
                          alt={file.original_name}
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm font-medium truncate mt-2">{file.original_name}</p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.eventType === 'event' && (
                <>
                  <div>
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, eventDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventEndDate">Event End Date (Optional)</Label>
                    <Input
                      id="eventEndDate"
                      type="datetime-local"
                      value={formData.eventEndDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, eventEndDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Event location..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationUrl">Registration URL (Optional)</Label>
                    <Input
                      id="registrationUrl"
                      type="url"
                      value={formData.registrationUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, registrationUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, featured: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive" title={`Remove ${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="SEO optimized title..."
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="SEO meta description..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div>
                <Label>Schema Markup</Label>
                <Select
                  value={formData.schemaType}
                  onValueChange={(value: FormData["schemaType"]) =>
                    setFormData((prev) => ({ ...prev, schemaType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Article">Article</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="NewsArticle">NewsArticle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={() => handleSubmit("published")}
              disabled={isLoading || !formData.title || !formData.content}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              {eventId ? "Update" : "Publish"} Event
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isLoading || !formData.title}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import useToast
import { useToast } from '@/hooks/use-toast';