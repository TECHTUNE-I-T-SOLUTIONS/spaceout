'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CreateServiceModal } from '@/components/modals/create-service-modal';
import { Edit2, Trash2, Tag, Type } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  _id: string;
  name: string;
  category: string;
  description: string;
  branchId: { _id: string; name: string };
  pricingPlans: any[];
  isActive: boolean;
  createdAt: string;
}

export default function ServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
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
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      workspace: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      office: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      conference: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      content: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">Manage all workspace services and pricing plans</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Add Service</Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading services...</p>
        </Card>
      ) : services.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Services Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first service to offer workspace options.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Service</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getCategoryColor(service.category)}`}>
                        {service.category.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{service.branchId?.name}</span>
                    </div>
                  </div>

                  {service.pricingPlans.length > 0 && (
                    <div className="bg-muted p-2 rounded text-sm">
                      <p className="font-semibold text-xs mb-1">Pricing Plans ({service.pricingPlans.length}):</p>
                      <ul className="text-xs space-y-1">
                        {service.pricingPlans.slice(0, 3).map((plan, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {plan.planName || 'Plan'} - {plan.durationLabel || 'N/A'}
                          </li>
                        ))}
                        {service.pricingPlans.length > 3 && (
                          <li className="text-muted-foreground">• +{service.pricingPlans.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(service._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateServiceModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchServices}
      />
    </motion.div>
  );
}
