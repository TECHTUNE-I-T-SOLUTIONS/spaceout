'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Search, LogOut, Calendar, Clock, History } from 'lucide-react';
import { toast } from 'sonner';

interface CheckInRecord {
  _id: string;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  serviceName: string;
  planName: string;
  planType: string;
  durationLabel: string;
  amount: number;
  selectedRate: string;
  status: string;
  paymentStatus: string;
  checkedInAt: string;
  checkedOutAt?: string;
}

interface FilterState {
  status: string;
  date: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    date: '',
    search: '',
    sortBy: 'checkedInAt',
    sortOrder: '-1',
  });

  useEffect(() => {
    fetchCheckIns();
  }, [filters, pagination.page, activeTab]);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      if (activeTab === 'checkout-history') {
        params.append('checkedOut', 'true');
        params.append('sortBy', filters.sortBy === 'checkedInAt' ? 'checkedOutAt' : filters.sortBy);
      } else if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (activeTab === 'today' && filters.date) {
        params.append('date', filters.date);
      }

      if (activeTab !== 'checkout-history' && filters.search) {
        params.append('search', filters.search);
      } else if (activeTab === 'checkout-history' && filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/admin/checkins?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCheckIns(data.checkIns);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
        }));
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      toast.error('Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed' || status === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  };

  const handleTodayFilter = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setFilters(prev => ({ ...prev, date: dateStr }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Check-Ins Management</h1>
        <p className="text-muted-foreground">View and manage all user check-ins</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 md:hidden" />
            <span className="hidden md:inline">All Check-Ins</span>
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center justify-center gap-2">
            <History className="w-4 h-4 md:hidden" />
            <span className="hidden md:inline">Today's Check-Ins</span>
          </TabsTrigger>
          <TabsTrigger value="checkout-history" className="flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4 md:hidden" />
            <span className="hidden md:inline">Checkout History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-6">
          {/* Filters */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, service..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="checkedInAt">Check-In Date</option>
                  <option value="amount">Amount</option>
                  <option value="serviceName">Service</option>
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

          {/* Check-ins List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : checkIns.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No check-ins found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {checkIns.map(checkIn => (
                <motion.div
                  key={checkIn._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">User</p>
                        <p className="font-medium">{checkIn.userId.firstName} {checkIn.userId.lastName}</p>
                        <p className="text-xs text-muted-foreground">{checkIn.userId.email}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Service</p>
                        <p className="font-medium">{checkIn.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{checkIn.planName}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check-In Time</p>
                        <p className="font-medium">
                          {new Date(checkIn.checkedInAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(checkIn.checkedInAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Amount</p>
                        <p className="font-medium text-primary">₦{checkIn.amount?.toLocaleString()}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getStatusColor(checkIn.paymentStatus)}>
                          {checkIn.paymentStatus === 'completed' ? '✓ Paid' : 'Pending'}
                        </Badge>
                        <Badge variant="outline">{checkIn.selectedRate}</Badge>
                        {checkIn.checkedOutAt && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <LogOut className="w-3 h-3" />
                            Checked Out
                          </Badge>
                        )}
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
                  <span className="flex items-center text-sm text-muted-foreground">
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
        </TabsContent>

        <TabsContent value="today" className="mt-6 space-y-6">
          {/* Today Filter */}
          <Card className="p-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select Date</label>
                <Input
                  type="date"
                  value={filters.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <Button onClick={handleTodayFilter} className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today
              </Button>
            </div>
          </Card>

          {/* Today's Check-ins List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : checkIns.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No check-ins for this date</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {checkIns.map(checkIn => (
                <motion.div
                  key={checkIn._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow border-l-4 border-l-gray-500">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">User</p>
                        <p className="font-medium">{checkIn.userId.firstName} {checkIn.userId.lastName}</p>
                        <p className="text-xs text-muted-foreground">{checkIn.userId.email}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Service</p>
                        <p className="font-medium">{checkIn.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{checkIn.planName}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                        <p className="font-medium">{checkIn.durationLabel}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Amount</p>
                        <p className="font-medium text-primary">₦{checkIn.amount?.toLocaleString()}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getStatusColor(checkIn.paymentStatus)}>
                          {checkIn.paymentStatus === 'completed' ? '✓ Paid' : 'Pending'}
                        </Badge>
                        <Badge variant="outline">{checkIn.selectedRate}</Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="checkout-history" className="mt-6 space-y-6">
          {/* Filters */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, service..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="checkedOutAt">Check-Out Date</option>
                  <option value="amount">Amount</option>
                  <option value="serviceName">Service</option>
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

          {/* Checked-out Records List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : checkIns.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No checkout records found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {checkIns.map(checkIn => {
                const checkedInDate = new Date(checkIn.checkedInAt);
                const checkedOutDate = checkIn.checkedOutAt ? new Date(checkIn.checkedOutAt) : null;
                const duration = checkedOutDate
                  ? Math.floor((checkedOutDate.getTime() - checkedInDate.getTime()) / (1000 * 60))
                  : 0;
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;

                return (
                  <motion.div
                    key={checkIn._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">User</p>
                          <p className="font-medium">{checkIn.userId.firstName} {checkIn.userId.lastName}</p>
                          <p className="text-xs text-muted-foreground">{checkIn.userId.email}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Service</p>
                          <p className="font-medium">{checkIn.serviceName}</p>
                          <p className="text-xs text-muted-foreground">{checkIn.planName}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check-In</p>
                          <p className="font-medium text-sm">
                            {checkedInDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {checkedInDate.toLocaleTimeString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check-Out</p>
                          {checkedOutDate ? (
                            <>
                              <p className="font-medium text-sm">
                                {checkedOutDate.toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {checkedOutDate.toLocaleTimeString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">—</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Duration</p>
                          {hours > 0 ? (
                            <p className="font-medium">{hours}h {minutes}m</p>
                          ) : (
                            <p className="font-medium">{minutes}m</p>
                          )}
                          <p className="text-xs text-muted-foreground">Amount: ₦{checkIn.amount?.toLocaleString()}</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getStatusColor(checkIn.paymentStatus)}>
                            {checkIn.paymentStatus === 'completed' ? '✓ Paid' : 'Pending'}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <LogOut className="w-3 h-3" />
                            Checked Out
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}

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
                  <span className="flex items-center text-sm text-muted-foreground">
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
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
