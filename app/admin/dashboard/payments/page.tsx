'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  method: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
        toast.success('Payments Loaded', {
          description: `Fetched ${data.length} payment records.`,
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to Load Payments', {
        description: 'Unable to fetch payment records.',
      });
      // Mock data for demo
      setPayments([
        { id: '1', userId: 'user1', amount: 50000, status: 'completed', date: '2026-03-01', method: 'card' },
        { id: '2', userId: 'user2', amount: 75000, status: 'completed', date: '2026-02-28', method: 'transfer' },
        { id: '3', userId: 'user3', amount: 30000, status: 'pending', date: '2026-02-27', method: 'card' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Export Started', {
      description: 'Payment records are being exported to CSV.',
    });
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={handleExport}
        >
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment records...</p>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Payments Found</h2>
          <p className="text-muted-foreground">Payment records will appear here once users make bookings.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="p-4 text-left">Transaction ID</th>
                  <th className="p-4 text-left">Amount</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Method</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/50">
                    <td className="p-4 font-mono text-xs">#{payment.id}</td>
                    <td className="p-4 font-bold">₦{payment.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 capitalize">{payment.method}</td>
                    <td className="p-4">{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" title="View Details">
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
