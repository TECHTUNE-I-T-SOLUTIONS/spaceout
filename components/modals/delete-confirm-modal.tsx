'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  isDangerous?: boolean;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  isLoading = false,
  onConfirm,
  isDangerous = true,
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-3 ${isDangerous ? 'bg-red-100 dark:bg-red-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
              <AlertCircle className={`w-5 h-5 ${isDangerous ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base py-4">
          {description}
          {itemName && (
            <>
              <br />
              <span className="font-semibold text-foreground block mt-2">"{itemName}"</span>
            </>
          )}
        </DialogDescription>

        <DialogFooter className="flex gap-2 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isDangerous ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
