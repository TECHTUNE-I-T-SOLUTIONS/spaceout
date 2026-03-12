'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, DollarSign, Calendar, User, Filter, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreateServiceModal } from '@/components/modals/create-service-modal';
import { DeleteConfirmModal } from '@/components/modals/delete-confirm-modal';
import { motion } from 'framer-motion';

interface Service {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  category?: string;
  branchId?: { _id: string; name: string };
  isActive: boolean;
  createdAt: string;
  pricingPlans?: any[];
}

interface UserSubscription {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  serviceName: string;
  planName: string;
  price: number;
  duration: number;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'cancelled';
  isAccessCard: boolean;
  createdAt: string;
}

interface SubscriptionsResponse {
  subscriptions: UserSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [services, setServices] = useState<Service[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [itemsPerPage] = useState(10);
  
  // Service management state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      if (activeTab === 'services') {
        fetchServices();
      } else {
        fetchSubscriptions();
      }
    }
  }, [status, router, activeTab, currentPage]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services?includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        setServices(Array.isArray(data) ? data : data.data || []);
      } else {
        toast.error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error fetching services');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (searchQuery) {
        params.append('serviceName', searchQuery);
      }

      const response = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (response.ok) {
        const data: SubscriptionsResponse = await response.json();
        setSubscriptions(data.subscriptions);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error('Failed to fetch subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error fetching subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSubscriptions();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${serviceToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Service deleted successfully');
        fetchServices();
      } else {
        toast.error('Failed to delete service');
      }
    } catch (error) {
      toast.error('Error deleting service');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingService(null);
    fetchServices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'expired':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Services & Subscriptions</h1>
        <p className="text-muted-foreground">Manage your services and view user subscriptions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          {/* Filters */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Search by Service Name</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Subscriptions Table */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">No subscriptions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Service</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Plan</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Duration</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Purchased</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Expires</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{subscription.userId.name}</p>
                              <p className="text-xs text-muted-foreground">{subscription.userId.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{subscription.serviceName}</td>
                        <td className="px-6 py-4 text-sm">{subscription.planName}</td>
                        <td className="px-6 py-4 text-sm font-semibold">₦{subscription.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">{subscription.duration} days</td>
                        <td className="px-6 py-4 text-sm">{formatDate(subscription.purchaseDate)}</td>
                        <td className="px-6 py-4 text-sm">{formatDate(subscription.expiryDate)}</td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={subscription.isAccessCard ? 'default' : 'secondary'}>
                            {subscription.isAccessCard ? 'Card' : 'Membership'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setEditingService(null);
                setIsModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              + Create Service
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">No services found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                      {service.location && (
                        <p className="text-sm text-muted-foreground">{service.location}</p>
                      )}
                    </div>
                    <Badge variant={service.isActive ? 'default' : 'secondary'}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  {service.category && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Category: {service.category}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mb-4">
                    Created: {formatDate(service.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(service)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(service)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {/* Service Modal */}
          <CreateServiceModal
            open={isModalOpen}
            onOpenChange={handleModalClose}
            editingService={editingService || undefined}
          />
          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={handleDeleteConfirm}
            title="Delete Service"
            description={`Are you sure you want to delete "${serviceToDelete?.name}"? This action cannot be undone.`}
            isLoading={isDeleting}
            confirmText="Delete"
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
