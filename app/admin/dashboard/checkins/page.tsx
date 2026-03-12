'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Search, LogOut, Calendar, Clock, History, Plus } from 'lucide-react';
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

interface UserOption {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hasMembership?: boolean;
  membershipStatus?: string;
  membershipEndDate?: string;
}

interface PricingPlan {
  _id: string;
  planName: string;
  planType: string;
  durationLabel: string;
  memberPrice: number;
  nonMemberPrice: number;
  flatPrice?: number;
}

interface ServiceOption {
  _id: string;
  name: string;
  pricingPlans: PricingPlan[];
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

  // Manual check-in state
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [manualAmount, setManualAmount] = useState<string>('');
  const [selectedRate, setSelectedRate] = useState<string>('nonMember');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    fetchCheckIns();
  }, [filters, pagination.page, activeTab]);

  useEffect(() => {
    // Load services when component mounts
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services-list');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/search-users?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    }
  };

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

  const handleManualCheckIn = async () => {
    if (!selectedUser || !selectedService || !manualAmount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      // Determine the rate based on user's membership status
      let finalRate = selectedRate;
      if (selectedUser.hasMembership) {
        finalRate = 'member';
      } else {
        finalRate = 'nonMember';
      }

      const payload = {
        userId: selectedUser._id,
        serviceId: selectedService._id,
        planName: selectedPlan?.planName || 'Manual Check-In',
        planType: selectedPlan?.planType || 'manual',
        durationLabel: selectedPlan?.durationLabel || 'Manual Entry',
        selectedRate: finalRate,
        amount: parseFloat(manualAmount),
        wifiIncluded: false,
      };

      const response = await fetch('/api/admin/manual-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Manual Check-In Created', {
          description: `${selectedUser.firstName} ${selectedUser.lastName} has been checked in with payment recorded as ${finalRate === 'member' ? 'Member' : 'Non-Member'}.`,
        });

        // Reset form
        setSelectedUser(null);
        setSelectedService(null);
        setSelectedPlan(null);
        setManualAmount('');
        setSelectedRate('nonMember');
        setUserSearch('');
        setUsers([]);

        // Refresh check-ins list
        fetchCheckIns();
      } else {
        const error = await response.json();
        toast.error('Failed to Create Check-In', {
          description: error.error || 'Please try again.',
        });
      }
    } catch (error) {
      console.error('Error creating manual check-in:', error);
      toast.error('Failed to Create Check-In', {
        description: 'An error occurred while processing your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="manual-checkin" className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4 md:hidden" />
            <span className="hidden md:inline">Manual Check-In</span>
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

        {/* Manual Check-In Tab */}
        <TabsContent value="manual-checkin" className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Manual Check-In
              </h3>

              <div className="space-y-6">
                {/* User Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select User *</label>
                  <div className="relative">
                    <Input
                      placeholder="Search user by name or email..."
                      value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        searchUsers(e.target.value);
                        if (selectedUser) setSelectedUser(null);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      className="pr-10"
                    />
                    <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />

                    {/* User Dropdown */}
                    {showUserDropdown && users.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {users.map(user => (
                          <div
                            key={user._id}
                            onClick={() => {
                              setSelectedUser(user);
                              // Auto-set rate based on membership
                              if (user.hasMembership) {
                                setSelectedRate('member');
                              } else {
                                setSelectedRate('nonMember');
                              }
                              setShowUserDropdown(false);
                              setUserSearch('');
                              setUsers([]);
                            }}
                            className="px-4 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          >
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.hasMembership && (
                              <p className="text-xs text-green-600">✓ Active membership</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedUser && (
                    <div className="text-sm mt-2 space-y-1">
                      <p className="text-green-600">✓ {selectedUser.firstName} {selectedUser.lastName} selected</p>
                      <p className="text-xs text-muted-foreground">
                        Rate: <span className="font-semibold">{selectedRate === 'member' ? 'Member' : 'Non-Member'}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Service Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Service *</label>
                  <select
                    value={selectedService?._id || ''}
                    onChange={(e) => {
                      const service = services.find(s => s._id === e.target.value);
                      setSelectedService(service || null);
                      setSelectedPlan(null);
                      setManualAmount('');
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">Choose a service...</option>
                    {services.map(service => (
                      <option key={service._id} value={service._id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pricing Plan Selection */}
                {selectedService && selectedService.pricingPlans.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Pricing Plan</label>
                    <select
                      value={selectedPlan?._id || ''}
                      onChange={(e) => {
                        const plan = selectedService.pricingPlans.find(p => p._id === e.target.value);
                        setSelectedPlan(plan || null);
                        if (plan?.flatPrice) {
                          setManualAmount(plan.flatPrice.toString());
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="">Choose a plan...</option>
                      {selectedService.pricingPlans.map(plan => (
                        <option key={plan._id} value={plan._id}>
                          {plan.planName} ({plan.durationLabel}) - ₦{plan.flatPrice || plan.memberPrice || 0}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount (₦) *</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="text-lg"
                  />
                  {selectedPlan && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Plan default: ₦{selectedPlan.flatPrice || selectedPlan.memberPrice || 0}
                    </p>
                  )}
                </div>

                {/* Summary */}
                {selectedUser && selectedService && manualAmount && (
                  <Card className="p-4 bg-muted">
                    <h4 className="font-semibold mb-3">Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User:</span>
                        <span className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-medium">{selectedService.name}</span>
                      </div>
                      {selectedPlan && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium">{selectedPlan.planName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate Type:</span>
                        <span className="font-medium">{selectedRate === 'member' ? '👤 Member' : '👥 Non-Member'}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Amount:</span>
                        <span className="font-bold text-green-600">₦{parseFloat(manualAmount || '0').toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleManualCheckIn}
                  disabled={!selectedUser || !selectedService || !manualAmount || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Check-In...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Manual Check-In & Record Payment
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
