'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  spaceName: string;
  location: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed';
  price: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        if (data.length > 0) {
          toast.success('Bookings Loaded', {
            description: `You have ${data.length} booking(s).`,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to Load Bookings', {
        description: 'Unable to fetch your bookings.',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/user/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId));
        toast.success('Booking Cancelled', {
          description: 'Your booking has been cancelled successfully.',
        });
      } else {
        toast.error('Failed to Cancel Booking', {
          description: 'Unable to cancel this booking.',
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Error', {
        description: 'Failed to cancel booking.',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button className="flex items-center gap-2">
          <Plus size={18} />
          New Booking
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your bookings...</p>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Bookings Yet</h2>
          <p className="text-muted-foreground mb-6">
            You don't have any bookings yet. Create one to reserve your space.
          </p>
          <Button>Make a Booking</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">{booking.spaceName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {booking.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      {booking.duration}h
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(booking.date).toLocaleDateString()} at {booking.time}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <span className="font-bold text-lg">₦{booking.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {booking.status === 'confirmed' && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4 flex items-center gap-2"
                  onClick={() => cancelBooking(booking.id)}
                >
                  <Trash2 size={16} />
                  Cancel Booking
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
