'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Download, Filter } from 'lucide-react';
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
  paidAt?: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.page]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'checkin':
        return 'Check-In';
      case 'membership':
        return 'Membership';
      case 'prepaid':
        return 'Prepaid';
      case 'service':
        return 'Service';
      default:
        return type;
    }
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment History</h1>
        <p className="text-muted-foreground">
          Track all your payments and transactions
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filters.type} onValueChange={(value) => {
                setFilters({...filters, type: value});
                setPagination({...pagination, page: 1});
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checkin">Check-Ins</SelectItem>
                  <SelectItem value="membership">Memberships</SelectItem>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => {
                setFilters({...filters, status: value});
                setPagination({...pagination, page: 1});
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Payments List */}
      <motion.div variants={itemVariants}>
        {loading ? (
          <Card className="p-8 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-muted-foreground">Loading payments...</span>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No payments found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <motion.div
                key={payment._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-base">
                            {payment.serviceName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getTypeLabel(payment.type)} {payment.planName && `• ${payment.planName}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(payment.createdAt).toLocaleDateString()} at{' '}
                            {new Date(payment.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between md:items-center gap-4 md:flex-col md:text-right">
                      <div>
                        <p className="text-2xl font-bold">
                          ₦{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {payment.reference.substring(0, 8)}...
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status.toUpperCase()}
                      </div>
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
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-2 mt-8"
        >
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination({...pagination, page: pagination.page - 1})
            }
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={pagination.page === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setPagination({...pagination, page})
                  }
                >
                  {page}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            disabled={pagination.page === pagination.pages}
            onClick={() =>
              setPagination({...pagination, page: pagination.page + 1})
            }
          >
            Next
          </Button>
        </motion.div>
      )}

      {/* Summary Card */}
      <motion.div variants={itemVariants} className="mt-8">
        <Card className="p-6 bg-muted">
          <h3 className="font-bold mb-3">Summary</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                ₦
                {payments
                  .filter((p) => p.status === 'completed')
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                ₦
                {payments
                  .filter((p) => p.status === 'pending')
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
