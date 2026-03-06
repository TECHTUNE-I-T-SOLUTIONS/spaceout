'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, Clock, Wifi, WifiOff, Loader2, TrendingUp, TrendingDown, AlertCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MembershipModal } from '@/components/membership-modal';
import { DocumentVerificationModal } from '@/components/document-verification-modal';
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

interface UserSubscription {
  _id: string;
  serviceName: string;
  planName: string;
  expiryDate: string;
  status: 'active' | 'expired';
  isAccessCard: boolean;
}

interface UserProfile {
  hasMembership: boolean;
  membershipExpiry?: string;
  passportUrl?: string;
  signatureUrl?: string;
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch user profile and check for missing documents
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
          
          // Show document verification modal if documents are missing
          if (!data.passportUrl || !data.signatureUrl) {
            setShowDocumentModal(true);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [status]);

  // Fetch subscriptions
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchSubscriptions = async () => {
      try {
        const response = await fetch('/api/user/subscriptions');
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      }
    };

    fetchSubscriptions();
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;

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
  }, [status]);

  // Fetch payments
  useEffect(() => {
    if (status !== 'authenticated') return;

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
  }, [status]);

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

  // Show loading skeleton while authentication is being checked
  if (status === 'loading') {
    return (
      <motion.div
        className="max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 4 }).map((_, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="p-6">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <Card className="p-6">
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
    // @ts-ignore
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
      // @ts-ignore
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          {
            icon: CreditCard,
            label: 'Membership Status',
            value: userProfile?.hasMembership ? 'Active' : 'Inactive',
            color: userProfile?.hasMembership ? 'text-green-500' : 'text-amber-500',
            badge: userProfile?.hasMembership ? 'Active' : null,
          },
          {
            icon: Shield,
            label: 'Verification Status',
            value: userProfile?.passportUrl && userProfile?.signatureUrl ? 'Verified' : 'Pending',
            color: userProfile?.passportUrl && userProfile?.signatureUrl ? 'text-green-500' : 'text-amber-500',
          },
          {
            icon: Clock,
            label: 'Active Memberships',
            value: subscriptions.filter(s => s.status === 'active').length,
            color: 'text-blue-500',
          },
          {
            icon: CheckCircle,
            label: 'Total Subscriptions',
            value: subscriptions.length,
            color: 'text-purple-500',
          },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.badge && <Badge className="mt-2 bg-green-500 text-white">{stat.badge}</Badge>}
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

      {/* Document Verification Alert */}
      {!loadingProfile && (!userProfile?.passportUrl || !userProfile?.signatureUrl) && (
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Verification Required</h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Please upload your passport and signature documents to proceed with check-ins.
                </p>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowDocumentModal(true)}
                >
                  Upload Documents
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Active Subscriptions */}
      {subscriptions.filter(s => s.status === 'active').length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Badge className="bg-green-500 text-white">Active</Badge>
            Your Active Memberships
          </h2>
          <div className="space-y-3">
            {subscriptions.filter(s => s.status === 'active').map((sub) => (
              <motion.div key={sub._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{sub.serviceName}</p>
                        {sub.isAccessCard && <Badge variant="outline" className="text-xs">Access Card</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{sub.planName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {new Date(sub.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

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
          <h3 className="text-xl font-bold mb-2">Become an Astronaut</h3>
          <p className="mb-6 opacity-90">
            Unlock exclusive benefits with SpaceOut! Upgrade your subscription, purchase a SpaceOut Card for exclusive access fees, or become an Astronaut member for premium perks and priority booking.
          </p>
          <Button 
            variant="secondary"
            onClick={() => setShowMembershipModal(true)}
          >
            Explore Options
          </Button>
        </Card>
      </motion.div>

      {/* Membership Modal */}
      <MembershipModal open={showMembershipModal} onOpenChange={setShowMembershipModal} />

      {/* Document Verification Modal */}
      <DocumentVerificationModal 
        open={showDocumentModal} 
        onOpenChange={setShowDocumentModal}
        onUploadSuccess={() => {
          // Refetch profile to update verification status
          fetch('/api/user/profile').then(r => r.json()).then(setUserProfile);
        }}
      />
    </motion.div>
  );
}
