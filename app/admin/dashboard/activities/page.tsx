'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Search, Users, CreditCard, LogIn, Calendar, FileText, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityEvent {
  type: string;
  date: string;
  title: string;
  name?: string;
  email?: string;
  amount?: number;
  status?: string;
  serviceName?: string;
  planName?: string;
  reference?: string;
  category?: string;
  details?: string;
  userName?: string;
  userEmail?: string;
  adminName?: string;
  adminEmail?: string;
  metadata?: Record<string, any>;
}

const typeIcons: Record<string, React.ElementType> = {
  user_signup: Users,
  payment: CreditCard,
  checkin: LogIn,
  booking: Calendar,
  admin_activity: Activity,
};

const typeColors: Record<string, string> = {
  user_signup: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  payment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  checkin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  booking: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  admin_activity: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
};

export default function ActivitiesPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [page, typeFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/activities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to Load Activities', { description: 'Unable to fetch platform activities.' });
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Error', { description: 'Failed to load activities.' });
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold">Activities</h1>
          <p className="text-sm text-muted-foreground">Platform-wide activity timeline including users, payments, check-ins, and more</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-10 h-8 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-sm w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="user_signup">User Signups</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="checkin">Check-Ins</SelectItem>
              <SelectItem value="booking">Bookings</SelectItem>
              <SelectItem value="admin_activity">Admin Activities</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Activity Timeline */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No Activities Found</h3>
            <p className="text-sm text-muted-foreground">Platform activities will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border">
              {events.map((event, index) => {
                const Icon = typeIcons[event.type] || FileText;
                const isExpanded = expandedEvent === event.type + index;
                return (
                  <div key={event.type + index} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${typeColors[event.type] || 'bg-gray-100 text-gray-600'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-[10px] h-4 px-1.5 ${typeColors[event.type] || ''}`}>
                              {event.type.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-sm font-semibold">{event.title}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(event.date)}</span>
                        </div>

                        {event.type === 'user_signup' && (
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">Name: <span className="text-foreground">{event.name}</span></span>
                            <span className="text-muted-foreground break-all">{event.email}</span>
                            <Badge variant={event.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">
                              {event.status}
                            </Badge>
                          </div>
                        )}

                        {event.type === 'payment' && (
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">Amount: <span className="text-foreground font-semibold">₦{event.amount?.toLocaleString()}</span></span>
                            <span className="text-muted-foreground">{event.serviceName}</span>
                            <span className="text-muted-foreground break-all">{event.email}</span>
                            <Badge variant="default" className="text-[10px]">{event.status}</Badge>
                          </div>
                        )}

                        {event.type === 'checkin' && (
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">{event.userName}</span>
                            <span className="text-muted-foreground">{event.serviceName}{event.planName ? ' - ' + event.planName : ''}</span>
                            <span className="text-muted-foreground break-all">{event.userEmail}</span>
                            <Badge variant={event.status === 'Completed' ? 'default' : 'secondary'} className="text-[10px]">{event.status}</Badge>
                          </div>
                        )}

                        {event.type === 'booking' && (
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">{event.userName}</span>
                            <span className="text-muted-foreground">{event.serviceName}</span>
                            <span className="text-muted-foreground break-all">{event.userEmail}</span>
                            <Badge variant="secondary" className="text-[10px]">{event.status}</Badge>
                          </div>
                        )}

                        {event.type === 'admin_activity' && (
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">By: <span className="text-foreground">{event.adminName}</span></span>
                            <span className="text-muted-foreground break-all">{event.details}</span>
                            {event.category && (
                              <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
                            )}
                          </div>
                        )}

                        {event.metadata && (
                          <button
                            onClick={() => setExpandedEvent(isExpanded ? null : event.type + index)}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 hover:text-foreground"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </button>
                        )}
                        {isExpanded && event.metadata && (
                          <div className="mt-2 text-[10px] bg-muted/50 rounded p-2">
                            <pre className="break-all overflow-x-auto">{JSON.stringify(event.metadata, null, 2)}</pre>
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
            {pagination.total} total events
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
