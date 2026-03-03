'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutConfirmModal({ isOpen, onOpenChange }: LogoutConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ redirect: true, redirectUrl: '/' });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Sign Out</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to sign out? You'll need to log back in to access your account.
        </AlertDialogDescription>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} disabled={isLoading}>
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
