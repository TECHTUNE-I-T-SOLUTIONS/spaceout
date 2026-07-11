'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import EventEditor from '@/components/admin/event-editor';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventData, setEventData] = useState<any>(null);
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
      setAdminId(adminData.id);
      
      // Get event ID from params
      params.then(p => {
        setEventId(p.id);
        fetchEvent(p.id);
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
      router.push('/admin/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEventData(data);
      } else {
        toast.error('Failed to load event');
        router.push('/admin/events');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      router.push('/admin/events');
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

  if (!adminId || !eventId || !eventData) {
    return null;
  }

  return (
    <div className="container py-8">
      <EventEditor adminId={adminId} eventId={eventId} initialData={eventData} />
    </div>
  );
}