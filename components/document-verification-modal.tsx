'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/file-upload';
import { AlertCircle, Upload, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

export function DocumentVerificationModal({ 
  open, 
  onOpenChange,
  onUploadSuccess 
}: DocumentVerificationModalProps) {
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<'passport' | 'signature' | null>(null);

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.passportUrl) setPassportUrl(data.passportUrl);
        if (data.signatureUrl) setSignatureUrl(data.signatureUrl);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handlePassportUpload = async (uploadedFile: any) => {
    try {
      setIsUploading(true);
      setUploadingType('passport');

      // Save to profile
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportUrl: uploadedFile.url,
        }),
      });

      if (response.ok) {
        setPassportUrl(uploadedFile.url);
        toast.success('Passport Uploaded', {
          description: 'Your passport has been saved successfully.',
        });
        if (passportUrl && signatureUrl) {
          onUploadSuccess?.();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error uploading passport:', error);
      toast.error('Upload Failed', {
        description: 'Failed to upload passport.',
      });
    } finally {
      setIsUploading(false);
      setUploadingType(null);
    }
  };

  const handleSignatureUpload = async (uploadedFile: any) => {
    try {
      setIsUploading(true);
      setUploadingType('signature');

      // Save to profile
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureUrl: uploadedFile.url,
        }),
      });

      if (response.ok) {
        setSignatureUrl(uploadedFile.url);
        toast.success('Signature Uploaded', {
          description: 'Your signature has been saved successfully.',
        });
        if (passportUrl && uploadedFile.url) {
          onUploadSuccess?.();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast.error('Upload Failed', {
        description: 'Failed to upload signature.',
      });
    } finally {
      setIsUploading(false);
      setUploadingType(null);
    }
  };

  const isComplete = passportUrl && signatureUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
            <div>
              <DialogTitle>Verification Documents Required</DialogTitle>
              <DialogDescription>
                Before you can check in, we need your passport and signature for verification purposes. Please upload both documents.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Passport Upload */}
          <Card className={`p-4 border-2 ${passportUrl ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-dashed border-border'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  {passportUrl && <CheckCircle className="w-5 h-5 text-green-500" />}
                  Passport
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a clear photo of your passport
                </p>

                {passportUrl ? (
                  <div className="mb-3">
                    <img
                      src={passportUrl}
                      alt="Passport"
                      className="w-32 h-40 object-cover rounded border border-border"
                    />
                  </div>
                ) : null}

                {!passportUrl && (
                  <div className="w-full max-w-xs">
                    <FileUpload
                      accept="image/*"
                      maxSize={2 * 1024 * 1024}
                      onUploadSuccess={handlePassportUpload}
                    />
                  </div>
                )}

                {passportUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPassportUrl(null)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Signature Upload */}
          <Card className={`p-4 border-2 ${signatureUrl ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-dashed border-border'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  {signatureUrl && <CheckCircle className="w-5 h-5 text-green-500" />}
                  Signature
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a clear photo of your signature
                </p>

                {signatureUrl ? (
                  <div className="mb-3">
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="w-32 h-20 object-cover rounded border border-border"
                    />
                  </div>
                ) : null}

                {!signatureUrl && (
                  <div className="w-full max-w-xs">
                    <FileUpload
                      accept="image/*"
                      maxSize={2 * 1024 * 1024}
                      onUploadSuccess={handleSignatureUpload}
                    />
                  </div>
                )}

                {signatureUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSignatureUrl(null)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={!isComplete || isUploading}
          >
            Skip
          </Button>
          <Button
            onClick={() => {
              if (isComplete) {
                onOpenChange(false);
                onUploadSuccess?.();
              }
            }}
            disabled={!isComplete}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
