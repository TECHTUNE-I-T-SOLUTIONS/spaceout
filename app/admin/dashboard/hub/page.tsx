'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HubAdminPage } from '@/components/admin/hub/hub-admin-page';

interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
}

export default function HubAdmin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch('/api/auth/admin/me');
        if (!response.ok) {
          router.push('/admin/auth/login');
          return;
        }
        const adminData = await response.json();
        setAdmin(adminData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
        router.push('/admin/auth/login');
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return <HubAdminPage adminId={admin.id} />;
}