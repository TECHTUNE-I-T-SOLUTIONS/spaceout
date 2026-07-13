'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt?: string, size?: 'small' | 'medium' | 'large' | 'full') => void;
}

export function InsertImageModal({ isOpen, onClose, onInsert }: InsertImageModalProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setImageUrl('');
      setAltText('');
      setMode('url');
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Upload response:', data);
        // API returns { url, fileName, fileSize, mimeType }
        setImageUrl(data.url);
        toast.success('Image uploaded successfully');
      } else {
        const errText = await response.text();
        console.error('Upload failed:', errText);
        toast.error('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsert = () => {
    if (!imageUrl) return;
    console.log('Inserting image:', imageUrl, 'with size:', imageSize);
    onInsert(imageUrl, altText || 'Image', imageSize);
    resetAndClose();
  };

  const resetAndClose = () => {
    setImageUrl('');
    setAltText('');
    setMode('url');
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={resetAndClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <h2 className="text-xl font-bold">Insert Image</h2>
            </div>
            <button onClick={resetAndClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <Button variant={mode === 'url' ? 'default' : 'outline'} size="sm" onClick={() => setMode('url')} className="flex-1">
              <LinkIcon className="w-4 h-4 mr-2" />URL
            </Button>
            <Button variant={mode === 'upload' ? 'default' : 'outline'} size="sm" onClick={() => setMode('upload')} className="flex-1">
              <Upload className="w-4 h-4 mr-2" />Upload
            </Button>
          </div>

          <div className="space-y-4">
            {mode === 'url' ? (
              <>
                <div>
                  <Label htmlFor="modal-image-url">Image URL</Label>
                  <Input id="modal-image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                </div>
                <div>
                  <Label htmlFor="modal-alt-text">Alt Text (Optional)</Label>
                  <Input id="modal-alt-text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image..." />
                </div>
              </>
            ) : (
              <>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="modal-image-upload" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-dashed" disabled={isUploading}>
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-sm">{imageUrl ? 'Upload another image' : 'Click to upload image'}</span>
                      </div>
                    )}
                  </Button>
                </div>
                {imageUrl && (
                  <div>
                    <Label htmlFor="modal-alt-upload">Alt Text (Optional)</Label>
                    <Input id="modal-alt-upload" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image..." />
                  </div>
                )}
              </>
            )}

            {/* Image Size Selector */}
            <div>
              <Label htmlFor="modal-image-size">Image Size</Label>
              <Select value={imageSize} onValueChange={(value: 'small' | 'medium' | 'large' | 'full') => setImageSize(value)}>
                <SelectTrigger id="modal-image-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (25%)</SelectItem>
                  <SelectItem value="medium">Medium (50%)</SelectItem>
                  <SelectItem value="large">Large (75%)</SelectItem>
                  <SelectItem value="full">Full Width (100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview - show when we have a URL */}
            {imageUrl && (
              <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className={`w-full h-48 object-cover rounded ${
                    imageSize === 'small' ? 'max-w-[25%]' :
                    imageSize === 'medium' ? 'max-w-[50%]' :
                    imageSize === 'large' ? 'max-w-[75%]' :
                    'max-w-full'
                  }`}
                  onError={(e) => {
                    console.error('Image preview error for:', imageUrl);
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                  onLoad={() => console.log('Preview loaded:', imageUrl)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={resetAndClose} className="flex-1">Cancel</Button>
            <Button onClick={handleInsert} disabled={!imageUrl || isUploading} className="flex-1">
              {imageUrl ? 'Insert Image' : 'Select an image'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}