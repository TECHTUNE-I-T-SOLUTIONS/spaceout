'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Link as LinkIcon, Globe } from 'lucide-react';

interface InsertLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

export function InsertLinkModal({ isOpen, onClose, onInsert }: InsertLinkModalProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const handleInsert = () => {
    if (!url) return;
    const linkText = text || url;
    const target = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const html = `<a href="${url}"${target} class="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">${linkText}</a>`;
    onInsert(html);
    resetAndClose();
  };

  const resetAndClose = () => {
    setUrl('');
    setText('');
    setOpenInNewTab(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={resetAndClose} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <h2 className="text-xl font-bold">Insert Link</h2>
            </div>
            <button
              onClick={resetAndClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="modal-link-url">URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-link-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="modal-link-text">Link Text (Optional)</Label>
              <Input
                id="modal-link-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Click here"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="modal-new-tab"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="modal-new-tab" className="text-sm cursor-pointer">
                Open in new tab
              </Label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={resetAndClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleInsert} disabled={!url} className="flex-1">
              {url ? 'Insert Link' : 'Enter a URL'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}