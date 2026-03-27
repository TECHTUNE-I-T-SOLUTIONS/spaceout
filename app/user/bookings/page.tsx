'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
// Dynamically import jsPDF only when needed
let jsPDF: any = null;
async function getJsPDF() {
  if (!jsPDF) {
    const mod = await import('jspdf');
    jsPDF = mod.jsPDF;
  }
  return jsPDF;
}
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
  _id: string;
  spaceName: string;
  location: string;
  date: string;
  time: string;
  duration: number;
  durationLabel: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'checked_in';
  price: number;
  selectedPlan: {
    planName: string;
    planType: string;
    durationLabel: string;
    memberPrice?: number;
    nonMemberPrice?: number;
    flatPrice?: number;
  };
  isMember: boolean;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  paymentStatus: string;
  notes?: string;
  serviceId: {
    _id: string;
    name: string;
  } | string;
  branchId?: {
    _id: string;
    name: string;
    location: string;
  };
}

interface Service {
  _id: string;
  name: string;
  pricingPlans: {
    durationInHours: number;
    _id: string;
    planName: string;
    planType: string;
    durationLabel: string;
    memberPrice: number;
    nonMemberPrice: number;
    flatPrice?: number;
  }[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    selectedPlanId: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<{
    planType: string;
    rate: number;
    quantity: number;
    unit: string;
    subtotal: number;
  } | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [durationInDays, setDurationInDays] = useState(0);

  useEffect(() => {
    fetchBookings();
    fetchServices();
    checkMembershipStatus();
    
    // Check for payment verification on page load
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference) {
      verifyPaymentAndShowReceipt(reference);
    }
  }, []);

  // Calculate price when form data changes
  useEffect(() => {
    calculatePrice();
  }, [formData, selectedService, isMember]);

  const calculatePrice = () => {
    if (!selectedService || !formData.selectedPlanId || !formData.startDate || !formData.endDate) {
      setCalculatedPrice(0);
      setPriceBreakdown(null);
      setDurationInDays(0);
      return;
    }

    const plan = selectedService.pricingPlans.find(p => p._id === formData.selectedPlanId);
    if (!plan) {
      setCalculatedPrice(0);
      setPriceBreakdown(null);
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const durationInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    setDurationInDays(durationInDays);

    let price = 0;
    let breakdown: typeof priceBreakdown = null;

    // Always calculate based on selected hours
    // Calculate hours per day from start time to end time
    const startHour = parseInt(formData.startTime.split(':')[0]);
    const startMinute = parseInt(formData.startTime.split(':')[1]) / 60;
    const endHour = parseInt(formData.endTime.split(':')[0]);
    const endMinute = parseInt(formData.endTime.split(':')[1]) / 60;
    const hoursPerDay = (endHour + endMinute) - (startHour + startMinute);

    const hourlyRate = isMember ? plan.memberPrice : plan.nonMemberPrice;
    price = hourlyRate * hoursPerDay * durationInDays;
    breakdown = {
      planType: 'hourly',
      rate: hourlyRate,
      quantity: Math.round(hoursPerDay * durationInDays * 10) / 10, // Total hours across all days
      unit: 'hours',
      subtotal: price,
    };

    setCalculatedPrice(price);
    setPriceBreakdown(breakdown);
  };

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

  const checkMembershipStatus = async () => {
    try {
      const response = await fetch('/api/users/membership-status');
      if (response.ok) {
        const data = await response.json();
        setIsMember(data.isMember);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const verifyPaymentAndShowReceipt = async (reference: string) => {
    try {
      const response = await fetch(`/api/payments/verify-booking?reference=${reference}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh bookings to show the updated status
          await fetchBookings();
          
          // Show receipt
          setReceiptData({
            bookingId: data.payment.bookingId,
            amount: data.payment.amount,
            reference: reference,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
          });
          setShowReceipt(true);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast.success('Payment Successful!', {
            description: 'Your booking has been confirmed.',
          });
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Payment verification failed');
    }
  };

  const handleCreateBooking = async () => {
    if (!formData.serviceId || !formData.selectedPlanId || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Always require start and end times
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please select both start and end times');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    // Validate time range (9 AM - 5 PM)
    if (formData.startTime < '09:00' || formData.startTime > '17:00') {
      toast.error('Start time must be between 9:00 AM and 5:00 PM');
      return;
    }

    if (formData.endTime < '09:00' || formData.endTime > '17:00') {
      toast.error('End time must be between 9:00 AM and 5:00 PM');
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

      const data = await response.json();
      setBookings([data.booking, ...bookings]);
      setShowBookingDialog(false);
      setFormData({
        serviceId: '',
        selectedPlanId: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        notes: '',
      });
      setSelectedService(null);
      setCalculatedPrice(0);
      setPriceBreakdown(null);

      console.log('Booking created:', data.booking);
      console.log('Total price:', data.booking.totalPrice);
      console.log('Total price type:', typeof data.booking.totalPrice);
      console.log('Total price truthy:', !!data.booking.totalPrice);

      // If booking requires payment, redirect to payment
      if (data.booking.totalPrice && data.booking.totalPrice > 0) {
        console.log('Initiating payment for booking with price:', data.booking.totalPrice);
        toast.success('Booking Created', {
          description: 'Redirecting to payment...',
        });
        // Add a small delay to show the toast
        setTimeout(() => {
          handlePayment(data.booking);
        }, 1000);
      } else {
        console.log('No payment required for booking, attempting payment anyway for debugging');
        // For debugging, try payment anyway
        toast.success('Booking Created', {
          description: 'Attempting payment...',
        });
        setTimeout(() => {
          handlePayment(data.booking);
        }, 1000);
      }
    } catch (error: any) {
      toast.error('Failed to Create Booking', {
        description: error.message || 'Unable to create booking.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (booking: Booking) => {
    try {
      console.log('Initializing payment for booking:', booking.id || booking._id);

      const response = await fetch('/api/payments/initialize-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id || booking._id,
        }),
      });

      console.log('Payment initialization response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment initialization failed:', errorText);
        throw new Error('Failed to initialize payment');
      }

      const paymentData = await response.json();
      console.log('Payment data received:', paymentData);

      // Redirect to Paystack payment page
      window.location.href = paymentData.authorization_url;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment Initialization Failed', {
        description: error.message || 'Unable to initialize payment.',
      });
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setIsProcessing(true);

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      setBookings(bookings.filter(b => b.id !== bookingId));
      setShowCancelDialog(false);
      setSelectedBookingId(null);

      toast.success('Booking Cancelled', {
        description: 'Your booking has been cancelled successfully.',
      });
    } catch (error: any) {
      toast.error('Failed to Cancel Booking', {
        description: error.message || 'Unable to cancel booking.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const canCheckIn = (booking: Booking) => {
    if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    return today >= startDate && today <= endDate;
  };

  const handleCheckIn = async (booking: Booking) => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: booking.serviceId,
          bookingId: booking.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check in');
      }

      // Update booking status locally
      setBookings(bookings.map(b =>
        b.id === booking.id ? { ...b, status: 'checked_in' as const } : b
      ));

      toast.success('Check-in Successful', {
        description: 'You have been checked in for your booking.',
      });
    } catch (error: any) {
      toast.error('Check-in Failed', {
        description: error.message || 'Unable to check in.',
      });
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
      // @ts-ignore
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
                        {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : booking.date}
                        {booking.endDate && new Date(booking.endDate).toLocaleDateString() !== new Date(booking.startDate).toLocaleDateString() &&
                          ` - ${new Date(booking.endDate).toLocaleDateString()}`
                        }
                        {booking.startTime && ` at ${booking.startTime}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.paymentStatus === 'paid'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : booking.paymentStatus === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                      }`}>
                        {booking.paymentStatus?.toUpperCase() || 'UNPAID'}
                      </span>
                      <span className="font-semibold">₦{booking.price?.toLocaleString() || '0'}</span>
                            {/* Booking Details Dialog */}
                            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Booking Details</DialogTitle>
                                  <DialogDescription>
                                    Detailed information about your booking.
                                  </DialogDescription>
                                </DialogHeader>
                                {detailsBooking ? (
                                  <div className="space-y-4">
                                    <div><strong>Space:</strong> {detailsBooking.spaceName}</div>
                                    <div><strong>Location:</strong> {detailsBooking.location}</div>
                                    {detailsBooking.branchId && (
                                      <div><strong>Branch:</strong> {detailsBooking.branchId.name} ({detailsBooking.branchId.location})</div>
                                    )}
                                    <div><strong>Date:</strong> {detailsBooking.startDate ? new Date(detailsBooking.startDate).toLocaleDateString() : ''}
                                      {detailsBooking.endDate && new Date(detailsBooking.endDate).toLocaleDateString() !== new Date(detailsBooking.startDate).toLocaleDateString() &&
                                        ` - ${new Date(detailsBooking.endDate).toLocaleDateString()}`}
                                      {detailsBooking.startTime && ` at ${detailsBooking.startTime}`}
                                    </div>
                                    <div><strong>Status:</strong> {detailsBooking.status}</div>
                                    <div><strong>Payment Status:</strong> {detailsBooking.paymentStatus}</div>
                                    <div><strong>Plan:</strong> {detailsBooking.selectedPlan?.planName || detailsBooking.durationLabel}</div>
                                    <div><strong>Plan Type:</strong> {detailsBooking.selectedPlan?.planType}</div>
                                    <div><strong>Duration:</strong> {detailsBooking.durationLabel}</div>
                                    <div><strong>Price:</strong> ₦{detailsBooking.price?.toLocaleString() || '0'}</div>
                                    <div><strong>Notes:</strong> {detailsBooking.notes || 'None'}</div>
                                    <div><strong>Booking ID:</strong> {detailsBooking.id}</div>
                                  </div>
                                ) : (
                                  <div>No booking selected.</div>
                                )}
                              </DialogContent>
                            </Dialog>
                      <span className="text-sm text-muted-foreground">
                        {booking.selectedPlan?.planName || booking.durationLabel}
                        {booking.isMember && ' (Member Rate)'}
                        {booking.selectedPlan?.durationLabel && ` - ${booking.selectedPlan.durationLabel}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setShowCancelDialog(true);
                      }}
                      disabled={booking.status === 'completed' || booking.status === 'checked_in'}
                    >
                      <Trash2 size={16} />
                    </Button>
                    {booking.paymentStatus !== 'paid' && booking.price > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handlePayment(booking)}
                        disabled={isProcessing}
                      >
                        {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Pay Now
                      </Button>
                    )}
                    {canCheckIn(booking) && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(booking)}
                        disabled={isProcessing}
                      >
                        {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Check In
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const res = await fetch(`/api/bookings/receipt/${booking.id}`);
                        if (!res.ok) {
                          alert('Failed to generate receipt.');
                          return;
                        }
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `receipt-${booking.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      Download Receipt
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setDetailsBooking(booking);
                        setShowDetailsDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new booking.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Label htmlFor="booking-service">Service</Label>
            <select
              id="booking-service"
              title="Select service"
              value={formData.serviceId}
              onChange={e => {
                const serviceId = e.target.value;
                setFormData({ ...formData, serviceId, selectedPlanId: '' });
                const service = services.find(s => s._id === serviceId) || null;
                setSelectedService(service);
                setSelectedPlan(null);
              }}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="">Select a service</option>
              {services.map(service => (
                <option key={service._id} value={service._id}>{service.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <Label htmlFor="booking-plan">Pricing Plan</Label>
            <select
              id="booking-plan"
              title="Select pricing plan"
              value={formData.selectedPlanId}
              onChange={e => {
                const planId = e.target.value;
                setFormData({ ...formData, selectedPlanId: planId });
                const plan = selectedService?.pricingPlans.find(p => p._id === planId);
                setSelectedPlan(plan || null);
              }}
              className="w-full px-3 py-2 border rounded-md bg-background"
              disabled={!selectedService}
            >
              <option value="">Select a pricing plan</option>
              {selectedService && selectedService.pricingPlans.map(plan => (
                <option key={plan._id} value={plan._id}>
                  {plan.planName} - ₦{isMember ? plan.memberPrice : plan.nonMemberPrice}
                  {plan.durationInHours > 1 && '/day'}
                  {plan.durationInHours === 1 && '/hour'}
                  {plan.planType === 'flat' && ' (Flat Rate)'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {selectedService && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="startTime">Start Time (9:00 AM - 5:00 PM)</Label>
                <select
                  id="startTime"
                  title="Select start time"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select start time</option>
                  {Array.from({ length: 9 }, (_, i) => {
                    const hour = i + 9;
                    const timeString = `${hour.toString().padStart(2, '0')}:00`;
                    const displayTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
                    return (
                      <option key={timeString} value={timeString}>{displayTime}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="endTime">End Time (9:00 AM - 5:00 PM)</Label>
                <select
                  id="endTime"
                  title="Select end time"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select end time</option>
                  {Array.from({ length: 9 }, (_, i) => {
                    const hour = i + 9;
                    const timeString = `${hour.toString().padStart(2, '0')}:00`;
                    const displayTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
                    return (
                      <option key={timeString} value={timeString}>{displayTime}</option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

            {calculatedPrice > 0 && priceBreakdown && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <h4 className="font-medium text-sm">Price Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span>₦{priceBreakdown.rate.toLocaleString()} per {priceBreakdown.unit.replace('s', '')}</span>
                  </div>
                  {priceBreakdown.planType === 'hourly' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Hours per day:</span>
                        <span>{(priceBreakdown.quantity / durationInDays).toFixed(1)} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of days:</span>
                        <span>{durationInDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total hours:</span>
                        <span>{priceBreakdown.quantity} hours</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{priceBreakdown.quantity} {priceBreakdown.unit}</span>
                    </div>
                  )}
                  {isMember && (
                    <div className="flex justify-between text-green-600">
                      <span>Member Discount:</span>
                      <span>Applied</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total:</span>
                    <span className="text-lg font-bold text-primary">₦{calculatedPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

          <div className="mt-4">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-background"
              rows={3}
              placeholder="Any special requests or notes..."
            />
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowBookingDialog(false);
                setFormData({
                  serviceId: '',
                  selectedPlanId: '',
                  startDate: '',
                  endDate: '',
                  startTime: '',
                  endTime: '',
                  notes: '',
                });
                setSelectedService(null);
                setCalculatedPrice(0);
                setPriceBreakdown(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              disabled={Boolean(
                isProcessing ||
                !formData.serviceId ||
                !formData.selectedPlanId ||
                !formData.startDate ||
                !formData.endDate ||
                (formData.startTime && !formData.endTime) ||
                (!formData.startTime && formData.endTime) ||
                (formData.startTime && formData.endTime && (
                  formData.startTime >= formData.endTime ||
                  formData.startTime < '09:00' || formData.startTime > '17:00' ||
                  formData.endTime < '09:00' || formData.endTime > '17:00'
                ))
              )}
              className="flex-1"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {calculatedPrice > 0 ? 'Pay and Book' : 'Book Now'}
            </Button>
          </div>
          {/* </div> */}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Payment Successful!</DialogTitle>
            <DialogDescription className="text-center">
              Your booking has been confirmed. Please show this receipt at entry.
            </DialogDescription>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Booking Receipt</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Booking ID:</span>
                  <span className="font-mono">{receiptData.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-semibold">₦{receiptData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono text-xs">{receiptData.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{receiptData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{receiptData.time}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Please keep this receipt for your records and show it at the venue entry.
                </p>
              </div>

              <Button onClick={() => setShowReceipt(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Important Notice
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    If you have already paid for this booking, your payment is irreversible and non-refundable.
                    For further details, inquiries, or help regarding refunds, please contact our support team.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact Support: support@spaceoutworkstation.com <br />Phone: +234 809 988 5454</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isProcessing}>
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCancelBooking(selectedBookingId!)}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Booking
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
