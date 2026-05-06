'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  _id: string;
  id: string;
  userId: {
    name: string;
    email: string;
  };
  serviceId: {
    name: string;
  };
  branchId: {
    name: string;
    location: string;
  };
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  durationInDays: number;
  selectedPlan: {
    planName: string;
    planType: string;
  };
  isMember: boolean;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked_in';
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkinStatsMap, setCheckinStatsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBookings(Array.isArray(data) ? data : data.bookings || []);
        setAuthError(false);
      } else {
        if (response.status === 401 || response.status === 403) setAuthError(true);
        throw new Error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to Load Bookings', {
        description: 'Unable to fetch bookings from server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(bookings.map(b =>
          (b._id || b.id) === bookingId ? { ...b, status: newStatus as any } : b
        ));
        toast.success('Booking Updated', {
          description: `Booking status changed to ${newStatus}.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update booking');
      }
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error('Failed to Update Booking', {
        description: error.message || 'Unable to update booking status.',
      });
    }
  };

  const handleReverifyPayments = async () => {
    try {
      const pending = bookings.filter(b => b.paymentStatus === 'pending');
      if (pending.length === 0) {
        toast.info('No pending payments to reverify');
        return;
      }

      for (const booking of pending) {
        const paymentResponse = await fetch(`/api/payments/checkin/${booking._id || booking.id}`);
        if (!paymentResponse.ok) continue;
        const paymentData = await paymentResponse.json();
        const reference = paymentData?.payment?.paystackReference || paymentData?.payment?.reference;
        if (!reference) continue;
        const verifyRes = await fetch(`/api/payments/verify?reference=${reference}`);
        if (!verifyRes.ok) {
          // If verify failed or payment not found, mark payment as failed via admin endpoint
          const paymentId = paymentData?.payment?._id;
          if (paymentId) {
            try {
              await fetch(`/api/admin/payments/${paymentId}/update-status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'failed' }),
              });
            } catch (e) {
              console.error('Failed to mark payment failed:', e);
            }
          }
        }
      }

      toast.success('Reverification completed');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to reverify pending payments');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default:
        return '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <Button variant="outline" onClick={handleReverifyPayments} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reverify Pending
        </Button>
      </div>

      {loading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading bookings...</p>
        </Card>
      )}

      {!loading && authError && (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Admin session required</h2>
          <p className="text-muted-foreground">Please sign in again to load bookings.</p>
        </Card>
      )}

      {!loading && !authError && bookings.length === 0 && (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Bookings</h2>
          <p className="text-muted-foreground">Bookings will appear here once users make reservations.</p>
        </Card>
      )}

      {!loading && !authError && bookings.length > 0 && (
        <>
          <Card className="overflow-hidden">
            {/* Mobile: show cards */}
            <div className="block md:hidden space-y-3 p-4">
              {bookings.map((booking) => {
                const id = booking._id || booking.id;
                const stats = checkinStatsMap[id];
                return (
                  <Card key={id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{booking.userId?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{booking.serviceId?.name || ''}</div>
                        <div className="text-xs text-muted-foreground">{new Date(booking.startDate).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">₦{booking.totalPrice?.toLocaleString() || '0'}</div>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            setSelectedBooking(booking);
                            setViewModalOpen(true);
                            try {
                              const res = await fetch(`/api/booking-checkin?bookingId=${encodeURIComponent(id)}`, { credentials: 'include' });
                              if (res.ok) {
                                const json = await res.json();
                                setCheckinStatsMap(prev => ({ ...prev, [id]: json }));
                              }
                            } catch {}
                          }}>View</Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {stats ? `Checked in: ${stats.totalCheckinDays || 0}/${stats.totalBookingDays || booking.durationInDays}` : ''}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="p-4 text-left">Booking ID</th>
                    <th className="p-4 text-left">User</th>
                    <th className="p-4 text-left">Service</th>
                    <th className="p-4 text-left">Dates</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.map((booking) => (
                    <tr key={booking._id || booking.id} className="hover:bg-muted/50">
                      <td className="p-4 font-mono text-xs">#{booking._id?.slice(-8) || booking.id}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{booking.userId?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{booking.userId?.email || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{booking.serviceId?.name || 'Unknown Service'}</div>
                          <div className="text-xs text-muted-foreground">{booking.selectedPlan?.planName || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(booking.startDate).toLocaleDateString()}
                          {booking.endDate && new Date(booking.endDate).toLocaleDateString() !== new Date(booking.startDate).toLocaleDateString() &&
                            ` - ${new Date(booking.endDate).toLocaleDateString()}`
                          }
                          {booking.startTime && <div className="text-xs text-muted-foreground">{booking.startTime}{booking.endTime && ` - ${booking.endTime}`}</div>}
                        </div>
                      </td>
                      <td className="p-4 font-bold">₦{booking.totalPrice?.toLocaleString() || '0'}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          {booking.paymentStatus && (
                            <div className="text-xs text-muted-foreground">
                              Payment: {booking.paymentStatus}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          <Button size="icon" variant="outline" onClick={async () => {
                            setSelectedBooking(booking);
                            setViewModalOpen(true);
                            try {
                              const id = booking._id || booking.id;
                              const res = await fetch(`/api/booking-checkin?bookingId=${encodeURIComponent(id)}`, { credentials: 'include' });
                              if (res.ok) {
                                const data = await res.json();
                                setCheckinStatsMap(prev => ({ ...prev, [id]: data }));
                              }
                            } catch (e) {
                              console.error('Failed to fetch checkin stats', e);
                            }
                          }}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          </Button>
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => updateBookingStatus(booking._id || booking.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-600"
                                onClick={() => updateBookingStatus(booking._id || booking.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                          {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => updateBookingStatus(booking._id || booking.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Details modal */}
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">User</div>
                    <div className="font-medium">{selectedBooking.userId?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{selectedBooking.userId?.email || ''}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Service</div>
                    <div className="font-medium">{selectedBooking.serviceId?.name || ''}</div>
                    <div className="text-xs">{selectedBooking.selectedPlan?.planName || ''}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Dates</div>
                    <div className="font-medium">{new Date(selectedBooking.startDate).toLocaleDateString()}{selectedBooking.endDate && ` - ${new Date(selectedBooking.endDate).toLocaleDateString()}`}</div>
                    <div className="text-xs">{selectedBooking.startTime ? `${selectedBooking.startTime}${selectedBooking.endTime ? ` - ${selectedBooking.endTime}` : ''}` : ''}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium">{selectedBooking.status}</div>
                    <div className="text-xs text-muted-foreground">Payment: {selectedBooking.paymentStatus}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Check-in Stats</div>
                    <div className="space-y-2">
                      {(() => {
                        const id = selectedBooking._id || selectedBooking.id;
                        const s = checkinStatsMap[id];
                        if (!s) return <div className="font-medium">No data</div>;
                        return (
                          <div>
                            <div className="font-medium">{s.totalCheckinDays || 0} / {s.totalBookingDays || selectedBooking.durationInDays} days</div>
                            {Array.isArray(s.checkins) && s.checkins.length > 0 && (
                              <div className="mt-2 space-y-1 text-sm">
                                {s.checkins.map((c: any) => (
                                  <div key={c._id} className="flex items-center justify-between">
                                    <div>{new Date(c.checkedInAt).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{c.checkedOut ? `Checked out ${c.checkedOutAt ? new Date(c.checkedOutAt).toLocaleString() : ''}` : 'Checked in'}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {selectedBooking.notes && (
                    <div>
                      <div className="text-sm text-muted-foreground">Notes</div>
                      <div className="text-sm">{selectedBooking.notes}</div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setViewModalOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </motion.div>
  );
}
