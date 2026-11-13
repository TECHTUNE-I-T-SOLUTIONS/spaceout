'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Search, Shield, LogIn, RefreshCw, UserPlus, Settings, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityLogEntry {
  _id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  category: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  checkin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  service: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  booking: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  settings: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
  report: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const categoryIcons: Record<string, React.ElementType> = {
  auth: LogIn,
  user: UserPlus,
  payment: RefreshCw,
  checkin: Shield,
  service: Settings,
  booking: Settings,
  settings: Settings,
  report: Shield,
  other: Settings,
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, categoryFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/activity-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to Load Admin Logs', { description: 'Unable to fetch admin activity logs.' });
      }
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      toast.error('Error', { description: 'Failed to load admin logs.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setTimeout(() => fetchLogs(), 100);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Logs</h1>
          <p className="text-sm text-muted-foreground">Track admin activities, login attempts, and system changes</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search admin logs..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-8 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 text-sm w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="user">User Management</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="checkin">Check-Ins</SelectItem>
              <SelectItem value="service">Services</SelectItem>
              <SelectItem value="booking">Bookings</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Logs List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No Admin Logs Found</h3>
            <p className="text-sm text-muted-foreground">Admin activity will appear here as it happens</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const Icon = categoryIcons[log.category] || Settings;
                const isExpanded = expandedLog === log._id;
                return (
                  <div key={log._id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{log.adminName}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              {log.category}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{log.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words">{log.details}</p>
                        {log.ipAddress && (
                          <button
                            onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 hover:text-foreground"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {log.ipAddress}
                          </button>
                        )}
                        {isExpanded && (
                          <div className="mt-2 text-xs bg-muted/50 rounded p-2 space-y-1">
                            <p>IP: {log.ipAddress || 'N/A'}</p>
                            <p className="break-all">User Agent: {log.userAgent || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            {pagination.total} total entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => { setPage(page + 1); }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
