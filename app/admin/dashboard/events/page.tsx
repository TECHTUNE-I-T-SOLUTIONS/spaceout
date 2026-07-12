'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import EventsClientPage from '@/components/admin/events-client-page';

interface AdminSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
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

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="container py-8">
      <EventsClientPage adminId={admin.id} />
    </div>
  );
}
