'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  Hash,
  User,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentDetail {
  _id: string;
  type: 'membership' | 'service' | 'prepaid' | 'checkin' | 'booking';
  serviceName: string;
  planName?: string;
  amount: number;
  currency: string;
  planType?: string;
  membershipDays?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  paystackReference?: string;
  paystackAccessCode?: string;
  paymentMethod?: string;
  email: string;
  paidAt?: string;
  verifiedAt?: string;
  coverageEndDate?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reverifying, setReverifying] = useState(false);

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data.payment);
      } else {
        toast.error('Failed to load payment details');
      }
    } catch {
      toast.error('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleReverify = async () => {
    if (!payment) return;
    setReverifying(true);
    try {
      const reference = payment.paystackReference || payment.reference;
      const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
      if (res.status === 202) {
        toast.info('Payment is still processing — please try again shortly.');
      } else if (res.ok) {
        toast.success('Payment verified successfully!');
        fetchPayment();
      } else {
        toast.error('Payment verification failed.');
      }
    } catch {
      toast.error('Failed to verify payment');
    } finally {
      setReverifying(false);
    }
  };

  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', label: 'Completed' },
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', label: 'Pending' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', label: 'Failed' },
    cancelled: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950', border: 'border-gray-200 dark:border-gray-800', label: 'Cancelled' },
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { membership: 'Membership', service: 'Service', prepaid: 'Prepaid', checkin: 'Check-In', booking: 'Booking' };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="px-3 py-3 max-w-[1400px] mx-auto flex items-center justify-center gap-2 min-h-[50vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <CreditCard className="w-6 h-6 text-primary" />
        </motion.div>
        <span className="text-xs text-muted-foreground">Loading payment details...</span>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="px-3 py-3 max-w-[1400px] mx-auto min-h-[50vh]">
        <Card className="p-8 text-center">
          <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">Payment not found</p>
          <p className="text-xs text-muted-foreground">The payment record may have been removed.</p>
          <Button size="sm" className="mt-3" onClick={() => router.push('/user/payments')}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Payments
          </Button>
        </Card>
      </div>
    );
  }

  const sc = statusConfig[payment.status];
  const StatusIcon = sc.icon;
  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div className="px-3 py-3 max-w-[1400px] mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-3">
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => router.push('/user/payments')}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold">Payment Details</h1>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{payment.reference}</p>
        </div>
        <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
          <StatusIcon className="w-3 h-3" />
          {sc.label.toUpperCase()}
        </div>
      </motion.div>

      {/* Amount Card */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06] bg-primary rounded-bl-full" />
          <div className="relative">
            <p className="text-[10px] text-muted-foreground mb-1">Amount</p>
            <p className="text-3xl font-bold">₦{payment.amount.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{payment.serviceName}{payment.planName ? ` — ${payment.planName}` : ''}</p>
          </div>
        </Card>
      </motion.div>

      {/* Details Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Hash className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Reference</p>
            <p className="text-[11px] font-mono truncate">{payment.reference}</p>
          </div>
        </Card>
        {payment.paystackReference && (
          <Card className="p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Paystack Ref</p>
              <p className="text-[11px] font-mono truncate">{payment.paystackReference}</p>
            </div>
          </Card>
        )}
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Email</p>
            <p className="text-[11px] truncate">{payment.email}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Currency</p>
            <p className="text-[11px]">{payment.currency}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Date</p>
            <p className="text-[11px]">{formatDate(payment.createdAt)}</p>
          </div>
        </Card>
        {payment.coverageEndDate && (
          <Card className="p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Coverage Until</p>
              <p className="text-[11px]">{formatDate(payment.coverageEndDate)}</p>
            </div>
          </Card>
        )}
      </motion.div>

      {/* More Info */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Type</p>
          <p className="text-xs font-medium">{getTypeLabel(payment.type)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Payment Method</p>
          <p className="text-xs font-medium">{(payment as any).paymentMethod?.toUpperCase?.() || 'Paystack'}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Paid At</p>
          <p className="text-xs">{formatDate(payment.paidAt)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Verified At</p>
          <p className="text-xs">{formatDate(payment.verifiedAt)}</p>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-2.5">
          <div className="flex gap-2">
            {payment.status === 'pending' && (
              <Button size="sm" className="h-7 text-xs" onClick={handleReverify} disabled={reverifying}>
                {reverifying ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><RefreshCw className="w-3 h-3 mr-1 inline" /></motion.span>Verifying</>
                ) : (
                  <><RefreshCw className="w-3 h-3 mr-1" />Reverify</>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.info('Receipt download coming soon')}>
              <Download className="w-3 h-3 mr-1" /> Download Receipt
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Raw Metadata */}
      {payment.metadata && Object.keys(payment.metadata).length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground mb-2">Metadata</p>
            <pre className="text-[10px] bg-muted rounded p-2 overflow-x-auto">{JSON.stringify(payment.metadata, null, 2)}</pre>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
