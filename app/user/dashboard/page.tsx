'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { MembershipModal } from '@/components/membership-modal';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  membershipStatus?: 'active' | 'inactive';
  membershipType?: string;
  membershipActivatedAt?: string;
  membershipExpiryDate?: string;
  passportUrl?: string;
  signatureUrl?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function UserDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingCheckIns, setLoadingCheckIns] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
          if (!data.documentsUploaded && data.passportPhotoUrl && data.signatureUrl) {
            try {
              await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentsUploaded: true }),
              });
              setUserProfile({ ...data, documentsUploaded: true });
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
      finally { setLoadingProfile(false); }
    };
    fetchUserProfile();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchSubscriptions = async () => {
      try {
        const res = await fetch('/api/user/subscriptions');
        if (res.ok) setSubscriptions((await res.json()).subscriptions || []);
      } catch { /* ignore */ }
    };
    fetchSubscriptions();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchCheckIns = async () => {
      try {
        setLoadingCheckIns(true);
        const res = await fetch('/api/checkin/history?limit=5');
        if (res.ok) setCheckIns((await res.json()).checkIns || []);
      } catch { /* ignore */ }
      finally { setLoadingCheckIns(false); }
    };
    fetchCheckIns();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchPayments = async () => {
      try {
        setLoadingPayments(true);
        const res = await fetch('/api/payments/history?limit=5');
        if (res.ok) setPayments((await res.json()).payments || []);
      } catch { /* ignore */ }
      finally { setLoadingPayments(false); }
    };
    fetchPayments();
  }, [session?.user?.id]);

  if (status === 'loading' || !session) {
    return (
      <motion.div
        className="px-3 py-3 max-w-[1400px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-1" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-7 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="p-3">
              <div className="h-3 w-16 bg-muted animate-pulse rounded mb-1.5" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="px-3 py-3 max-w-[1400px] mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-3">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Welcome back to SpaceOut</p>
      </motion.div>

      {/* Stats — compact single row */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          {
            icon: CreditCard,
            label: 'Membership',
            value: userProfile?.membershipStatus === 'active' ? 'Active' : 'Inactive',
            color: userProfile?.membershipStatus === 'active' ? 'text-green-500' : 'text-amber-500',
            badge: userProfile?.membershipStatus === 'active' ? 'Active' : 'inactive',
          },
          {
            icon: Shield,
            label: 'Verification',
            value: userProfile?.passportUrl && userProfile?.signatureUrl ? 'Verified' : 'Pending',
            color: userProfile?.passportUrl && userProfile?.signatureUrl ? 'text-green-500' : 'text-amber-500',
          },
          {
            icon: Clock,
            label: 'Active',
            value: subscriptions.filter(s => s.status === 'active').length.toString(),
            color: 'text-blue-500',
          },
          {
            icon: CheckCircle,
            label: 'Total',
            value: subscriptions.length.toString(),
            color: 'text-purple-500',
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                  <p className="text-lg font-bold leading-tight truncate">{stat.value}</p>
                  {stat.badge && <Badge className="mt-1 bg-green-500 text-white text-[10px]">{stat.badge}</Badge>}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link href="/user/check-in">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">Check In Now</Button>
          </Link>
          <Link href="/user/bookings">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">Make a Booking</Button>
          </Link>
          <Link href="/user/payments">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">View Payments</Button>
          </Link>
        </div>
      </motion.div>

      {/* Document Verification Alert */}
      {!loadingProfile && (!userProfile?.passportUrl || !userProfile?.signatureUrl) && (
        <motion.div variants={itemVariants} className="mb-3">
          <Card className="p-3 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Verification Required</h3>
                <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">Upload passport and signature to proceed with check-ins.</p>
                <Button size="sm" variant="default" onClick={() => router.push('/user/profile')}>Upload Documents</Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Active Subscriptions */}
      {subscriptions.filter(s => s.status === 'active').length > 0 && (
        <motion.div variants={itemVariants} className="mb-3">
          <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <Badge className="bg-green-500 text-white text-[10px]">Active</Badge>
            Your Active Memberships
          </h2>
          <div className="space-y-2">
            {subscriptions.filter(s => s.status === 'active').map((sub) => (
              <motion.div key={sub._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-3 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-semibold text-sm truncate">{sub.serviceName}</p>
                        {sub.isAccessCard && <Badge variant="outline" className="text-[10px]">Access Card</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{sub.planName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Expires: {new Date(sub.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <Badge className="bg-green-500 text-white text-[10px]">Active</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Check-Ins */}
      <motion.div variants={itemVariants} className="mb-3">
        <h2 className="text-sm font-bold mb-2">Recent Check-Ins</h2>
        {loadingCheckIns ? (
          <Card className="p-4 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Loading check-ins...</span>
          </Card>
        ) : checkIns.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-3">No check-ins yet</p>
            <Link href="/user/check-in"><Button size="sm">Check In Now</Button></Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn) => (
              <motion.div key={checkIn._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{checkIn.serviceName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        {checkIn.planName} • {checkIn.durationLabel}
                        {checkIn.wifiIncluded ? (
                          <span className="text-green-600">WiFi</span>
                        ) : (
                          <span className="text-amber-600">No WiFi</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm">₦{checkIn.amount.toLocaleString()}</p>
                      <p className={`text-[10px] ${
                        checkIn.status === 'checked_in' ? 'text-green-600' : checkIn.status === 'pending' ? 'text-amber-600' : 'text-muted-foreground'
                      }`}>{checkIn.status}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            <Link href="/user/check-in" className="block">
              <Button variant="outline" className="w-full text-xs h-8">View All Check-Ins</Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Payment History */}
      <motion.div variants={itemVariants} className="mb-3">
        <h2 className="text-sm font-bold mb-2">Payment History</h2>
        {loadingPayments ? (
          <Card className="p-4 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Loading payments...</span>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-3">No payments yet</p>
            <Link href="/user/check-in"><Button size="sm">Make a Payment</Button></Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <motion.div key={payment._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{payment.serviceName}</p>
                      <p className="text-xs text-muted-foreground truncate">{payment.planName || payment.type} • {new Date(payment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm">₦{payment.amount.toLocaleString()}</p>
                      <p className={`text-[10px] font-semibold ${
                        payment.status === 'completed' ? 'text-green-600' : payment.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                      }`}>{payment.status.toUpperCase()}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            <Link href="/user/payments" className="block">
              <Button variant="outline" className="w-full text-xs h-8">View All Payments</Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Membership CTA */}
      <motion.div variants={itemVariants}>
        <Card className="p-5 bg-primary text-primary-foreground border-primary">
          <h3 className="text-base font-bold mb-1">Become an Astronaut</h3>
          <p className="mb-3 opacity-90 text-xs leading-relaxed">Upgrade your subscription, purchase a SpaceOut Card, or become an Astronaut member for premium perks.</p>
          <Button variant="secondary" onClick={() => setShowMembershipModal(true)}>Explore Options</Button>
        </Card>
      </motion.div>

      {/* Membership Modal */}
      <MembershipModal open={showMembershipModal} onOpenChange={setShowMembershipModal} />
    </motion.div>
  );
}
