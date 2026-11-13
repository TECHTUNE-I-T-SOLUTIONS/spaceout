'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, RefreshCw, ArrowRight, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  _id: string;
  type: string;
  serviceName: string;
  planName?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  paystackReference?: string;
  paidAt?: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'all', status: 'all' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [reverifyingIds, setReverifyingIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => { fetchPayments(); }, [filters, pagination.page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        page: pagination.page.toString(),
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.status !== 'all' && { status: filters.status }),
      });
      const response = await fetch(`/api/payments/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'pending': return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case 'failed': case 'cancelled': return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 border-red-200 dark:border-red-800';
      default: return 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'checkin': return 'Check-In';
      case 'membership': return 'Membership';
      case 'prepaid': return 'Prepaid';
      case 'service': return 'Service';
      default: return type;
    }
  };

  const handleReverify = async (payment: Payment) => {
    if (reverifyingIds.has(payment._id)) return;
    setReverifyingIds(prev => new Set(prev).add(payment._id));
    try {
      const reference = payment.paystackReference || payment.reference;
      const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
      if (response.status === 202) {
        toast.info('Payment is still processing — please try again shortly.');
      } else if (response.ok) {
        toast.success('Payment verified successfully!');
      } else {
        toast.error('Payment verification failed.');
      }
      fetchPayments();
    } catch (error) {
      toast.error('Failed to reverify payment');
    } finally {
      setReverifyingIds(prev => { const next = new Set(prev); next.delete(payment._id); return next; });
    }
  };

  const completedAmount = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const failedAmount = payments.filter(p => p.status === 'failed' || p.status === 'cancelled').reduce((s, p) => s + p.amount, 0);

  return (
    <motion.div className="px-3 py-3 max-w-[1400px] mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-3">
        <h1 className="text-lg font-bold mb-0.5">Payment History</h1>
        <p className="text-xs text-muted-foreground">Track and manage all your transactions</p>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Total</p>
            <p className="text-base font-bold">₦{pagination.total.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Completed</p>
            <p className="text-base font-bold">₦{completedAmount.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Pending</p>
            <p className="text-base font-bold">₦{pendingAmount.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Failed</p>
            <p className="text-base font-bold">₦{failedAmount.toLocaleString()}</p>
          </div>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="mb-3">
        <Card className="p-2.5">
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1 w-full">
              <Select value={filters.type} onValueChange={(value) => { setFilters({ ...filters, type: value }); setPagination({ ...pagination, page: 1 }); }}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checkin">Check-Ins</SelectItem>
                  <SelectItem value="membership">Memberships</SelectItem>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full">
              <Select value={filters.status} onValueChange={(value) => { setFilters({ ...filters, status: value }); setPagination({ ...pagination, page: 1 }); }}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-8">
              <Download className="w-3.5 h-3.5 mr-1" /> Export
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Payments List */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <Card className="p-6 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading payments...</span>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-8 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium mb-1">No payments found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <motion.div key={payment._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
                <Card className="p-2.5 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm truncate">{payment.serviceName}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border flex-shrink-0 ${getStatusColor(payment.status)}`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {getTypeLabel(payment.type)} {payment.planName && `• ${payment.planName}`} • {new Date(payment.createdAt).toLocaleDateString('en-NG')}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{payment.paystackReference || payment.reference}</p>
                    </div>

                    {/* Right: Amount + Action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold">₦{payment.amount.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">{payment.reference.substring(0, 10)}...</p>
                      </div>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReverify(payment)}
                          disabled={reverifyingIds.has(payment._id)}
                          className="h-7 px-2 text-[11px]"
                        >
                          {reverifyingIds.has(payment._id) ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Verifying</>
                          ) : (
                            <><RefreshCw className="w-3 h-3 mr-1" />Reverify</>
                          )}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => router.push(`/user/payments/${payment._id}`)}>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <motion.div variants={itemVariants} className="flex justify-center items-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} className="h-7 text-xs">
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={pagination.page === page ? 'default' : 'outline'} size="sm" onClick={() => setPagination({ ...pagination, page })} className="h-7 w-7 p-0 text-xs">
                {page}
              </Button>
            ))}
            {pagination.pages > 5 && <span className="text-xs text-muted-foreground px-1">...</span>}
          </div>
          <Button variant="outline" size="sm" disabled={pagination.page === pagination.pages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} className="h-7 text-xs">
            Next
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
