'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Download, Search, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Payment {
  _id: string;
  reference: string;
  paystackReference?: string;
  email: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  serviceName: string;
  userId: string;
  createdAt: string;
  paymentVerifiedAt?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: '-1',
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
        }));
      } else {
        throw new Error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to Load Payments', {
        description: 'Unable to fetch payment records.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Reference', 'Email', 'Service', 'Amount', 'Status', 'Created At', 'Verified At'];
    const rows = payments.map((payment) => [
      payment.reference,
      payment.email,
      payment.serviceName,
      payment.amount.toString(),
      payment.status,
      new Date(payment.createdAt).toISOString(),
      payment.paymentVerifiedAt ? new Date(payment.paymentVerifiedAt).toISOString() : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export complete');
  };

  const handleReverify = async (payment: Payment) => {
    try {
      const reference = payment.paystackReference || payment.reference;
      const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = data?.error || data?.message || 'Failed to reverify payment';
        toast.error(msg);
        return;
      }

      // If backend returned updated payment, update local state
      if (data?.payment) {
        setPayments((prev) => prev.map((p) => (p._id === data.payment._id ? { ...p, status: data.payment.status, paystackReference: data.payment.paystackReference || p.paystackReference, paymentVerifiedAt: data.payment.verifiedAt || p.paymentVerifiedAt } : p)));
      }

      toast.success(data?.message || 'Payment reverification completed');
      fetchPayments();
    } catch {
      toast.error('Failed to reverify payment');
    }
  };

  const handleRepairReference = async (payment: Payment) => {
    try {
      const response = await fetch('/api/admin/repair-payment-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment._id,
          reference: payment.paystackReference || payment.reference,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.message || 'Repair failed');
        return;
      }

      // update local payments list if returned
      if (data?.payment) {
        setPayments((prev) => prev.map((p) => (p._id === data.payment._id ? { ...p, ...data.payment } : p)));
      }

      toast.success(data?.message || 'Payment reference repaired');
      fetchPayments();
    } catch {
      toast.error('Failed to repair payment reference');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage and track all transactions</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={handleExport}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Reference, email, service..."
                value={filters.search}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, status: e.target.value }));
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="createdAt">Date</option>
              <option value="amount">Amount</option>
              <option value="reference">Reference</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="-1">Newest First</option>
              <option value="1">Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      {loading ? (
        <Card className="p-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </Card>
      ) : payments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No payments found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <motion.div
              key={payment._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reference</p>
                    <p className="font-mono text-sm font-semibold">{payment.reference}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">User Email</p>
                    <p className="text-sm">{payment.email}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Service</p>
                    <p className="text-sm font-semibold">{payment.serviceName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(payment.amount)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex justify-end gap-2 items-center">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setViewModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {payment.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleReverify(payment)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    {payment.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRepairReference(payment)}
                      >
                        Repair
                      </Button>
                    )}
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-4">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Transaction Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
                      <p className="font-mono font-semibold text-sm">{selectedPayment.reference}</p>
                    </div>
                    <Badge className={getStatusColor(selectedPayment.status)}>
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div>
                <h4 className="font-semibold mb-3">User Information</h4>
                <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{selectedPayment.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">User ID</span>
                    <span className="text-sm font-mono text-muted-foreground">{selectedPayment.userId.substring(0, 12)}...</span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div>
                <h4 className="font-semibold mb-3">Transaction Details</h4>
                <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Service</span>
                    <span className="text-sm font-medium">{selectedPayment.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Paystack Ref</span>
                    <span className="text-sm font-mono">{selectedPayment.paystackReference || selectedPayment.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount Paid</span>
                    <span className="text-sm font-bold text-primary">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="font-semibold mb-3">Dates</h4>
                <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction Date</span>
                    <span className="text-sm font-medium">
                      {new Date(selectedPayment.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} {new Date(selectedPayment.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {selectedPayment.paymentVerifiedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Verified Date</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedPayment.paymentVerifiedAt).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })} {new Date(selectedPayment.paymentVerifiedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={() => setViewModalOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
