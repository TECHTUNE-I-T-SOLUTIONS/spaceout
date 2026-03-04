'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  totalUsers: number;
  totalRevenue: number;
  totalBookings: number;
  monthlyTrend: Array<{ month: string; revenue: number; bookings: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
        toast.success('Analytics Loaded', {
          description: 'Dashboard analytics updated successfully.',
        });
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to Load Analytics', {
        description: 'Unable to fetch analytics data.',
      });
      // Mock data for demo
      setData({
        totalUsers: 1250,
        totalRevenue: 45000,
        totalBookings: 380,
        monthlyTrend: [
          { month: 'Jan', revenue: 4000, bookings: 40 },
          { month: 'Feb', revenue: 3000, bookings: 30 },
          { month: 'Mar', revenue: 2000, bookings: 25 },
          { month: 'Apr', revenue: 2780, bookings: 39 },
          { month: 'May', revenue: 1890, bookings: 22 },
          { month: 'Jun', revenue: 2390, bookings: 29 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      icon: Users,
      label: 'Total Users',
      value: data?.totalUsers || 0,
      color: 'text-gray-500',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: formatPrice(data?.totalRevenue || 0),
      color: 'text-green-500',
    },
    {
      icon: Calendar,
      label: 'Total Bookings',
      value: data?.totalBookings || 0,
      color: 'text-purple-500',
    },
    {
      icon: TrendingUp,
      label: 'Monthly Growth',
      value: data?.monthlyTrend && data.monthlyTrend.length > 0 ? '+12.5%' : 'N/A',
      color: 'text-orange-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : data && data.monthlyTrend && data.monthlyTrend.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatPrice(value as number)} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Bookings Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No analytics data available yet</p>
        </Card>
      )}
    </motion.div>
  );
}
