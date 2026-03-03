'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, MapPin, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Booking {
  id: string;
  spaceName: string;
  location: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed';
  price: number;
  _id: string;
}

interface Service {
  _id: string;
  name: string;
  dailyPrice: number;
  description?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    date: '',
    duration: 1,
  });

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/user/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to Load Bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleCreateBooking = async () => {
    if (!formData.serviceId || !formData.date || !formData.duration) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const newBooking = await response.json();
      setBookings([newBooking, ...bookings]);
      setShowBookingDialog(false);
      setFormData({ serviceId: '', date: '', duration: 1 });

      toast.success('Booking Created', {
        description: 'Your booking has been created successfully.',
      });
    } catch (error: any) {
      toast.error('Failed to Create Booking', {
        description: error.message || 'Unable to create booking.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setIsProcessing(true);

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== bookingId));
        toast.success('Booking Cancelled');
        setShowCancelDialog(false);
      }
    } catch (error) {
      toast.error('Failed to Cancel Booking');
    } finally {
      setIsProcessing(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button
          className="flex items-center gap-2"
          onClick={() => setShowBookingDialog(true)}
        >
          <Plus size={18} />
          New Booking
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No bookings yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create a booking to reserve your workspace
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <motion.div key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold">{booking.spaceName}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        {booking.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        {booking.date} at {booking.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                      <span className="font-semibold">₦{booking.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">{booking.duration}h duration</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedBookingId(booking.id);
                      setShowCancelDialog(true);
                    }}
                    disabled={booking.status === 'completed'}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>Book a workspace for your needs</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="service">Service</Label>
              <select
                id="service"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedBookingId) {
                  handleCancelBooking(selectedBookingId);
                }
              }}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
