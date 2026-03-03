'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedFile {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface FileUploadProps {
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

export function FileUpload({
  onUploadSuccess,
  onUploadError,
  accept = 'image/*,.pdf',
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size
      if (file.size > maxSize) {
        const errorMsg = `File ${file.name} exceeds the ${maxSize / 1024 / 1024}MB size limit`;
        toast.error('File Too Large', { description: errorMsg });
        onUploadError?.(errorMsg);
        continue;
      }

      // Upload file
      await uploadFile(file);

      // Reset after first upload if not multiple
      if (!multiple) break;
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data: UploadedFile = await response.json();

      setUploadedFiles((prev) => [...prev, data]);
      onUploadSuccess?.(data);

      toast.success('File Uploaded Successfully', {
        description: `${file.name} uploaded to Cloudinary.`,
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to upload file';
      toast.error('Upload Failed', { description: errorMsg });
      onUploadError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className="p-8 border-2 border-dashed hover:border-primary transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Click to upload or drag and drop</h3>
          <p className="text-sm text-muted-foreground">
            {accept === 'image/*' ? 'PNG, JPG, WebP' : 'Images or PDF'} (Max {maxSize / 1024 / 1024}MB)
          </p>
        </div>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.fileSize / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                  className="text-xs"
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Uploading to Cloudinary...
        </div>
      )}
    </div>
  );
}
