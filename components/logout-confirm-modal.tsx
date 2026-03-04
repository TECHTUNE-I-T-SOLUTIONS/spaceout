'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LogoutConfirmModalProps {
  isOpen?: boolean;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutConfirmModal({ isOpen = false, open, onOpenChange }: LogoutConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const modalOpen = open ?? isOpen;

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admins', { method: 'GET' });
        setIsAdmin(response.ok);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    if (modalOpen) {
      checkAdminStatus();
    }
  }, [modalOpen]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        const response = await fetch('/api/auth/admin-logout', { method: 'POST' });
        if (response.ok) {
          router.push('/admin/auth/login');
          router.refresh();
        } else {
          console.error('Admin logout failed');
          setIsLoading(false);
        }
      } else {
        await signOut({ redirect: true, redirectUrl: '/auth/login' });
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={modalOpen} onOpenChange={onOpenChange}>
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
