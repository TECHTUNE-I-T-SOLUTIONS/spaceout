'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, Clock, Wifi, WifiOff, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MembershipModal } from '@/components/membership-modal';
import { toast } from 'sonner';

interface CheckIn {
  _id: string;
  serviceName: string;
  planName: string;
  durationLabel: string;
  amount: number;
  status: string;
  checkedInAt: string;
  wifiIncluded: boolean;
}

interface PaymentRecord {
  _id: string;
  type: string;
  serviceName: string;
  planName?: string;
  amount: number;
  status: string;
  paidAt?: string;
  createdAt: string;
}

export default function UserDashboard() {
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Fetch check-ins
  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        setLoadingCheckIns(true);
        const response = await fetch('/api/checkin/history?limit=5');
        if (response.ok) {
          const data = await response.json();
          setCheckIns(data.checkIns || []);
        }
      } catch (error) {
        console.error('Error fetching check-ins:', error);
      } finally {
        setLoadingCheckIns(false);
      }
    };

    fetchCheckIns();
  }, []);

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoadingPayments(true);
        const response = await fetch('/api/payments/history?limit=5');
        if (response.ok) {
          const data = await response.json();
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to SpaceOut</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          {
            icon: CreditCard,
            label: 'Membership Status',
            value: 'Inactive',
            color: 'text-amber-500',
          },
          {
            icon: Clock,
            label: 'Hours Used',
            value: '0 hours',
            color: 'text-blue-500',
          },
          {
            icon: Calendar,
            label: 'Active Bookings',
            value: '0',
            color: 'text-green-500',
          },
          {
            icon: CheckCircle,
            label: 'Check-Ins Today',
            value: '0',
            color: 'text-purple-500',
          },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/user/check-in">
            <Button className="w-full justify-start" variant="outline" size="lg">
              Check In Now
            </Button>
          </Link>
          <Link href="/user/bookings">
            <Button className="w-full justify-start" variant="outline" size="lg">
              Make a Booking
            </Button>
          </Link>
          <Link href="/user/payments">
            <Button className="w-full justify-start" variant="outline" size="lg">
              View Payments
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Recent Check-Ins */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Check-Ins</h2>
        {loadingCheckIns ? (
          <Card className="p-6 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-muted-foreground">Loading check-ins...</span>
          </Card>
        ) : checkIns.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No check-ins yet</p>
            <Link href="/user/check-in">
              <Button size="sm">Check In Now</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn) => (
              <motion.div key={checkIn._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{checkIn.serviceName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {checkIn.planName} • {checkIn.durationLabel}
                        {checkIn.wifiIncluded ? (
                          <Wifi className="w-3 h-3 text-green-600" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-amber-600" />
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₦{checkIn.amount.toLocaleString()}</p>
                      <p className={`text-xs ${
                        checkIn.status === 'checked_in'
                          ? 'text-green-600'
                          : checkIn.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                      }`}>
                        {checkIn.status}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            <Link href="/user/check-in" className="block">
              <Button variant="outline" className="w-full">
                View All Check-Ins
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Payment History */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-xl font-bold mb-4">Payment History</h2>
        {loadingPayments ? (
          <Card className="p-6 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-muted-foreground">Loading payments...</span>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No payments yet</p>
            <Link href="/user/check-in">
              <Button size="sm">Make a Payment</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <motion.div key={payment._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{payment.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.planName || payment.type} • {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₦{payment.amount.toLocaleString()}</p>
                      <p className={`text-xs font-semibold ${
                        payment.status === 'completed'
                          ? 'text-green-600'
                          : payment.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                        {payment.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            <Link href="/user/payments" className="block">
              <Button variant="outline" className="w-full">
                View All Payments
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Membership CTA */}
      <motion.div variants={itemVariants}>
        <Card className="p-8 bg-primary text-primary-foreground border-primary">
          <h3 className="text-xl font-bold mb-2">Upgrade Your Membership</h3>
          <p className="mb-6 opacity-90">
            Get priority access and special rates with an annual membership. Join our community of professionals and enjoy exclusive benefits.
          </p>
          <Button 
            variant="secondary"
            onClick={() => setShowMembershipModal(true)}
          >
            Become a Member
          </Button>
        </Card>
      </motion.div>

      {/* Membership Modal */}
      <MembershipModal open={showMembershipModal} onOpenChange={setShowMembershipModal} />
    </motion.div>
  );
}
